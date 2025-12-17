# Bug 修复：无限循环问题

## 问题描述

组件陷入无限循环：

```
初始化 → 加载 → 取消 → 清理 → 再次初始化 → ...
```

控制台输出：

```
[ModelViewer] 开始初始化viewer
[IFC Worker] 解析已取消
[ModelViewer] 开始加载模型: /models/0923.ifc
[ModelViewer] 初始化被取消
[ModelViewer] 开始清理资源
[useIFCWorker] 取消解析
[ModelViewer] 资源清理完成
[ModelViewer] 开始初始化viewer  // 循环开始
...
```

## 根本原因

### 问题 1: useEffect 依赖项导致无限循环

```typescript
// ❌ 错误的代码
useEffect(() => {
  if (src) {
    initViewer();
  }
  return cleanup;
}, [src, initViewer, cleanup]); // 问题在这里！
```

**原因：**

- `initViewer` 是一个 `useCallback`，依赖于 `[src, isWorkerAvailable, parseIFC, handleWorkerSuccess, loadModelInMainThread]`
- `cleanup` 是一个 `useCallback`，依赖于 `[cancelWorker]`
- 每次这些依赖项变化时，`initViewer` 和 `cleanup` 都会重新创建
- 重新创建导致 useEffect 重新运行
- useEffect 重新运行导致 cleanup 被调用
- cleanup 重置状态，导致依赖项再次变化
- **无限循环！**

### 问题 2: isWorkerAvailable 使用 ref 而不是 state

```typescript
// ❌ 错误的代码
const isWorkerAvailableRef = useRef(false);

return {
  isWorkerAvailable: isWorkerAvailableRef.current, // 值在 hook 初始化时就固定了
};
```

**原因：**

- ref 的值变化不会触发组件重新渲染
- `isWorkerAvailable` 在 hook 返回时就固定了，即使 Worker 创建成功也不会更新
- 导致组件始终认为 Worker 不可用

## 解决方案

### 修复 1: 移除 useEffect 的函数依赖

```typescript
// ✅ 正确的代码
useEffect(() => {
  if (src) {
    initViewer();
  }

  return () => {
    cleanup();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [src]); // 只依赖 src，避免无限循环
```

**说明：**

- 只在 `src` 变化时重新初始化
- 使用箭头函数包装 cleanup，避免直接依赖
- 添加 eslint-disable 注释，因为我们知道这是安全的

### 修复 2: 使用 state 而不是 ref

```typescript
// ✅ 正确的代码
const [isWorkerAvailable, setIsWorkerAvailable] = useState(false);

// Worker 创建成功时
setIsWorkerAvailable(true);

return {
  isWorkerAvailable, // 现在会随着 state 变化而更新
};
```

**说明：**

- state 变化会触发组件重新渲染
- 组件可以正确响应 Worker 的可用性变化

### 修复 3: 改进错误处理

```typescript
// ✅ 正确的代码
onError: (error) => {
  console.error('[ModelViewer] Worker 错误:', error);
  // 不要设置错误状态，因为可能只是 Worker 不可用
  // 主线程降级会在 initViewer 中处理
},
```

**说明：**

- Worker 创建失败不应该显示错误给用户
- 应该静默降级到主线程解析

## 测试验证

### 预期行为

1. **首次加载**

   ```
   [ModelViewer] 开始初始化viewer
   [ModelViewer] 开始加载模型: /models/0923.ifc
   [ModelViewer] isWorkerAvailable: true
   [ModelViewer] 使用 Worker 解析
   [IFC Worker] 开始解析 IFC 文件
   [ModelViewer] Worker 进度: 40% - 正在解析模型...
   [ModelViewer] Worker 进度: 70% - 正在处理模型数据...
   [ModelViewer] Worker 解析成功
   [ModelViewer] 模型加载完成
   ```

2. **组件卸载**

   ```
   [ModelViewer] 开始清理资源
   [useIFCWorker] 取消解析
   [ModelViewer] 资源清理完成
   ```

3. **不应该有循环**
   - 清理后不应该自动重新初始化
   - 只有当 `src` prop 变化时才重新初始化

## 相关文件

- `src/components/ModelViewer.tsx` - 修复 useEffect 依赖
- `src/hooks/useIFCWorker.ts` - 修复 isWorkerAvailable 使用 state

## 提交信息

```
fix: 修复 ModelViewer 无限循环和 Worker 状态问题

- 移除 useEffect 中的函数依赖，只依赖 src
- 将 isWorkerAvailable 从 ref 改为 state
- 改进 Worker 错误处理，静默降级到主线程
- 添加更多调试日志

修复了组件初始化-清理的无限循环问题
```

## 后续改进

1. **性能监控**

   - 添加性能指标收集
   - 监控 Worker 解析时间
   - 监控主线程阻塞时间

2. **错误恢复**

   - 添加重试机制
   - 改进错误提示
   - 添加降级提示

3. **用户体验**
   - 添加取消按钮
   - 改进进度显示
   - 添加预估时间
