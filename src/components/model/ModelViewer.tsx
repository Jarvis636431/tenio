import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import * as THREE from "three";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { LoadingState } from "@/types/domain/worker";
import { buildGlobalIdMap, buildTagMap } from "./utils/ifcCaches";
import { setupCameraAndControls } from "./utils/cameraControls";
import { useRenderLoop } from "./hooks/useRenderLoop";
import type { HighlightGroup } from "./hooks/useHighlight";
import { useResize } from "./hooks/useResize";

const MODEL_RESPONSE_CACHE_NAME = "tenio-ifc-model-cache-v1";
const modelBufferCache = new Map<string, ArrayBuffer>();
const inflightModelRequests = new Map<string, Promise<ArrayBuffer>>();
const modelMetadataCache = new Map<
  string,
  {
    globalIdMap: Map<string, number>;
    tagMap: Record<string, string[]>;
  }
>();

type MaterialOverrides = Omit<THREE.MeshStandardMaterialParameters, "color"> & {
  color?: string | number;
};

async function loadModelBuffer(src: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  if (modelBufferCache.has(src)) {
    return modelBufferCache.get(src)!.slice(0);
  }

  const inflight = inflightModelRequests.get(src);
  if (inflight) {
    return (await inflight).slice(0);
  }

  const request = (async () => {
    let response: Response | undefined;

    if ("caches" in globalThis) {
      const cacheStorage = await caches.open(MODEL_RESPONSE_CACHE_NAME);
      const cachedResponse = await cacheStorage.match(src);
      if (cachedResponse) {
        response = cachedResponse;
      } else {
        const networkResponse = await fetch(src, {
          signal,
          cache: "force-cache",
        });
        if (!networkResponse.ok) {
          throw new Error(`请求模型文件失败: ${networkResponse.status}`);
        }
        await cacheStorage.put(src, networkResponse.clone());
        response = networkResponse;
      }
    } else {
      response = await fetch(src, {
        signal,
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(`请求模型文件失败: ${response.status}`);
      }
    }

    const buffer = await response.arrayBuffer();
    modelBufferCache.set(src, buffer);
    return buffer;
  })();

  inflightModelRequests.set(src, request);

  try {
    return (await request).slice(0);
  } finally {
    inflightModelRequests.delete(src);
  }
}

function cloneGlobalIdMap(globalIdMap: Map<string, number>) {
  return new Map(globalIdMap);
}

function cloneTagMap(tagMap: Record<string, string[]>) {
  return Object.fromEntries(Object.entries(tagMap).map(([key, values]) => [key, [...values]]));
}

interface ModelViewerProps {
  className?: string;
  highlightColor?: string;
  highlightColorGroups?: HighlightGroup[];
  baseMaterialOverrides?: MaterialOverrides;
  highlightMaterial?: MaterialOverrides;
  highlightGroupMaterial?: MaterialOverrides;
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
  highlightColorGroups,
  baseMaterialOverrides,
  highlightMaterial,
  highlightGroupMaterial,
  models,
  highlightGlobalIds = [],
  highlightTagIds = [],
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animateIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const needsRenderRef = useRef(true);
  const ifcLoaderRef = useRef<IFCLoader | null>(null);
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
  const tagMapsRef = useRef<Map<string, Record<string, string[]>>>(new Map());
  const globalIdMapsRef = useRef<Map<string, Map<string, number>>>(new Map());
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const modelsSignatureRef = useRef<string | null>(null);
  const highlightMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const highlightGroupMaterialsRef = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());
  const highlightSubsetsRef = useRef<Map<string, THREE.Mesh & { renderOrder: number }>>(new Map());
  const highlightSubsetRef = useRef<(THREE.Mesh & { renderOrder: number }) | null>(null);

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: "",
    error: null,
  });

  const normalizedModels = useMemo(() => models, [models]);
  const mergeTagMaps = (base?: Record<string, string[]>, override?: Record<string, string[]>) => {
    if (!base && !override) return undefined;
    if (!base) return override;
    if (!override) return base;
    const merged: Record<string, string[]> = { ...base };
    Object.entries(override).forEach(([key, values]) => {
      const existing = merged[key] ?? [];
      const next = new Set<string>(existing);
      values.forEach((value) => {
        if (value) next.add(value);
      });
      merged[key] = Array.from(next);
    });
    return merged;
  };
  const normalizedModelsRef = useRef(normalizedModels);
  const modelsSignature = useMemo(
    () => normalizedModels.map((item) => `${item.key}:${item.src}`).join("|"),
    [normalizedModels],
  );

  useEffect(() => {
    normalizedModelsRef.current = normalizedModels;
  }, [normalizedModels]);

  const { startRenderLoop } = useRenderLoop({
    controlsRef,
    animateIdRef,
    abortControllerRef,
    needsRenderRef,
  });

  const { handleResize } = useResize({ containerRef, rendererRef, cameraRef });

  const resolveColor = (value: string | number | undefined, fallback: string) => {
    if (value === undefined || value === null) return new THREE.Color(fallback);
    return new THREE.Color(value as string | number);
  };

  const ensureHighlightMaterial = () => {
    const nextColor = new THREE.Color(highlightColor).getStyle();
    if (!highlightMaterialRef.current) {
      highlightMaterialRef.current = new THREE.MeshStandardMaterial({
        color: resolveColor(highlightMaterial?.color, highlightColor),
        transparent: highlightMaterial?.transparent ?? true,
        opacity: highlightMaterial?.opacity ?? 0.8,
        depthWrite: highlightMaterial?.depthWrite ?? true,
        depthTest: highlightMaterial?.depthTest ?? true,
        metalness: highlightMaterial?.metalness ?? 0,
        roughness: highlightMaterial?.roughness ?? 0.6,
        ...highlightMaterial,
      });
    } else if (highlightMaterialRef.current.color.getStyle() !== nextColor) {
      highlightMaterialRef.current.color = resolveColor(highlightMaterial?.color, highlightColor);
    }

    return highlightMaterialRef.current;
  };

  const applyMultiHighlight = () => {
    if (!isInitializedRef.current || !modelsRef.current.size) return;

    const useGroups = Array.isArray(highlightColorGroups) && highlightColorGroups.length > 0;
    const highlightMaterial = ensureHighlightMaterial();
    const highlightGlobalSet = new Set(highlightGlobalIds);
    const highlightTagSet = new Set(highlightTagIds);

    modelsRef.current.forEach((entry, modelKey) => {
      const idMap = globalIdMapsRef.current.get(modelKey);
      if (!idMap) return;

      const expressToMaterial = new Map<number, THREE.Material>();
      const modelInput = normalizedModels.find((item) => item.key === modelKey);
      const mergedTagMap = mergeTagMaps(tagMapsRef.current.get(modelKey), modelInput?.tagMap);
      let tagHit = 0;
      let tagMiss = 0;
      console.debug("[ModelViewer] highlight pass", {
        modelKey,
        idMapSize: idMap.size,
        hasTagMap: Boolean(mergedTagMap),
        tagMapKeys: mergedTagMap ? Object.keys(mergedTagMap).length : 0,
        useGroups,
      });

      if (useGroups && ifcLoaderRef.current) {
        highlightSubsetsRef.current.forEach((subset) => {
          entry.model.remove(subset);
        });
        highlightSubsetsRef.current.clear();

        highlightColorGroups?.forEach((group) => {
          const idsToHighlight: number[] = [];
          let mappedFromIdMap = 0;
          let mappedFromTagMap = 0;
          for (const rawId of group.ids) {
            if (typeof rawId === "number") {
              idsToHighlight.push(rawId);
            } else if (typeof rawId === "string") {
              const trimmed = rawId.trim();
              if (!trimmed) continue;
              if (mergedTagMap?.[trimmed]) {
                const mapped = mergedTagMap[trimmed] ?? [];
                mapped.forEach((gid) => {
                  const mappedExpress = idMap.get(gid);
                  if (mappedExpress !== undefined) {
                    idsToHighlight.push(mappedExpress);
                    mappedFromTagMap += 1;
                  }
                });
                tagHit += 1;
              } else {
                const expressId = idMap.get(trimmed);
                if (expressId !== undefined) {
                  idsToHighlight.push(expressId);
                  mappedFromIdMap += 1;
                } else if (/^\d+$/.test(trimmed)) {
                  const parsed = parseInt(trimmed, 10);
                  if (!Number.isNaN(parsed)) {
                    idsToHighlight.push(parsed);
                    mappedFromIdMap += 1;
                  } else {
                    tagMiss += 1;
                  }
                } else {
                  tagMiss += 1;
                }
              }
            }
          }

          if (!idsToHighlight.length) return;
          console.debug("[ModelViewer] highlight group", {
            group: group.customID,
            rawCount: group.ids.length,
            mappedCount: idsToHighlight.length,
            mappedFromIdMap,
            mappedFromTagMap,
            tagHit,
            tagMiss,
          });

          let material = highlightGroupMaterialsRef.current.get(group.customID);
          if (!material) {
            material = new THREE.MeshStandardMaterial({
              color: resolveColor(highlightGroupMaterial?.color ?? group.color, group.color),
              transparent: highlightGroupMaterial?.transparent ?? true,
              opacity: highlightGroupMaterial?.opacity ?? group.opacity ?? 0.8,
              depthWrite: highlightGroupMaterial?.depthWrite ?? true,
              depthTest: highlightGroupMaterial?.depthTest ?? true,
              metalness: highlightGroupMaterial?.metalness ?? 0,
              roughness: highlightGroupMaterial?.roughness ?? 0.6,
              ...highlightGroupMaterial,
            });
            highlightGroupMaterialsRef.current.set(group.customID, material);
          } else {
            material.color = resolveColor(
              highlightGroupMaterial?.color ?? group.color,
              group.color,
            );
            material.opacity = highlightGroupMaterial?.opacity ?? group.opacity ?? 0.8;
          }

          const subset = ifcLoaderRef.current?.ifcManager.createSubset({
            modelID: entry.model.modelID,
            ids: idsToHighlight,
            material,
            removePrevious: true,
            customID: group.customID,
          } as {
            modelID: number;
            ids: number[];
            material: THREE.Material;
            removePrevious: boolean;
            customID: string;
          });

          if (subset) {
            (subset as THREE.Mesh & { renderOrder: number }).renderOrder = 1;
            entry.model.add(subset);
            highlightSubsetsRef.current.set(
              group.customID,
              subset as THREE.Mesh & { renderOrder: number },
            );
          }
        });
        needsRenderRef.current = true;
        return;
      } else if (useGroups) {
        highlightColorGroups?.forEach((group) => {
          const idsToHighlight: number[] = [];
          let mappedFromIdMap = 0;
          let mappedFromTagMap = 0;
          for (const rawId of group.ids) {
            if (typeof rawId === "number") {
              idsToHighlight.push(rawId);
            } else if (typeof rawId === "string") {
              const trimmed = rawId.trim();
              if (!trimmed) continue;
              if (mergedTagMap?.[trimmed]) {
                const mapped = mergedTagMap[trimmed] ?? [];
                mapped.forEach((gid) => {
                  const mappedExpress = idMap.get(gid);
                  if (mappedExpress !== undefined) {
                    idsToHighlight.push(mappedExpress);
                    mappedFromTagMap += 1;
                  }
                });
                tagHit += 1;
              } else {
                const expressId = idMap.get(trimmed);
                if (expressId !== undefined) {
                  idsToHighlight.push(expressId);
                  mappedFromIdMap += 1;
                } else if (/^\d+$/.test(trimmed)) {
                  const parsed = parseInt(trimmed, 10);
                  if (!Number.isNaN(parsed)) {
                    idsToHighlight.push(parsed);
                    mappedFromIdMap += 1;
                  } else {
                    tagMiss += 1;
                  }
                } else {
                  tagMiss += 1;
                }
              }
            }
          }

          if (!idsToHighlight.length) return;
          console.debug("[ModelViewer] highlight group", {
            group: group.customID,
            rawCount: group.ids.length,
            mappedCount: idsToHighlight.length,
            mappedFromIdMap,
            mappedFromTagMap,
            tagHit,
            tagMiss,
          });

          let material = highlightGroupMaterialsRef.current.get(group.customID);
          if (!material) {
            material = new THREE.MeshStandardMaterial({
              color: resolveColor(highlightGroupMaterial?.color ?? group.color, group.color),
              transparent: highlightGroupMaterial?.transparent ?? true,
              opacity: highlightGroupMaterial?.opacity ?? group.opacity ?? 0.8,
              depthWrite: highlightGroupMaterial?.depthWrite ?? true,
              depthTest: highlightGroupMaterial?.depthTest ?? true,
              metalness: highlightGroupMaterial?.metalness ?? 0,
              roughness: highlightGroupMaterial?.roughness ?? 0.6,
              ...highlightGroupMaterial,
            });
            highlightGroupMaterialsRef.current.set(group.customID, material);
          } else {
            material.color = resolveColor(
              highlightGroupMaterial?.color ?? group.color,
              group.color,
            );
            material.opacity = highlightGroupMaterial?.opacity ?? group.opacity ?? 0.8;
          }

          idsToHighlight.forEach((id) => {
            expressToMaterial.set(id, material!);
          });
        });
      } else {
        if (ifcLoaderRef.current) {
          const idsToHighlight: number[] = [];
          highlightGlobalSet.forEach((gid) => {
            const expressId = idMap.get(gid);
            if (expressId !== undefined) {
              idsToHighlight.push(expressId);
            }
          });

          if (mergedTagMap && highlightTagSet.size > 0) {
            highlightTagSet.forEach((tagId) => {
              const tagIds = mergedTagMap?.[tagId] ?? [];
              tagIds.forEach((gid) => {
                const expressId = idMap.get(gid);
                if (expressId !== undefined) {
                  idsToHighlight.push(expressId);
                }
              });
            });
          }

          if (highlightSubsetRef.current) {
            entry.model.remove(highlightSubsetRef.current);
            highlightSubsetRef.current = null;
          }

          if (idsToHighlight.length > 0) {
            const subset = ifcLoaderRef.current.ifcManager.createSubset({
              modelID: entry.model.modelID,
              ids: idsToHighlight,
              material: highlightMaterial,
              removePrevious: true,
              customID: "highlight",
            } as {
              modelID: number;
              ids: number[];
              material: THREE.Material;
              removePrevious: boolean;
              customID: string;
            });
            if (subset) {
              (subset as THREE.Mesh & { renderOrder: number }).renderOrder = 1;
              entry.model.add(subset);
              highlightSubsetRef.current = subset as THREE.Mesh & {
                renderOrder: number;
              };
            }
          }

          needsRenderRef.current = true;
          return;
        }

        highlightGlobalSet.forEach((gid) => {
          const expressId = idMap.get(gid);
          if (expressId !== undefined) {
            expressToMaterial.set(expressId, highlightMaterial);
          }
        });

        if (mergedTagMap && highlightTagSet.size > 0) {
          highlightTagSet.forEach((tagId) => {
            const tagIds = mergedTagMap?.[tagId] ?? [];
            tagIds.forEach((gid) => {
              const expressId = idMap.get(gid);
              if (expressId !== undefined) {
                expressToMaterial.set(expressId, highlightMaterial);
              }
            });
          });
        }
      }

      let matchedMeshes = 0;
      entry.meshes.forEach((mesh) => {
        const expressID = (mesh as THREE.Mesh & { expressID?: number }).expressID;
        const originalMaterial = entry.originalMaterials.get(mesh.uuid);
        if (expressID !== undefined && expressToMaterial.has(expressID)) {
          mesh.material = expressToMaterial.get(expressID)!;
          matchedMeshes += 1;
        } else if (originalMaterial) {
          mesh.material = originalMaterial;
        }
      });
      console.debug("[ModelViewer] highlight applied", {
        modelKey,
        meshes: entry.meshes.length,
        matchedMeshes,
        highlightedIds: expressToMaterial.size,
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
    highlightSubsetsRef.current.clear();
    highlightSubsetRef.current = null;
    modelsRef.current.forEach((entry) => disposeModel(entry.model));
    modelsRef.current.clear();
    tagMapsRef.current.clear();
    globalIdMapsRef.current.clear();
    rootGroupRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    isInitializedRef.current = false;
    isInitializingRef.current = false;
    modelsSignatureRef.current = null;
    if (ifcLoaderRef.current?.ifcManager) {
      try {
        ifcLoaderRef.current.ifcManager.dispose();
      } catch (error) {
        console.warn("[ModelViewer] 卸载IFC实例时出错:", error);
      }
      ifcLoaderRef.current = null;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!normalizedModelsRef.current.length || !containerRef.current) return;

    if (
      modelsSignatureRef.current === modelsSignature &&
      (isInitializedRef.current || isInitializingRef.current)
    ) {
      return;
    }

    if (isInitializedRef.current || isInitializingRef.current) {
      cleanup();
    }

    const initViewer = async () => {
      isInitializingRef.current = true;
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
          normalizedModelsRef.current.map(async (item) => {
            console.log("[ModelViewer] fetching model:", item.src);
            return loadModelBuffer(item.src, abortControllerRef.current?.signal);
          }),
        );

        if (abortControllerRef.current?.signal.aborted) return;

        const baseMaterial = new THREE.MeshStandardMaterial({
          color: resolveColor(baseMaterialOverrides?.color, "#808080"),
          transparent: baseMaterialOverrides?.transparent ?? true,
          opacity: baseMaterialOverrides?.opacity ?? 0.3,
          depthWrite: baseMaterialOverrides?.depthWrite ?? false,
          metalness: baseMaterialOverrides?.metalness ?? 0,
          roughness: baseMaterialOverrides?.roughness ?? 1,
          ...baseMaterialOverrides,
        });

        await Promise.all(
          normalizedModelsRef.current.map(async (item, index) => {
            setLoadingState((prev) => ({
              ...prev,
              progress: 20 + Math.round((index / normalizedModels.length) * 60),
              message: `正在解析模型 ${index + 1}/${normalizedModels.length}...`,
            }));

            const ifcLoader = new IFCLoader();
            ifcLoader.ifcManager.setWasmPath("/wasm/");
            ifcLoaderRef.current = ifcLoader;
            const model = (await ifcLoader.parse(buffers[index])) as THREE.Object3D & {
              modelID: number;
            };
            const cachedMetadata = modelMetadataCache.get(item.src);
            const idMap = cachedMetadata
              ? cloneGlobalIdMap(cachedMetadata.globalIdMap)
              : await buildGlobalIdMap(ifcLoader, model.modelID);
            const modelTagMap = cachedMetadata
              ? cloneTagMap(cachedMetadata.tagMap)
              : await buildTagMap(ifcLoader, model.modelID);
            if (!cachedMetadata) {
              modelMetadataCache.set(item.src, {
                globalIdMap: cloneGlobalIdMap(idMap),
                tagMap: cloneTagMap(modelTagMap),
              });
            }
            console.debug("[ModelViewer] tag map built", {
              modelKey: item.key,
              tagKeys: Object.keys(modelTagMap).length,
              fromCache: Boolean(cachedMetadata),
            });

            if (abortControllerRef.current?.signal.aborted) return;

            model.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                child.material = baseMaterial;
                child.renderOrder = 0;
              }
            });

            rootGroupRef.current?.add(model);

            const meshes: THREE.Mesh[] = [];
            const originalMaterials = new Map<string, THREE.Material | THREE.Material[]>();
            model.traverse((child: THREE.Object3D) => {
              if (child instanceof THREE.Mesh) {
                meshes.push(child);
                if (!originalMaterials.has(child.uuid)) {
                  originalMaterials.set(child.uuid, child.material);
                }
              }
            });

            globalIdMapsRef.current.set(item.key, idMap);
            tagMapsRef.current.set(item.key, modelTagMap);
            modelsRef.current.set(item.key, {
              model,
              meshes,
              originalMaterials,
            });
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
        isInitializingRef.current = false;
        modelsSignatureRef.current = modelsSignature;

        setLoadingState({
          isLoading: false,
          progress: 100,
          message: "加载完成",
          error: null,
        });

        applyMultiHighlight();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          isInitializingRef.current = false;
          return;
        }
        console.error("[ModelViewer] 初始化失败:", err);
        setLoadingState({
          isLoading: false,
          progress: 0,
          message: "",
          error: err instanceof Error ? err.message : "初始化失败",
        });
        isInitializingRef.current = false;
      }
    };

    initViewer();

    return () => {
      cleanup();
    };
  }, [modelsSignature, startRenderLoop]);

  useEffect(() => {
    applyMultiHighlight();
  }, [highlightGlobalIds, highlightTagIds, highlightColor, highlightColorGroups, normalizedModels]);

  return (
    <div className={cn("relative w-full h-full bg-[#03122e]", className)}>
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: "400px" }} />

      {loadingState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center w-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 mb-2">{loadingState.message || "加载模型中..."}</p>
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
