import { useState } from 'react'
import { CalendarDays, Check, Clock3, Instagram, Plus, Sparkles, Trash2, Youtube } from 'lucide-react'
import { Badge, Button, Field, Modal, SectionHeading } from '@/components/UI'
import type { ScheduledPost } from '@/types/studio'

const days = [
  { day: 'MON', date: '26 OCT', number: '26' }, { day: 'TUE', date: '27 OCT', number: '27' },
  { day: 'WED', date: '28 OCT', number: '28' }, { day: 'THU', date: '29 OCT', number: '29' },
  { day: 'FRI', date: '30 OCT', number: '30' }, { day: 'SAT', date: '31 OCT', number: '31' },
  { day: 'SUN', date: '01 NOV', number: '01' },
]

export default function Scheduler({ schedule, onAdd, onRemove, projectTitle, notify }: {
  schedule: ScheduledPost[]
  onAdd: (post: ScheduledPost) => void
  onRemove: (id: string) => void
  projectTitle: string
  notify: (message: string) => void
}) {
  const [showNew, setShowNew] = useState(false)
  const [title, setTitle] = useState(projectTitle)
  const [date, setDate] = useState('30 OCT')
  const [time, setTime] = useState('19:30')
  const [platform, setPlatform] = useState<ScheduledPost['platform']>('YouTube Shorts')

  const submit = () => {
    const day = days.find((item) => item.date === date)?.day || 'FRI'
    onAdd({ id: `post-${Date.now()}`, projectTitle: title, day, date, time, platform })
    setShowNew(false)
  }

  return (
    <div className="page">
      <SectionHeading eyebrow="CHANNEL OPERATIONS · IST" title="Posting Scheduler" description="Protect a sustainable cadence. Early slots use transparent IST heuristics until your own audience data takes over." action={<Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} />New posting slot</Button>} />
      <div className="schedule-summary">
        <div><CalendarDays size={19} /><span><strong>2 posts this week</strong><small>One Short · one Reel</small></span></div>
        <div><Clock3 size={19} /><span><strong>19:30 is your anchor</strong><small>Default weekday evening slot</small></span></div>
        <div><Sparkles size={19} /><span><strong>Heuristic mode</strong><small>Own analytics activate after 10–15 videos</small></span></div>
        <Badge tone="amber">REMINDERS ONLY</Badge>
      </div>
      <section className="calendar-panel">
        <div className="calendar-head"><div><button aria-label="Current week" onClick={() => notify('Showing the current sample week')}><CalendarDays size={16} />26 Oct — 01 Nov</button><Badge>CURRENT WEEK</Badge></div><span>All times Asia/Kolkata</span></div>
        <div className="week-grid">
          {days.map((day) => {
            const posts = schedule.filter((post) => post.date === day.date)
            return <div className={`week-day ${day.date === '30 OCT' ? 'is-today' : ''}`} key={day.date}>
              <div className="week-day-head"><span>{day.day}</span><strong>{day.number}</strong>{day.date === '30 OCT' && <small>TODAY</small>}</div>
              <div className="week-day-body">
                {posts.map((post) => <div className="calendar-post" key={post.id}><time>{post.time}</time><strong>{post.projectTitle}</strong><span>{post.platform === 'YouTube Shorts' ? <Youtube size={12} /> : <Instagram size={12} />}{post.platform === 'YouTube Shorts' ? 'Short' : 'Reel'}</span></div>)}
                {posts.length === 0 && <button className="empty-slot" onClick={() => { setDate(day.date); setShowNew(true) }}><Plus size={14} />Add slot</button>}
              </div>
            </div>
          })}
        </div>
      </section>
      <div className="scheduler-lower">
        <section className="upcoming-list">
          <div className="panel-header"><div className="panel-title"><span>Publishing queue</span><span className="panel-meta">{schedule.length} PLANNED</span></div></div>
          {schedule.map((post) => <div className="queue-row" key={post.id}><span className="platform-icon">{post.platform === 'YouTube Shorts' ? <Youtube size={18} /> : <Instagram size={18} />}</span><div><strong>{post.projectTitle}</strong><small>{post.platform} · {post.day}, {post.date} at {post.time} IST</small></div><Badge>REMINDER SET</Badge><Button size="icon" variant="ghost" aria-label={`Remove ${post.projectTitle} posting slot`} onClick={() => onRemove(post.id)}><Trash2 size={15} /></Button></div>)}
        </section>
        <aside className="best-times">
          <p className="eyebrow">STARTING HEURISTIC</p><h2>Post when you can stay for the replies.</h2><p>Evening and weekend slots are starting points, not claims about your live audience.</p>
          {['FRI · 19:30', 'SUN · 11:00', 'SUN · 20:00'].map((slot) => <button key={slot} onClick={() => { const [day, timeValue] = slot.split(' · '); setDate(day === 'FRI' ? '30 OCT' : '01 NOV'); setTime(timeValue); setShowNew(true) }}><span>{slot}</span><Plus size={14} /></button>)}
          <div className="auto-post-note"><Check size={14} />Auto-publishing requires OAuth setup later.</div>
        </aside>
      </div>
      {showNew && <Modal title="New posting slot" description="This creates a local schedule and reminder, not a social-platform publish job." onClose={() => setShowNew(false)}>
        <form onSubmit={(event) => { event.preventDefault(); submit() }}>
          <Field label="Project"><input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
          <div className="field-pair"><Field label="Date"><select value={date} onChange={(e) => setDate(e.target.value)}>{days.map((day) => <option key={day.date} value={day.date}>{day.day} · {day.date}</option>)}</select></Field><Field label="Time · IST"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></Field></div>
          <Field label="Platform"><select value={platform} onChange={(e) => setPlatform(e.target.value as ScheduledPost['platform'])}><option>YouTube Shorts</option><option>Instagram Reels</option></select></Field>
          <div className="modal-actions"><Button onClick={() => setShowNew(false)}>Cancel</Button><Button variant="primary" type="submit">Save reminder</Button></div>
        </form>
      </Modal>}
    </div>
  )
}
