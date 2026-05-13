# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A.PM 智能管理平台 - 智慧工地/项目管理前端。当前产品结构已经拆分为登录、项目控制台、上传入口和单项目工作台四层。

## Tech Stack

- **Build Tool**: Vite + React SWC plugin
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + A.PM design tokens in `src/index.css` + shadcn-ui (Radix primitives)
- **Routing**: React Router v6
- **State Management**: Zustand (persist middleware)
- **Data Fetching**: React Query (TanStack Query)
- **Package Manager**: pnpm (10.14.0)

## Commands

```bash
# Install dependencies
pnpm i

# Development server (runs on port 8080)
pnpm dev

# Build for production
pnpm build

# Build for development mode
pnpm build:dev

# Run ESLint
pnpm lint

# Run all tests
pnpm test

# Run a single test file
pnpm test tests/services/http.test.ts

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Full check (lint + typecheck + test + build)
pnpm check

# Format code
pnpm format

# Check formatting without writing
pnpm format:check

# Preview production build
pnpm preview
```

## Project Architecture

### Feature-Based Directory Structure

```
src/
  components/          # Shared UI components
    ui/               # shadcn/ui primitives (Button, Dialog, etc.)
    layout/           # App layout components
  features/            # Feature modules
    ai/               # AI Chat feature
      components/     # Chat, ChatInput, ChatHeader, ChatMessage
      hooks/          # useChat, useVoice
      services/       # ai-service
      types/
        index.ts
      index.ts
    project/          # Project management feature
      components/     # Project UI pieces, tabs, local widgets
      pages/          # Overview page
      hooks/          # useProject, useProjectData, useProjectCharts
      services/       # project-api, project-bootstrap, uploads-api
      types/
        index.ts      # Project types
        uploads.ts    # Upload feature types
      queryKeys.ts
      index.ts
  hooks/              # Global hooks (useTime)
  lib/                # Utility functions (date, array, task, gantt)
  schemas/            # Zod schemas (env validation)
  analytics/          # Usage analytics abstraction (with console/noop providers)
  routes/             # React Router configuration
  stores/             # Zustand stores (client state only)
  services/           # Core infrastructure (http.ts)
  pages/              # Top-level entry pages (NotFound)
```

### Key Architecture Patterns

1. **Feature Module Organization**: Each feature in `src/features/` is self-contained with its own `components`, `hooks`, `services`, `types`, and optional `pages`/`queryKeys`. Cross-feature imports must go through feature barrel (`index.ts`) — enforced by ESLint's `no-restricted-imports` rule.

2. **Project Resolution**: Project pages resolve the active project from the route param (`:id`) or selected project state via `useProject` + `useProjectData`.

3. **API Service Layer**: HTTP requests use a custom wrapper around `fetch` in `src/services/http.ts`. This wrapper handles auth headers, automatic token refresh (with retry), API response unwrapping, and SSE streaming. Feature-specific services are in `features/{feature}/services/`. API base URLs are configured in `src/config/index.ts` via environment variables and validated with Zod schema at runtime.

4. **State Management**:
   - **Client State (Zustand)**: Multiple stores in `src/stores/` — `authStore` (token/user with persist), `projectStore` (currentProjectId with persist), `chatStore` (per-project message threads, agent tickets, input state), `generationStore` (generation task progress)
   - **Server State (React Query)**: Queries in `src/features/*/hooks/` manage project list, core graph, cost curve, document, crew plan artifacts, and upload data. Query keys are defined per-feature in `queryKeys.ts`.

5. **AI Chat Flow**:
   - `src/components/layout/AppLayout.tsx` mounts a persistent chat panel in the left sidebar (visible only on `/project/:id`)
   - `src/features/ai/hooks/useChat.ts` manages per-project message threads, SSE streaming with agent ticket auth, interrupt resume, and refetch triggers
   - Agent auth uses a two-layer ticket system: session-level ticket with automatic refresh (tracked in chatStore per project)

6. **Auth Flow**: `/login` page (in `src/features/auth/`) supports password and SMS login. The `http.ts` service layer automatically attaches Bearer tokens, detects 401/403 responses, attempts token refresh via `/auth/refresh`, and retries the original request. Failed refresh triggers logout.

