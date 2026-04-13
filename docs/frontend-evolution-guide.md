# Frontend Evolution Guide

This document is the working guide for evolving the main frontend under `src/` using the reference assets in `templete/`.

## Source Of Truth

Use these assets as the design reference:

- `templete/design_spec_and_markup/design_spec.md`
- `templete/design_spec_and_markup/ui_markup_guide.md`
- `templete/apm_ui_html (3)/login.html`
- `templete/apm_ui_html (3)/projects.html`
- `templete/apm_ui_html (3)/upload.html`
- `templete/apm_ui_html (3)/app.html`

Do not treat `templete/apm_react_template` as the implementation baseline. It is only historical reference.

## Implementation Rule

The production frontend lives only in `src/`.

Reference HTML is for:

- visual hierarchy
- component structure
- spacing and typography intent
- state presentation

Reference HTML is not for:

- copy-pasting inline CSS into app code
- reintroducing DOM-driven tab state or `onclick`
- creating a second parallel frontend

## Design Token Baseline

Primary design tokens now live in `src/index.css`.

Use these token groups:

- Fonts: `--font-display`, `--font-body`
- Backgrounds: `--apm-bg`, `--apm-bg-panel`, `--apm-bg-card`, `--apm-bg-overlay`
- Accent system: `--apm-accent`, `--apm-accent-strong`, `--apm-accent-border`
- Text: `--apm-text`, `--apm-text-muted`, `--apm-text-dim`
- Status: `--apm-success`, `--apm-warning`, `--apm-danger`
- Layout primitives: `--apm-radius-*`, `--apm-space-*`
- Visual effects: `--apm-gradient-*`, `--apm-shadow-*`

Prefer these utilities when they fit:

- `font-display`
- `font-body`
- `text-apm`
- `text-apm-muted`
- `text-apm-dim`
- `bg-apm-grid`
- `bg-apm-ambient`
- `bg-apm-panel`
- `bg-apm-card`
- `border-apm`
- `shadow-apm-panel`
- `shadow-apm-glow`
- `apm-topline`

## Page Mapping

### Login

Reference:

- `templete/apm_ui_html (3)/login.html`

Target:

- `src/pages/Login.tsx`

Current state:

- aligned with the login prototype shell
- includes brand area above form
- includes tab-like login mode switch
- uses A.PM token-based card, inputs, and dialog styling
- successful login now routes to `/projects`

Remaining work:

- connect real auth flow when backend is ready
- replace placeholder phone-code action with real verification flow if kept

### Project Dashboard

Reference:

- `templete/apm_ui_html (3)/projects.html`

Target:

- `src/pages/Projects.tsx`
- `src/routes/AppRoutes.tsx`

Current state:

- sticky top navbar
- welcome strip
- stats row
- filter chips and search
- project card grid
- root route `/` now redirects to `/projects`
- project cards enter `/project/:id`
- new project action routes to `/upload`

Remaining work:

- replace placeholder project metrics with real backend summary fields when available
- extract repeated dashboard pieces into shared display components

### Upload

Reference:

- `templete/apm_ui_html (3)/upload.html`

Target:

- `src/features/upload/pages/UploadPage.tsx`

Current state:

- required vs optional upload zones
- stronger upload-state visuals
- structured file list cards
- AI-generation guidance state
- successful upload currently enters a generated-state sequence and then returns to `/projects`

Remaining work:

- support project-name/context handoff from `/projects`
- consider controlled parallel upload if file count grows
- align generated-state messaging with future real AI generation workflow

### Workspace

Reference:

- `templete/apm_ui_html (3)/app.html`

Target:

- `src/components/layout/AppLayout.tsx`
- `src/features/project/pages/Overview.tsx`
- `src/features/project/components/ProjectTabBar.tsx`
- `src/features/ai/components/*`

Current state:

- left AI sidebar + right workspace shell
- top tab strip as a workspace control bar
- consistent panel frames across uploads, document, gantt, network, resources
- workspace-level actions grouped in header/toolbars

Remaining work:

- extract repeated workspace shell elements into reusable display components
- continue tightening panel-level consistency across tabs
- decide whether more of the page shell should move out of feature pages into shared layout components

## Current Route Flow

The intended app flow is now:

1. `/login`
2. `/projects`
3. `/upload` for new project intake
4. `/project/:id` for the active workspace

When changing routing, preserve this flow unless the task explicitly changes product structure.

## Component Extraction Plan

Create or refine reusable display components before duplicating page markup.

Recommended candidates:

- `WorkspaceHeader`
- `SectionHeader`
- `StatCard`
- `InfoCard`
- `FilterChip`
- `FileCard`
- `ConsolePanel`

Place them in:

- `src/components/layout`
- `src/features/project/components`
- `src/features/ai/components`

Keep `src/components/ui` for low-level primitives only.

## Execution Order

Completed:

1. Stabilize design tokens in `src/index.css`
2. Align `AppLayout`, `Overview`, and `ProjectTabBar` with the workspace shell
3. Rework `UploadPage.tsx` using the upload prototype
4. Rework `Login.tsx` using the login prototype
5. Refine AI sidebar structure and console panel
6. Add and route a dashboard/projects page

Next:

1. Extract repeated display components from `Projects`, `Upload`, and workspace shell
2. Clean up remaining raw color usage where token utilities should be used
3. Improve upload/project creation continuity from dashboard into workspace
4. Revisit business-layer gaps after UI shell is stable

## Agent Rules

Any coding agent working on the frontend should follow these rules:

- Work from the reference assets, but implement inside `src/`
- Prefer semantic tokens over raw hex or ad-hoc rgba values
- Reuse or add intermediate display components instead of expanding page-level class blobs
- Preserve current app behavior unless the task explicitly includes UX changes
- Preserve the current route flow: `/login -> /projects -> /upload -> /project/:id`
- Avoid introducing a second styling system
- Avoid one-off visual hacks that bypass tokens

## Definition Of Done

A page refactor is considered aligned when:

- it uses the shared A.PM token system
- its structure matches the intended reference hierarchy
- repeated visual patterns are extracted into reusable components
- no prototype HTML or inline CSS is copied into production code verbatim
- existing lint and typecheck pass
