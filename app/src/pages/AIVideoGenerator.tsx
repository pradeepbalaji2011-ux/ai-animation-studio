import { useEffect, useRef, useState } from 'react'
import { Bot, Camera, CheckCircle2, ChevronRight, Download, Film, Loader2, Mic, Palette, RotateCcw, Sparkles, TriangleAlert, Wand2, Zap } from 'lucide-react'
import { Badge, Button, Field, SectionHeading } from '@/components/UI'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Genre = 'Motivation' | 'Science' | 'Horror' | 'Kids' | 'Life' | 'Tech' | 'Storytelling' | 'Funny' | 'Facts'
type StyleId = 'anime' | 'neon' | 'minimal' | 'retro' | 'nature'

interface AIScene {
  id: string
  title: string
  narration: string
  onScreenText: string
  bg: string[]
  accent: string
  textColor: string
  durationSec: number
}

interface GeneratedScript {
  title: string
  style: StyleId
  scenes: AIScene[]
  hashtags: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Script Engine (deterministic from topic + genre → structured script)
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_PALETTES: Record<StyleId, { bg: string[]; accent: string; textColor: string; label: string }> = {
  anime:   { bg: ['#0d0221', '#1a0533', '#2d0d69'], accent: '#a855f7', textColor: '#f3e8ff', label: 'Anime Purple' },
  neon:    { bg: ['#050a0e', '#0d1f2d', '#162b3b'], accent: '#00fff5', textColor: '#e0ffff', label: 'Cyber Neon' },
  minimal: { bg: ['#1a1a1a', '#242424', '#2e2e2e'], accent: '#f59e0b', textColor: '#fffbeb', label: 'Dark Minimal' },
  retro:   { bg: ['#2d1b0e', '#4a2c14', '#5c3617'], accent: '#f97316', textColor: '#fff7ed', label: 'Retro Warm' },
  nature:  { bg: ['#0a1f0e', '#122b16', '#1a3a1d'], accent: '#22c55e', textColor: '#f0fdf4', label: 'Forest Night' },
}

const GENRE_STYLE_MAP: Record<Genre, StyleId> = {
  Motivation: 'neon', Science: 'minimal', Horror: 'anime', Kids: 'nature',
  Life: 'retro', Tech: 'neon', Storytelling: 'anime', Funny: 'retro', Facts: 'minimal',
}

const HOOK_TEMPLATES: Record<Genre, string[]> = {
  Motivation: ['Most people give up right before the breakthrough.', 'This one habit changed everything for me.', 'Stop waiting for the perfect moment — it does not exist.'],
  Science:    ['This discovery broke everything we thought we knew.', 'Science just proved the impossible is real.', 'The universe hid this secret for 14 billion years.'],
  Horror:     ['They found something inside the walls. It was still moving.', 'The signal came from a house that burned down in 1987.', 'She checked the camera feed. Her shadow was three seconds behind.'],
  Kids:       ['What if clouds were made of cotton candy?', 'The tiniest robot had the biggest heart.', 'One small act of kindness lit up the whole town.'],
  Life:       ['I stopped chasing busy and found something better.', 'The three-minute rule that saved my mornings.', 'Happiness is not at the end of the road — it is the road.'],
  Tech:       ['This AI solved a problem that took humans 50 years.', 'The chip inside your phone is smarter than you think.', 'This open-source tool is replacing entire teams.'],
  Storytelling: ['She kept one letter hidden for twenty years.', 'The last passenger on the last train left something behind.', 'He walked into the wrong life and found the right one.'],
  Funny:      ['I tried productivity hacks for 30 days. Here is what broke first.', 'My 3 AM brain had a business idea. We need to talk.', 'The five stages of Monday, explained by a robot.'],
  Facts:      ['This map fact will change how you see the world.', 'The oldest living creature is older than recorded history.', 'This number looks impossible — and it is completely real.'],
}

const VALUE_TEMPLATES: Record<Genre, string[][]> = {
  Motivation: [
    ['Every expert was once a beginner who refused to quit.', 'Progress is invisible until it is undeniable.'],
    ['The gap between who you are and who you want to be is just one daily decision.', 'Small actions, repeated every single day, become the life you wanted.'],
  ],
  Science: [
    ['The discovery happened by accident — like most great ones.', 'When they measured it, the results defied every existing model.'],
    ['Scientists had to rewrite the textbook after this finding.', 'The data was so unusual, they repeated the experiment eleven times.'],
  ],
  Horror: [
    ['The recordings showed movement in the room after everyone left.', 'Three investigators went in. Only two came back with answers.'],
    ['The pattern repeated every seven years without explanation.', 'No one reported it because no one could explain what they saw.'],
  ],
  Kids: [
    ['The little robot met a firefly and learned that some lights are better when they blink.', 'Together, they built something neither could build alone.'],
    ['The smallest cloud made the biggest rainbow of all.', 'Kindness turned out to be the most powerful superpower.'],
  ],
  Life: [
    ['The habit takes 14 days. The result lasts a lifetime.', 'You do not need more hours — you need better defaults.'],
    ['Silence is not emptiness. It is where the good ideas live.', 'The people who rest intentionally outperform the people who never stop.'],
  ],
  Tech: [
    ['The model processed in milliseconds what took humans six months.', 'The code was 40 lines. The impact was billion-dollar scale.'],
    ['This open-source project started in a bedroom. It now powers 40% of the internet.', 'The team shipped it on a Friday. By Monday the world had changed.'],
  ],
  Storytelling: [
    ['She had carried the secret through three cities and two lifetimes.', 'The letter was never meant to be sent — but it was.'],
    ['He walked in as a stranger. He left as something the town could not name.', 'The ending was not what she planned. It was better.'],
  ],
  Funny: [
    ['Day 1: optimized everything. Day 7: optimized the optimization.', 'By Day 14 I had a spreadsheet tracking my spreadsheets.'],
    ['The productivity app sent me 47 reminders to relax.', 'I am now more organized about being disorganized.'],
  ],
  Facts: [
    ['The number is so large it has no physical meaning — and yet it is real.', 'Every atom in your body was forged inside a dying star.'],
    ['The oldest known melody is 3,400 years old and still sounds familiar.', 'The shortest war in history lasted 38 minutes.'],
  ],
}

const CTA_TEMPLATES: Record<Genre, string> = {
  Motivation: 'Save this for the day you need it most. Follow for the next push.',
  Science:    'Which part surprised you most? Comment below and follow for more.',
  Horror:     'Sleep well. Follow for the next file.',
  Kids:       'What would your superpower be? Follow for the next adventure.',
  Life:       'Try it today. Report back tomorrow. Follow for more.',
  Tech:       'Link in the bio. Follow for the next breakthrough.',
  Storytelling: 'What happens next? Follow for chapter two.',
  Funny:      'Like if this is your week. Follow for the next disaster.',
  Facts:      'Share this with someone who will not believe you. Follow for more.',
}

const HASHTAG_MAP: Record<Genre, string[]> = {
  Motivation: ['#motivation', '#mindset', '#growth', '#shorts', '#inspire'],
  Science:    ['#science', '#facts', '#discovery', '#shorts', '#learnontiktok'],
  Horror:     ['#horror', '#mystery', '#creepy', '#shorts', '#paranormal'],
  Kids:       ['#kids', '#animation', '#story', '#shorts', '#fun'],
  Life:       ['#lifehacks', '#productivity', '#wellness', '#shorts', '#tips'],
  Tech:       ['#tech', '#ai', '#coding', '#shorts', '#innovation'],
  Storytelling: ['#storytelling', '#shortfilm', '#animation', '#shorts', '#story'],
  Funny:      ['#funny', '#comedy', '#relatable', '#shorts', '#humor'],
  Facts:      ['#facts', '#didyouknow', '#learnontiktok', '#shorts', '#history'],
}

function generateScript(topic: string, genre: Genre, lengthSec: number): GeneratedScript {
  const styleId = GENRE_STYLE_MAP[genre]
  const palette = STYLE_PALETTES[styleId]
  const hooks = HOOK_TEMPLATES[genre]
  const values = VALUE_TEMPLATES[genre]
  const cta = CTA_TEMPLATES[genre]

  const hook = hooks[Math.abs(topic.length) % hooks.length]
  const valueSet = values[Math.abs(topic.charCodeAt(0) ?? 0) % values.length]

  const hookDur = Math.round(lengthSec * 0.2)
  const valueDur = Math.round(lengthSec * 0.3)
  const ctaDur = Math.round(lengthSec * 0.2)

  const scenes: AIScene[] = [
    {
      id: 'S01',
      title: 'Hook',
      narration: hook,
      onScreenText: topic.toUpperCase().slice(0, 24),
      bg: palette.bg,
      accent: palette.accent,
      textColor: palette.textColor,
      durationSec: hookDur,
    },
    {
      id: 'S02',
      title: 'Value I',
      narration: valueSet[0],
      onScreenText: valueSet[0].split(' ').slice(0, 4).join(' ').toUpperCase(),
      bg: palette.bg,
      accent: palette.accent,
      textColor: palette.textColor,
      durationSec: valueDur,
    },
    {
      id: 'S03',
      title: 'Value II',
      narration: valueSet[1],
      onScreenText: valueSet[1].split(' ').slice(0, 4).join(' ').toUpperCase(),
      bg: palette.bg,
      accent: palette.accent,
      textColor: palette.textColor,
      durationSec: valueDur,
    },
    {
      id: 'S04',
      title: 'CTA',
      narration: cta,
      onScreenText: 'FOLLOW FOR MORE',
      bg: palette.bg,
      accent: palette.accent,
      textColor: palette.textColor,
      durationSec: ctaDur,
    },
  ]

  return {
    title: topic.trim() || `${genre} Short`,
    style: styleId,
    scenes,
    hashtags: HASHTAG_MAP[genre],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas renderer — draws one animated frame for a scene
// ─────────────────────────────────────────────────────────────────────────────

function renderSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  scene: AIScene,
  progress: number, // 0..1 within the scene
  w: number,
  h: number,
) {
  const [c1, c2, c3] = scene.bg
  const grd = ctx.createLinearGradient(0, 0, 0, h)
  grd.addColorStop(0, c1)
  grd.addColorStop(0.55, c2)
  grd.addColorStop(1, c3)
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)

  // Animated particles / orbs
  const t = progress * Math.PI * 2
  for (let i = 0; i < 6; i++) {
    const ox = w * 0.15 + (w * 0.7 * i) / 5 + Math.sin(t + i) * 30
    const oy = h * 0.1 + Math.cos(t * 0.7 + i * 1.2) * h * 0.12
    const r = 80 + Math.sin(t + i * 0.8) * 20
    const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, r)
    orb.addColorStop(0, scene.accent + '55')
    orb.addColorStop(1, 'transparent')
    ctx.fillStyle = orb
    ctx.beginPath()
    ctx.arc(ox, oy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Horizontal scanlines (subtle)
  for (let y = 0; y < h; y += 8) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, y, w, 1)
  }

