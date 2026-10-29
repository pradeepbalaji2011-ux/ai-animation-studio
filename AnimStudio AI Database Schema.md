# AnimStudio AI — Database Schema

Executable Supabase/Postgres migration source:

```sql
-- AnimStudio AI — Supabase / PostgreSQL schema
-- Apply through Supabase migrations. Media bytes live in Storage, not Postgres.

create extension if not exists pgcrypto;

create type public.project_status as enum (
  'idea', 'scripting', 'script_review', 'bible_lock', 'keyframes',
  'clips', 'voice_captions', 'assembly', 'qa', 'review',
  'approved', 'scheduled', 'publishing', 'posted', 'archived'
);
create type public.style_route as enum ('generative', 'programmatic');
create type public.asset_kind as enum (
  'character_sheet', 'background', 'keyframe', 'clip', 'voice',
  'caption', 'music', 'master', 'thumbnail', 'qa_artifact'
);
create type public.job_status as enum (
  'queued', 'leased', 'succeeded', 'retryable_failed', 'dead_letter', 'cancelled'
);
create type public.publication_status as enum (
  'draft', 'scheduled', 'publishing', 'posted', 'failed', 'cancelled'
);
create type public.reminder_status as enum ('pending', 'sent', 'dismissed', 'failed');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Asia/Kolkata',
  default_aspect_ratio text not null default '9:16'
    check (default_aspect_ratio in ('9:16', '16:9')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.style_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  slug text not null,
  version integer not null default 1 check (version > 0),
  name text not null,
  best_for text not null,
  main_strength text not null,
  route public.style_route not null,
  preset jsonb not null,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, slug, version),
  check (jsonb_typeof(preset) = 'object')
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  title text not null,
  idea text not null default '',
  genre text not null default 'Storytelling',
  audience text not null default '',
  tone text not null default '',
  target_seconds integer not null default 30 check (target_seconds between 15 and 60),
  aspect_ratio text not null default '9:16' check (aspect_ratio in ('9:16', '16:9')),
  timezone text not null default 'Asia/Kolkata',
  status public.project_status not null default 'idea',
  style_preset_id uuid references public.style_presets(id),
  style_bible jsonb not null default '{}'::jsonb,
  style_bible_version integer not null default 0,
  current_script_version integer not null default 0,
  safe_zones jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  version integer not null default 1 check (version > 0),
  appearance jsonb not null default '{}'::jsonb,
  outfits jsonb not null default '[]'::jsonb,
  expression_sheet_asset_id uuid,
  angle_sheet_asset_id uuid,
  prompt_fragment text not null default '',
  negative_prompt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, version)
);

create table public.backgrounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null,
  style_slugs text[] not null default '{}',
  moods text[] not null default '{}',
  prompt_fragment text not null default '',
  continuity_descriptor jsonb not null default '{}'::jsonb,
  preview_asset_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_characters (
  project_id uuid not null references public.projects(id) on delete cascade,
  character_id uuid not null references public.characters(id),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  role text not null default 'primary',
  locked_outfit_tag text not null,
  continuity_prompt text not null default '',
  primary key (project_id, character_id)
);

create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  version integer not null check (version > 0),
  hook text not null default '',
  cta text not null default '',
  title text not null default '',
  description text not null default '',
  hashtags text[] not null default '{}',
  prompt_snapshot text not null default '',
  plain_english_summary text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null references public.scripts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  position integer not null check (position > 0),
  phase text not null default 'value' check (phase in ('hook', 'value', 'cta')),
  duration_seconds numeric(4,2) not null check (duration_seconds between 3 and 6),
  location text not null check (length(trim(location)) > 0),
  subject text not null check (length(trim(subject)) > 0),
  action text not null check (length(trim(action)) > 0),
  camera text not null default '',
  narration text not null default '',
  on_screen_text text not null default '',
  continuity_tags jsonb not null,
  ai_risk_flags jsonb not null default '[]'::jsonb,
  fallback_shot text not null default '',
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (script_id, position),
  check (continuity_tags ?& array['character', 'outfit', 'environment']),
  check (length(on_screen_text) <= 80)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete set null,
  kind public.asset_kind not null,
  version integer not null default 1,
  storage_bucket text not null default 'animstudio-private',
  storage_key text not null,
  mime_type text not null,
  bytes bigint check (bytes is null or bytes >= 0),
  sha256 text,
  duration_seconds numeric(8,3),
  width integer,
  height integer,
  fps numeric(6,3),
  provider text,
  provider_asset_id text,
  input_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, storage_bucket, storage_key)
);

alter table public.characters
  add constraint characters_expression_asset_fk
  foreign key (expression_sheet_asset_id) references public.assets(id) on delete set null;
alter table public.characters
  add constraint characters_angle_asset_fk
  foreign key (angle_sheet_asset_id) references public.assets(id) on delete set null;
alter table public.backgrounds
  add constraint backgrounds_preview_asset_fk
  foreign key (preview_asset_id) references public.assets(id) on delete set null;

create table public.cost_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  adapter text not null,
  batch_scope jsonb not null,
  estimated_units numeric(12,4),
  estimated_amount numeric(12,4),
  currency text,
  approved_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete cascade,
  approval_id uuid references public.cost_approvals(id),
  stage text not null check (stage in (
    'script', 'keyframe', 'clip', 'voice', 'alignment', 'assembly',
    'qa', 'summary', 'analytics_sync', 'publish', 'reminder'
  )),
  status public.job_status not null default 'queued',
  adapter text not null default 'mock',
  requires_paid_approval boolean not null default false,
  idempotency_key text not null,
  input_hash text not null,
  input jsonb not null default '{}'::jsonb,
  output_asset_id uuid references public.assets(id) on delete set null,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  attempt integer not null default 0,
  max_attempts integer not null default 3,
  lease_expires_at timestamptz,
  sanitized_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key),
  check (not requires_paid_approval or approval_id is not null)
);

create table public.qa_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  master_asset_id uuid not null references public.assets(id) on delete cascade,
  status text not null check (status in ('pending', 'passed', 'warning', 'failed')),
  checks jsonb not null default '[]'::jsonb,
  integrated_lufs numeric(6,2),
  true_peak_dbtp numeric(6,2),
  creator_approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  platform text not null check (platform in ('youtube', 'instagram')),
  external_account_id text not null,
  display_name text,
  secret_reference text,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  unique (user_id, platform, external_account_id)
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  channel_connection_id uuid not null references public.channel_connections(id),
  master_asset_id uuid not null references public.assets(id),
  qa_report_id uuid not null references public.qa_reports(id),
  status public.publication_status not null default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  external_post_id text,
  title text not null default '',
  description text not null default '',
  sanitized_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_connection_id, project_id, master_asset_id)
);

create table public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  captured_at timestamptz not null default now(),
  views bigint not null default 0,
  average_view_duration_seconds numeric(10,3),
  retention_curve jsonb not null default '[]'::jsonb,
  ctr numeric(6,3),
  first_three_second_dropoff numeric(6,3),
  likes bigint,
  comments bigint,
  shares bigint,
  raw_metadata jsonb not null default '{}'::jsonb,
  unique (publication_id, captured_at)
);

create table public.trend_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  niche text not null,
  kind text not null check (kind in ('topic', 'format', 'hook', 'sound')),
  title text not null,
  evidence jsonb not null default '{}'::jsonb,
  source_url text,
  score numeric(8,3),
  observed_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete cascade,
  publication_id uuid references public.publications(id) on delete cascade,
  type text not null check (type in (
    'next_video_fix', 'hook', 'title', 'thumbnail', 'series',
    'cadence', 'comment_reply', 'posting_time', 'trend_idea'
  )),
  recommendation text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence text not null default 'heuristic' check (confidence in ('heuristic', 'low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'accepted', 'dismissed', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  script_version integer not null,
  scene_count integer not null,
  duration_seconds numeric(8,2) not null,
  generated_items jsonb not null default '[]'::jsonb,
  flagged_items jsonb not null default '[]'::jsonb,
  creator_review_items jsonb not null default '[]'::jsonb,
  recommended_post_time timestamptz,
  report text,
  created_at timestamptz not null default now(),
  unique (project_id, script_version)
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  project_id uuid references public.projects(id) on delete cascade,
  publication_id uuid references public.publications(id) on delete cascade,
  kind text not null check (kind in ('unfinished_work', 'review', 'upcoming_post', 'weekly_analytics')),
  channel text not null check (channel in ('in_app', 'email', 'telegram', 'whatsapp')),
  destination text,
  message text not null,
  due_at timestamptz not null,
  status public.reminder_status not null default 'pending',
  sent_at timestamptz,
  sanitized_error text,
  created_at timestamptz not null default now()
);

create index projects_user_status_idx on public.projects(user_id, status, updated_at desc);
create index scenes_script_position_idx on public.scenes(script_id, position);
create index assets_project_kind_idx on public.assets(project_id, kind, created_at desc);
create index render_jobs_ready_idx on public.render_jobs(status, run_after)
  where status in ('queued', 'retryable_failed');
create index render_jobs_lease_idx on public.render_jobs(lease_expires_at)
  where status = 'leased';
create index publications_due_idx on public.publications(status, scheduled_for)
  where status = 'scheduled';
create index analytics_publication_time_idx on public.analytics_snapshots(publication_id, captured_at desc);
create index trend_items_rank_idx on public.trend_items(user_id, niche, score desc, observed_at desc);
create index reminders_due_idx on public.reminders(status, due_at)
  where status = 'pending';

-- Updated-at maintenance.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'projects', 'characters', 'backgrounds', 'scenes',
    'render_jobs', 'publications', 'recommendations'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- RLS: built-in styles are readable by signed-in users; custom styles and all
-- creative/channel records are accessible only to their owner.
alter table public.profiles enable row level security;
create policy profiles_own on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

alter table public.style_presets enable row level security;
create policy styles_read on public.style_presets for select
  using (is_builtin or user_id = auth.uid());
create policy styles_insert_own on public.style_presets for insert
  with check (user_id = auth.uid() and not is_builtin);
create policy styles_update_own on public.style_presets for update
  using (user_id = auth.uid() and not is_builtin)
  with check (user_id = auth.uid() and not is_builtin);
create policy styles_delete_own on public.style_presets for delete
  using (user_id = auth.uid() and not is_builtin);

do $$
declare t text;
begin
  foreach t in array array[
    'projects', 'characters', 'backgrounds', 'project_characters', 'scripts',
    'scenes', 'assets', 'cost_approvals', 'render_jobs', 'qa_reports',
    'channel_connections', 'publications', 'analytics_snapshots', 'trend_items',
    'recommendations', 'work_summaries', 'reminders'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I_all_own on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end $$;

-- Storage: create a private bucket named animstudio-private. Keys use:
-- <auth.uid()>/<project_id>/<asset_kind>/<version>/<content_hash>.<ext>
-- Storage policies must enforce (storage.foldername(name))[1] = auth.uid()::text
-- for SELECT/INSERT/UPDATE/DELETE. Never store OAuth secrets in asset metadata.

```
