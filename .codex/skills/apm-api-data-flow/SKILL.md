---
name: apm-api-data-flow
description: Use when adding, changing, or reviewing API calls, React Query data flow, runtime config usage, Zustand client state, upload/resource URLs, or SSE data handling in this A.PM frontend repo.
---

# A.PM API Data Flow

Use this skill when work touches frontend data boundaries:

- environment/runtime config
- HTTP requests, SSE, auth headers, or API envelopes
- feature services under `src/features/*/services`
- React Query hooks, query keys, cache invalidation, loading/error states
- Zustand client state versus server state decisions
- upload APIs, resource URLs, or AI service calls

## Core Rules

1. Runtime configuration comes from `src/config/index.ts`.
   - Do not read `import.meta.env` directly outside config/schema layers unless the existing code already requires it.
   - Use `API_BASE.backend`, `API_BASE.aiService`, and `RESOURCE_BASE_URL` instead of hard-coded endpoints.
2. HTTP JSON calls go through `src/services/http.ts`.
   - Use `request<T>` when the backend may return the standard `ApiResponse<T>` envelope.
   - Use `requestJson<T>` only when the raw response shape must be preserved.
   - Use `buildUrl` for query parameters instead of manual URL string concatenation.
3. SSE calls go through `requestSse`.
   - Keep stream parsing and cancellation behavior centralized unless a feature has a clear protocol-specific reason.
4. Feature-specific API functions live in `src/features/{feature}/services`.
   - Keep transport code out of components.
   - Hooks may compose services with React Query, but should not duplicate request construction.
5. Server state belongs in React Query.
   - Project lists, graph data, curves, upload status, and backend-owned entities should use queries/mutations.
   - Put query keys in the feature `queryKeys.ts` when the feature has more than trivial data access.
6. Client-owned UI state belongs in Zustand or component state.
   - Use Zustand for cross-route or persisted UI choices such as `currentProjectId`.
   - Do not mirror server entities into Zustand unless the UI explicitly owns an editable draft.
7. Cross-feature data access goes through feature public exports.
   - Prefer `@/features/project` over deep imports into another feature.
   - If a service/hook must be consumed cross-feature, export it deliberately from the feature barrel.
8. Exported hooks, services, and utilities need concise Chinese JSDoc.
   - Follow the repo rule from `.rules/feature-architecture.md`.

## Workflow

1. Identify the owner of the data: backend/AI service, feature service, React Query cache, Zustand, or local component state.
2. Check existing patterns before adding new abstractions:
   - `src/services/http.ts`
   - `src/config/index.ts`
   - `src/features/project/services/project-api.ts`
   - `src/features/project/queryKeys.ts`
   - `src/features/upload/services/uploads-api.ts`
   - `src/features/ai/services/ai-service.ts`
3. Make the smallest boundary-preserving change:
   - service builds URLs and calls HTTP helpers
   - hook owns query/mutation wiring
   - component renders states and triggers actions
4. Add or adjust tests when behavior changes:
   - HTTP wrapper/API shape: `tests/services`
   - query key utilities: `tests/utils`
   - store behavior: `tests/stores`
   - pure data transforms: `tests/utils`
5. Verify with the narrowest useful command first, then broaden if needed:
   - `pnpm test <file>`
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm check` for broad or cross-feature changes

## Red Flags

- Components calling `fetch` directly.
- Hard-coded `localhost`, API hostnames, or resource hosts outside config.
- Query string assembly by string interpolation when `buildUrl` fits.
- Zustand storing backend lists or graph payloads as canonical state.
- Deep imports from another feature's `services`, `hooks`, or `types`.
- API response types using `any` instead of explicit domain/request/response types.
- Upload or AI service code bypassing established auth/error/cancellation handling.