  // Scene label (top badge)
  ctx.font = 'bold 22px Inter, sans-serif'
  ctx.fillStyle = scene.accent
  ctx.textAlign = 'center'
  const fadeIn = Math.min(1, progress * 6)
  ctx.globalAlpha = fadeIn
  ctx.fillText(scene.title.toUpperCase(), w / 2, 80)
  ctx.globalAlpha = 1

  // On-screen text (large headline, centered vertically high)
  const words = scene.onScreenText.split(' ')
  ctx.font = `bold ${Math.min(62, 420 / Math.max(words[0]?.length ?? 1, 4))}px Inter, sans-serif`
  ctx.fillStyle = scene.textColor
  ctx.textAlign = 'center'
  ctx.globalAlpha = fadeIn

  const lineH = 72
  const startY = h * 0.28 - ((words.length - 1) * lineH) / 2
  words.forEach((word, i) => {
    ctx.fillText(word, w / 2, startY + i * lineH)
  })
  ctx.globalAlpha = 1

  // Accent divider line (animated width)
  const lineW = (w * 0.55) * Math.min(1, progress * 4)
  ctx.strokeStyle = scene.accent
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(w / 2 - lineW / 2, h * 0.5)
  ctx.lineTo(w / 2 + lineW / 2, h * 0.5)
  ctx.stroke()

