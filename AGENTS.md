# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
    chart/            # Chart components (GanttChart, NetworkDiagram)
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
      hooks/          # useProject, useProjectData
      services/       # project-api
      types/
        index.ts      # Project types
      queryKeys.ts
      index.ts
    upload/           # Upload intake feature
      hooks/          # useUploads
      pages/          # UploadPage
      services/       # uploads-api
      types/
        uploads.ts
      queryKeys.ts
      index.ts
  hooks/              # Global shared hooks (useTime, useWeather)
  lib/                # Utility functions (date, array, task)
  routes/             # React Router configuration
  stores/             # Zustand stores (client state only)
  services/           # Core infrastructure (http.ts)
```

### Key Architecture Patterns

1. **Feature Module Organization**: Each feature in `src/features/` is self-contained with its own `components`, `hooks`, `services`, `types`, and optional `pages`/`queryKeys`. Cross-feature imports should go through feature index files: `import { useProject } from "@/features/project";`

2. **Project Resolution**: Project pages resolve the active project from the route param or selected project state. URL format: `/project/:id`.

3. **API Service Layer**: HTTP requests use a custom wrapper around `fetch` in `src/services/http.ts`. Feature-specific services are in `features/{feature}/services/`. API base URLs are configured in `src/config/index.ts` via environment variables.

4. **State Management**:
   - **Client State**: Zustand store in `src/stores/projectStore.ts` stores client-owned UI state such as `currentProjectId`
   - **Server State**: React Query owns project list, core graph, and chart data

5. **AI Chat Flow**:
   - `src/components/layout/AppLayout.tsx` mounts a persistent chat panel in the left sidebar
   - `src/features/ai/hooks/useChat.ts` manages message state, SSE streaming, interrupt resume, voice input, and cross-project thread switching
   - Feature cross-imports should use `@/features/project` public exports, not deep imports

6. **Feature Architecture Rules**: Detailed rules for feature structure, layer separation, and import restrictions are in [.rules/feature-architecture.md](.rules/feature-architecture.md). Key principles:
   - Features own their layers (components/hooks/services/types/pages)
   - Cross-feature imports must use feature barrel (`@/features/ai`)
   - Shared utilities go in `src/lib`, shared infrastructure in `src/services`
   - All exported hooks, services, and utility functions require JSDoc comments in Chinese (中文)

7. **Design Evolution Rules**:
   - `templete/` contains design references only, not production code
   - `templete/apm_react_template` is historical reference only, not the implementation baseline
   - `docs/frontend-evolution-guide.md` is the working guide for page mapping and agent constraints
   - Prefer A.PM token utilities over ad-hoc colors when touching page-level UI

8. **Definition of Done**: A page refactor is considered aligned when:
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
- `src/features/ai/services/ai-service.ts` - Agent init and interrupt-resume API calls
- `src/features/project/hooks/useProjectData.ts` - Project overview data derivation and graph query binding
- `src/features/project/hooks/useProject.ts` - Selected project state + project list query adapter
- `src/stores/projectStore.ts` - Client-side project selection state
- `src/features/ai/hooks/useChat.ts` - AI panel state, SSE parsing, voice input
- `src/pages/Projects.tsx` - Project dashboard / project list page
- `src/features/upload/pages/UploadPage.tsx` - New-project intake flow
- `src/features/project/pages/Overview.tsx` - Main dashboard page

### Utility Libraries

Shared utilities in `src/lib/`:

- `date.ts` - Date parsing, formatting, normalization functions
- `array.ts` - Array utilities (sortBySeqNo, groupBy)
- `task.ts` - Task utilities (isLagTask, formatDurationDays)

### Test Layout

All test files are centralized under `tests/` rather than colocated beside source files.

- `tests/services` - HTTP service and API wrapper tests
- `tests/stores` - Zustand store tests
- `tests/utils` - pure utility tests (date, array, task, queryKeys)
