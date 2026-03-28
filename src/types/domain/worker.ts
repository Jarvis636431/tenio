/**
 * Web Worker 消息类型定义
 * 用于主线程和 Worker 线程之间的通信
 */

// ============================================================================
// Worker 请求消息类型
// ============================================================================

/**
 * 主线程发送给 Worker 的消息
 */
export interface WorkerMessage {
  type: "parse" | "cancel";
  data?: {
    arrayBuffer: ArrayBuffer;
    wasmPath: string;
  };
}

// ============================================================================
// Worker 响应消息类型
// ============================================================================

/**
 * Worker 发送给主线程的响应
 */
export interface WorkerResponse {
  type: "progress" | "success" | "error";
  data?: {
    progress?: number;
    message?: string;
    modelData?: SerializedModel;
    error?: string;
  };
}

// ============================================================================
// 序列化模型数据结构
// ============================================================================

/**
 * 序列化后的模型数据
 * 用于在 Worker 和主线程之间传递
 */
export interface SerializedModel {
  modelID: number;
  meshes: SerializedMesh[];
  globalIdEntries?: Array<[string, number]>;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
}

/**
 * 序列化后的网格数据
 */
export interface SerializedMesh {
  // 几何数据
  geometry: {
    positions: Float32Array;
    normals?: Float32Array;
    indices?: Uint32Array;
    uuid: string;
  };
  // 材质数据
  material: {
    color: number;
    opacity: number;
    transparent: boolean;
    side: number;
    uuid: string;
  };
  // 变换矩阵
  matrix: number[]; // 16个元素的数组
  // IFC 相关
  expressID?: number;
  // 其他属性
  name?: string;
  visible: boolean;
  renderOrder: number;
}

// ============================================================================
// 加载状态类型
// ============================================================================

/**
 * 加载状态
 */
export interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  message: string; // 当前阶段描述
  error: string | null;
}

/**
 * 加载阶段
 */
export enum LoadingPhase {
  IDLE = "idle",
  DOWNLOADING = "downloading",
  PARSING = "parsing",
  PROCESSING = "processing",
  RENDERING = "rendering",
  COMPLETE = "complete",
  ERROR = "error",
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 进度回调函数
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * 成功回调函数
 */
export type SuccessCallback = (modelData: SerializedModel) => void;

/**
 * 错误回调函数
 */
export type ErrorCallback = (error: string) => void;
