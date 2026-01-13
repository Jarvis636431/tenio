import * as THREE from 'three';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Dispatch, SetStateAction } from 'react';

type Ref<T> = { current: T };

type ApplyHighlight = (model: THREE.Object3D & { modelID: number }, attempt?: number) => Promise<void> | void;

type LoadModelInMainThread = (
  data: ArrayBuffer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  container: HTMLDivElement
) => Promise<void>;

interface MainThreadLoaderParams {
  ifcLoaderRef: Ref<IFCLoader | null>;
  abortControllerRef: Ref<AbortController | null>;
  modelRef: Ref<(THREE.Object3D & { modelID: number }) | null>;
  setLoadingState: Dispatch<SetStateAction<{ isLoading: boolean; progress: number; message: string; error: string | null }>>;
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
  buildIdCaches: (params: {
    ifcLoader: IFCLoader;
    modelID: number;
    productIdsRef: Ref<number[] | null>;
    globalIdMapRef: Ref<Map<string, number> | null>;
    globalIdMapModelIdRef: Ref<number | null>;
    productIndexReadyRef: Ref<boolean>;
    expressIdIndexMapRef: Ref<Map<number, { [materialID: number]: number[] }> | null>;
  }) => Promise<void>;
  applyHighlight: ApplyHighlight;
  productIdsRef: Ref<number[] | null>;
  globalIdMapRef: Ref<Map<string, number> | null>;
  globalIdMapModelIdRef: Ref<number | null>;
  productIndexReadyRef: Ref<boolean>;
  needsRenderRef: Ref<boolean>;
  controlsRef: Ref<OrbitControls | null>;
  sceneRef: Ref<THREE.Scene | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
  animateIdRef: Ref<number | null>;
  expressIdIndexMapRef: Ref<Map<number, { [materialID: number]: number[] }> | null>;
}

export function createMainThreadLoader({
  ifcLoaderRef,
  abortControllerRef,
  modelRef,
  setLoadingState,
  setupCameraAndControls,
  startRenderLoop,
  buildIdCaches,
  applyHighlight,
  productIdsRef,
  globalIdMapRef,
  globalIdMapModelIdRef,
  productIndexReadyRef,
  needsRenderRef,
  controlsRef,
  sceneRef,
  cameraRef,
  rendererRef,
  animateIdRef,
  expressIdIndexMapRef,
}: MainThreadLoaderParams) {
  const loadModelInMainThread: LoadModelInMainThread = async (
    data,
    scene,
    camera,
    renderer,
    container
  ) => {
    if (!ifcLoaderRef.current) {
      throw new Error('IFC Loader 未初始化');
    }

    setLoadingState(prev => ({
      ...prev,
      progress: 40,
      message: '正在解析模型（主线程）...',
    }));

    const model = await ifcLoaderRef.current.parse(data) as THREE.Object3D & { modelID: number };

    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    setLoadingState(prev => ({
      ...prev,
      progress: 70,
      message: '正在处理模型...',
    }));

    model.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }

        if (child.material) {
          child.material.side = THREE.FrontSide;
          child.material.transparent = false;
          child.material.depthWrite = true;
          child.material.depthTest = true;

          if (child.material.map) {
            child.material.map.generateMipmaps = false;
            child.material.map.minFilter = THREE.LinearFilter;
            child.material.map.magFilter = THREE.LinearFilter;
          }
        }

        child.renderOrder = 0;
      }
    });

    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    scene.add(model);
    modelRef.current = model;

    const mainThreadBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      metalness: 0,
      roughness: 1,
    });

    model.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.material = mainThreadBaseMaterial;
        child.renderOrder = 0;
      }
    });

    setupCameraAndControls({
      model,
      camera,
      renderer,
      controlsRef,
      sceneRef,
      cameraRef,
      rendererRef,
    });

    startRenderLoop(scene, camera, renderer);

    await buildIdCaches({
      ifcLoader: ifcLoaderRef.current,
      modelID: model.modelID,
      productIdsRef,
      globalIdMapRef,
      globalIdMapModelIdRef,
      productIndexReadyRef,
      expressIdIndexMapRef,
    });

    setLoadingState(prev => ({
      ...prev,
      progress: 90,
      message: '正在应用高亮...',
    }));

    await applyHighlight(model);

    setLoadingState({
      isLoading: false,
      progress: 100,
      message: '加载完成',
      error: null,
    });

    console.log('[ModelViewer] 模型加载完成（主线程）');
  };

  return { loadModelInMainThread };
}
