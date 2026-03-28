# useInitViewer 迁移说明

## 范围

本文记录将初始化流程从独立 util 改造为 React hook 的变更与原因。

## 发生的变化

- 原 API：`initViewer(params)`，位于 `src/components/model/ModelViewer/hooks/useInitViewer.ts` 之前的 util。
- 新 API：`useInitViewer(...)` 返回 `{ initViewer }`。
- 调用方改为通过 hook 获取 `initViewer`。

## 为什么要改为 Hook

- **生命周期契合**：初始化流程包含请求、取消、错误处理，属于典型副作用逻辑。
- **依赖收口**：hook 内聚 refs/props，减少调用端噪音。
- **扩展性**：未来增加重试/节流/预加载等逻辑时，可直接在 hook 内扩展。

## 行为是否变化

- 场景/相机/渲染器初始化、下载与解析流程保持一致。
- 变化仅在调用方式：util 调用改为 hook 返回函数。

## 相关文件

- `src/components/model/ModelViewer/hooks/useInitViewer.ts`
- `src/components/model/ModelViewer/index.tsx`
