import { useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Link2, MousePointer2, Play, TimerReset, UsersRound } from 'lucide-react'
import { Badge, Button, Modal, SectionHeading } from '@/components/UI'

const videoData = {
  cloud: { title: 'The Cloud Repair Shop', views: '12.4K', retention: '71%', ctr: '6.8%', drop: '18%', duration: '0:31', change: '+4.2%' },
  robot: { title: 'A Robot Learns to Wait', views: '8.1K', retention: '64%', ctr: '5.1%', drop: '27%', duration: '0:28', change: '−1.8%' },
}

export default function VideoAnalyzer({ onApply, notify }: { onApply: (idea: string) => void; notify: (message: string) => void }) {
  const [selected, setSelected] = useState<keyof typeof videoData>('cloud')
  const [showConnect, setShowConnect] = useState(false)
  const [applied, setApplied] = useState<number[]>([])
  const data = videoData[selected]
  const fixes = [
    { title: 'Put the broken cloud in frame one', detail: 'Replace the 1.2-second studio title with the visual problem. Keep the first spoken line under nine words.', metric: 'Target: first-3s drop below 15%' },
    { title: 'Move the reveal two scenes earlier', detail: 'Show the repaired cloud at 0:12, then use the remaining time for one consequence and one CTA.', metric: 'Target: average retention above 75%' },
    { title: 'Make the title promise one thing', detail: 'Test “She Repairs Clouds” against the current title. Keep the thumbnail to one face and one cloud.', metric: 'Target: CTR above 7.5%' },
  ]
  return (
    <div className="page">
      <SectionHeading eyebrow="OWNED-CHANNEL LEARNING · SAMPLE" title="Video Analyzer" description="Read the audience’s behavior, then turn it into three specific changes for the next cut." action={<Button onClick={() => setShowConnect(true)}><Link2 size={15} />Connect analytics</Button>} />
      <div className="analyzer-toolbar"><select aria-label="Select sample video" value={selected} onChange={(e) => setSelected(e.target.value as keyof typeof videoData)}>{Object.entries(videoData).map(([id, video]) => <option key={id} value={id}>{video.title}</option>)}</select><div><Badge tone="amber">ILLUSTRATIVE DATA</Badge><span>Last 28 days · sample snapshot</span></div></div>
      <section className="metric-grid">
        <div><span><Play size={15} />VIEWS</span><strong>{data.views}</strong><small className="positive"><ArrowUpRight size={13} />12% vs previous</small></div>
        <div><span><UsersRound size={15} />AVG. RETENTION</span><strong>{data.retention}</strong><small className="positive"><ArrowUpRight size={13} />{data.change} vs channel</small></div>
        <div><span><MousePointer2 size={15} />IMPRESSIONS CTR</span><strong>{data.ctr}</strong><small>{data.duration} average view</small></div>
        <div className={selected === 'robot' ? 'metric-warning' : ''}><span><TimerReset size={15} />FIRST-3S DROP-OFF</span><strong>{data.drop}</strong><small className={selected === 'robot' ? 'negative' : 'positive'}>{selected === 'robot' ? <ArrowDownRight size={13} /> : <Check size={13} />}{selected === 'robot' ? 'Hook needs attention' : 'Within starting target'}</small></div>
      </section>
      <div className="analysis-layout">
        <section className="retention-panel">
          <div className="panel-header"><div className="panel-title"><span>Audience retention</span><span className="panel-meta">PERCENTAGE WATCHING</span></div><Badge>{data.title}</Badge></div>
          <div className="retention-chart">
            <div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
            <svg viewBox="0 0 700 240" preserveAspectRatio="none" role="img" aria-label="Sample audience retention curve">
              <g stroke="#3a3b40" strokeWidth="1"><path d="M0 0h700M0 60h700M0 120h700M0 180h700M0 239h700" /></g>
              <path d={selected === 'cloud' ? 'M0 18 C45 25 55 35 90 40 S170 48 220 59 S320 66 370 77 S470 93 520 105 S630 115 700 128' : 'M0 18 C35 35 55 66 90 72 S170 83 220 92 S320 108 370 119 S470 133 520 148 S630 162 700 173'} fill="none" stroke="#e14b45" strokeWidth="4" vectorEffect="non-scaling-stroke" />
              <path d="M90 0v240M370 0v240" stroke="#787a80" strokeDasharray="4 6" />
              <circle cx="90" cy={selected === 'cloud' ? 40 : 72} r="6" fill="#e14b45" />
            </svg>
            <div className="chart-x"><span>0:00</span><span>0:03</span><span>0:08</span><span>0:15</span><span>0:22</span><span>0:30</span></div>
            <span className="chart-note note-hook">HOOK<br /><strong>{data.drop} drop</strong></span><span className="chart-note note-reveal">REVEAL<br /><strong>0:15</strong></span>
          </div>
          <div className="retention-insight"><span>01</span><p><strong>The opening is {selected === 'cloud' ? 'holding' : 'leaking attention'}.</strong> The largest avoidable loss happens before the viewer understands the visual problem.</p></div>
        </section>
        <aside className="fix-panel">
          <div className="panel-header"><div className="panel-title"><span>Next-video fixes</span><span className="panel-meta">3 PRIORITIZED</span></div></div>
          {fixes.map((fix, index) => <div className="fix-item" key={fix.title}><span className="fix-number">0{index + 1}</span><div><h3>{fix.title}</h3><p>{fix.detail}</p><small>{fix.metric}</small><Button size="sm" variant={applied.includes(index) ? 'ghost' : 'secondary'} disabled={applied.includes(index)} onClick={() => { setApplied([...applied, index]); notify('Fix added to the next creative brief') }}>{applied.includes(index) ? <Check size={13} /> : <ArrowRight size={13} />}{applied.includes(index) ? 'Added to brief' : 'Apply to next draft'}</Button></div></div>)}
        </aside>
      </div>
      <div className="analyzer-next"><p><strong>Build the comparison, not just another video.</strong> Change one opening variable and keep the length and style stable.</p><Button variant="primary" onClick={() => onApply('A 30-second visual mystery that shows the broken cloud in frame one, with a spoken hook under nine words and the reveal by 0:12.')}>Create improved draft <ArrowRight size={15} /></Button></div>
      {showConnect && <Modal title="Connect YouTube Analytics" description="OAuth is a production step and is not active in this frontend-only prototype." onClose={() => setShowConnect(false)}>
        <div className="connection-explainer"><Link2 size={25} /><p>The production app will request minimum YouTube Data and Analytics scopes, store refresh tokens server-side, and import normalized retention, CTR, and first-3-second metrics.</p><ul><li>No credentials are collected here</li><li>No social API is called</li><li>Current charts use clearly labeled sample data</li></ul></div>
        <div className="modal-actions"><Button variant="primary" onClick={() => setShowConnect(false)}>Understood</Button></div>
      </Modal>}
    </div>
  )
}
