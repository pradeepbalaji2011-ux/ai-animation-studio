export type View =
  | 'dashboard'
  | 'styles'
  | 'script'
  | 'studio'
  | 'builder'
  | 'aigenerate'
  | 'character'
  | 'trends'
  | 'scheduler'
  | 'analyzer'
  | 'coach'
  | 'work'

export type StyleRoute = 'generative' | 'programmatic'

export interface StylePreset {
  id: string
  name: string
  bestFor: string
  mainStrength: string
  route: StyleRoute
  promptPrefix: string
  negativePrompt: string
  palette: string[]
  cameraRules: string[]
  fps: number
  motionRules: string[]
  backgrounds: string[]
  characterTypes: string[]
}

export interface ContinuityTags {
  character: string
  outfit: string
  environment: string
}

export interface Scene {
  id: string
  duration: number
  phase: 'hook' | 'value' | 'cta'
  location: string
  subject: string
  action: string
  camera: string
  narration: string
  onScreenText: string
  continuityTags: ContinuityTags
  aiRiskFlags: string[]
}

export interface Project {
  title: string
  idea: string
  genre: string
  audience: string
  tone: string
  targetLength: number
  styleId: string
  status: 'Idea' | 'Script' | 'Render' | 'Review' | 'Scheduled' | 'Posted'
  aspectRatio: '9:16' | '16:9'
}

export interface ScheduledPost {
  id: string
  projectTitle: string
  day: string
  date: string
  time: string
  platform: 'YouTube Shorts' | 'Instagram Reels'
}

export interface Reminder {
  id: string
  title: string
  detail: string
  due: string
  done: boolean
}
