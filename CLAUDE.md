# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A.PM 智能管理平台 — 智慧工地/项目管理平台。pnpm monorepo 结构，包含前端 (React)、后端 (NestJS)、共享类型包。

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
pnpm lint:web      # web ESLint
pnpm --filter api lint   # API ESLint

# Type checking
pnpm typecheck        # web
pnpm typecheck:web    # web
pnpm --filter api typecheck   # API
pnpm --filter @tenio/shared typecheck  # shared package

# Testing
pnpm test          # web (Vitest)
pnpm test:web      # web
pnpm --filter api test     # API (Jest)
pnpm --filter api test -- tests/health.controller.test.ts  # single API test

# Full checks
pnpm check         # web: lint → typecheck → test → build
pnpm --filter api check    # API: lint → typecheck → test → build

# Format
pnpm format       # Prettier all files
pnpm format:check # Check formatting only

# Bundle analysis (web)
ANALYZE=true pnpm build   # generates dist/stats.html

# Prepare Husky hooks
pnpm prepare
```

## Monorepo Structure

```
tenio/
  apps/
    web/          # React frontend (Vite)
    api/          # NestJS backend (Prisma)
  packages/
    shared/       # @tenio/shared — shared types
```

### Root package.json scripts

Root scripts target `web` by default (`pnpm dev` = `pnpm --filter web dev`).
Use `--filter api` to run API-specific commands:

- `pnpm --filter api dev` — start NestJS dev server
- `pnpm --filter api lint` — API ESLint
- `pnpm --filter api test` — API Jest tests
- `pnpm --filter api typecheck` — API TypeScript check
- `pnpm --filter api check` — full API toolchain

## apps/web — Frontend

Refer to `apps/web` for the complete frontend codebase.

### Config

- `apps/web/vite.config.ts` — Vite config with `@/` alias, manual vendor chunk splitting, conditional bundle analyzer (ANALYZE env)
- `apps/web/vitest.config.ts` — jsdom environment, tests in `tests/`, globals enabled
- `apps/web/eslint.config.js` — ESLint 9 flat config with TypeScript strict rules, React Hooks plugin
- `apps/web/tailwind.config.js` — Tailwind with A.PM tokens
- `apps/web/tsconfig.json` — Path alias `@/` → `src/`

### ESLint rules (web)

- `no-unused-vars` — **error** (prefix `_` to ignore)
- `consistent-type-imports` — **warn** with `inline-type-imports` fix style
- `no-unsafe-*` (assignment/member-access/call/return/argument) — **error**
- `require-await` — **warn**
- `no-restricted-imports` — **error**: cross-feature deep imports prohibited (use feature barrels)

### Route Structure

- `/login` — Login page (password + SMS)
- `/projects` — Project dashboard / list
- `/upload` — New project intake and document upload
- `/` → redirects to `/projects`
- `/project/:id` — Main project dashboard (Overview)

User flow: `/login` → `/projects` → `/upload` → `/project/:id`

### Key Files

- `src/services/http.ts` — Fetch wrapper with auth headers, token refresh, SSE streaming, ApiResponse unwrapping
- `src/config/index.ts` — Single source of truth for env-based runtime config
- `src/features/ai/hooks/useChat.ts` — AI chat state, SSE streaming, agent ticket auth, voice input
- `src/features/project/hooks/useProjectData.ts` — Project overview data derivation and graph query binding
- `src/stores/chatStore.ts` — Zustand store with per-project message thread isolation pattern using `Record<string, ProjectChatState>`
- `src/stores/authStore.ts` — Auth token/user with persist middleware
- `src/components/layout/AppLayout.tsx` — Main layout: left AI sidebar + right project workspace

### Feature Architecture

Each feature in `src/features/` is self-contained:

```text
features/{feature}/
  components/  # Feature UI pieces
  hooks/       # State, orchestration, queries
  services/    # API calls and business flows
  types/       # Feature-local types
  pages/       # Route-level page components
  index.ts     # Public barrel (single cross-feature import point)
  queryKeys.ts # React Query keys (if feature uses RQ)
