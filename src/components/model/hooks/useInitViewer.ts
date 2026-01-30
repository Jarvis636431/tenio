import { useCallback } from 'react';
import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import type { Dispatch, SetStateAction } from 'react';

type Ref<T> = { current: T };

type LoadModelInMainThread = (
  data: ArrayBuffer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) => Promise<void>;

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

interface UseInitViewerParams {
  src?: string;
  containerRef: Ref<HTMLDivElement | null>;
  isInitializedRef: Ref<boolean>;
  abortControllerRef: Ref<AbortController | null>;
  setLoadingState: Dispatch<SetStateAction<LoadingState>>;
  sceneRef: Ref<THREE.Scene | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
  ifcLoaderRef: Ref<IFCLoader | null>;
  isWorkerAvailable: boolean;
  parseIFC: (data: ArrayBuffer, wasmPath: string) => void;
  loadModelInMainThread: LoadModelInMainThread;
}

export function useInitViewer({
  src,
  containerRef,
  isInitializedRef,
  abortControllerRef,
  setLoadingState,
  sceneRef,
  cameraRef,
  rendererRef,
  ifcLoaderRef,
  isWorkerAvailable,
  parseIFC,
  loadModelInMainThread,
}: UseInitViewerParams) {
  const initViewer = useCallback(async () => {
    if (isInitializedRef.current || !containerRef.current || !src) {
      return;
    }

    console.log('[ModelViewer] 开始初始化viewer');
    setLoadingState({
      isLoading: true,
      progress: 0,
      message: '正在初始化...',
      error: null,
    });

    try {
      abortControllerRef.current = new AbortController();

      const container = containerRef.current;
      container.innerHTML = '';

      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = null;

      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.01,
        2000
      );
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
      camera.near = 0.01;
      camera.far = 2000;
      camera.updateProjectionMatrix();

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
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

      const ifcLoader = new IFCLoader();
      ifcLoader.ifcManager.setWasmPath('/wasm/');
      ifcLoaderRef.current = ifcLoader;

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      console.log('[ModelViewer] 开始加载模型:', src);

      setLoadingState(prev => ({
        ...prev,
        progress: 10,
        message: '正在下载模型...',
      }));

      if (abortControllerRef.current?.signal.aborted) {
        console.log('[ModelViewer] 加载已取消（下载前）');
        return;
      }

      const response = await fetch(src, {
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`请求模型文件失败: ${response.status}`);
      }

      if (abortControllerRef.current?.signal.aborted) {
        console.log('[ModelViewer] 加载已取消（下载后）');
        return;
      }

      const data = await response.arrayBuffer();

      if (abortControllerRef.current?.signal.aborted) {
        console.log('[ModelViewer] 加载已取消（数据获取后）');
        return;
      }

      setLoadingState(prev => ({
        ...prev,
        progress: 30,
        message: '下载完成，准备解析...',
      }));

      console.log('[ModelViewer] isWorkerAvailable:', isWorkerAvailable);
      if (isWorkerAvailable) {
        console.log('[ModelViewer] 使用 Worker 解析，数据大小:', data.byteLength, 'bytes');
        parseIFC(data, '/wasm/');
        console.log('[ModelViewer] Worker 解析请求已发送');
      } else {
        console.warn('[ModelViewer] Worker 不可用，使用主线程解析');
        await loadModelInMainThread(data, scene, camera, renderer);
      }

      isInitializedRef.current = true;
      console.log('[ModelViewer] Viewer初始化完成');

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[ModelViewer] 初始化被取消');
        return;
      }
      console.error('[ModelViewer] 初始化失败:', err);
      setLoadingState({
        isLoading: false,
        progress: 0,
        message: '',
        error: err instanceof Error ? err.message : '初始化失败',
      });
    }
  }, [
    src,
    containerRef,
    isInitializedRef,
    abortControllerRef,
    setLoadingState,
    sceneRef,
    cameraRef,
    rendererRef,
    ifcLoaderRef,
    isWorkerAvailable,
    parseIFC,
    loadModelInMainThread,
  ]);

  return { initViewer };
}
