/**
 * IFC Worker
 * 在后台线程中解析 IFC 文件，避免阻塞主线程
 */

import { IFCLoader } from 'web-ifc-three/IFCLoader';
import * as THREE from 'three';
import type { WorkerMessage, WorkerResponse, SerializedModel, SerializedMesh } from "@/types/domain/worker";

// ============================================================================
// Worker 状态
// ============================================================================

let ifcLoader: IFCLoader | null = null;
let isProcessing = false;

// ============================================================================
// 消息处理
// ============================================================================

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;

  try {
    if (type === 'cancel') {
      handleCancel();
      return;
    }

    if (type === 'parse' && data) {
      await handleParse(data.arrayBuffer, data.wasmPath);
    }
  } catch (error) {
    handleError(error);
  }
};

// ============================================================================
// 取消处理
// ============================================================================

function handleCancel() {
  isProcessing = false;
  console.log('[IFC Worker] 解析已取消');
}

// ============================================================================
// 解析处理
// ============================================================================

async function handleParse(arrayBuffer: ArrayBuffer, wasmPath: string) {
  try {
    isProcessing = true;

    // 初始化 IFCLoader
    if (!ifcLoader) {
      console.log('[IFC Worker] 初始化 IFCLoader');
      ifcLoader = new IFCLoader();
      ifcLoader.ifcManager.setWasmPath(wasmPath);
    }

    // 报告进度：开始解析
    sendProgress(40, '正在解析模型...');

    // 解析 IFC
    console.log('[IFC Worker] 开始解析 IFC 文件');
    const model = await ifcLoader.parse(arrayBuffer) as THREE.Object3D & { modelID: number };

    if (!isProcessing) {
      console.log('[IFC Worker] 解析已取消（解析后）');
      return;
    }

    // 报告进度：解析完成
    sendProgress(70, '正在处理模型数据...');

    // 序列化模型数据
    console.log('[IFC Worker] 开始序列化模型');
    const serialized = serializeModel(model);

    if (!isProcessing) {
      console.log('[IFC Worker] 解析已取消（序列化后）');
      return;
    }

    // 发送成功响应
    console.log('[IFC Worker] 解析完成，发送数据');
    sendSuccess(serialized);

  } catch (error) {
    console.error('[IFC Worker] 解析失败:', error);
    handleError(error);
  } finally {
    isProcessing = false;
  }
}

// ============================================================================
// 模型序列化
// ============================================================================

function serializeModel(model: THREE.Object3D & { modelID: number }): SerializedModel {
  const meshes: SerializedMesh[] = [];
  const box = new THREE.Box3();

  // 遍历模型树，提取所有网格
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      try {
        const serializedMesh = serializeMesh(child);
        if (serializedMesh) {
          meshes.push(serializedMesh);
          
          // 更新边界框
          if (child.geometry.boundingBox) {
            box.union(child.geometry.boundingBox);
          }
        }
      } catch (error) {
        console.warn('[IFC Worker] 序列化网格失败:', error);
      }
    }
  });

  console.log(`[IFC Worker] 序列化了 ${meshes.length} 个网格`);

  return {
    modelID: model.modelID,
    meshes,
    boundingBox: {
      min: [box.min.x, box.min.y, box.min.z],
      max: [box.max.x, box.max.y, box.max.z],
    },
  };
}

function serializeMesh(mesh: THREE.Mesh): SerializedMesh | null {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const material = mesh.material as THREE.Material;

  if (!geometry || !material) {
    return null;
  }

  // 提取几何数据
  const positions = geometry.attributes.position?.array as Float32Array;
  const normals = geometry.attributes.normal?.array as Float32Array;
  const indices = geometry.index?.array as Uint32Array;

  if (!positions) {
    return null;
  }

  // 提取材质数据
  let color = 0x808080;
  let opacity = 1.0;
  let transparent = false;

  if (material instanceof THREE.MeshStandardMaterial || 
      material instanceof THREE.MeshBasicMaterial) {
    if (material.color) {
      color = material.color.getHex();
    }
    opacity = material.opacity ?? 1.0;
    transparent = material.transparent ?? false;
  }

  // 提取变换矩阵
  const matrix = mesh.matrix.toArray();

  // 提取 expressID（如果存在）
  const expressID = (mesh as any).expressID;

  return {
    geometry: {
      positions: positions,
      normals: normals,
      indices: indices,
      uuid: geometry.uuid,
    },
    material: {
      color,
      opacity,
      transparent,
      side: material.side,
      uuid: material.uuid,
    },
    matrix,
    expressID,
    name: mesh.name,
    visible: mesh.visible,
    renderOrder: mesh.renderOrder,
  };
}

// ============================================================================
// 消息发送
// ============================================================================

function sendProgress(progress: number, message: string) {
  const response: WorkerResponse = {
    type: 'progress',
    data: { progress, message },
  };
  self.postMessage(response);
}

function sendSuccess(modelData: SerializedModel) {
  const response: WorkerResponse = {
    type: 'success',
    data: { modelData },
  };
  self.postMessage(response);
}

function sendError(error: string) {
  const response: WorkerResponse = {
    type: 'error',
    data: { error },
  };
  self.postMessage(response);
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : '未知错误';
  sendError(message);
}

// ============================================================================
// Worker 生命周期
// ============================================================================

console.log('[IFC Worker] Worker 已启动');

// 处理 Worker 错误
self.onerror = (error) => {
  console.error('[IFC Worker] Worker 错误:', error);
  handleError(error);
};

// 处理未捕获的 Promise 拒绝
self.onunhandledrejection = (event) => {
  console.error('[IFC Worker] 未处理的 Promise 拒绝:', event.reason);
  handleError(event.reason);
};
