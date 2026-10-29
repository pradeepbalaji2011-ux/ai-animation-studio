import { ArrowRight, Check, Clock3, Film, Lightbulb, Play, Sparkles, TriangleAlert } from 'lucide-react'
import { Badge, Button, PanelHeader } from '@/components/UI'
import { VideoFrame } from '@/components/StudioVisuals'
import { pipelineStages } from '@/data/demo'
import type { Project, Reminder, Scene, ScheduledPost, StylePreset, View } from '@/types/studio'

export default function Dashboard({ project, style, scene, schedule, reminders, onNavigate, onToggleReminder }: {
  project: Project
  style: StylePreset
  scene: Scene
  schedule: ScheduledPost[]
  reminders: Reminder[]
  onNavigate: (view: View) => void
  onToggleReminder: (id: string) => void
}) {
  const openReminders = reminders.filter((item) => !item.done)
  return (
    <div className="page dashboard-page">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">FRIDAY · 30 OCTOBER · IST</p>
          <h1>Good evening, Pradeep.<br /><span>Your night line is moving.</span></h1>
        </div>
        <div className="intro-note">
          <span className="status-dot" />
          <p><strong>1 render needs review</strong><br />Scene 04 has a flagged lantern transition.</p>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('builder')}>Review <ArrowRight size={14} /></Button>
        </div>
      </section>

      <section className="dashboard-feature">
        <div className="feature-copy">
          <div className="feature-topline"><Badge tone="red">IN PRODUCTION</Badge><span>PROJECT 024</span></div>
          <h2>{project.title}</h2>
          <p className="feature-idea">{project.idea}</p>
          <div className="project-facts">
            <div><span>STYLE</span><strong>{style.name}</strong></div>
            <div><span>FORMAT</span><strong>{project.aspectRatio} · 1080 × 1920</strong></div>
            <div><span>SCRIPT</span><strong>5 scenes · 24 sec</strong></div>
            <div><span>NEXT</span><strong>Creator QA review</strong></div>
          </div>
          <div className="feature-actions">
            <Button variant="primary" onClick={() => onNavigate('builder')}><Play size={16} fill="currentColor" />Continue production</Button>
            <Button onClick={() => onNavigate('script')}>Open script <ArrowRight size={15} /></Button>
          </div>
        </div>
        <button className="feature-preview" onClick={() => onNavigate('builder')} aria-label="Open The Last Lantern in Video Builder">
          <VideoFrame preset={style} scene={scene} compact />
          <span className="preview-play"><Play size={18} fill="currentColor" /></span>
          <span className="preview-timecode">00:00:04:12</span>
        </button>
        <div className="feature-pipeline">
          <PanelHeader title="Production line" meta="7 / 11 stages" />
          <div className="pipeline-list">
            {pipelineStages.slice(0, 8).map((stage, index) => (
              <div className={`pipeline-row ${index === 7 ? 'is-current' : ''}`} key={stage.id}>
                <span className="pipeline-check">{index < 7 ? <Check size={12} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</span>
                <span>{stage.label}</span><small>{index < 7 ? 'Complete' : 'In review'}</small>
              </div>
            ))}
          </div>
          <button className="text-link" onClick={() => onNavigate('builder')}>View full pipeline <ArrowRight size={13} /></button>
        </div>
      </section>

      <section className="dashboard-lower">
        <div className="today-panel">
          <PanelHeader title="Today’s direction" meta="3 priorities" />
          <button className="direction-item" onClick={() => onNavigate('builder')}>
            <span className="direction-icon"><TriangleAlert size={17} /></span>
            <span><strong>Review the lantern ignition</strong><small>Use a lighting change, not transforming geometry.</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="direction-item" onClick={() => onNavigate('trends')}>
            <span className="direction-icon"><Lightbulb size={17} /></span>
            <span><strong>Develop “one-object mysteries”</strong><small>Strong sample format fit for your story niche.</small></span>
            <ArrowRight size={16} />
          </button>
          <button className="direction-item" onClick={() => onNavigate('scheduler')}>
            <span className="direction-icon"><Clock3 size={17} /></span>
            <span><strong>Protect Friday’s 19:30 slot</strong><small>Default IST evening recommendation.</small></span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="schedule-panel">
          <PanelHeader title="Upcoming" meta={`${schedule.length} slots`} action={<Button size="sm" variant="ghost" onClick={() => onNavigate('scheduler')}>Calendar</Button>} />
          {schedule.slice(0, 3).map((post) => (
            <div className="schedule-row" key={post.id}>
              <div className="date-block"><strong>{post.date.split(' ')[0]}</strong><span>{post.date.split(' ')[1]}</span></div>
              <div><strong>{post.projectTitle}</strong><span>{post.platform}</span></div>
              <time>{post.time}<small>IST</small></time>
            </div>
          ))}
        </div>

        <div className="reminder-panel">
          <PanelHeader title="Reminders" meta={`${openReminders.length} open`} />
          {reminders.slice(0, 3).map((reminder) => (
            <label className={`reminder-row ${reminder.done ? 'is-done' : ''}`} key={reminder.id}>
              <input type="checkbox" checked={reminder.done} onChange={() => onToggleReminder(reminder.id)} />
              <span><strong>{reminder.title}</strong><small>{reminder.due}</small></span>
            </label>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onNavigate('work')}>Open work summary <ArrowRight size={13} /></Button>
        </div>
      </section>

      <section className="quick-start-strip">
        <div><Sparkles size={18} /><span><strong>Start somewhere new</strong><small>Move from a blank idea to a directed scene plan.</small></span></div>
        <Button onClick={() => onNavigate('styles')}><Film size={15} />Browse 18 styles</Button>
        <Button onClick={() => onNavigate('coach')}><Lightbulb size={15} />Find my next hook</Button>
      </section>
    </div>
  )
}
