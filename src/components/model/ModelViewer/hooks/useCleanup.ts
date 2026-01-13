import { useCallback } from 'react';
import type * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { IFCLoader } from 'web-ifc-three/IFCLoader';

type Ref<T> = { current: T };

type AnyMesh = THREE.Mesh & { renderOrder: number };

interface UseCleanupParams {
  cancelWorker: () => void;
  animateIdRef: Ref<number | null>;
  abortControllerRef: Ref<AbortController | null>;
  rendererRef: Ref<THREE.WebGLRenderer | null>;
  controlsRef: Ref<OrbitControls | null>;
  containerRef: Ref<HTMLDivElement | null>;
  sceneRef: Ref<THREE.Scene | null>;
  cameraRef: Ref<THREE.PerspectiveCamera | null>;
  modelRef: Ref<(THREE.Object3D & { modelID: number }) | null>;
  highlightSubsetRef: Ref<AnyMesh | null>;
  highlightSubsetsRef: Ref<Map<string, AnyMesh>>;
  productIdsRef: Ref<number[] | null>;
  globalIdMapRef: Ref<Map<string, number> | null>;
  globalIdMapModelIdRef: Ref<number | null>;
  expressIdIndexMapRef: Ref<Map<number, { [materialID: number]: number[] }> | null>;
  ifcLoaderRef: Ref<IFCLoader | null>;
  isInitializedRef: Ref<boolean>;
  productIndexReadyRef: Ref<boolean>;
  highlightRetryTimeoutRef: Ref<number | null>;
}

export function useCleanup({
  cancelWorker,
  animateIdRef,
  abortControllerRef,
  rendererRef,
  controlsRef,
  containerRef,
  sceneRef,
  cameraRef,
  modelRef,
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
}: UseCleanupParams) {
  const cleanup = useCallback(() => {
    console.log('[ModelViewer] 开始清理资源');

    cancelWorker();

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
      containerRef.current.innerHTML = '';
    }

    sceneRef.current = null;
    cameraRef.current = null;
    modelRef.current = null;
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
  }, [
    cancelWorker,
    animateIdRef,
    abortControllerRef,
    rendererRef,
    controlsRef,
    containerRef,
    sceneRef,
    cameraRef,
    modelRef,
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
  ]);

  return { cleanup };
}
