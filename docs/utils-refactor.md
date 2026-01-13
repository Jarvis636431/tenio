# Utils 形式回退说明

## 背景
部分模块在迁移为 hook 后并未获得生命周期或状态管理收益，反而增加了理解成本，因此回退为纯 util 形式。

## 回退模块
- `useMainThreadLoader` → `createMainThreadLoader`
- `useWorkerModel` → `createWorkerModel`
- `useCleanup` → `cleanup`

## 原因
- **无生命周期依赖**：这些模块主要是流程编排与函数组合，不依赖 React 的生命周期。
- **副作用外置**：副作用均由调用方控制，hook 语义不必要。
- **降低心智负担**：保留 util 形式可减少“伪 hook”的误解。

## 相关文件
- `src/components/model/ModelViewer/utils/mainThreadLoader.ts`
- `src/components/model/ModelViewer/utils/workerModel.ts`
- `src/components/model/ModelViewer/utils/cleanup.ts`
- `src/components/model/ModelViewer/index.tsx`
