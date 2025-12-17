# ModelViewer Web Worker 优化设计文档

## 概述

本设计文档描述了如何使用 Web Worker 优化 ModelViewer 组件的性能。核心思路是将 CPU 密集型的 IFC 解析操作从主线程移至 Worker 线程，同时实现进度反馈、并行化处理和按需渲染等优化措施。

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        主线程 (UI)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ModelViewer Component                       │  │
│  │  - 状态管理 (loading, progress, error)               │  │
│  │  - UI 渲染 (Three.js scene)                          │  │
│  │  - 用户交互 (点击、旋转、缩放)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕ postMessage                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Worker Manager                              │  │
│  │  - Worker 生命周期管理                                │  │
│  │  - 消息路由和错误处理                                 │  │
│  │  - 超时和重试逻辑                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ postMessage
┌─────────────────────────────────────────────────────────────┐
│                    Worker 线程 (后台)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           IFC Worker                                  │  │
│  │  - IFC 文件解析 (ifcLoader.parse)                    │  │
│  │  - 模型数据序列化                                     │  │
│  │  - 进度报告                                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
1. 用户触发加载
   ↓
2. 主线程下载 IFC 文件 (ArrayBuffer)
   ↓
3. 主线程发送 ArrayBuffer 到 Worker
   ↓
4. Worker 解析 IFC (3-5秒，不阻塞主线程)
   ↓ (定期发送进度)
5. Worker 序列化模型数据
   ↓
6. Worker 发送模型数据回主线程
   ↓
7. 主线程反序列化并渲染
   ↓
8. 完成加载
```

## 组件和接口

### 1. Worker 消息类型

```typescript
// Worker 消息类型定义
interface WorkerMessage {
  type: "parse" | "cancel";
  data?: {
    arrayBuffer: ArrayBuffer;
    wasmPath: string;
  };
}

interface WorkerResponse {
  type: "progress" | "success" | "error";
  data?: {
    progress?: number;
    message?: string;
    modelData?: SerializedModel;
    error?: string;
  };
}

interface SerializedModel {
  modelID: number;
  geometry: {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
  };
  materials: Array<{
    color: number;
    opacity: number;
  }>;
  metadata: {
    expressIDs: number[];
    boundingBox: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}
```

### 2. IFC Worker (src/workers/ifc.worker.ts)

```typescript
import { IFCLoader } from "web-ifc-three/IFCLoader";
import * as THREE from "three";

let ifcLoader: IFCLoader | null = null;
let isProcessing = false;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;

  if (type === "cancel") {
    isProcessing = false;
    return;
  }

  if (type === "parse" && data) {
    try {
      isProcessing = true;

      // 初始化 IFCLoader
      if (!ifcLoader) {
        ifcLoader = new IFCLoader();
        ifcLoader.ifcManager.setWasmPath(data.wasmPath);
      }

      // 报告进度：开始解析
      self.postMessage({
        type: "progress",
        data: { progress: 40, message: "正在解析模型..." },
      });

      // 解析 IFC
      const model = await ifcLoader.parse(data.arrayBuffer);

      if (!isProcessing) return; // 已取消

      // 报告进度：解析完成
      self.postMessage({
        type: "progress",
        data: { progress: 70, message: "正在处理模型数据..." },
      });

      // 序列化模型数据
      const serialized = serializeModel(model);

      if (!isProcessing) return; // 已取消

      // 发送成功响应
      self.postMessage({
        type: "success",
        data: { modelData: serialized },
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        data: { error: error instanceof Error ? error.message : "解析失败" },
      });
    } finally {
      isProcessing = false;
    }
  }
};

function serializeModel(model: THREE.Object3D): SerializedModel {
  // 实现模型序列化逻辑
  // 注意：Three.js 对象不能直接传递，需要提取数据
  const geometries: any[] = [];
  const materials: any[] = [];
  const expressIDs: number[] = [];

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 提取几何数据
      // 提取材质数据
      // 提取 expressID
    }
  });

  return {
    modelID: (model as any).modelID,
    geometry: {
      positions: new Float32Array(),
      normals: new Float32Array(),
      indices: new Uint32Array(),
    },
    materials: [],
    metadata: {
      expressIDs,
      boundingBox: {
        min: [0, 0, 0],
        max: [0, 0, 0],
      },
    },
  };
}
```

### 3. Worker Manager Hook (src/hooks/useIFCWorker.ts)

```typescript
import { useRef, useCallback, useEffect } from "react";

interface UseIFCWorkerOptions {
  onProgress?: (progress: number, message: string) => void;
  onSuccess?: (modelData: SerializedModel) => void;
  onError?: (error: string) => void;
  timeout?: number;
}

