/**
 * IFC Worker Hook
 * 管理 Worker 生命周期和消息通信
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import type {
  WorkerMessage,
  WorkerResponse,
  SerializedModel,
  ProgressCallback,
  SuccessCallback,
  ErrorCallback,
} from '../types/worker.types';

// ============================================================================
// Hook 选项
// ============================================================================

export interface UseIFCWorkerOptions {
  onProgress?: ProgressCallback;
  onSuccess?: SuccessCallback;
  onError?: ErrorCallback;
  timeout?: number; // 超时时间（毫秒），默认 30 秒
}

// ============================================================================
// Hook 返回值
// ============================================================================

export interface UseIFCWorkerReturn {
  parseIFC: (arrayBuffer: ArrayBuffer, wasmPath: string) => void;
  cancel: () => void;
  isWorkerAvailable: boolean;
}

// ============================================================================
// Hook 实现
// ============================================================================

export function useIFCWorker(options: UseIFCWorkerOptions): UseIFCWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isWorkerAvailable, setIsWorkerAvailable] = useState(false);

  // ============================================================================
  // 初始化 Worker
  // ============================================================================

  useEffect(() => {
    try {
      console.log('[useIFCWorker] 创建 Worker');
      
      // 创建 Worker
      workerRef.current = new Worker(
        new URL('../../../../workers/ifc.worker.ts', import.meta.url),
        { type: 'module' }
      );

      setIsWorkerAvailable(true);

      // 设置消息处理器
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { type, data } = e.data;

        if (type === 'progress' && data?.progress !== undefined) {
          console.log(`[useIFCWorker] 进度: ${data.progress}% - ${data.message}`);
          options.onProgress?.(data.progress, data.message || '');
        } else if (type === 'success' && data?.modelData) {
          console.log('[useIFCWorker] 解析成功');
          clearTimeout(timeoutRef.current!);
          options.onSuccess?.(data.modelData);
        } else if (type === 'error') {
          console.error('[useIFCWorker] 解析失败:', data?.error);
          clearTimeout(timeoutRef.current!);
          options.onError?.(data?.error || '未知错误');
        }
      };

      // 设置错误处理器
      workerRef.current.onerror = (error) => {
        console.error('[useIFCWorker] Worker 错误:', error);
        clearTimeout(timeoutRef.current!);
        options.onError?.(`Worker 错误: ${error.message}`);
      };

      console.log('[useIFCWorker] Worker 创建成功');

    } catch (error) {
      console.warn('[useIFCWorker] Worker 创建失败，将使用主线程解析', error);
      setIsWorkerAvailable(false);
      // 不调用 onError，让组件自行处理降级
    }

    // 清理函数
    return () => {
      console.log('[useIFCWorker] 清理 Worker');
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsWorkerAvailable(false);
    };
  }, []); // 空依赖数组，只在挂载/卸载时执行

  // ============================================================================
  // 解析 IFC
  // ============================================================================

  const parseIFC = useCallback((arrayBuffer: ArrayBuffer, wasmPath: string) => {
    if (!workerRef.current) {
      console.error('[useIFCWorker] Worker 未初始化');
      options.onError?.('Worker 未初始化');
      return;
    }

    console.log('[useIFCWorker] 发送解析请求');

    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置超时
    const timeout = options.timeout || 30000; // 默认 30 秒
    timeoutRef.current = window.setTimeout(() => {
      console.error('[useIFCWorker] 解析超时');
      
      if (workerRef.current) {
        workerRef.current.terminate();
        
        // 重新创建 Worker
        try {
          workerRef.current = new Worker(
            new URL('../../../../workers/ifc.worker.ts', import.meta.url),
            { type: 'module' }
          );
          setIsWorkerAvailable(true);
        } catch (error) {
          console.error('[useIFCWorker] 重新创建 Worker 失败:', error);
          setIsWorkerAvailable(false);
        }
      }
      
      options.onError?.('解析超时（超过 30 秒）');
    }, timeout);

    // 发送解析请求
    const message: WorkerMessage = {
      type: 'parse',
      data: { arrayBuffer, wasmPath },
    };
    
    workerRef.current.postMessage(message);
  }, [options]);

  // ============================================================================
  // 取消解析
  // ============================================================================

  const cancel = useCallback(() => {
    console.log('[useIFCWorker] 取消解析');
    
    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'cancel',
      };
      workerRef.current.postMessage(message);
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ============================================================================
  // 返回值
  // ============================================================================

  return {
    parseIFC,
    cancel,
    isWorkerAvailable,
  };
}
