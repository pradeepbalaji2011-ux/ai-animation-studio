# AnimStudio AI — Clickable Studio Prototype

A personal animation-direction workspace for creating and growing YouTube Shorts and Instagram Reels. This release contains a responsive, interactive frontend prototype and a validated registry of 18 animation style presets.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## What works

- Dashboard with production status, priorities, schedule, and reminders
- Style Library with 18 presets, search, route filters, JSON inspection, and project selection
- Script Studio with a local five-scene draft generator, editable scenes, continuity tags, risk flags, and JSON view
- Character/background library and lockable continuity bible
- Vertical Video Builder with safe-zone overlays, playback controls, scene filmstrip, pipeline simulation, QA plan, and summary download
- Sample trend development, local posting reminders, sample video analysis, audience coaching, kanban, and reminders
- Keyboard module search (`Ctrl/Cmd + K`), new-video shortcut (`Ctrl/Cmd + N`), accessible dialogs, and mobile navigation

## Prototype boundary

This is intentionally frontend-only. Changes persist in this browser's localStorage; they do not sync across devices and are lost if browser data is cleared. AI generation, FFmpeg rendering, social OAuth/publishing, live trends, and analytics are not connected. Trend and analytics figures are labeled sample data. The pipeline control simulates state transitions and never calls a paid API.

The production target is Next.js + TypeScript + Tailwind with Supabase Postgres/Storage, a Postgres-backed render queue, Remotion, FFmpeg, and provider-agnostic adapters. The separately delivered architecture and schema documents define that implementation.

## Source map

- `src/App.tsx` — workspace shell, navigation, local state, and primary workflows
- `src/pages/` — all ten studio views
- `src/components/StudioVisuals.tsx` — original SVG style, character, and vertical-scene artwork
- `src/data/style-presets.json` — 18 validated style presets
- `src/data/demo.ts` — clearly illustrative project, trend, schedule, and analytics content
- `src/types/studio.ts` — shared project, scene, style, and scheduling contracts

All artwork is original SVG/CSS. Fonts are bundled locally through Fontsource. Icons are from Lucide.