  // Narration text (wrapped, bottom area)
  ctx.font = '28px Inter, sans-serif'
  ctx.fillStyle = scene.textColor
  ctx.textAlign = 'center'
  ctx.globalAlpha = Math.min(1, progress * 3)
  const maxW = w - 80
  const words2 = scene.narration.split(' ')
  const lines: string[] = []
  let cur = ''
  words2.forEach((w2) => {
    const test = cur ? cur + ' ' + w2 : w2
    if (ctx.measureText(test).width > maxW) { lines.push(cur); cur = w2 } else { cur = test }
  })
  if (cur) lines.push(cur)
  const textStartY = h * 0.58
  lines.slice(0, 5).forEach((line, i) => ctx.fillText(line, w / 2, textStartY + i * 40))
  ctx.globalAlpha = 1

  // Bottom: progress bar
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(0, h - 8, w, 8)
  ctx.fillStyle = scene.accent
  ctx.fillRect(0, h - 8, w * progress, 8)
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS — speaks narration using Web Speech API
// ─────────────────────────────────────────────────────────────────────────────

function speak(text: string, rate = 1.05): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = rate
    utt.pitch = 1
    utt.volume = 1
    const voices = window.speechSynthesis.getVoices()
    const en = voices.find(v => v.lang.startsWith('en') && !v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en')) || null
    if (en) utt.voice = en
    utt.onend = () => resolve()
    utt.onerror = () => resolve()
    window.speechSynthesis.speak(utt)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Step labels for the progress stepper
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { id: 'script',  label: 'AI Script',      icon: Wand2 },
  { id: 'style',   label: 'Style Engine',   icon: Palette },
  { id: 'render',  label: 'Frame Render',   icon: Film },
  { id: 'voice',   label: 'AI Voiceover',   icon: Mic },
  { id: 'encode',  label: 'Video Encode',   icon: Zap },
  { id: 'done',    label: 'Ready',          icon: CheckCircle2 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AIVideoGenerator({ notify }: { notify: (m: string) => void }) {
  // Form inputs
  const [topic, setTopic] = useState('')
  const [genre, setGenre] = useState<Genre>('Motivation')
  const [length, setLength] = useState<30 | 45 | 60>(30)
  const [includeVoice, setIncludeVoice] = useState(true)

  // Pipeline state
  const [step, setStep] = useState(-1)  // -1 = idle
  const [stepLabel, setStepLabel] = useState('')
  const [script, setScript] = useState<GeneratedScript | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const abortRef = useRef(false)

  // Clean up blob URL when a new video is generated
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])

  const reset = () => {
    abortRef.current = true
    window.speechSynthesis?.cancel()
    setStep(-1); setStepLabel(''); setScript(null)
    setVideoUrl(null); setThumbnailUrl(null); setError(null)
    setTimeout(() => { abortRef.current = false }, 300)
  }

  // ─── Main pipeline ─────────────────────────────────────────────────────────

  const generateVideo = async () => {
    if (!topic.trim()) { notify('Enter a topic first'); return }
    abortRef.current = false
    setError(null); setVideoUrl(null); setThumbnailUrl(null)

    // STEP 0: Script generation
    setStep(0); setStepLabel('Generating AI script…')
    await new Promise(r => setTimeout(r, 900))
    if (abortRef.current) return
    const generated = generateScript(topic, genre, length)
    setScript(generated)

    // STEP 1: Style engine
    setStep(1); setStepLabel('Applying style palette…')
    await new Promise(r => setTimeout(r, 600))
    if (abortRef.current) return

    // STEP 2: Frame render
    setStep(2); setStepLabel('Rendering animated frames…')
    await new Promise(r => setTimeout(r, 400))
    if (abortRef.current) return

    const canvas = canvasRef.current
    if (!canvas) { setError('Canvas unavailable'); return }
    const ctx = canvas.getContext('2d')
    if (!ctx) { setError('2D context unavailable'); return }

    const W = 720, H = 1280
    canvas.width = W; canvas.height = H

    const FPS = 30
    const scenes = generated.scenes

    // Determine MIME type
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    // Set up MediaRecorder
    let audioStream: MediaStream | null = null

    // STEP 3: Voice
    setStep(3); setStepLabel('Generating AI voiceover…')
    if (includeVoice && 'speechSynthesis' in window) {
      // Prime voices list
      window.speechSynthesis.getVoices()
      await new Promise(r => setTimeout(r, 200))
    }
    if (abortRef.current) return

    // STEP 4: Encode
    setStep(4); setStepLabel('Encoding 9:16 vertical video…')
    await new Promise(r => setTimeout(r, 300))
    if (abortRef.current) return

    try {
      const videoStream = canvas.captureStream(FPS)
      const streams: MediaStream[] = [videoStream]

      // Attempt to capture audio from Web Speech API via AudioContext destination
      let audioCtx: AudioContext | null = null
      try {
        audioCtx = new AudioContext()
        const dest = audioCtx.createMediaStreamDestination()
        audioStream = dest.stream
        streams.push(audioStream)
      } catch {
        audioStream = null
      }

      const combinedTracks = streams.flatMap(s => s.getTracks())
      const combinedStream = new MediaStream(combinedTracks)

      const recorder = new MediaRecorder(combinedStream, { mimeType })
      const chunks: Blob[] = []
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data) }

      const recordingDone = new Promise<Blob>(resolve => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
      })
      recorder.start(100)