export function useIFCWorker(options: UseIFCWorkerOptions) {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // 初始化 Worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL("../workers/ifc.worker.ts", import.meta.url),
        { type: "module" }
      );

      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { type, data } = e.data;

        if (type === "progress" && data?.progress !== undefined) {
          options.onProgress?.(data.progress, data.message || "");
        } else if (type === "success" && data?.modelData) {
          clearTimeout(timeoutRef.current!);
          options.onSuccess?.(data.modelData);
        } else if (type === "error") {
          clearTimeout(timeoutRef.current!);
          options.onError?.(data?.error || "未知错误");
        }
      };

      workerRef.current.onerror = (error) => {
        clearTimeout(timeoutRef.current!);
        options.onError?.(`Worker 错误: ${error.message}`);
      };
    } catch (error) {
      console.warn("Worker 创建失败，将使用主线程解析", error);
      options.onError?.("Worker 不可用");
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const parseIFC = useCallback(
    (arrayBuffer: ArrayBuffer, wasmPath: string) => {
      if (!workerRef.current) {
        options.onError?.("Worker 未初始化");
        return;
      }

      // 设置超时
      const timeout = options.timeout || 30000;
      timeoutRef.current = window.setTimeout(() => {
        workerRef.current?.terminate();
        options.onError?.("解析超时");
      }, timeout);

      // 发送解析请求
      workerRef.current.postMessage({
        type: "parse",
        data: { arrayBuffer, wasmPath },
      } as WorkerMessage);
    },
    [options]
  );

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "cancel" } as WorkerMessage);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { parseIFC, cancel };
}
```

### 4. 并行高亮映射工具

```typescript
// src/utils/highlightUtils.ts

export async function buildGlobalIdMapping(
  ifcLoader: IFCLoader,
  modelID: number,
  allProductIds: number[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, number>> {
  const globalIdToExpressId = new Map<string, number>();

  // 分批并行处理，避免一次性发起过多请求
  const BATCH_SIZE = 100;
  const batches = [];

  for (let i = 0; i < allProductIds.length; i += BATCH_SIZE) {
    batches.push(allProductIds.slice(i, i + BATCH_SIZE));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    // 并行处理当前批次
    const propsPromises = batch.map((expressID) =>
      ifcLoader.ifcManager
        .getItemProperties(modelID, expressID, false)
        .catch(() => null)
    );

    const allProps = await Promise.all(propsPromises);

    // 处理结果
    allProps.forEach((props, index) => {
      if (props?.GlobalId?.value) {
        globalIdToExpressId.set(props.GlobalId.value, batch[index]);
      }
    });

    // 报告进度
    onProgress?.((batchIndex + 1) * BATCH_SIZE, allProductIds.length);
  }

  return globalIdToExpressId;
}
```

### 5. 分帧处理工具

```typescript
// src/utils/frameUtils.ts

export async function processInChunks<T>(
  items: T[],
  processor: (item: T, index: number) => void,
  options: {
    chunkSize?: number;
    onProgress?: (current: number, total: number) => void;
  } = {}
): Promise<void> {
  const { chunkSize = 100, onProgress } = options;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, Math.min(i + chunkSize, items.length));

    chunk.forEach((item, chunkIndex) => {
      processor(item, i + chunkIndex);
    });

    // 让出控制权
    await new Promise<void>((resolve) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => resolve());
      } else {
        setTimeout(() => resolve(), 0);
      }
    });

    // 报告进度
    onProgress?.(Math.min(i + chunkSize, items.length), items.length);
  }
}
```

## 数据模型

### LoadingState

```typescript
interface LoadingState {
  isLoading: boolean;
  progress: number; // 0-100
  message: string; // 当前阶段描述
  error: string | null;
}
```

### ModelData

```typescript
interface ModelData {
  model: THREE.Object3D & { modelID: number };
  expressIDs: number[];
  globalIdMap: Map<string, number>;
  boundingBox: THREE.Box3;
}
```

## 正确性属性

_属性是系统在所有有效执行中应保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。_

### 属性 1: Worker 不阻塞主线程

_对于任何_ IFC 文件解析操作，当在 Worker 中执行时，主线程的 UI 响应时间应始终小于 100ms
**验证需求: 1.2**

### 属性 2: 进度单调递增

_对于任何_ 加载过程，进度值应单调递增，从 0 开始到 100 结束，不应出现回退
**验证需求: 2.1, 2.2, 2.3, 2.4**

### 属性 3: 并行映射完整性

_对于任何_ GlobalId 映射操作，并行处理后的结果应与串行处理的结果完全一致
**验证需求: 3.1, 3.2, 3.4**

### 属性 4: 分帧处理完整性

_对于任何_ 模型遍历操作，分帧处理应访问所有节点，且访问顺序应与同步遍历一致
**验证需求: 4.1, 4.4**

### 属性 5: 资源清理完整性

_对于任何_ 组件卸载操作，所有 Worker、定时器和事件监听器应被正确清理，不应有内存泄漏
**验证需求: 7.2, 7.3**

### 属性 6: 错误降级可用性

_对于任何_ Worker 创建失败的情况，系统应能降级到主线程解析并成功加载模型
**验证需求: 6.1, 6.4**

### 属性 7: 消息传递可靠性

_对于任何_ Worker 消息，应在合理时间内（< 30 秒）收到响应，超时应触发错误处理
**验证需求: 6.2**

## 错误处理

### 错误类型

1. **Worker 创建失败**: 降级到主线程解析
2. **解析超时**: 终止 Worker，显示错误
3. **解析失败**: 显示错误信息，允许重试
4. **网络错误**: 显示错误信息，允许重试
5. **内存不足**: 显示错误信息，建议刷新页面

### 错误处理策略

```typescript
try {
  // Worker 解析
  await parseWithWorker();
} catch (error) {
  if (error.type === "worker_unavailable") {
    // 降级到主线程
    await parseInMainThread();
  } else if (error.type === "timeout") {
    // 显示超时错误
    showError("解析超时，请重试");
  } else {
    // 显示通用错误
    showError("加载失败: " + error.message);
  }
}
```

## 测试策略

### 单元测试

1. **Worker 消息处理**: 测试各种消息类型的正确处理
2. **序列化/反序列化**: 测试模型数据的正确转换
3. **并行映射**: 测试批量并行请求的正确性
4. **分帧处理**: 测试分帧逻辑的完整性
5. **错误处理**: 测试各种错误场景的处理

### 集成测试

1. **完整加载流程**: 测试从下载到渲染的完整流程
2. **进度反馈**: 测试进度更新的正确性
3. **高亮功能**: 测试高亮在 Worker 模式下的正确性
4. **资源清理**: 测试组件卸载时的资源清理
5. **降级处理**: 测试 Worker 不可用时的降级逻辑

### 性能测试

1. **主线程阻塞时间**: 应 < 100ms
2. **总加载时间**: 应 < 5s（中等大小模型）
3. **内存使用**: 不应有明显泄漏
4. **并行映射速度**: 应比串行快 5-10 倍

### 属性测试

使用 fast-check 库进行属性测试：

```typescript
import fc from "fast-check";

