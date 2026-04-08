# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A.PM 智能管理平台 - 智慧工地/项目管理前端，以"单项目单页面聚合"作为主工作台。

## Tech Stack

- **Build Tool**: Vite + React SWC plugin
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn-ui (Radix UI primitives)
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
      types.ts
    project/          # Project management feature
      components/     # Overview, ProjectSlider, etc.
      hooks/          # useProject, useProjectCoreGraph, useProjectHighlight
      services/       # project-service, schedulepro-service
      types.ts        # Project types
  hooks/              # Global shared hooks (useTime, useWeather)
  lib/                # Utility functions (date, array, task)
  routes/             # React Router configuration
  stores/             # Zustand stores (projectStore)
  services/           # Core infrastructure (http.ts)
  types/domain/       # Shared domain types (schedulepro, plan)
```

### Key Architecture Patterns

1. **Feature Module Organization**: Each feature in `src/features/` is self-contained with its own components, hooks, services, and types. Import from feature index files: `import { useProject } from "@/features/project";`

2. **Project Resolution**: Projects can be referenced by either `id` (UUID) or `code`. The `useProjectCoreGraph` hook handles resolution from URL params, local state, or API lookup. URL format: `/project/:id` where `:id` can be either UUID or project code.

3. **API Service Layer**: HTTP requests use a custom wrapper around `fetch` in `src/services/http.ts`. Feature-specific services are in `features/{feature}/services/`. API base URLs are configured in `src/config/index.ts` via environment variables.

4. **State Management**:
   - **Project**: Zustand store in `src/stores/projectStore.ts`, manages current project, project list, and core graph data per project
   - **Server State**: React Query for server-cached data (cost curves, headcount curves)

5. **AI Chat Flow**:
   - `src/components/layout/AppLayout.tsx` mounts a persistent chat panel in the center column
   - `src/features/ai/hooks/useChat.ts` manages message state, SSE streaming, interrupt resume, voice input, and cross-project thread switching
   - Project overview initializes the agent once per `project_id + base_date` combination

### Environment Variables

Required in `.env` or `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_SERVICE_URL=http://127.0.0.1:8123
VITE_RESOURCE_BASE_URL=https://apmoss.emio.cn/public/resources
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
VITE_VOLC_APP_ID=your_volc_app_id
VITE_VOLC_ACCESS_TOKEN=your_volc_access_token
VITE_VOLC_SECRET_KEY=your_volc_secret_key
```

Notes:

- `src/config/index.ts` is the single source of truth for runtime config
- Volc speech recognition requires `VITE_VOLC_APP_ID` and `VITE_VOLC_ACCESS_TOKEN`

### Route Structure

- `/login` - Login page
- `/` - Redirects to default project (`/project/project_001`)
- `/project/:id` - Main project dashboard (Overview component)

### Key Files to Understand

- `src/config/index.ts` - All environment-based configuration
- `src/services/http.ts` - HTTP request wrapper with auth headers
- `src/features/project/services/schedulepro-service.ts` - Main project API calls (core graph, curves)
- `src/features/ai/services/ai-service.ts` - Agent init and interrupt-resume API calls
- `src/features/project/hooks/useProjectCoreGraph.ts` - Project ID resolution and core graph loading
- `src/stores/projectStore.ts` - Project state management
- `src/features/ai/hooks/useChat.ts` - AI panel state, SSE parsing, voice input
- `src/features/project/components/Overview.tsx` - Main dashboard page

### Utility Libraries

Shared utilities in `src/lib/`:

- `date.ts` - Date parsing, formatting, normalization functions
- `array.ts` - Array utilities (sortBySeqNo, groupBy)
- `task.ts` - Task utilities (isLagTask, formatDurationDays)

### Test Layout

All test files are centralized under `tests/` rather than colocated beside source files.

- `tests/services` - service and API wrapper tests
- `tests/hooks` - hook tests
- `tests/components` - UI/component tests
- `tests/stores` - Zustand store tests
- `tests/utils` - pure utility tests
- `tests/integration` - broader integration tests
