import * as THREE from 'three';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';
import type { SerializedModel, LoadingState } from '@/types/domain/worker';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Dispatch, SetStateAction } from 'react';
import type { buildIdCaches } from './ifcCaches';

type Ref<T> = { current: T };

type ApplyHighlight = (model: THREE.Object3D & { modelID: number }, attempt?: number) => Promise<void> | void;

type BuildIdCaches = typeof buildIdCaches;

type SelectableModel = THREE.Object3D & { modelID: number };

type AnyMesh = THREE.Mesh & { renderOrder: number };

interface DeserializeParams {
  serialized: SerializedModel;
}

export function deserializeModel({ serialized }: DeserializeParams): SelectableModel {
  console.log('[ModelViewer] 开始反序列化模型');

  const group = new THREE.Group() as any;
  group.modelID = serialized.modelID;

  serialized.meshes.forEach((meshData, index) => {
    try {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(meshData.geometry.positions, 3));

      if (meshData.geometry.normals) {
        geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.geometry.normals, 3));
      }

      if (meshData.geometry.indices) {
        geometry.setIndex(new THREE.BufferAttribute(meshData.geometry.indices, 1));
      }

      geometry.uuid = meshData.geometry.uuid;
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();

      const material = new THREE.MeshStandardMaterial({
        color: meshData.material.color,
        opacity: meshData.material.opacity,
        transparent: meshData.material.transparent,
        side: meshData.material.side as THREE.Side,
        depthWrite: true,
        depthTest: true,
        metalness: 0,
        roughness: 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material) as THREE.Mesh & { expressID?: number };
      mesh.matrix.fromArray(meshData.matrix);
      mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);

      if (meshData.expressID !== undefined) {
        mesh.expressID = meshData.expressID;
      }

      mesh.name = meshData.name || `Mesh_${index}`;
      mesh.visible = meshData.visible;
      mesh.renderOrder = meshData.renderOrder;

      group.add(mesh);
    } catch (error) {
      console.warn('[ModelViewer] 反序列化网格失败:', error);
    }
  });

  console.log(`[ModelViewer] 反序列化完成，共 ${group.children.length} 个网格`);
  return group;
}

interface WorkerModelParams {
  sceneRef: Ref<THREE.Scene | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
  containerRef: Ref<HTMLDivElement | null>;
  ifcLoaderRef: Ref<IFCLoader | null>;
  modelRef: Ref<SelectableModel | null>;
  setLoadingState: Dispatch<SetStateAction<LoadingState>>;
  setupCameraAndControls: (params: {
    model: THREE.Object3D;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controlsRef: Ref<OrbitControls | null>;
    sceneRef: Ref<THREE.Scene | null>;
    cameraRef: Ref<THREE.PerspectiveCamera | null>;
    rendererRef: Ref<THREE.WebGLRenderer | null>;
  }) => void;
  startRenderLoop: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => void;
  buildIdCaches: BuildIdCaches;
  applyHighlight: ApplyHighlight;
  globalIdMapRef: Ref<Map<string, number> | null>;
  globalIdMapModelIdRef: Ref<number | null>;
  productIdsRef: Ref<number[] | null>;
  productIndexReadyRef: Ref<boolean>;
  needsRenderRef: Ref<boolean>;
  controlsRef: Ref<OrbitControls | null>;
  animateIdRef: Ref<number | null>;
  abortControllerRef: Ref<AbortController | null>;
  expressIdIndexMapRef: Ref<Map<number, { [materialID: number]: number[] }> | null>;
}

export function createWorkerModel({
  sceneRef,
  cameraRef,
  rendererRef,
  containerRef,
  ifcLoaderRef,
  modelRef,
  setLoadingState,
  setupCameraAndControls,
  startRenderLoop,
  buildIdCaches,
  applyHighlight,
  globalIdMapRef,
  globalIdMapModelIdRef,
  productIdsRef,
  productIndexReadyRef,
  needsRenderRef,
  controlsRef,
  animateIdRef,
  abortControllerRef,
  expressIdIndexMapRef,
}: WorkerModelParams) {
  const handleWorkerSuccess = async (modelData: SerializedModel) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !containerRef.current) {
      console.error('[ModelViewer] 场景未初始化');
      return;
    }

    try {
      const model = deserializeModel({ serialized: modelData });
      modelRef.current = model;

      sceneRef.current.add(model);

      const workerBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        metalness: 0,
        roughness: 1,
      });

      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.material = workerBaseMaterial;
          child.renderOrder = 0;
        }
      });

      setupCameraAndControls({
        model,
        camera: cameraRef.current,
        renderer: rendererRef.current,
        controlsRef,
        sceneRef,
        cameraRef,
        rendererRef,
      });

      startRenderLoop(sceneRef.current, cameraRef.current, rendererRef.current);

      if (ifcLoaderRef.current) {
        await buildIdCaches({
          ifcLoader: ifcLoaderRef.current,
          modelID: model.modelID,
          productIdsRef,
          globalIdMapRef,
          globalIdMapModelIdRef,
          productIndexReadyRef,
          expressIdIndexMapRef,
        });
      }

      setLoadingState({
        isLoading: false,
        progress: 90,
        message: '正在应用高亮...',
        error: null,
      });

      applyHighlight(model);

      setLoadingState({
        isLoading: false,
        progress: 100,
        message: '加载完成',
        error: null,
      });

      console.log('[ModelViewer] 模型加载完成');
    } catch (error) {
      console.error('[ModelViewer] 处理模型失败:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '处理模型失败',
      }));
    }
  };

  return { handleWorkerSuccess };
}
