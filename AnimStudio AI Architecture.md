# AnimStudio AI — Production Architecture

**Status:** Initial build blueprint  
**Product:** Personal AI animation direction and channel-growth workspace  
**Primary output:** 9:16, 1080 × 1920; optional 16:9, 1920 × 1080  
**Default timezone:** Asia/Kolkata (IST)

## 1. Scope and design principles

AnimStudio AI is an **orchestrator, not a model provider**. It owns the creative brief, continuity bible, scene graph, render plan, asset lineage, quality checks, publishing workflow, and learning loop. External image, video, voice, transcription, and social-platform services sit behind replaceable adapters.

The system is designed for one creator, but all records are user-scoped so authentication and row-level security remain correct if additional creators are added later.

Non-negotiable rules:

- No paid provider call is dispatched without an explicit, recorded creator approval.
- Each scene has one location, one primary subject, and one visible action.
- Generative and programmatic clips are planned in 3–6 second units.
- Every scene carries character, outfit, and environment continuity tags.
- Character sheets and the project style bible are locked before keyframe generation.
- Programmatic styles render text and exact shapes in Remotion, not inside generated imagery.
- Final media passes visual, motion, text, and audio QA before it can be scheduled.
- Only creator-owned or licensed music enters the assembly step.
- OAuth tokens and provider secrets never reach the browser or appear in logs.

## 2. System topology

```text
Browser (Next.js App Router + TypeScript + Tailwind)
  ├─ Studio modules and local draft editing
  ├─ Signed uploads / asset preview URLs
  └─ Server actions and route handlers
                       │
                       ▼
Application services (TypeScript)
  ├─ Script service + scene validator
  ├─ Continuity / style-bible service
  ├─ Render planner + cost-approval gate
  ├─ Trend, analytics, coaching, and summary services
  └─ Provider-agnostic adapter registry
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
Supabase Postgres + RLS       Supabase Storage
  ├─ Projects / scripts         ├─ Character sheets
  ├─ Scenes / continuity        ├─ Backgrounds / keyframes
  ├─ Assets / render jobs       ├─ Clips / voice / captions
  ├─ Queue tables / leases      ├─ Masters / thumbnails
  └─ Analytics / schedules      └─ QA contact sheets
          │
          ▼
Render workers (Node.js, Graphile Worker / Postgres queue)
  ├─ Keyframe and clip adapter jobs
  ├─ Remotion programmatic renderer
  ├─ TTS + word-alignment jobs
  ├─ FFmpeg assembly + loudness normalization
  └─ QA, reports, scheduling, and reminders
          │
          ▼
External adapters
  ├─ LLM / image / image-to-video / TTS / transcription
  ├─ YouTube Data + YouTube Analytics APIs
  ├─ Instagram Graph API
  └─ Email / Telegram / WhatsApp reminder providers
```

### Deployment units

1. **Web application:** Next.js App Router, React Server Components where useful, client components for the timeline, inspectors, and drag interactions.
2. **Render worker:** long-running Node.js process with FFmpeg and Remotion; horizontally scalable by queue concurrency.
3. **Database and storage:** Supabase Postgres, Auth, Storage, and Realtime for render-progress updates.
4. **Scheduler:** worker cron enqueues due analytics syncs, reminders, and publishing jobs; database timestamps remain UTC and display in IST.

## 3. Monorepo layout

```text
apps/
  web/                  Next.js UI, server actions, OAuth callbacks
  worker/               Queue consumers, Remotion, FFmpeg, QA, cron
packages/
  contracts/            Zod schemas, scene/style/job TypeScript types
  db/                   SQL migrations, generated database types, queries
  adapters/             Provider interfaces and vendor implementations
  director/             Script prompt, scene validator, render planning
  media/                FFmpeg graphs, caption layout, safe zones, probes
  analytics/            Metric normalization and recommendation rules
  ui/                   Shared Tailwind/shadcn components
supabase/
  migrations/           Ordered schema and RLS migrations
```

All external payloads are validated at trust boundaries with Zod. Database-generated types and shared contracts prevent the script editor, worker, and adapters from drifting apart.

## 4. Module boundaries