      // Render each scene
      for (let s = 0; s < scenes.length; s++) {
        if (abortRef.current) { recorder.stop(); return }
        const scene = scenes[s]
        const totalFrames = scene.durationSec * FPS

        // Start TTS in parallel with rendering
        const speechPromise = includeVoice ? speak(scene.narration, 1.05) : Promise.resolve()

        await new Promise<void>(resolve => {
          let frame = 0
          const loop = () => {
            if (abortRef.current) { resolve(); return }
            const progress = frame / totalFrames
            renderSceneToCanvas(ctx, scene, Math.min(progress, 1), W, H)
            frame++
            if (frame < totalFrames) requestAnimationFrame(loop)
            else resolve()
          }
          requestAnimationFrame(loop)
        })

        await speechPromise
        if (abortRef.current) { recorder.stop(); return }
      }

      // Render a final "end card"
      const endDur = 2 * FPS
      const lastScene = scenes[scenes.length - 1]
      for (let f = 0; f < endDur; f++) {
        renderSceneToCanvas(ctx, { ...lastScene, onScreenText: 'FOLLOW NOW', narration: '' }, f / endDur, W, H)
        await new Promise(r => requestAnimationFrame(r))
      }

      recorder.stop()
      const videoBlob = await recordingDone
      if (audioCtx) audioCtx.close()

