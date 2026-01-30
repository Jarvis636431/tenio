import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { LoadingState } from "@/types/domain/worker";
import { buildGlobalIdMap } from "./utils/ifcCaches";
import { setupCameraAndControls } from "./utils/cameraControls";
import { useRenderLoop } from "./hooks/useRenderLoop";
import type { HighlightGroup } from "./hooks/useHighlight";
import { useResize } from "./hooks/useResize";

interface ModelViewerProps {
  className?: string;
  highlightColor?: string;
  highlightGroups?: HighlightGroup[];
  models: Array<{
    key: string;
    src: string;
    tagMap?: Record<string, string[]>;
  }>;
  highlightGlobalIds?: string[];
  highlightTagIds?: string[];
}

export function ModelViewer({
  className,
  highlightColor = "#ff9800",
  highlightGroups,
  models,
  highlightGlobalIds = [],
  highlightTagIds = [],
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animateIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const needsRenderRef = useRef(true);
  const modelsRef = useRef<
    Map<
      string,
      {
        model: THREE.Object3D & { modelID: number };
        meshes: THREE.Mesh[];
        originalMaterials: Map<string, THREE.Material | THREE.Material[]>;
      }
    >
  >(new Map());
  const globalIdMapsRef = useRef<Map<string, Map<string, number>>>(new Map());
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const modelsSignatureRef = useRef<string | null>(null);
  const highlightMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const highlightGroupMaterialsRef = useRef<
    Map<string, THREE.MeshStandardMaterial>
  >(new Map());

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: "",
    error: null,
  });

  const normalizedModels = useMemo(() => models, [models]);

  const { startRenderLoop } = useRenderLoop({
    controlsRef,
    animateIdRef,
    abortControllerRef,
    needsRenderRef,
  });

  const { handleResize } = useResize({ containerRef, rendererRef, cameraRef });

  const ensureHighlightMaterial = () => {
    const nextColor = new THREE.Color(highlightColor).getStyle();
    if (!highlightMaterialRef.current) {
      highlightMaterialRef.current = new THREE.MeshStandardMaterial({
        color: new THREE.Color(highlightColor),
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true,
        metalness: 0,
        roughness: 0.6,
      });
    } else if (
      highlightMaterialRef.current.color.getStyle() !== nextColor
    ) {
      highlightMaterialRef.current.color = new THREE.Color(highlightColor);
    }

    return highlightMaterialRef.current;
  };

  const applyMultiHighlight = () => {
    if (!isInitializedRef.current || !modelsRef.current.size) return;

    const useGroups = Array.isArray(highlightGroups) && highlightGroups.length > 0;
    const highlightMaterial = ensureHighlightMaterial();
    const highlightGlobalSet = new Set(highlightGlobalIds);
    const highlightTagSet = new Set(highlightTagIds);

    modelsRef.current.forEach((entry, modelKey) => {
      const idMap = globalIdMapsRef.current.get(modelKey);
      if (!idMap) return;

      const expressToMaterial = new Map<number, THREE.Material>();
      const modelInput = normalizedModels.find((item) => item.key === modelKey);

      if (useGroups) {
        highlightGroups?.forEach((group) => {
          const idsToHighlight: number[] = [];
          for (const rawId of group.ids) {
            if (typeof rawId === "number") {
              idsToHighlight.push(rawId);
            } else if (typeof rawId === "string") {
              const trimmed = rawId.trim();
              if (!trimmed) continue;
              if (/^\d+$/.test(trimmed)) {
                const parsed = parseInt(trimmed, 10);
                if (!Number.isNaN(parsed)) idsToHighlight.push(parsed);
              } else {
                const expressId = idMap.get(trimmed);
                if (expressId !== undefined) {
                  idsToHighlight.push(expressId);
                }
              }
            }
          }

          if (!idsToHighlight.length) return;

          let material = highlightGroupMaterialsRef.current.get(group.customID);
          if (!material) {
            material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(group.color),
              transparent: true,
              opacity: group.opacity ?? 0.8,
              depthWrite: true,
              depthTest: true,
              metalness: 0,
              roughness: 0.6,
            });
            highlightGroupMaterialsRef.current.set(group.customID, material);
          } else {
            material.color = new THREE.Color(group.color);
            material.opacity = group.opacity ?? 0.8;
          }

          idsToHighlight.forEach((id) => {
            expressToMaterial.set(id, material!);
          });
        });
      } else {
        highlightGlobalSet.forEach((gid) => {
          const expressId = idMap.get(gid);
          if (expressId !== undefined) {
            expressToMaterial.set(expressId, highlightMaterial);
          }
        });

        if (modelInput?.tagMap && highlightTagSet.size > 0) {
          highlightTagSet.forEach((tagId) => {
            const tagIds = modelInput.tagMap?.[tagId] ?? [];
            tagIds.forEach((gid) => {
              const expressId = idMap.get(gid);
              if (expressId !== undefined) {
                expressToMaterial.set(expressId, highlightMaterial);
              }
            });
          });
        }
      }

      entry.meshes.forEach((mesh) => {
        const expressID = (mesh as THREE.Mesh & { expressID?: number }).expressID;
        const originalMaterial = entry.originalMaterials.get(mesh.uuid);
        if (expressID !== undefined && expressToMaterial.has(expressID)) {
          mesh.material = expressToMaterial.get(expressID)!;
        } else if (originalMaterial) {
          mesh.material = originalMaterial;
        }
      });
    });

    needsRenderRef.current = true;
  };

  const disposeModel = (model: THREE.Object3D) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        const material = child.material;
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose());
        } else if (material) {
          material.dispose();
        }
      }
    });
  };

  const cleanup = () => {
    if (animateIdRef.current) {
      cancelAnimationFrame(animateIdRef.current);
      animateIdRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
    if (rootGroupRef.current) {
      rootGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          const material = child.material;
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else if (material) {
            material.dispose();
          }
        }
      });
    }
    highlightGroupMaterialsRef.current.forEach((mat) => mat.dispose());
    highlightGroupMaterialsRef.current.clear();
    modelsRef.current.forEach((entry) => disposeModel(entry.model));
    modelsRef.current.clear();
    globalIdMapsRef.current.clear();
    rootGroupRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    isInitializedRef.current = false;
    modelsSignatureRef.current = null;
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!normalizedModels.length || !containerRef.current) return;

    const signature = normalizedModels
      .map((item) => `${item.key}:${item.src}`)
      .join("|");

    if (modelsSignatureRef.current === signature && isInitializedRef.current) {
      return;
    }

    if (isInitializedRef.current) {
      cleanup();
    }

    const initViewer = async () => {
      setLoadingState({
        isLoading: true,
        progress: 0,
        message: "正在初始化...",
        error: null,
      });

      try {
        abortControllerRef.current = new AbortController();
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = "";

        const scene = new THREE.Scene();
        scene.background = null;
        scene.fog = null;

        const camera = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.01,
          2000,
        );
        camera.position.set(20, 20, 20);
        camera.lookAt(0, 0, 0);
        camera.near = 0.01;
        camera.far = 2000;
        camera.updateProjectionMatrix();

        const renderer = new THREE.WebGLRenderer({
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = false;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        rootGroupRef.current = new THREE.Group();
        scene.add(rootGroupRef.current);

        setLoadingState((prev) => ({
          ...prev,
          progress: 10,
          message: "正在下载模型...",
        }));

        const buffers = await Promise.all(
          normalizedModels.map(async (item) => {
            const response = await fetch(item.src, {
              signal: abortControllerRef.current?.signal,
            });
            if (!response.ok) {
              throw new Error(`请求模型文件失败: ${response.status}`);
            }
            return response.arrayBuffer();
          }),
        );

        if (abortControllerRef.current?.signal.aborted) return;

        const baseMaterial = new THREE.MeshStandardMaterial({
          color: 0x808080,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          metalness: 0,
          roughness: 1,
        });

        await Promise.all(
          normalizedModels.map(async (item, index) => {
            setLoadingState((prev) => ({
              ...prev,
              progress: 20 + Math.round((index / normalizedModels.length) * 60),
              message: `正在解析模型 ${index + 1}/${normalizedModels.length}...`,
            }));

            const ifcLoader = new IFCLoader();
            ifcLoader.ifcManager.setWasmPath("/wasm/");
            const model = (await ifcLoader.parse(buffers[index])) as THREE.Object3D & {
              modelID: number;
            };

            if (abortControllerRef.current?.signal.aborted) return;

            model.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                child.material = baseMaterial;
                child.renderOrder = 0;
              }
            });

            rootGroupRef.current?.add(model);

            const meshes: THREE.Mesh[] = [];
            const originalMaterials = new Map<
              string,
              THREE.Material | THREE.Material[]
            >();
            model.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                meshes.push(child);
                if (!originalMaterials.has(child.uuid)) {
                  originalMaterials.set(child.uuid, child.material);
                }
              }
            });

            const idMap = await buildGlobalIdMap(ifcLoader, model.modelID);
            globalIdMapsRef.current.set(item.key, idMap);
            modelsRef.current.set(item.key, {
              model,
              meshes,
              originalMaterials,
            });

            try {
              ifcLoader.ifcManager?.dispose();
            } catch (disposeError) {
              console.warn("[ModelViewer] 卸载IFC实例时出错:", disposeError);
            }
          }),
        );

        if (abortControllerRef.current?.signal.aborted) return;

        if (rootGroupRef.current) {
          setupCameraAndControls({
            model: rootGroupRef.current,
            camera,
            renderer,
            controlsRef,
            sceneRef,
            cameraRef,
            rendererRef,
          });
        }

        startRenderLoop(scene, camera, renderer);
        isInitializedRef.current = true;
        modelsSignatureRef.current = signature;

        setLoadingState({
          isLoading: false,
          progress: 100,
          message: "加载完成",
          error: null,
        });

        applyMultiHighlight();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("[ModelViewer] 初始化失败:", err);
        setLoadingState({
          isLoading: false,
          progress: 0,
          message: "",
          error: err instanceof Error ? err.message : "初始化失败",
        });
      }
    };

    initViewer();

    return () => {
      cleanup();
    };
  }, [normalizedModels, startRenderLoop]);

  useEffect(() => {
    applyMultiHighlight();
  }, [highlightGlobalIds, highlightTagIds, highlightColor, highlightGroups, normalizedModels]);

  return (
    <div className={cn("relative w-full h-full bg-gray-50", className)}>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      />

      {loadingState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center w-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 mb-2">
              {loadingState.message || "加载模型中..."}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingState.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{loadingState.progress}%</p>
          </div>
        </div>
      )}

      {loadingState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center text-red-600">
            <p className="text-sm">加载失败: {loadingState.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
