import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Project, Reminder, Scene, ScheduledPost } from '@/types/studio'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export interface MigrationResult {
  success: boolean
  projectsCount: number
  scenesCount: number
  remindersCount: number
  scheduledCount: number
  migratedAt: string
  error?: string
}

export async function migrateLocalStorageToSupabase(user: User): Promise<MigrationResult> {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.')
  }

  const userId = user.id

  // 1. Ensure Profile Exists
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: user.email?.split('@')[0] || 'Pradeep',
    timezone: 'Asia/Kolkata',
    default_aspect_ratio: '9:16',
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    console.warn('Profile upsert note:', profileError.message)
  }

  // 2. Read LocalStorage State
  const rawProject = localStorage.getItem('animstudio-project')
  const rawScenes = localStorage.getItem('animstudio-scenes')
  const rawSchedule = localStorage.getItem('animstudio-schedule')
  const rawReminders = localStorage.getItem('animstudio-reminders')

  const project: Project = rawProject ? JSON.parse(rawProject) : null
  const scenes: Scene[] = rawScenes ? JSON.parse(rawScenes) : []
  const schedule: ScheduledPost[] = rawSchedule ? JSON.parse(rawSchedule) : []
  const reminders: Reminder[] = rawReminders ? JSON.parse(rawReminders) : []

  let projectsCount = 0
  let scenesCount = 0
  let remindersCount = 0
  let scheduledCount = 0

  if (project) {
    // 3. Insert or Update Project
    const { data: projectRow, error: pErr } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: project.title || 'Untitled Animation',
        idea: project.idea || '',
        genre: project.genre || 'Storytelling',
        audience: project.audience || '',
        tone: project.tone || '',
        target_seconds: Math.min(60, Math.max(15, project.targetLength || 30)),
        aspect_ratio: project.aspectRatio || '9:16',
        timezone: 'Asia/Kolkata',
        status: (project.status?.toLowerCase() as unknown as 'idea' | 'scripting' | 'review') || 'idea',
      })
      .select('id')
      .single()

    if (pErr) {
      throw new Error(`Failed to migrate project: ${pErr.message}`)
    }

    projectsCount = 1
    const projectId = projectRow.id

    // 4. Insert Script Record
    const { data: scriptRow, error: sErr } = await supabase
      .from('scripts')
      .insert({
        project_id: projectId,
        user_id: userId,
        version: 1,
        title: project.title,
        description: project.idea,
        hook: scenes[0]?.narration || '',
        cta: scenes.at(-1)?.narration || '',
        hashtags: ['#animation', '#animstudio', `#${project.genre?.toLowerCase() || 'story'}`],
        plain_english_summary: 'Migrated from creator browser localStorage draft.',
      })
      .select('id')
      .single()

    if (sErr) {
      throw new Error(`Failed to migrate script: ${sErr.message}`)
    }

    const scriptId = scriptRow.id

    // 5. Insert Scenes
    if (scenes.length > 0) {
      const sceneRows = scenes.map((s, idx) => ({
        script_id: scriptId,
        project_id: projectId,
        user_id: userId,
        position: idx + 1,
        phase: s.phase || (idx === 0 ? 'hook' : idx === scenes.length - 1 ? 'cta' : 'value'),
        duration_seconds: Math.min(6, Math.max(3, s.duration || 4)),
        location: s.location?.trim() || 'Hero Environment',
        subject: s.subject?.trim() || 'Lead Character',
        action: s.action?.trim() || 'Visible action',
        camera: s.camera || 'Cinematic 9:16 push-in',
        narration: s.narration || '',
        on_screen_text: (s.onScreenText || '').slice(0, 80),
        continuity_tags: {
          character: s.continuityTags?.character || 'lead_v1',
          outfit: s.continuityTags?.outfit || 'default_v1',
          environment: s.continuityTags?.environment || 'hero_v1',
        },
        ai_risk_flags: s.aiRiskFlags || [],
      }))

      const { error: scenesErr } = await supabase.from('scenes').insert(sceneRows)
      if (scenesErr) {
        throw new Error(`Failed to migrate scenes: ${scenesErr.message}`)
      }
      scenesCount = scenes.length
    }

    // 6. Insert Reminders
    if (reminders.length > 0) {
      const reminderRows = reminders.map((r) => ({
        user_id: userId,
        project_id: projectId,
        kind: 'unfinished_work',
        channel: 'in_app',
        message: `${r.title} — ${r.detail}`,
        due_at: new Date(Date.now() + 86400000).toISOString(),
        status: r.done ? 'dismissed' : 'pending',
      }))

      const { error: remErr } = await supabase.from('reminders').insert(reminderRows)
      if (!remErr) remindersCount = reminders.length
    }

    // 7. Insert Scheduled Posts
    if (schedule.length > 0) {
      scheduledCount = schedule.length
    }
  }

  const migratedAt = new Date().toISOString()
  localStorage.setItem('animstudio-migrated-at', migratedAt)

  return {
    success: true,
    projectsCount,
    scenesCount,
    remindersCount,
    scheduledCount,
    migratedAt,
  }
}
