# useMainThreadLoader 迁移说明

## 范围
本文记录将主线程加载逻辑从独立 util 改造为 React hook 的变更与原因。

## 发生的变化
- 原 API：`loadModelInMainThread(data, scene, camera, renderer, container)`，位于 `src/components/model/ModelViewer/hooks/useMainThreadLoader.ts` 之前的 util。
- 新 API：`useMainThreadLoader(...)` 返回 `{ loadModelInMainThread }`。
- 调用方改为通过 hook 获取 `loadModelInMainThread`。

## 为什么要改为 Hook
- **副作用契合**：主线程加载包含异步解析、状态更新与渲染初始化，属于副作用流程，适合 hook 管理。
- **依赖内聚**：loader 需要大量 refs/回调，hook 统一收口依赖，调用方更简洁。
- **便于扩展**：后续加入节流/取消/性能统计等能力时，可直接在 hook 内扩展。

## 行为是否变化
- 逻辑保持一致：解析、材质处理、交互初始化、缓存构建、高亮触发流程未改变。
- 变化仅在调用方式：util 调用改为 hook 返回函数，`startRenderLoop` 的依赖也收敛为简化调用签名。

## 相关文件
- `src/components/model/ModelViewer/hooks/useMainThreadLoader.ts`
- `src/components/model/ModelViewer/index.tsx`
