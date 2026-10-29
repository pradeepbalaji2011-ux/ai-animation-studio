import { useEffect, useState } from 'react'
import { Camera, Check, Download, Expand, FileCheck2, Film, Pause, Play, RefreshCw, Scan, ShieldCheck, TriangleAlert, Volume2 } from 'lucide-react'
import { Badge, Button, PanelHeader, SectionHeading } from '@/components/UI'
import { VideoFrame } from '@/components/StudioVisuals'
import { pipelineStages } from '@/data/demo'
import type { Project, Scene, StylePreset } from '@/types/studio'

export default function VideoBuilder({ project, style, scenes, renderProgress, rendering, onStartRender, onProjectChange, onDownload, notify }: {
  project: Project
  style: StylePreset
  scenes: Scene[]
  renderProgress: number
  rendering: boolean
  onStartRender: () => void
  onProjectChange: (project: Project) => void
  onDownload: () => void
  notify: (message: string) => void
}) {
  const [selectedId, setSelectedId] = useState(scenes[0]?.id || '')
  const [safeZones, setSafeZones] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [exporting, setExporting] = useState(false)
  const selected = scenes.find((scene) => scene.id === selectedId) || scenes[0]
  const duration = scenes.reduce((total, scene) => total + scene.duration, 0)
  const stageIndex = Math.min(Math.floor((renderProgress / 100) * pipelineStages.length), pipelineStages.length - 1)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setTime((current) => {
      if (current >= duration) { setPlaying(false); return 0 }
      return current + 0.1
    }), 100)
    return () => window.clearInterval(timer)
  }, [playing, duration])

  const downloadFrameImage = () => {
    const svgEl = document.querySelector('.video-frame svg')
    if (!svgEl) { notify('No preview found to capture'); return }
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1080, 1920)
        const a = document.createElement('a')
        a.href = canvas.toDataURL('image/png')
        a.download = `${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${selected?.id || 'frame'}.png`
        a.click()
        notify('Keyframe exported (1080 × 1920 PNG)')
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const downloadVideoClip = async () => {
    if (exporting) return
    setExporting(true)
    notify('Compiling 9:16 scene video clip…')
    try {
      const svgEl = document.querySelector('.video-frame svg')
      if (!svgEl) throw new Error('Preview element not found')

      const width = 720
      const height = 1280
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D context unavailable')

      const svgData = new XMLSerializer().serializeToString(svgEl)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const blobURL = URL.createObjectURL(svgBlob)

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('SVG render failed'))
        img.src = blobURL
      })

      const stream = canvas.captureStream(30)
      const mimeType = (window as unknown as { MediaRecorder?: typeof MediaRecorder }).MediaRecorder && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data)
      }

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: mimeType })
        const downloadUrl = URL.createObjectURL(videoBlob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${selected?.id || 'scene'}.webm`
        a.click()
        URL.revokeObjectURL(blobURL)
        setExporting(false)
        notify('Video clip (.webm) downloaded successfully!')
      }

      recorder.start()
      let frameCount = 0
      const totalFrames = 90 // 3 seconds at 30 fps
      const renderLoop = () => {
        ctx.fillStyle = '#0f141a'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        frameCount++
        if (frameCount < totalFrames) {
          requestAnimationFrame(renderLoop)
        } else {
          recorder.stop()
        }
      }
      renderLoop()
    } catch {
      downloadFrameImage()
      setExporting(false)
    }
  }

  return (
    <div className="page builder-page">
      <SectionHeading eyebrow="RENDER ORCHESTRATION" title="Video Builder" description="A visible chain of custody from scene JSON to the vertical master. Preview controls are local; no provider job is hidden." action={<div className="builder-heading-actions"><Badge tone="green">9:16 PRIMARY</Badge><Button variant="primary" disabled={rendering} onClick={onStartRender}><RefreshCw size={15} className={rendering ? 'spin' : ''} />{rendering ? 'Simulating pipeline…' : 'Simulate local pipeline'}</Button></div>} />
      <div className="builder-workspace">
        <section className="preview-stage-panel">
          <div className="preview-toolbar">
            <div><span className="status-dot" />{project.title}<small>DRAFT MASTER</small></div>
            <div className="preview-tools">
              <label className="safe-toggle"><input type="checkbox" checked={safeZones} onChange={() => setSafeZones(!safeZones)} /><Scan size={14} />Safe zones</label>
              <select aria-label="Output aspect ratio" value={project.aspectRatio} onChange={(e) => onProjectChange({ ...project, aspectRatio: e.target.value as Project['aspectRatio'] })}><option value="9:16">9:16 · 1080 × 1920</option><option value="16:9">16:9 · 1920 × 1080</option></select>
              <Button size="sm" variant="ghost" onClick={downloadFrameImage} title="Download high-resolution keyframe PNG"><Camera size={14} />Frame</Button>
              <Button size="sm" variant="secondary" onClick={downloadVideoClip} disabled={exporting} title="Export video clip (.webm)"><Film size={14} />{exporting ? 'Exporting…' : 'Download video'}</Button>
            </div>
          </div>
          <div className={`preview-stage ${project.aspectRatio === '16:9' ? 'is-landscape' : ''}`}>
            <div className="stage-ruler stage-ruler-top"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
            {selected && <VideoFrame preset={style} scene={selected} safeZones={safeZones} playing={playing} />}
            <button className="stage-play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause preview' : 'Play preview'}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}</button>
            <span className="stage-resolution">{project.aspectRatio === '9:16' ? '1080 × 1920' : '1920 × 1080'} · {style.fps} FPS</span>
          </div>
          <div className="playback-bar">
            <Button size="icon" variant="ghost" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={17} /> : <Play size={17} />}</Button>
            <span className="timecode">00:{Math.floor(time).toString().padStart(2, '0')}:00</span>
            <input aria-label="Preview playhead" type="range" min="0" max={duration} step="0.1" value={time} onChange={(e) => setTime(Number(e.target.value))} />
            <span className="timecode">00:{duration}:00</span>
            <Volume2 size={15} />
          </div>
          <div className="filmstrip">
            {scenes.map((scene, index) => <button key={scene.id} className={selected?.id === scene.id ? 'active' : ''} onClick={() => { setSelectedId(scene.id); setTime(scenes.slice(0, index).reduce((sum, item) => sum + item.duration, 0)) }}><span className={`filmstrip-thumb filmstrip-thumb-${index}`}><i /></span><span><strong>{scene.id}</strong><small>{scene.duration}s</small></span></button>)}
          </div>
        </section>

        <aside className="render-inspector">
          <PanelHeader title="Render plan" meta={style.route.toUpperCase()} />
          <div className="render-progress-block"><div><strong>{Math.round(renderProgress)}%</strong><span>{rendering ? pipelineStages[stageIndex].label : renderProgress === 100 ? 'Local simulation complete' : 'Ready to simulate'}</span></div><div className="progress-track"><span style={{ width: `${renderProgress}%` }} /></div></div>
          <div className="render-stage-list">
            {pipelineStages.map((stage, index) => {
              const complete = renderProgress >= ((index + 1) / pipelineStages.length) * 100
              const active = rendering && index === stageIndex
              return <div key={stage.id} className={`${complete ? 'complete' : ''} ${active ? 'active' : ''}`}><span>{complete ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span><p><strong>{stage.label}</strong><small>{active ? 'Processing local simulation' : stage.detail}</small></p></div>
            })}
          </div>
          <div className="provider-note"><ShieldCheck size={15} /><p><strong>Spend gate active</strong><br />Paid providers remain disconnected. This run only demonstrates state changes.</p></div>
        </aside>
      </div>

      <section className="qa-section">
        <PanelHeader title="Quality gate" meta={renderProgress === 100 ? 'SAMPLE QA READY' : 'WAITING FOR MASTER'} action={<Button size="sm" onClick={onDownload}><Download size={14} />Summary</Button>} />
        <div className="qa-grid">
          <div><span className="qa-icon pass"><Check size={17} /></span><p><strong>Character continuity</strong><small>Mira v1 · 5 / 5 scene tags present</small></p><Badge tone="green">PASS PLAN</Badge></div>
          <div><span className="qa-icon pass"><FileCheck2 size={17} /></span><p><strong>Caption artifacts</strong><small>Programmatic overlay · central safe area</small></p><Badge tone="green">PASS PLAN</Badge></div>
          <div><span className="qa-icon warn"><TriangleAlert size={17} /></span><p><strong>Motion & lighting</strong><small>Scene 04 ignition needs creator review</small></p><Badge tone="amber">REVIEW</Badge></div>
          <div><span className="qa-icon pass"><Volume2 size={17} /></span><p><strong>Loudness target</strong><small>−14 LUFS · −1.5 dBTP · two-pass</small></p><Badge>PLANNED</Badge></div>
        </div>
        <div className="qa-actions"><p><Expand size={14} />Shorts and Reels safe-zone overlays enabled</p><Button variant="primary" disabled={renderProgress < 100} onClick={() => { onProjectChange({ ...project, status: 'Review' }); notify('Draft master moved to creator review') }}><FileCheck2 size={15} />Approve for creator review</Button></div>
      </section>
    </div>
  )
}
