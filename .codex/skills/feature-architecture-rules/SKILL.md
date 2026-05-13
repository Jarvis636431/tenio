---
name: feature-architecture-rules
description: Use when creating, reorganizing, or reviewing frontend feature modules in this repo. Applies the repo's feature directory contract, public barrel strategy, and import-boundary rules for React and TypeScript code under src/features.
---

# Feature Architecture Rules

Use this skill when:

- creating a new feature under `src/features`
- moving files between `pages`, `components`, `hooks`, `services`, and `types`
- reviewing import paths and public exports
- enforcing repo architecture rules in ESLint

## Workflow

1. Keep each feature self-contained.
2. Prefer a consistent folder contract:
   - `components/`
   - `hooks/`
   - `services/`
   - `types/`
   - `pages/`
   - `index.ts`
   - `queryKeys.ts` only when the feature uses React Query
3. Expose cross-feature imports through the feature barrel (`index.ts`) or another explicit public entry.
4. Do not deep-import another feature's internals.
5. Keep shared cross-feature code out of feature folders; move it to `src/lib`, `src/services`, or another true shared layer.

Read [../../../../.rules/feature-architecture.md](../../../../.rules/feature-architecture.md) before making structural changes.