| Module | Owns | Important outputs |
|---|---|---|
| Style Library | Versioned built-in and custom presets | Selected style version, route, palette, camera and motion constraints |
| Script Studio | Brief, genre prompt, hook/value/CTA structure | Script JSON, narration, validated scene list |
| Character & Background Studio | Character sheets, expressions, angles, environments | Locked continuity bible and reusable asset references |
| Video Builder | Scene render plans, keyframes, clips, audio, assembly | Versioned master, captions, QA report |
| Trend Analyzer | Normalized niche topics, formats, hooks, sounds | Ranked ideas with source and expiry |
| Scheduler | Platform targets and best-time recommendations | UTC publish slots and publishing jobs |
| Video Analyzer | Retention, CTR, first-3-second drop-off | Three specific, measurable next-video fixes |
| Audience Coach | Hooks, titles, thumbnails, series, cadence, replies | Prioritized recommendations and experiment backlog |
| Work Summary & Reminders | Kanban, per-video reports, notifications | Plain-English summary and actionable reminders |

## 5. Production state machine

```text
idea → scripting → script_review → bible_lock → keyframes
     → clips → voice_captions → assembly → qa
     → review → approved → scheduled → publishing → posted
```

A failed stage returns to its owning stage with an error and retry count; it never silently advances. Re-editing a script invalidates downstream scene artifacts by version, while old assets remain available for audit and rollback.

### Render planning

1. Lock `project_style_bible_version` and `script_version`.
2. Validate duration, single-action semantics, continuity tags, safe text length, and AI risk flags.
3. Estimate provider units and cost; create a `cost_approval` record if a paid adapter is selected.
4. Only after approval, enqueue independent scene jobs with idempotency keys.
5. Generate one approved keyframe per scene; reuse character/background references.
6. Route clips:
   - **Generative:** keyframe + scene prompt → image-to-video adapter, 3–6 seconds.
   - **Programmatic:** scene JSON + preset → Remotion composition, exact vector/text render.
7. Apply stepped-motion post-processing where required by the preset.
8. Generate TTS, align words, and emit caption cues with keyword highlights.
9. Assemble picture, voice, licensed music, and captions with FFmpeg.
10. Probe loudness, dimensions, fps, duration, black/freeze frames, and text bounds; create visual QA artifacts.
11. Generate the work summary; allow creator review before scheduling.

## 6. Scene contract

```json
{
  "id": "scene_01",
  "durationSeconds": 4,
  "phase": "hook",
  "location": "Rooftop railway platform at blue hour",
  "subject": "Mira",
  "action": "Mira lifts a red lantern toward the camera",
  "camera": "Slow push-in, medium close-up, eye level",
  "narration": "What if the last train never arrived?",
  "onScreenText": "THE LAST TRAIN",
  "continuityTags": {
    "character": "mira_v1",
    "outfit": "yellow_raincoat_v1",
    "environment": "rooftop_platform_blue_hour_v1"
  },
  "aiRiskFlags": [],
  "fallbackShot": "Static medium close-up with a slow camera push"
}
```

Validation combines deterministic checks with model-assisted review. The database enforces duration and the presence of continuity tags; the director service checks multi-action language, abstract/internal states, micro-gestures, unsafe caption length, and risky physics. A risk must include a simpler alternative shot.

## 7. Media and QA standards

### Canvas and safe zones

- Primary master: 1080 × 1920, H.264 video, AAC audio, fast-start MP4.
- Optional master: 1920 × 1080 with a separately checked composition; never assume a center crop is sufficient.
- Keep critical captions and faces inside the configured platform-safe rectangles. Defaults are starting values only and are versioned per platform.
- Render captions as a dedicated overlay layer. Generated scene prompts explicitly forbid words, logos, subtitles, and watermarks.

### Audio

- Measure integrated loudness and true peak with FFmpeg `loudnorm` analysis.
- Normalize the final mix to a configurable target, initially **−14 LUFS integrated**, **−1.5 dBTP**, with two-pass normalization.
- Preserve dialogue intelligibility; duck licensed music under narration rather than raising the entire mix.
- Store measured values in the QA report.

### Visual checks

- Character identity and outfit similarity against the locked sheet.
- Environment continuity against the project bible.
- Flicker, duplicate/frozen frames, abrupt exposure shifts, and malformed motion.
- Text artifacts in keyframes and clips; any generated text triggers rejection.
- Caption overflow and platform-safe-zone violations.
- Automated checks assist the creator; final visual approval remains explicit.

## 8. Provider adapter contracts

```ts
interface ImageProvider {
  estimate(input: ImageRequest): Promise<CostEstimate>;
  generate(input: ImageRequest, signal: AbortSignal): Promise<AssetResult>;
}

interface VideoProvider {
  estimate(input: VideoRequest): Promise<CostEstimate>;
  animate(input: VideoRequest, signal: AbortSignal): Promise<AssetResult>;
}

interface SpeechProvider {
  synthesize(input: SpeechRequest, signal: AbortSignal): Promise<SpeechResult>;
}

interface AlignmentProvider {
  align(input: AlignmentRequest, signal: AbortSignal): Promise<WordCue[]>;
}
```

