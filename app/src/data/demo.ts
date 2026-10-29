import type { Project, Reminder, Scene, ScheduledPost } from '@/types/studio'

export const initialProject: Project = {
  title: 'The Last Lantern',
  idea: 'A night courier discovers a lantern that lights only when someone tells the truth.',
  genre: 'Storytelling',
  audience: 'Viewers aged 18–34 who enjoy atmospheric micro-stories',
  tone: 'Mysterious, warm, cinematic',
  targetLength: 24,
  styleId: 'anime-animation',
  status: 'Render',
  aspectRatio: '9:16',
}

export const initialScenes: Scene[] = [
  {
    id: 'S01', duration: 4, phase: 'hook',
    location: 'Rooftop railway platform at blue hour',
    subject: 'Mira',
    action: 'Mira lifts a red lantern toward the camera',
    camera: 'Slow push-in, medium close-up, eye level',
    narration: 'This lantern only glows for the truth.',
    onScreenText: 'ONLY THE TRUTH',
    continuityTags: { character: 'mira_v1', outfit: 'yellow_raincoat_v1', environment: 'platform_blue_hour_v1' },
    aiRiskFlags: [],
  },
  {
    id: 'S02', duration: 5, phase: 'value',
    location: 'Rooftop railway platform at blue hour',
    subject: 'Mira',
    action: 'Mira places the lantern on a wooden bench',
    camera: 'Static wide shot, platform lights behind her',
    narration: 'Mira has carried it through twelve cities, but never made it glow.',
    onScreenText: 'TWELVE CITIES',
    continuityTags: { character: 'mira_v1', outfit: 'yellow_raincoat_v1', environment: 'platform_blue_hour_v1' },
    aiRiskFlags: ['Lantern placement may create hand artifacts'],
  },
  {
    id: 'S03', duration: 5, phase: 'value',
    location: 'Rooftop railway platform at blue hour',
    subject: 'Mira',
    action: 'Mira turns toward the arriving empty train',
    camera: 'Side-on medium shot, train lights crossing frame',
    narration: 'Tonight, the empty train finally brings someone back.',
    onScreenText: 'THE EMPTY TRAIN',
    continuityTags: { character: 'mira_v1', outfit: 'yellow_raincoat_v1', environment: 'platform_blue_hour_v1' },
    aiRiskFlags: ['Train motion may flicker; use a static train with moving light reflections'],
  },
  {
    id: 'S04', duration: 5, phase: 'value',
    location: 'Rooftop railway platform at blue hour',
    subject: 'Mira',
    action: 'Mira opens her empty courier bag',
    camera: 'Medium close-up, lantern glow from below',
    narration: '“I never delivered your letter,” she admits. The lantern ignites.',
    onScreenText: 'I NEVER DELIVERED IT',
    continuityTags: { character: 'mira_v1', outfit: 'yellow_raincoat_v1', environment: 'platform_blue_hour_v1' },
    aiRiskFlags: ['Complex ignition; use a light change instead of transforming geometry'],
  },
  {
    id: 'S05', duration: 5, phase: 'cta',
    location: 'Rooftop railway platform at blue hour',
    subject: 'Mira',
    action: 'Mira walks toward the glowing train door',
    camera: 'Static rear wide shot, warm lantern against blue rain',
    narration: 'Follow for the next truth on the night line.',
    onScreenText: 'THE NIGHT LINE',
    continuityTags: { character: 'mira_v1', outfit: 'yellow_raincoat_v1', environment: 'platform_blue_hour_v1' },
    aiRiskFlags: [],
  },
]

export const pipelineStages = [
  { id: 'idea', label: 'Idea', detail: 'Creative brief locked' },
  { id: 'script', label: 'Script', detail: '5 scenes · 24 seconds' },
  { id: 'scene', label: 'Scene JSON', detail: 'Continuity validated' },
  { id: 'bible', label: 'Style bible', detail: 'Mira v1 · Anime v3' },
  { id: 'keyframes', label: 'Keyframes', detail: '5 frames planned' },
  { id: 'clips', label: 'Clips', detail: 'Generative route' },
  { id: 'audio', label: 'TTS + captions', detail: 'Word-level timing' },
  { id: 'assembly', label: 'FFmpeg', detail: '1080 × 1920' },
  { id: 'qa', label: 'QA', detail: 'Visual + loudness' },
  { id: 'summary', label: 'Summary', detail: 'Creator review' },
  { id: 'schedule', label: 'Schedule', detail: 'IST posting slot' },
]

export const initialSchedule: ScheduledPost[] = [
  { id: 'p1', projectTitle: 'The Last Lantern', day: 'FRI', date: '30 OCT', time: '19:30', platform: 'YouTube Shorts' },
  { id: 'p2', projectTitle: 'Monsoon in a Teacup', day: 'SUN', date: '01 NOV', time: '11:00', platform: 'Instagram Reels' },
  { id: 'p3', projectTitle: 'The Last Lantern', day: 'SUN', date: '01 NOV', time: '20:00', platform: 'YouTube Shorts' },
]

export const initialReminders: Reminder[] = [
  { id: 'r1', title: 'Review scene 04 lantern glow', detail: 'The Last Lantern · AI risk flagged', due: 'Today, 18:00', done: false },
  { id: 'r2', title: 'Approve vertical master', detail: 'QA review required before scheduling', due: 'Today, 19:00', done: false },
  { id: 'r3', title: 'Weekly analytics review', detail: 'Compare first-3-second retention', due: 'Monday, 09:30', done: false },
]

export const trendItems = [
  { id: 't1', kind: 'FORMAT', title: 'One-object mysteries', evidence: 'A single prop anchors a complete 20–30 second reveal.', score: 94, niche: 'Storytelling', hook: 'This [object] only works when…' },
  { id: 't2', kind: 'HOOK', title: 'Confession in the first line', evidence: 'Open with the consequence, then rewind to the cause.', score: 89, niche: 'Storytelling', hook: 'I kept one secret for twelve years.' },
  { id: 't3', kind: 'TOPIC', title: 'Rainy night micro-worlds', evidence: 'Atmospheric loops and tiny cinematic worlds fit the current niche.', score: 86, niche: 'Atmosphere', hook: 'The city sleeps. This street does not.' },
  { id: 't4', kind: 'FORMAT', title: 'Three-frame science reveals', evidence: 'Setup, visual proof, and one plain-English explanation.', score: 82, niche: 'Science', hook: 'Watch what this shadow reveals.' },
]

export const kanbanItems = [
  { id: 'k1', title: 'Why Shadows Chase Us', style: 'Vector Animation', status: 'Idea' as const },
  { id: 'k2', title: 'The Last Lantern', style: 'Anime Animation', status: 'Render' as const },
  { id: 'k3', title: 'Monsoon in a Teacup', style: 'Claymation', status: 'Review' as const },
  { id: 'k4', title: 'A Robot Learns to Wait', style: '2D Animation', status: 'Scheduled' as const },
  { id: 'k5', title: 'The Cloud Repair Shop', style: 'Traditional Animation', status: 'Posted' as const },
]
