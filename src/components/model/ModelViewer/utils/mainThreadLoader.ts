import * as THREE from 'three';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';
import type { HighlightGroup, applyHighlight as applyHighlightFn } from './highlight';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Dispatch, SetStateAction } from 'react';

type Ref<T> = { current: T };

type ApplyHighlight = typeof applyHighlightFn;

interface LoadModelInMainThreadParams {
  data: ArrayBuffer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  container: HTMLDivElement;
  ifcLoader: IFCLoader;
  abortControllerRef: Ref<AbortController | null>;
  infoDivRef: Ref<HTMLDivElement | null>;
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
  setupInteraction: (params: {
    ifcLoader: IFCLoader;
    model: THREE.Object3D & { modelID: number };
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    raycasterRef: Ref<THREE.Raycaster | null>;
    mouseRef: Ref<THREE.Vector2 | null>;
    infoDivRef: Ref<HTMLDivElement | null>;
    selectionSubsetRef: Ref<(THREE.Mesh & { renderOrder: number }) | null>;
    modelRef: Ref<(THREE.Object3D & { modelID: number }) | null>;
    clickHandlerRef: Ref<((event: MouseEvent) => void) | null>;
    clickTargetRef: Ref<HTMLCanvasElement | null>;
  }) => void;
  startRenderLoop: (params: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controlsRef: Ref<OrbitControls | null>;
    animateIdRef: Ref<number | null>;
    abortControllerRef: Ref<AbortController | null>;
    needsRenderRef: Ref<boolean>;
  }) => void;
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
  highlightGroups?: HighlightGroup[];
  highlightIds: Array<number | string>;
  highlightColor: string;
  globalIdMapRef: Ref<Map<string, number> | null>;
  globalIdMapModelIdRef: Ref<number | null>;
  productIdsRef: Ref<number[] | null>;
  productIndexReadyRef: Ref<boolean>;
  highlightSubsetRef: Ref<(THREE.Mesh & { renderOrder: number }) | null>;
  highlightSubsetsRef: Ref<Map<string, THREE.Mesh & { renderOrder: number }>>;
  scheduleHighlightRetry: (nextAttempt: number) => void;
  needsRenderRef: Ref<boolean>;
  maxHighlightRetry: number;
  controlsRef: Ref<OrbitControls | null>;
  sceneRef: Ref<THREE.Scene | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
  raycasterRef: Ref<THREE.Raycaster | null>;
  mouseRef: Ref<THREE.Vector2 | null>;
  selectionSubsetRef: Ref<(THREE.Mesh & { renderOrder: number }) | null>;
  clickHandlerRef: Ref<((event: MouseEvent) => void) | null>;
  clickTargetRef: Ref<HTMLCanvasElement | null>;
  animateIdRef: Ref<number | null>;
  expressIdIndexMapRef: Ref<Map<number, { [materialID: number]: number[] }> | null>;
}

export async function loadModelInMainThread({
  data,
  scene,
  camera,
  renderer,
  container,
  ifcLoader,
  abortControllerRef,
  infoDivRef,
  modelRef,
  setLoadingState,
  setupCameraAndControls,
  setupInteraction,
  startRenderLoop,
  buildIdCaches,
  applyHighlight,
  highlightGroups,
  highlightIds,
  highlightColor,
  globalIdMapRef,
  globalIdMapModelIdRef,
  productIdsRef,
  productIndexReadyRef,
  highlightSubsetRef,
  highlightSubsetsRef,
  scheduleHighlightRetry,
  needsRenderRef,
  maxHighlightRetry,
  controlsRef,
  sceneRef,
  cameraRef,
  rendererRef,
  raycasterRef,
  mouseRef,
  selectionSubsetRef,
  clickHandlerRef,
  clickTargetRef,
  animateIdRef,
  expressIdIndexMapRef,
}: LoadModelInMainThreadParams) {
  setLoadingState(prev => ({
    ...prev,
    progress: 40,
    message: '正在解析模型（主线程）...',
  }));

  const model = await ifcLoader.parse(data) as THREE.Object3D & { modelID: number };

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

  if (!infoDivRef.current) {
    const info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '12px';
    info.style.right = '12px';
    info.style.maxWidth = '360px';
    info.style.background = 'rgba(0,0,0,0.65)';
    info.style.color = '#fff';
    info.style.padding = '10px 12px';
    info.style.borderRadius = '8px';
    info.style.fontSize = '12px';
    info.style.lineHeight = '1.4';
    info.style.pointerEvents = 'none';
    info.style.whiteSpace = 'pre-wrap';
    info.textContent = '点击构件以查看属性';
    infoDivRef.current = info;
    container.style.position = 'relative';
    container.appendChild(info);
  }

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

  setupInteraction({
    ifcLoader,
    model,
    camera,
    renderer,
    raycasterRef,
    mouseRef,
    infoDivRef,
    selectionSubsetRef,
    modelRef,
    clickHandlerRef,
    clickTargetRef,
  });

  startRenderLoop({
    scene,
    camera,
    renderer,
    controlsRef,
    animateIdRef,
    abortControllerRef,
    needsRenderRef,
  });

  await buildIdCaches({
    ifcLoader,
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

  await applyHighlight({
    ifcLoader,
    model,
    attempt: 0,
    highlightGroups,
    highlightIds,
    highlightColor,
    globalIdMapRef,
    globalIdMapModelIdRef,
    productIdsRef,
    productIndexReadyRef,
    highlightSubsetRef,
    highlightSubsetsRef,
    modelRef,
    scheduleHighlightRetry,
    needsRenderRef,
    maxHighlightRetry,
  });

  setLoadingState({
    isLoading: false,
    progress: 100,
    message: '加载完成',
    error: null,
  });

  console.log('[ModelViewer] 模型加载完成（主线程）');
}