7. **Feature Architecture Rules**: Detailed rules for feature structure, layer separation, and import restrictions are in [.rules/feature-architecture.md](.rules/feature-architecture.md). Key principles:
   - Features own their layers (components/hooks/services/types/pages)
   - Cross-feature imports must use feature barrel (`@/features/ai`)
   - Shared utilities go in `src/lib`, shared infrastructure in `src/services`
   - All exported hooks, services, and utility functions require JSDoc comments in Chinese (中文)

8. **Design Evolution Rules**:
   - `templete/` contains design references only, not production code
   - `templete/apm_react_template` is historical reference only, not the implementation baseline
   - `docs/frontend-evolution-guide.md` is the working guide for page mapping and agent constraints
   - Prefer A.PM token utilities over ad-hoc colors when touching page-level UI

9. **Definition of Done**: A page refactor is considered aligned when:
   - It uses the shared A.PM token system
   - Its structure matches the intended reference hierarchy
   - Repeated visual patterns are extracted into reusable components
   - No prototype HTML or inline CSS is copied verbatim
   - Existing lint and typecheck pass

### Environment Variables

Required in `.env` or `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_SERVICE_URL=http://127.0.0.1:8123
VITE_RESOURCE_BASE_URL=https://apmoss.emio.cn/public/resources
VITE_VOLC_APP_ID=your_volc_app_id
VITE_VOLC_ACCESS_TOKEN=your_volc_access_token
VITE_VOLC_SECRET_KEY=your_volc_secret_key
```

Notes:

- `src/config/index.ts` is the single source of truth for runtime config
- Volc speech recognition requires `VITE_VOLC_APP_ID` and `VITE_VOLC_ACCESS_TOKEN`

### Route Structure

- `/login` - Login page
- `/projects` - Project dashboard / project list entry
- `/upload` - New project intake and document upload
- `/` - Redirects to `/projects`
- `/project/:id` - Main project dashboard (Overview component)

Current intended user flow:

```text
/login -> /projects -> /upload -> /project/:id
```

### Key Files to Understand

- `docs/frontend-evolution-guide.md` - Current UI evolution constraints and page mapping
- `src/config/index.ts` - All environment-based configuration
- `src/services/http.ts` - HTTP request wrapper with auth headers
- `src/features/project/services/project-api.ts` - Main project API calls (core graph, curves)
- `src/features/project/services/project-bootstrap.ts` - Project creation and bootstrap flow
- `src/features/ai/services/ai-service.ts` - Agent init and interrupt-resume API calls
- `src/features/project/hooks/useProjectData.ts` - Project overview data derivation and graph query binding
- `src/features/project/hooks/useProject.ts` - Selected project state + project list query adapter
- `src/stores/projectStore.ts` - Client-side project selection state
- `src/features/ai/hooks/useChat.ts` - AI panel state, SSE parsing, voice input
- `src/features/project/pages/Projects.tsx` - Project dashboard / project list page
- `src/features/upload/pages/UploadPage.tsx` - New-project intake flow
- `src/features/project/pages/Overview.tsx` - Main dashboard page

### Utility Libraries

Shared utilities in `src/lib/`:

- `date.ts` - Date parsing, formatting, normalization functions
- `array.ts` - Array utilities (sortBySeqNo, groupBy)
- `task.ts` - Task utilities (isLagTask, formatDurationDays)
- `gantt.ts` - Gantt chart data helpers
- `log.ts` - Silent error logging utility
- `project-document.ts` - Project document content extraction helpers
- `utils.ts` - General utilities (cn class merging, createMessageId)

### ESLint Configuration

ESLint is configured in `eslint.config.js` with TypeScript strict mode, React Hooks, and React Refresh rules.

Key rules:

- `@typescript-eslint/no-unused-vars` — **error** (prefix with `_` to opt out)
- `@typescript-eslint/consistent-type-imports` — **warn** with `inline-type-imports` fix style
- `@typescript-eslint/no-unsafe-assignment/member-access/call/return/argument` — **error** (full unsafe type safety)
- `@typescript-eslint/require-await` — **warn**
- `no-restricted-imports` — **error**: cross-feature deep imports prohibited (use feature barrels instead)

### Test Layout

All test files are centralized under `tests/` rather than colocated beside source files.

- `tests/services` - HTTP service and API wrapper tests
- `tests/stores` - Zustand store tests
- `tests/utils` - pure utility tests (date, array, task, queryKeys)
