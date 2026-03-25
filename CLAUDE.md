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
- **3D/Models**: Three.js + web-ifc/web-ifc-three for IFC model parsing
- **Charts**: Recharts
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

# Preview production build
pnpm preview
```

Note: This project has no test suite configured.

## Project Architecture

### Directory Structure

```
src/
  components/     # React components
    ui/          # shadcn/ui primitive components (Button, Dialog, etc.)
    ai/          # AI Chat components
    layout/      # App layout components (AppLayout, AppSidebar)
    model/       # 3D IFC model viewer (ModelViewer, hooks, utils)
    plan/        # Planning components (GanttChart, NetworkDiagram)
  config/         # Runtime configuration (API endpoints, env vars)
  constants/      # Application constants
  hooks/          # Custom React hooks
  lib/            # Utility functions (cn, etc.)
  mocks/          # MSW (Mock Service Worker) setup
  pages/          # Route-level pages
    project/      # Project dashboard (Overview, components)
  routes/         # React Router configuration
  services/       # API service functions
  stores/         # Zustand stores (auth, project)
  types/domain/   # TypeScript domain types
```

### Key Architecture Patterns

1. **Project Resolution**: Projects can be referenced by either `id` (UUID) or `code`. The `useProjectCoreGraph` hook handles resolution from URL params, local state, or API lookup. URL format: `/project/:id` where `:id` can be either UUID or project code.

2. **API Service Layer**: HTTP requests use a custom wrapper around `fetch` in `src/services/http.ts`. Services expose functions that accept an optional `token` parameter and return typed promises. API base URLs are configured in `src/config/index.ts` via environment variables.

3. **State Management**:
   - **Auth**: Zustand store in `src/stores/authStore.ts`, persists token and user info
   - **Project**: Zustand store in `src/stores/projectStore.ts`, manages current project, project list, and core graph data per project
   - **Server State**: React Query for server-cached data (cost curves, headcount curves)

4. **Model Viewer (IFC)**: The `ModelViewer` component loads IFC files via web-ifc-three. It has a multi-level caching system:
   - Memory cache (`modelBufferCache` Map) for ArrayBuffers
   - Browser Cache API (`tenio-ifc-model-cache-v1`) for persistent storage
   - Metadata cache for `globalIdMap` and `tagMap`

5. **Component Highlighting**: Model highlighting uses Express IDs from the core graph. The `processHighlights` in `useProjectHighlight` hook maps dates to component IDs for timeline-based visualization.

### Environment Variables

Required in `.env` or `.env.local`:

```bash
VITE_USER_SERVICE_URL=http://localhost:8000
VITE_PROJECT_SERVICE_URL=http://localhost:8000
VITE_AI_SSE_URL=https://chat.zrzz.site/api/agent/chat/sse
VITE_POI_SERVICE_URL=https://chat.zrzz.site
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECURITY_CODE=your_amap_security_code
```

### Route Structure

- `/login` - Login page
- `/` - Redirects to default project (`/project/project_001`)
- `/project/:id` - Main project dashboard (Overview component)

### Key Files to Understand

- `src/config/index.ts` - All environment-based configuration
- `src/services/http.ts` - HTTP request wrapper with auth headers
- `src/services/schedulepro-service.ts` - Main project API calls (core graph, curves)
- `src/hooks/useProjectCoreGraph.ts` - Project ID resolution and core graph loading
- `src/stores/projectStore.ts` - Project state management
- `src/components/model/ModelViewer.tsx` - 3D IFC model viewer with caching
- `src/pages/project/Overview.tsx` - Main dashboard page aggregating all features

### Type Definitions

Domain types are in `src/types/domain/`:
- `schedulepro.ts` - Core graph, cost/headcount curves, auth types
- `project.ts` - Project list, process info types
- `ai.ts` - Agent init/resume types
- `plan.ts` - Gantt chart task types

### ESLint Configuration

ESLint is configured in `eslint.config.js` with TypeScript, React Hooks, and React Refresh rules. Unused vars rule is disabled (`@typescript-eslint/no-unused-vars: off`).