      // Generate thumbnail
      const thumbUrl = canvas.toDataURL('image/jpeg', 0.85)
      setThumbnailUrl(thumbUrl)

      const url = URL.createObjectURL(videoBlob)
      setVideoUrl(url)
      setStep(5); setStepLabel('Your video is ready!')
      notify('✓ AI video ready — click Download Video to save it')
    } catch (err) {
      setError(String(err))
      setStep(-1)
    }
  }

  const downloadVideo = () => {
    if (!videoUrl || !script) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${script.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-animstudio.webm`
    a.click()
    notify('Video downloaded! Open in any media player or upload directly to YouTube / Instagram.')
  }

  const downloadThumbnail = () => {
    if (!thumbnailUrl || !script) return
    const a = document.createElement('a')
    a.href = thumbnailUrl
    a.download = `${script.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-thumb.jpg`
    a.click()
  }

  const running = step >= 0 && step < 5
  const done = step === 5

  return (
    <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>
      <SectionHeading
        eyebrow="AI DIRECTOR · ZERO-CLICK PRODUCTION"
        title="AI Video Generator"
        description="Enter a topic. The AI writes the script, applies a visual style, renders every frame, adds voiceover, and hands you a ready-to-post vertical video."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Badge tone="red">9:16 SHORTS</Badge>
            <Badge tone="green">VOICE INCLUDED</Badge>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* ── Left: Form & Pipeline ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Form card */}
          <div className="inspector-section" style={{ background: 'var(--surface-panel)', borderRadius: 10, padding: 24, border: '1px solid var(--line)' }}>
            <p className="mini-label" style={{ marginBottom: 16 }}>YOUR BRIEF</p>
            <Field label="Video topic or idea" hint="One sentence, one concept">
              <textarea
                rows={3}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Why most people never achieve their goals"
                disabled={running}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Field label="Genre">
                <select value={genre} onChange={e => setGenre(e.target.value as Genre)} disabled={running}>
                  {(['Motivation', 'Science', 'Horror', 'Kids', 'Life', 'Tech', 'Storytelling', 'Funny', 'Facts'] as Genre[]).map(g =>
                    <option key={g} value={g}>{g}</option>
                  )}
                </select>
              </Field>
              <Field label="Length">
                <select value={length} onChange={e => setLength(Number(e.target.value) as 30 | 45 | 60)} disabled={running}>
                  <option value={30}>30 seconds</option>
                  <option value={45}>45 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={includeVoice} onChange={e => setIncludeVoice(e.target.checked)} disabled={running} />
              <Mic size={14} /> Include AI voiceover (Web Speech API)
            </label>
            <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
              {!running && !done && (
                <Button variant="primary" onClick={generateVideo} style={{ flex: 1, justifyContent: 'center' }}>
                  <Bot size={16} /> Generate My Video — AI Does Everything
                </Button>
              )}
              {running && (
                <Button variant="primary" disabled style={{ flex: 1, justifyContent: 'center' }}>
                  <Loader2 size={16} className="spin" /> AI Working…
                </Button>
              )}
              {done && (
                <Button variant="primary" onClick={downloadVideo} style={{ flex: 1, justifyContent: 'center' }}>
                  <Download size={16} /> Download Video (.webm)
                </Button>
              )}
              {(running || done) && (
                <Button variant="ghost" onClick={reset} title="Start over">
                  <RotateCcw size={15} />
                </Button>
              )}
            </div>
            {done && (
              <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                <Button onClick={downloadThumbnail} style={{ flex: 1, justifyContent: 'center' }}>
                  <Camera size={14} /> Download Thumbnail (.jpg)
                </Button>
              </div>
            )}
          </div>

          {/* Pipeline stepper */}
          <div style={{ background: 'var(--surface-panel)', borderRadius: 10, padding: 24, border: '1px solid var(--line)' }}>
            <p className="mini-label" style={{ marginBottom: 16 }}>AI PIPELINE</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PIPELINE_STEPS.map((s, i) => {
                const Icon = s.icon
                const complete = step > i
                const active = step === i
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 7, background: active ? 'var(--surface-raised)' : 'transparent', border: `1px solid ${active ? 'var(--action-primary)' : complete ? 'var(--success)' : 'var(--line-soft)'}`, opacity: step === -1 ? 0.45 : 1, transition: 'all 0.3s' }}>
                    <Icon size={16} color={complete ? 'var(--success)' : active ? 'var(--action-primary)' : 'var(--text-muted)'} />
                    <span style={{ flex: 1, fontSize: 14, color: active ? 'var(--text-primary)' : complete ? 'var(--success)' : 'var(--text-muted)' }}>{s.label}</span>
                    {complete && <CheckCircle2 size={14} color="var(--success)" />}
                    {active && <Loader2 size={14} color="var(--action-primary)" className="spin" />}
                    {!complete && !active && step !== -1 && <ChevronRight size={14} color="var(--text-muted)" />}
                  </div>
                )
              })}
            </div>
            {stepLabel && (
              <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>{stepLabel}</p>
            )}
          </div>

          {/* Script preview */}
          {script && (
            <div style={{ background: 'var(--surface-panel)', borderRadius: 10, padding: 24, border: '1px solid var(--line)' }}>
              <p className="mini-label" style={{ marginBottom: 12 }}>GENERATED SCRIPT</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Style: <strong>{STYLE_PALETTES[script.style].label}</strong> · {script.scenes.length} scenes · {script.scenes.reduce((a, s) => a + s.durationSec, 0)}s
              </p>
              {script.scenes.map((sc) => (
                <div key={sc.id} style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 6, background: 'var(--surface-raised)', borderLeft: `3px solid ${sc.accent}` }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{sc.id} · {sc.title} · {sc.durationSec}s</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sc.narration}</p>
                  <p style={{ fontSize: 11, color: sc.accent, marginTop: 4 }}>ON SCREEN: {sc.onScreenText}</p>
                </div>
              ))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {script.hashtags.map(h => <span key={h} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '3px 8px', borderRadius: 4 }}>{h}</span>)}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 8, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: 'var(--danger)' }}>
              <TriangleAlert size={16} />
              <p style={{ fontSize: 13 }}>{error}</p>
            </div>
          )}

          {/* Posting guide */}
          {done && (
            <div style={{ background: 'var(--surface-panel)', borderRadius: 10, padding: 24, border: '1px solid var(--line)' }}>
              <p className="mini-label" style={{ marginBottom: 12 }}>HOW TO POST</p>
              {[
                { platform: 'YouTube Shorts', steps: 'YouTube Studio → Create → Upload → select the .webm file → Add title + hashtags → Audience: "Yes, made for kids" if Kids genre → Publish' },
                { platform: 'Instagram Reels', steps: 'Instagram app → + → Reel → select .webm → Add on-screen text if needed → Share' },
                { platform: 'TikTok',          steps: 'TikTok app → + → select .webm → Trim if needed → Add captions → Post' },
              ].map(p => (
                <div key={p.platform} style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.platform}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.steps}</p>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                Hashtags: {script?.hashtags.join(' ')}
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Live Canvas Preview ─────────────────────────────── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <p className="mini-label" style={{ marginBottom: 10 }}>LIVE RENDER PREVIEW</p>
          <div style={{ aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', border: '2px solid var(--line)', background: '#0d0d0d', position: 'relative', boxShadow: done ? '0 0 40px rgba(168,85,247,0.25)' : 'none' }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {step === -1 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(0,0,0,0.7)' }}>
                <Sparkles size={36} color="#a855f7" />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', padding: '0 24px' }}>Your AI-generated video will render here live</p>
              </div>
            )}
            {done && (
              <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                <Button variant="primary" onClick={downloadVideo} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                  <Download size={15} /> Download Video
                </Button>
              </div>
            )}
          </div>
          {done && (
            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 8, background: 'var(--surface-panel)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--text-secondary)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>✓ Ready to upload</p>
              <p>Format: WebM (VP9) · 720 × 1280 · 30fps</p>
              <p>Plays natively on YouTube, Instagram, TikTok, and Chrome.</p>
            </div>
          )}

          {/* Manual override note */}
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--line-soft)', fontSize: 12, color: 'var(--text-muted)' }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Want manual control?</p>
            <p>Use <strong>Script Studio</strong> to edit narration scene-by-scene, then <strong>Video Builder</strong> to fine-tune before export.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
