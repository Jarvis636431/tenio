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

### Allowed

- Inside a feature, use relative imports for the feature's own internals.
- Outside a feature, import from the feature barrel:

```ts
import { useProject } from "@/features/project";
import { useChat } from "@/features/ai";
```

### Disallowed

- Deep-importing another feature's internals:

```ts
import { useProject } from "@/features/project/hooks/useProject";
import { getProcessInfo } from "@/features/project/services/project-api";
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