```

Rules (enforced by ESLint `no-restricted-imports`):

- Cross-feature imports MUST use the feature barrel (`@/features/ai`)
- Feature internal imports MUST use relative paths
- All exported hooks, services, utilities need Chinese JSDoc
- Full rules at `.rules/feature-architecture.md`

### AI Chat Flow

1. Frontend requests `agent_ticket` from backend API: `POST /api/agent/tickets`
2. Initiates agent session: `POST {aiService}/api/agent/init`
3. Sends messages: `POST {aiService}/api/agent/sessions/{id}/messages`
4. Reads SSE stream: `GET {aiService}/api/agent/streams/{stream_id}/sse`
5. On `401 + AGENT_TICKET_EXPIRED`: re-request ticket and retry once
6. SSE `refetch` event triggers React Query invalidation for core graph, curves, documents, crew plan

### Upload Flow

- Upload page at `src/features/upload/pages/UploadPage.tsx`
- Flow: get upload credentials → `PUT` file content → notify backend → start generation task
- File categories in `src/features/upload/types/uploads.ts`
- Generation progress polled up to 30 min; user can cancel (triggers backend cancel + project deletion)
- `upload_url` origin replaced with `VITE_API_BASE_URL` to avoid internal addresses

## apps/api — NestJS Backend

### Prisma

```bash
pnpm --filter api prisma:generate   # Generate Prisma client
pnpm --filter api prisma:migrate:dev # Run migrations
pnpm --filter api prisma:studio     # Open Prisma Studio
```

Prisma client must be generated before typecheck or dev will work. The API uses Prisma as its ORM layer with PostgreSQL.

### Modules

```text
src/modules/
  auth/       # JWT-based authentication (password + SMS login, refresh, profile setup)
  agent/      # AI agent ticket management and session orchestration
  artifacts/  # Artifact CRUD (crew plan artifacts)
  files/      # File upload with S3 presigned URLs
  projects/   # Project management
  health/     # Health check endpoint (GET /health)
```

### Common Infrastructure

- `src/common/auth/jwt-auth.guard.ts` — JWT guard for protected routes
- `src/common/auth/current-user.decorator.ts` — `@CurrentUser()` param decorator
- `src/common/dto/pagination-query.dto.ts` — Pagination query params
- `src/config/env.ts` — Environment config via Zod validation
- `src/prisma/` — Prisma module and service

### Agent Auth

Two-layer ticket system:

1. JWT login → `POST /api/agent/tickets` → short-lived `agent_ticket` (with `expires_at` + `refresh_after_seconds`)
2. `agent_ticket` used for agent service calls; guard at `agent-ticket.guard.ts`

### Testing (Jest)

- Config: `apps/api/jest.config.ts` — ts-jest with NodeNext module resolution, `.js` extension mapping
- Tests in `tests/` directory, `*.test.ts` pattern
- `moduleNameMapper` resolves `@tenio/shared` to the shared package source

### ESLint (API)

- `apps/api/eslint.config.js` — ESLint 9 flat config
- `no-unsafe-*` rules at **warn** level (NestJS/Prisma patterns trigger many false positives)
- `require-await` — **warn**
- `no-unnecessary-type-assertion` — **warn**

## packages/shared — @tenio/shared

### Exports

```typescript
export * from "./agent/agent.types.js";
export * from "./artifact/artifact.types.js";
export * from "./auth/auth.types.js";
export * from "./common/api-response.js";
export * from "./common/pagination.js";
export * from "./file/file.types.js";
export * from "./project/project.types.js";
```

Used by both `apps/web` (via `moduleNameMapper` in vitest + vite alias) and `apps/api` (via `moduleNameMapper` in jest). Resolution configured per-app since the shared package is a raw TypeScript source (no build step).

## Environment Variables

Root `.env` file (shared by all apps, `envDir: "../.."` in vite config):

```bash
# Required
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

## Design System

- A.PM design tokens in `apps/web/src/index.css`
- Prototype references in `templete/` (not production code)
- UI evolution guide at `docs/frontend-evolution-guide.md`
- Prefer A.PM token utilities over ad-hoc colors

## Documentation

- `docs/frontend-evolution-guide.md` — UI evolution constraints and page mapping
- `docs/backend/` — API backend module documentation
- `docs/REST_API_IMPLEMENTATION_SUMMARY.md` — REST API overview
- `docs/deployment.md` — Deployment guide

## Git Hooks

Husky + lint-staged configured. Pre-commit runs ESLint + Prettier on staged `apps/web/**/*.{ts,tsx}` files.

## Prettier

Config in `.prettierrc.json`: semicolons, double quotes, trailing commas, 100 print width.
