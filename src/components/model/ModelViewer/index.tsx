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
import { cleanup as cleanupUtil } from './utils/cleanup';
import { handleWorkerSuccess as handleWorkerSuccessUtil } from './utils/workerModel';
import { initViewer as initViewerUtil } from './utils/initViewer';
import { handleResize as handleResizeUtil } from './utils/resize';

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

  // 处理 Worker 成功
  const handleWorkerSuccess = useCallback(async (modelData: SerializedModel) => {
    await handleWorkerSuccessUtil({
      modelData,
      sceneRef,
      cameraRef,
      rendererRef,
      containerRef,
      ifcLoaderRef,
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
      animateIdRef,
      abortControllerRef,
      raycasterRef,
      mouseRef,
      infoDivRef,
      selectionSubsetRef,
      clickHandlerRef,
      clickTargetRef,
      expressIdIndexMapRef,
    });
  }, [highlightGroups, highlightIds, highlightColor]);

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
    cleanupUtil({
      cancelWorker,
      animateIdRef,
      abortControllerRef,
      rendererRef,
      controlsRef,
      containerRef,
      sceneRef,
      cameraRef,
      modelRef,
      raycasterRef,
      mouseRef,
      infoDivRef,
      selectionSubsetRef,
      highlightSubsetRef,
      highlightSubsetsRef,
      productIdsRef,
      globalIdMapRef,
      globalIdMapModelIdRef,
      expressIdIndexMapRef,
      ifcLoaderRef,
      isInitializedRef,
      productIndexReadyRef,
      highlightRetryTimeoutRef,
      clickHandlerRef,
      clickTargetRef,
    });
  }, [cancelWorker]);

  // 初始化viewer
  const initViewer = useCallback(async () => {
    await initViewerUtil({
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
    });
  }, [src, isWorkerAvailable, parseIFC, loadModelInMainThread]);

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
    handleResizeUtil({ containerRef, rendererRef, cameraRef });
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
