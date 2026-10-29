import { useMemo, useState } from 'react'
import { ArrowRight, Clock3, Flame, Lightbulb, RefreshCw, TrendingUp } from 'lucide-react'
import { Badge, Button, SectionHeading } from '@/components/UI'
import { trendItems } from '@/data/demo'

export default function TrendAnalyzer({ onUseIdea, notify }: { onUseIdea: (idea: string, title: string) => void; notify: (message: string) => void }) {
  const [niche, setNiche] = useState('All niches')
  const [refreshed, setRefreshed] = useState('Sample snapshot · 30 Oct, 17:30 IST')
  const filtered = useMemo(() => trendItems.filter((item) => niche === 'All niches' || item.niche === niche), [niche])
  return (
    <div className="page">
      <SectionHeading eyebrow="DISCOVERY · SAMPLE DATA" title="Trend Analyzer" description="Turn observed formats into original ideas. Live trend connectors are intentionally disconnected in this prototype." action={<Button onClick={() => { setRefreshed(`Sample refreshed · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`); notify('Sample trend snapshot refreshed; no live API called') }}><RefreshCw size={15} />Refresh sample</Button>} />
      <div className="trend-overview">
        <div className="trend-lead"><span className="trend-mark"><TrendingUp size={27} /></span><div><p className="eyebrow">STRONGEST CREATIVE SIGNAL</p><h2>One object. One secret.<br />One complete story.</h2><p>Short mystery formats are a strong conceptual fit for your atmospheric story niche. Use the structure—not another creator’s characters, footage, or sound.</p></div></div>
        <div className="trend-evidence"><div><span>FORMAT FIT</span><strong>94<small>/100</small></strong></div><div><span>EFFORT</span><strong>Low</strong></div><div><span>ROUTE</span><strong>Anime</strong></div><p><Clock3 size={13} />{refreshed}</p></div>
      </div>
      <div className="content-toolbar"><div className="segmented">{['All niches', 'Storytelling', 'Atmosphere', 'Science'].map((item) => <button key={item} className={niche === item ? 'active' : ''} onClick={() => setNiche(item)}>{item}</button>)}</div><Badge>ILLUSTRATIVE · NOT LIVE</Badge></div>
      <div className="trend-table">
        <div className="trend-table-head"><span>Signal</span><span>Why it matters</span><span>Fit</span><span>Action</span></div>
        {filtered.map((item) => <div className="trend-row" key={item.id}>
          <div><Badge tone={item.kind === 'HOOK' ? 'red' : item.kind === 'FORMAT' ? 'blue' : 'neutral'}>{item.kind}</Badge><h3>{item.title}</h3><p>“{item.hook}”</p></div>
          <p>{item.evidence}<small>{item.niche}</small></p>
          <div className="trend-score"><strong>{item.score}</strong><span><i style={{ width: `${item.score}%` }} /></span></div>
          <Button size="sm" onClick={() => onUseIdea(`An original ${item.title.toLowerCase()} short using the hook: “${item.hook}”`, item.title)}><Lightbulb size={14} />Develop idea</Button>
        </div>)}
      </div>
      <div className="trend-footer"><Flame size={17} /><p><strong>Director’s note:</strong> A trend is a creative constraint, not a script. Keep your own world, punchline, and visual signature.</p><Button variant="ghost" size="sm" onClick={() => onUseIdea('A new original atmospheric mystery set during the monsoon.', 'Untitled Monsoon Mystery')}>Blank idea instead <ArrowRight size={14} /></Button></div>
    </div>
  )
}
