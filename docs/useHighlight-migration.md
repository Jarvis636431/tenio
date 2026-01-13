# useHighlight 迁移说明

## 范围
本文记录将高亮逻辑从独立 util 改造为 React hook 的变更与原因。

## 发生的变化
- 原 API：`applyHighlight(params)`，位于 `src/components/model/ModelViewer/hooks/useHighlight.ts` 之前的 util。
- 新 API：`useHighlight(...)` 返回 `{ applyHighlight }`，签名为 `applyHighlight(model, attempt?)`。
- 重试调度逻辑内聚到 hook 内部，调用方不再传入 `scheduleHighlightRetry`。
- 调用方从“传入大量依赖参数”改为“仅传 model”，减少调用噪音。

## 为什么要改为 Hook
- **依赖内聚**：原 util 每次调用都要传一堆 refs/props，容易出错且影响可读性；hook 统一收口依赖。
- **与生命周期对齐**：重试/定时器属于组件副作用，hook 更适合管理这些行为。
- **接口更简洁**：外部只需要调用 `applyHighlight(model)`，减少参数传递成本。
- **便于后续优化**：后续要加入缓存、差量更新、drawRange 切换等，放在 hook 内更易扩展而不改变调用方。

## 行为是否变化
- 逻辑保持一致：高亮解析、重试策略、子集创建流程未改变。
- 变化仅在“调度位置”：由调用方调度重试改为 hook 内部调度。

## 相关文件
- `src/components/model/ModelViewer/hooks/useHighlight.ts`
- `src/components/model/ModelViewer/index.tsx`
- `src/components/model/ModelViewer/utils/mainThreadLoader.ts`
- `src/components/model/ModelViewer/utils/workerModel.ts`
