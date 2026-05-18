# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

A.PM 智能管理平台 — pnpm monorepo，包含前端 (React)、后端 (NestJS)、共享类型包。

## Tech Stack

- **Monorepo**: pnpm workspace (v10.14.0)
- **Frontend**: React 18 + TypeScript + Vite (SWC plugin)
- **Backend**: NestJS 11 + Prisma ORM + PostgreSQL
- **Frontend Styling**: Tailwind CSS + A.PM design tokens + shadcn-ui (Radix primitives)
- **Frontend State**: Zustand (client state) + TanStack Query (server state)
- **Shared**: `@tenio/shared` types package for cross-app type sharing
- **Testing**: Vitest (web) + Jest / ts-jest (api)
- **Linting**: ESLint 9 flat config + Prettier

## Commands

```bash
# Install all workspace dependencies
pnpm i

# Development servers
pnpm dev         # web frontend (port 8080)
pnpm dev:web     # web frontend explicitly
pnpm dev:api     # NestJS API backend

# Build
pnpm build         # web production build
pnpm build:web     # web production build explicitly
pnpm build:dev     # web dev-mode build

# Lint (per app)
pnpm lint          # web only (default)
pnpm --filter api lint   # API ESLint

# Type checking
pnpm typecheck            # web
pnpm --filter api typecheck       # API
pnpm --filter @tenio/shared typecheck  # shared package

# Testing
pnpm test                       # web (Vitest)
pnpm --filter api test          # API (Jest)
pnpm --filter api test -- tests/health.controller.test.ts  # single API test

# Full checks
pnpm check         # web: lint → typecheck → test → build
pnpm --filter api check    # API: lint → typecheck → test → build

# Format
pnpm format       # Prettier all files
pnpm format:check # Check formatting only

# Bundle analysis (web)
ANALYZE=true pnpm build   # generates dist/stats.html

# API
pnpm --filter api prisma:generate   # Generate Prisma client
pnpm --filter api prisma:migrate:dev # Run migrations
```

## Project Architecture

### Monorepo Structure

```text
tenio/
  apps/
    web/          # React frontend (Vite)
    api/          # NestJS backend (Prisma)
  packages/
    shared/       # @tenio/shared — shared types (agent, artifact, auth, common, file, project)
```

### apps/web — Frontend

Feature-based directory structure:

```text
src/
  components/       # Shared UI components (ui/, layout/)
  features/         # Feature modules (ai/, project/, upload/)
    {feature}/
      components/  # Feature UI pieces
      hooks/       # State, orchestration, queries
      services/    # API calls and business flows
      types/       # Feature-local types
      pages/       # Route-level page components
      index.ts     # Public barrel
      queryKeys.ts # React Query keys
  hooks/            # Global shared hooks
  lib/              # Utility functions (date, array, task)
  routes/           # React Router configuration
  stores/           # Zustand stores (authStore, projectStore, chatStore)
  services/         # Core infrastructure (http.ts)
```

**Key Patterns:**

- Cross-feature imports MUST go through feature barrel (`@/features/ai`) — enforced by ESLint `no-restricted-imports`
- Feature internal imports use relative paths
- All exported hooks, services, utilities need Chinese JSDoc
- Full rules at `.rules/feature-architecture.md`

**Route Structure:** `/login` → `/projects` → `/upload` → `/project/:id`

**AI Chat Flow:**

1. Request `agent_ticket` from backend: `POST /api/agent/tickets`
2. Init agent session: `POST {aiService}/api/agent/init`
3. Send messages: `POST {aiService}/api/agent/sessions/{id}/messages`
4. Read SSE stream: `GET {aiService}/api/agent/streams/{stream_id}/sse`
5. On `401 + AGENT_TICKET_EXPIRED`: re-request ticket and retry
6. SSE `refetch` event → invalidate React Query caches

### apps/api — NestJS Backend

Modules:

- `auth/` — JWT auth (password + SMS login, refresh, profile setup)
- `agent/` — Agent ticket management and session orchestration
- `artifacts/` — Artifact CRUD (document, graph, time_cost, crew_plan)
- `files/` — File upload with S3 presigned URLs
- `projects/` — Project management
- `health/` — Health check

Common infrastructure:

- `jwt-auth.guard.ts` — JWT guard
- `current-user.decorator.ts` — `@CurrentUser()` param decorator
- `prisma/` — Prisma module and service

### packages/shared — @tenio/shared

Exports types for agent, artifact, auth, common (ApiResponse, Pagination), file, and project.
Used by both web and api (via moduleNameMapper). Raw TypeScript source, no build step.

### Environment Variables

Root `.env` file (shared by all apps):

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_AI_SERVICE_URL=http://127.0.0.1:8123
VITE_RESOURCE_BASE_URL=https://apmoss.emio.cn/public/resources

# Volc speech recognition (optional)
VITE_VOLC_APP_ID=your_volc_app_id
VITE_VOLC_ACCESS_TOKEN=your_volc_access_token

# Analytics (optional)
VITE_ANALYTICS_ENABLED=false
VITE_ANALYTICS_DEBUG=false
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_PROVIDER=noop
```

### Key Files to Understand

- `docs/backend/` — API backend module architecture docs
- `apps/web/src/services/http.ts` — Fetch wrapper with auth, token refresh, SSE
- `apps/web/src/config/index.ts` — Runtime config single source of truth
- `apps/web/src/features/ai/hooks/useChat.ts` — AI chat state, SSE, agent ticket
- `apps/web/src/stores/chatStore.ts` — Zustand per-project message isolation pattern
- `apps/api/src/modules/` — NestJS module implementations

### Test Layout

- **Web (Vitest)**: `apps/web/tests/{services,stores,utils,hooks,components,integration}/`
- **API (Jest)**: `apps/api/tests/*.test.ts`

### Design System

- A.PM design tokens in `apps/web/src/index.css`
- Prototype references in `templete/` (not production code)
- Prefer A.PM token utilities over ad-hoc colors
