# useWorkerModel 迁移说明

## 范围
本文记录将 worker 成功处理逻辑从独立 util 改造为 React hook 的变更与原因。

## 发生的变化
- 原 API：`handleWorkerSuccess(params)`，位于 `src/components/model/ModelViewer/hooks/useWorkerModel.ts` 之前的 util。
- 新 API：`useWorkerModel(...)` 返回 `{ handleWorkerSuccess }`。
- 调用方改为通过 hook 获取 `handleWorkerSuccess`。

## 为什么要改为 Hook
- **生命周期契合**：worker 回调属于副作用流程，适合用 hook 管理。
- **依赖收口**：大量 refs/回调集中到 hook 内，主组件只保留调用入口。
- **扩展性更好**：后续可以在 hook 内加缓存、差量更新、失败重试等逻辑。

## 行为是否变化
- 逻辑保持一致：反序列化、材质设置、交互初始化、索引缓存和高亮触发流程不变。
- 变化仅在调用方式：util 调用改为 hook 返回函数。

## 相关文件
- `src/components/model/ModelViewer/hooks/useWorkerModel.ts`
- `src/components/model/ModelViewer/index.tsx`
