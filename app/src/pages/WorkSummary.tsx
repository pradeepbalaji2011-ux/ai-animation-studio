import { ArrowRight, Bell, Check, CheckCircle2, Download, FileText, Flag, Clock3, Play } from 'lucide-react'
import { Badge, Button, PanelHeader, SectionHeading } from '@/components/UI'
import type { Project, Reminder, StylePreset, View } from '@/types/studio'

const statuses: Project['status'][] = ['Idea', 'Script', 'Render', 'Review', 'Scheduled', 'Posted']
export type KanbanItem = { id: string; title: string; style: string; status: Project['status'] }

export default function WorkSummary({ project, style, items, reminders, onMove, onToggleReminder, onDownload, onNavigate, notify }: {
  project: Project
  style: StylePreset
  items: KanbanItem[]
  reminders: Reminder[]
  onMove: (id: string, status: Project['status']) => void
  onToggleReminder: (id: string) => void
  onDownload: () => void
  onNavigate?: (view: View) => void
  notify: (message: string) => void
}) {
  return (
    <div className="page">
      <SectionHeading eyebrow="WORKLOG · ACCOUNTABILITY" title="Work Summary & Reminders" description="See what the system did, what still needs your eye, and what happens next." action={<Button onClick={onDownload}><Download size={15} />Download report</Button>} />
      <section className="work-kanban">
        {statuses.map((status) => <div className="kanban-column" key={status}><div className="kanban-head"><span>{status}</span><Badge>{items.filter((item) => item.status === status).length}</Badge></div>{items.filter((item) => item.status === status).map((item) => {
          const index = statuses.indexOf(item.status)
          return <article className="kanban-card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.style}</p>
            {index < statuses.length - 1 ? (
              <Button size="sm" variant="ghost" onClick={() => onMove(item.id, statuses[index + 1])}>Move to {statuses[index + 1]} <ArrowRight size={12} /></Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', marginTop: '4px' }}>
                <span className="posted-label"><Check size={12} />Published</span>
                {onNavigate && (
                  <Button size="sm" variant="secondary" onClick={() => onNavigate('analyzer')}>
                    <Play size={12} fill="currentColor" /> Open in Analyzer
                  </Button>
                )}
              </div>
            )}
          </article>
        })}</div>)}
      </section>
      <div className="work-lower">
        <section className="summary-document">
          <div className="summary-doc-head"><div><p className="eyebrow">GENERATED WORK REPORT · V1</p><h2>{project.title}</h2><p>Created by the local production prototype · 30 October 2026</p></div><FileText size={31} /></div>
          <div className="summary-facts"><div><span>TOPIC</span><strong>Truth & delivery</strong></div><div><span>GENRE</span><strong>{project.genre}</strong></div><div><span>STYLE</span><strong>{style.name}</strong></div><div><span>SCENES</span><strong>5 · 24 seconds</strong></div></div>
          <div className="summary-block"><h3><CheckCircle2 size={16} />What was completed</h3><p>Creative brief, five-scene director draft, scene JSON, character and environment continuity tags, keyframe plan, clip route, caption plan, and vertical assembly specification.</p></div>
          <div className="summary-block warning"><h3><Flag size={16} />What was flagged</h3><p>Scene 04’s lantern ignition may produce transforming geometry. Scene 03’s moving train may flicker. Both have simpler lighting-based alternatives.</p></div>
          <div className="summary-block"><h3><Clock3 size={16} />What you should review</h3><p>Check Mira’s face in scenes 03–04, approve the lantern glow, listen to the narration pause before the confession, and confirm the CTA remains inside the Reels safe zone.</p></div>
          <div className="summary-recommendation"><span>RECOMMENDED POST</span><strong>Friday · 19:30 IST</strong><small>Starting heuristic; replace with owned analytics after 10–15 videos.</small></div>
        </section>
        <aside className="work-reminders">
          <PanelHeader title="Reminder stack" meta={`${reminders.filter((item) => !item.done).length} OPEN`} action={<Button size="icon" variant="ghost" aria-label="Reminder information" onClick={() => notify('Email, Telegram, and WhatsApp require production provider setup')}><Bell size={16} /></Button>} />
          {reminders.map((reminder) => <label className={`work-reminder ${reminder.done ? 'is-done' : ''}`} key={reminder.id}><input type="checkbox" checked={reminder.done} onChange={() => onToggleReminder(reminder.id)} /><span><strong>{reminder.title}</strong><p>{reminder.detail}</p><small>{reminder.due}</small></span></label>)}
          <div className="reminder-channel-note"><Bell size={15} /><p><strong>In-app reminders work locally.</strong><br />External delivery is not connected in this prototype.</p></div>
        </aside>
      </div>
    </div>
  )
}