Each adapter declares capabilities, supported durations and aspect ratios, rate limits, pricing metadata, and whether it can accept character references. Provider-specific payloads are isolated in adapter metadata, not spread through core tables. Every request carries an idempotency key, timeout, cancellation signal, and sanitized error mapping.

**Approval gate:** selecting a provider is not approval to spend. The UI shows the estimated units/cost and requires a fresh confirmation for a defined render batch. Free/local/mock adapters remain available for development.

## 9. Queue, reliability, and asset lineage

- Use a Postgres-backed worker queue (Graphile Worker recommended) to avoid a second infrastructure dependency.
- Jobs use `FOR UPDATE SKIP LOCKED`-style leasing through the queue library, bounded retries, exponential backoff, and heartbeat-based stale-lease recovery.
- Idempotency key: `project + script_version + scene + stage + input_hash + provider`.
- Assets are content-addressed where practical and stored by user/project/version in Supabase Storage; Postgres stores metadata and keys, not media blobs.
- The web app receives progress through Realtime plus polling fallback. Progress is derived from job state, not fabricated timers.
- FFmpeg and Remotion run only in workers with bounded CPU/memory concurrency.
- A dead-letter state preserves the sanitized error, input hash, and retry history for operator review.

## 10. Social APIs and growth loop

### YouTube

Use OAuth with the minimum required scopes. YouTube Data API handles channel/video metadata and uploads when enabled; YouTube Analytics API supplies normalized retention and traffic metrics. Raw responses are kept only as needed, with normalized daily snapshots for trending.

### Instagram

Instagram Graph API publishing requires an eligible Business or Creator account and the appropriate Facebook connection. Media publishing follows the container → status poll → publish flow. Reminders work without auto-publishing; failed publishing never marks a video posted.

### Recommendation logic

The first 10–15 posted videos use transparent heuristics, including IST evening and weekend slots. After enough owned-channel data exists, recommendations rank actual audience windows and format performance. Every suggestion displays its evidence and confidence; trend signals expire and are never presented as evergreen facts.

## 11. Security and privacy

- Supabase Auth identifies the creator; Postgres RLS restricts every owned row and storage object.
- OAuth refresh tokens and provider keys live in server-side encrypted secrets, never ordinary JSON columns or client environment variables.
- OAuth callbacks use state, PKCE where supported, and exact redirect allowlists.
- Signed asset URLs are short-lived. Public sharing, if later added, uses separate explicit public assets.
- Logs exclude prompts containing private data when requested, access tokens, signed URL query strings, and provider secrets.
- Paid-provider approval records include actor, timestamp, adapter, estimate, and batch scope.

## 12. Prototype boundary and implementation phases

The accompanying clickable prototype is frontend-only. It uses realistic sample data and browser-local edits; it does not call AI providers, social APIs, FFmpeg, or a database, and it does not claim cross-device persistence.

### Phase 1 — foundation

- Next.js app, Supabase migrations/RLS, shared contracts, style registry.
- Script editor, scene validator, character/style bible, local/mock render adapter.
- Worker skeleton, storage layout, and deterministic Remotion/FFmpeg smoke test.

### Phase 2 — first real video, after provider approval

- Connect one image, one video, and one TTS/alignment provider.
- Complete one short vertical video through QA and creator review.
- Measure render cost and failure rates before adding more vendors.

### Phase 3 — channel operations

- Scheduler, reminders, work summaries, YouTube/Instagram OAuth and publishing.
- Analytics ingestion, video analyzer, trend analyzer, audience coach.

## 13. Acceptance checks

- All 18 presets validate against the shared style schema and resolve to the correct route.
- A 15–60 second script produces valid 3–6 second scenes with no missing continuity tags.
- Changing a character outfit after bible lock requires a new version and marks affected scenes stale.
- No paid adapter can run without a matching approval record.
- A worker crash can be retried without duplicate provider output or duplicate publishing.
- Programmatic text is sharp at 1080 × 1920 and remains inside safe zones.
- Final audio meets the configured loudness and true-peak targets.
- A video cannot become `scheduled` until required QA checks and creator approval pass.
- Analytics recommendations cite the owned metrics or trend evidence behind them.