// 属性 2: 进度单调递增
fc.assert(
  fc.property(fc.array(fc.integer({ min: 0, max: 100 })), (progressUpdates) => {
    const filtered = filterProgressUpdates(progressUpdates);
    return isMonotonicallyIncreasing(filtered);
  })
);

// 属性 3: 并行映射完整性
fc.assert(
  fc.property(
    fc.array(fc.integer({ min: 1, max: 10000 })),
    async (expressIDs) => {
      const serialResult = await mapSerially(expressIDs);
      const parallelResult = await mapInParallel(expressIDs);
      return deepEqual(serialResult, parallelResult);
    }
  )
);
```

## 实施计划

### 阶段 1: 基础设施 (2-3 小时)

1. 安装 TypeScript 类型定义
2. 创建 Worker 消息类型定义
3. 创建 IFC Worker 基础结构
4. 创建 Worker Manager Hook

### 阶段 2: Worker 集成 (3-4 小时)

1. 实现 Worker 中的 IFC 解析
2. 实现模型数据序列化
3. 集成 Worker 到 ModelViewer 组件
4. 实现进度反馈机制

### 阶段 3: 优化增强 (2-3 小时)

1. 实现并行高亮映射
2. 实现分帧模型处理
3. 实现按需渲染优化
4. 实现错误处理和降级

### 阶段 4: 测试和调优 (2-3 小时)

1. 编写单元测试
2. 编写集成测试
3. 性能测试和调优
4. 文档更新

**总计**: 9-13 小时（约 1.5-2 个工作日）

## 风险和缓解

| 风险                    | 等级 | 缓解措施                   |
| ----------------------- | ---- | -------------------------- |
| Worker 不支持 IFCLoader | 高   | 提前验证，准备降级方案     |
| 模型序列化复杂          | 中   | 简化序列化，只传递必要数据 |
| 浏览器兼容性            | 低   | 提供降级到主线程的方案     |
| 性能提升不明显          | 低   | 结合其他优化措施           |

## 成功指标

- ✅ UI 阻塞时间 < 100ms
- ✅ 用户可交互时间 < 2s
- ✅ 高亮映射时间 < 500ms
- ✅ 总加载时间 < 5s
- ✅ 无内存泄漏
- ✅ 所有测试通过
