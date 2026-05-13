# Feature Architecture Rules

## Purpose

These rules keep `src/features` modular, predictable, and refactor-friendly.

## Feature Contract

Each feature should follow this structure when applicable:

```text
src/features/<feature>/
  components/
  hooks/
  services/
  types/
  pages/
  index.ts
  queryKeys.ts
```

Notes:

- `queryKeys.ts` is required only when the feature uses React Query.
- `types/` should use `index.ts` as the main entry.
- Empty folders do not need to be created just to satisfy the pattern.

## Layer Rules

- `pages/`: route-level or feature-level page composition only
- `components/`: reusable feature UI pieces
- `hooks/`: feature state, selectors, orchestration, and UI logic
- `services/`: API calls and feature business flows
- `types/`: feature-local types
- `index.ts`: the public barrel for cross-feature imports

## Import Rules

### Feature 内外导入边界

跨 feature 的导入必须通过 feature barrel；feature 内部导入应使用相对路径，避免从自己的 barrel 回引造成循环依赖。

**正确：**

```ts
// feature 内部导入：使用相对路径
import { useProjectData } from "../hooks/useProjectData";
import type { ScheduleTask } from "../types";

// 跨 feature 导入：使用 public barrel
import { useChat } from "@/features/ai";
import { getProjectList } from "@/features/project";
```

**错误：**

```ts
// 禁止跨 feature 深入内部模块
import { useProject } from "@/features/project/hooks/useProject";

// 禁止 feature 内部从自己的 barrel 回引
import { useProjectData } from "@/features/project";
```

### 原理

跨 feature barrel 导入提供稳定边界；feature 内部相对导入避免 barrel 循环依赖。

- **稳定的公共 API**：模块内部重构（如移动文件）不影响消费者
- **清晰的边界**：通过 barrel 导出的才是真正公共的接口
- **更少循环依赖**：feature 内部实现不通过自己的 public API 回引

### Barrel Export 要求

每个 feature 的 `index.ts` 必须：

1. 导出该 feature 的所有公共组件、hooks、services、types
2. 使用命名的 barrel 导出（非 default），便于 tree-shaking
3. 不导出 internal（以 `@internal` 注释标记）的实现细节

**正确示例：**

```ts
// index.ts
export { Overview } from "./pages/Overview";
export { useProject, useProjectData } from "./hooks";
export type { ProjectListItem, ScheduleTask } from "./types";
// 不导出 internal 实现
// export { _internalHelper } from "./internal"; // ❌ 禁止
```

### Disallowed Patterns

- 深入导入其他 feature 的内部模块：

  ```ts
  import { useProject } from "@/features/project/hooks/useProject";
  ```

- 跨 feature 绕过 barrel：

  ```ts
  import { getProjectList } from "@/features/project/services/project-api";
  ```

## Public Barrel Strategy

Each feature should export only the small public surface actually needed elsewhere.

Typical public exports:

- route page entry points
- public hooks
- public service functions used across features
- feature query keys
- public types

Do not export everything by default.

## Shared Code Rule

If code is used by multiple features and is not owned by one feature, move it out of feature folders.

Preferred destinations:

- `src/lib` for pure utilities
- `src/services` for app-wide infrastructure
- `src/components` for truly shared UI

## JSDoc Documentation

All exported hooks, services, and utility functions should have JSDoc comments.

### Requirements

- Use Chinese for all JSDoc comments (中文注释)
- Include `@param` and `@returns` for function parameters and return values
- Describe the purpose and any notable side effects
- Mark internal/helper functions with `@internal` if they are not part of the public API

### Example

```ts
/**
 * 协调 AI 面板的聊天状态、SSE 流和语音输入。
 * 为每个项目维护独立的消息线程。
 *
 * @param options - 配置选项
 * @param options.projectId - 可选的项目 ID 覆盖
 * @returns Chat state and actions for the Chat component
 */
export function useChat(options: ChatPanelOptions = {}) {
  // ...
}
```

## Review Checklist

When reviewing structural changes:

1. Is the file in the correct layer?
2. Is the import path going through a public entry when crossing feature boundaries?
3. Is this code feature-owned or actually shared?
4. Does the feature barrel expose only what other modules need?
5. If React Query is used, are query keys feature-local and named consistently?
