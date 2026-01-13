# useCleanup 迁移说明

## 范围
本文记录将清理逻辑从独立 util 改造为 React hook 的变更与原因。

## 发生的变化
- 原 API：`cleanup(params)`，位于 `src/components/model/ModelViewer/utils/cleanup.ts`。
- 新 API：`useCleanup(...)` 返回 `{ cleanup }`。
- 调用方改为通过 hook 获取 `cleanup`，不再直接调用 util。

## 为什么要改为 Hook
- **生命周期契合**：清理逻辑本身与组件卸载周期强绑定，使用 hook 更自然。
- **依赖收口**：hook 内聚 refs 和清理细节，调用方保持简洁。
- **统一扩展点**：后续增加“资源统计/性能日志/统一释放策略”可以直接在 hook 内实现。

## 行为是否变化
- 清理流程与释放顺序保持一致。
- 变化仅在调用方式：util 调用改为 hook 返回函数。

## 相关文件
- `src/components/model/ModelViewer/utils/cleanup.ts`
- `src/components/model/ModelViewer/index.tsx`
