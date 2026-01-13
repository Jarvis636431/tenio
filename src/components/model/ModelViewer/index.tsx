import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIFCWorker } from '@/hooks/useIFCWorker';
import type { SerializedModel, LoadingState } from '@/types/worker.types';
import { buildIdCaches } from './utils/ifcCaches';
import { setupCameraAndControls } from './utils/cameraControls';
import { startRenderLoop } from './utils/renderLoop';
import { setupInteraction } from './utils/interaction';
import { applyHighlight, HighlightGroup } from './utils/highlight';
import { loadModelInMainThread as loadModelInMainThreadUtil } from './utils/mainThreadLoader';

// TODO: 继续优化：在加载阶段预建 ExpressID/GlobalId/索引映射，交互阶段仅查表并通过 visible/material/drawRange 切换渲染，减少 createSubset 与属性遍历开销；同时完善子集/材质的统一释放策略。

interface ModelViewerProps {
  src?: string;
  allowUpload?: boolean;
  className?: string;
  highlightIds?: Array<number | string>;
  highlightColor?: string;
  baseColor?: string;
  // 新增：支持多组高亮
  highlightGroups?: HighlightGroup[];
}

export function ModelViewer({
  src,
  allowUpload = false,
  className,
  highlightIds = [],
  highlightColor = "#ff9800",
  baseColor = "#808080",
  highlightGroups,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animateIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ifcLoaderRef = useRef<IFCLoader | null>(null);
  const modelRef = useRef<(THREE.Object3D & { modelID: number }) | null>(null);
  const productIndexReadyRef = useRef(false);
  const highlightRetryTimeoutRef = useRef<number | null>(null);
  const MAX_HIGHLIGHT_RETRY = 20;
  const HIGHLIGHT_RETRY_DELAY = 750;
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  const infoDivRef = useRef<HTMLDivElement | null>(null);
  const selectionSubsetRef = useRef<(THREE.Mesh & { renderOrder: number }) | null>(null);
  const highlightSubsetRef = useRef<(THREE.Mesh & { renderOrder: number }) | null>(null);
  const highlightSubsetsRef = useRef<Map<string, THREE.Mesh & { renderOrder: number }>>(new Map());
  const clickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const clickTargetRef = useRef<HTMLCanvasElement | null>(null);
  const globalIdMapRef = useRef<Map<string, number> | null>(null);
  const globalIdMapModelIdRef = useRef<number | null>(null);
  const productIdsRef = useRef<number[] | null>(null);
  const expressIdIndexMapRef = useRef<Map<number, { [materialID: number]: number[] }> | null>(null);
  const needsRenderRef = useRef(true);

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '',
    error: null,
  });

  // Worker hook
  const { parseIFC, cancel: cancelWorker, isWorkerAvailable } = useIFCWorker({
    onProgress: (progress, message) => {
      console.log(`[ModelViewer] Worker 进度: ${progress}% - ${message}`);
      setLoadingState(prev => ({
        ...prev,
        progress,
        message,
      }));
    },
    onSuccess: (modelData) => {
      console.log('[ModelViewer] Worker 解析成功');
      void handleWorkerSuccess(modelData);
    },
    onError: (error) => {
      console.error('[ModelViewer] Worker 错误:', error);
      // 不要设置错误状态，因为可能只是 Worker 不可用
      // 主线程降级会在 initViewer 中处理
    },
  });

  // 反序列化模型数据
  const deserializeModel = useCallback((serialized: SerializedModel): THREE.Object3D & { modelID: number } => {
    console.log('[ModelViewer] 开始反序列化模型');
    
    const group = new THREE.Group() as any;
    group.modelID = serialized.modelID;

    serialized.meshes.forEach((meshData, index) => {
      try {
        // 创建几何体
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

        // 创建材质
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
        // material.uuid = meshData.material.uuid; // uuid 是只读的

        // 创建网格
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
  }, []);

  // 处理 Worker 成功
  const handleWorkerSuccess = useCallback(async (modelData: SerializedModel) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !containerRef.current) {
      console.error('[ModelViewer] 场景未初始化');
      return;
    }

    try {
      // 反序列化模型
      const model = deserializeModel(modelData);
      modelRef.current = model;

      // 添加到场景
      sceneRef.current.add(model);

      // 应用基础材质
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

      // 设置相机和控制器
      setupCameraAndControls({
        model,
        camera: cameraRef.current,
        renderer: rendererRef.current,
        controlsRef,
        sceneRef,
        cameraRef,
        rendererRef,
      });

      // 设置交互
      setupInteraction({
        ifcLoader: ifcLoaderRef.current!,
        model,
        camera: cameraRef.current,
        renderer: rendererRef.current,
        raycasterRef,
        mouseRef,
        infoDivRef,
        selectionSubsetRef,
        modelRef,
        clickHandlerRef,
        clickTargetRef,
      });

      // 开始渲染循环
      startRenderLoop({
        scene: sceneRef.current,
        camera: cameraRef.current,
        renderer: rendererRef.current,
        controlsRef,
        animateIdRef,
        abortControllerRef,
        needsRenderRef,
      });

      // 构建索引缓存（ExpressID 列表 + GlobalId 映射）
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

      // 更新加载状态
      setLoadingState({
        isLoading: false,
        progress: 90,
        message: '正在应用高亮...',
        error: null,
      });

      // 应用高亮
      if (ifcLoaderRef.current) {
        applyHighlight({
          ifcLoader: ifcLoaderRef.current,
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
          maxHighlightRetry: MAX_HIGHLIGHT_RETRY,
        });
      }

      // 完成
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
  }, [deserializeModel]);

  // 主线程降级加载
  const loadModelInMainThread = useCallback(async (
    data: ArrayBuffer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    container: HTMLDivElement
  ) => {
    try {
      if (!ifcLoaderRef.current) {
        throw new Error('IFC Loader 未初始化');
      }

      await loadModelInMainThreadUtil({
        data,
        scene,
        camera,
        renderer,
        container,
        ifcLoader: ifcLoaderRef.current,
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
        maxHighlightRetry: MAX_HIGHLIGHT_RETRY,
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
      });
    } catch (err) {
      console.error('[ModelViewer] 主线程加载失败:', err);
      throw err;
    }
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    console.log('[ModelViewer] 开始清理资源');
    
    // 取消 Worker
    cancelWorker();
    
    // 取消动画循环
    if (animateIdRef.current) {
      cancelAnimationFrame(animateIdRef.current);
      animateIdRef.current = null;
    }

    // 取消网络请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 清理Three.js资源
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    if (clickHandlerRef.current && clickTargetRef.current) {
      clickTargetRef.current.removeEventListener('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
      clickTargetRef.current = null;
    }

    // 清理容器
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // 重置refs
    sceneRef.current = null;
    cameraRef.current = null;
    modelRef.current = null;
    raycasterRef.current = null;
    mouseRef.current = null;
    infoDivRef.current = null;
    selectionSubsetRef.current = null;
    highlightSubsetRef.current = null;
    highlightSubsetsRef.current.clear();
    productIdsRef.current = null;
    globalIdMapRef.current = null;
    globalIdMapModelIdRef.current = null;
    expressIdIndexMapRef.current = null;
    if (ifcLoaderRef.current) {
      try {
        ifcLoaderRef.current.ifcManager?.dispose();
      } catch (disposeError) {
        console.warn('[ModelViewer] 卸载IFC实例时出错:', disposeError);
      }
      ifcLoaderRef.current = null;
    }
    isInitializedRef.current = false;
    productIndexReadyRef.current = false;
    if (highlightRetryTimeoutRef.current) {
      clearTimeout(highlightRetryTimeoutRef.current);
      highlightRetryTimeoutRef.current = null;
    }

    console.log('[ModelViewer] 资源清理完成');
  }, [cancelWorker]);

  // 初始化viewer
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
      // 创建新的AbortController用于取消下载
      abortControllerRef.current = new AbortController();

      const container = containerRef.current;
      container.innerHTML = '';

      // 创建场景
      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = null;

      // 创建相机
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

      // 创建渲染器
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

      // 添加光源
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // 创建IFC加载器（用于高亮和交互）
      const ifcLoader = new IFCLoader();
      ifcLoader.ifcManager.setWasmPath('/wasm/');
      ifcLoaderRef.current = ifcLoader;

      // 保存场景引用
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      // 加载模型（内联）
      console.log('[ModelViewer] 开始加载模型:', src);

      // 更新进度：开始下载
      setLoadingState(prev => ({
        ...prev,
        progress: 10,
        message: '正在下载模型...',
      }));

      // 检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[ModelViewer] 加载已取消（下载前）');
        return;
      }

      const response = await fetch(src!, {
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`请求模型文件失败: ${response.status}`);
      }

      // 再次检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[ModelViewer] 加载已取消（下载后）');
        return;
      }

      const data = await response.arrayBuffer();

      // 再次检查是否已被取消
      if (abortControllerRef.current?.signal.aborted) {
        console.log('[ModelViewer] 加载已取消（数据获取后）');
        return;
      }

      // 更新进度：下载完成
      setLoadingState(prev => ({
        ...prev,
        progress: 30,
        message: '下载完成，准备解析...',
      }));

      // 使用 Worker 解析（如果可用）
      console.log('[ModelViewer] isWorkerAvailable:', isWorkerAvailable);
      if (isWorkerAvailable) {
        console.log('[ModelViewer] 使用 Worker 解析，数据大小:', data.byteLength, 'bytes');
        parseIFC(data, '/wasm/');
        // Worker 会通过回调处理后续流程
        console.log('[ModelViewer] Worker 解析请求已发送');
      } else {
        // 降级：使用主线程解析
        console.warn('[ModelViewer] Worker 不可用，使用主线程解析');
        await loadModelInMainThread(data, scene, camera, renderer, container);
      }

      isInitializedRef.current = true;
      console.log('[ModelViewer] Viewer初始化完成');

    } catch (err) {
      // 忽略 AbortError
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
  }, [src, isWorkerAvailable, parseIFC, handleWorkerSuccess, loadModelInMainThread]);

  // 应用高亮
  const scheduleHighlightRetry = (nextAttempt: number) => {
    if (highlightRetryTimeoutRef.current) {
      clearTimeout(highlightRetryTimeoutRef.current);
    }
    highlightRetryTimeoutRef.current = window.setTimeout(() => {
      highlightRetryTimeoutRef.current = null;
      if (ifcLoaderRef.current && modelRef.current) {
        applyHighlight({
          ifcLoader: ifcLoaderRef.current,
          model: modelRef.current as THREE.Object3D & { modelID: number },
          attempt: nextAttempt,
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
          maxHighlightRetry: MAX_HIGHLIGHT_RETRY,
        });
      }
    }, HIGHLIGHT_RETRY_DELAY);
  };

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }, []);

  // 初始化effect
  useEffect(() => {
    if (src) {
      initViewer();
    }

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]); // 只依赖 src，避免无限循环

  // 高亮变化effect
  useEffect(() => {
    if (isInitializedRef.current && ifcLoaderRef.current && modelRef.current) {
      console.log('[ModelViewer] 高亮ID变化，重新应用高亮');
      applyHighlight({
        ifcLoader: ifcLoaderRef.current,
        model: modelRef.current as THREE.Object3D & { modelID: number },
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
        maxHighlightRetry: MAX_HIGHLIGHT_RETRY,
      });
    }
  }, [highlightIds, highlightColor, highlightGroups]);

  // 窗口大小变化effect
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <div className={cn("relative w-full h-full bg-gray-50", className)}>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {loadingState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center w-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 mb-2">{loadingState.message || '加载模型中...'}</p>
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

      {allowUpload && !src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">请选择IFC文件</p>
            <input
              type="file"
              accept=".ifc"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
