import { useState } from 'react'
import { ArrowRight, Check, Copy, MessageCircleReply, Sparkles, Target, UsersRound } from 'lucide-react'
import { Badge, Button, Field, SectionHeading } from '@/components/UI'

const hooks = [
  { label: 'CURIOSITY', text: 'This lantern only glows when someone stops lying.', note: 'Object + rule + immediate mystery' },
  { label: 'CONFESSION', text: 'I kept the letter for twelve years. Tonight, it started burning.', note: 'Personal stakes + visual consequence' },
  { label: 'PATTERN BREAK', text: 'The last train arrived with no driver—and one passenger.', note: 'Two impossible details, one clear image' },
]

export default function AudienceCoach({ onUseIdea, notify }: { onUseIdea: (idea: string, title: string) => void; notify: (message: string) => void }) {
  const [tab, setTab] = useState<'hooks' | 'titles' | 'series' | 'replies'>('hooks')
  const [copied, setCopied] = useState<string | null>(null)
  const [comment, setComment] = useState('The lantern made me cry. Is there a part two?')
  const [reply, setReply] = useState('')
  const copy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => { setCopied(id); notify('Copied to clipboard'); window.setTimeout(() => setCopied(null), 1600) })
  }
  return (
    <div className="page">
      <SectionHeading eyebrow="AUDIENCE DEVELOPMENT" title="Audience Coach" description="Build recognition through repeatable promises—not louder posting. Every recommendation stays tied to your story world." action={<Badge tone="green">STORYTELLING NICHE</Badge>} />
      <section className="coach-banner">
        <div><p className="eyebrow">THIS WEEK’S CREATIVE BET</p><h2>Become the channel for<br /><em>one-object mysteries.</em></h2><p>Three episodes. Same visual signature. A different impossible rule each time.</p></div>
        <div className="coach-bet"><span><Target size={18} />SERIES PROMISE</span><strong>“Every object has one impossible rule.”</strong><small>Clear enough to repeat · flexible enough to grow</small></div>
        <div className="cadence-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="41" /><circle cx="50" cy="50" r="41" pathLength="100" strokeDasharray="67 100" /></svg><strong>2/3</strong><span>EPISODES<br />PLANNED</span></div>
      </section>
      <div className="coach-tabs tab-list">
        {(['hooks', 'titles', 'series', 'replies'] as const).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'hooks' ? 'Hook lab' : item === 'titles' ? 'Titles & thumbnails' : item === 'series' ? 'Series planner' : 'Comment replies'}</button>)}
      </div>
      {tab === 'hooks' && <div className="hook-layout">
        <section className="hook-list">{hooks.map((hook, index) => <article key={hook.text}><div className="hook-index">0{index + 1}</div><div><Badge tone={index === 0 ? 'red' : 'neutral'}>{hook.label}</Badge><h3>“{hook.text}”</h3><p>{hook.note}</p><div><Button size="sm" onClick={() => copy(`hook-${index}`, hook.text)}>{copied === `hook-${index}` ? <Check size={14} /> : <Copy size={14} />}{copied === `hook-${index}` ? 'Copied' : 'Copy hook'}</Button><Button size="sm" variant="ghost" onClick={() => onUseIdea(hook.text, ['The Truth Lantern', 'The Unsent Letter', 'The Last Passenger'][index])}>Develop <ArrowRight size={13} /></Button></div></div></article>)}</section>
        <aside className="hook-formula"><Sparkles size={22} /><p className="eyebrow">DIRECTOR’S FORMULA</p><h3>Show the object.<br />State the rule.<br />Raise the cost.</h3><ol><li><span>0–1s</span>Object already visible</li><li><span>1–3s</span>Rule under ten words</li><li><span>3–8s</span>One failed attempt</li><li><span>8–20s</span>Truth and consequence</li></ol></aside>
      </div>}
      {tab === 'titles' && <div className="title-layout">
        <section><p className="eyebrow">TITLE TESTS · THE LAST LANTERN</p>{['The Lantern Knows You’re Lying', 'She Carried a Lie for 12 Years', 'Only the Truth Can Light It'].map((title, index) => <div className="title-test" key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{index === 0 ? 'Object + direct threat · recommended' : index === 1 ? 'Character + time stake' : 'Rule + visual promise'}</p></div><Button size="icon" variant="ghost" aria-label={`Copy ${title}`} onClick={() => copy(`title-${index}`, title)}>{copied === `title-${index}` ? <Check size={15} /> : <Copy size={15} />}</Button></div>)}</section>
        <aside className="thumbnail-direction"><div className="thumbnail-sketch"><span className="thumb-face" /><span className="thumb-lantern" /><strong>TRUTH<br />GLOWS</strong></div><h3>Thumbnail direction</h3><p>One face, one lantern, two words maximum. Keep both clear on a phone-sized preview. No generated typography inside the scene art.</p><Button onClick={() => notify('Thumbnail direction saved to the local creative brief')}>Save direction</Button></aside>
      </div>}
      {tab === 'series' && <div className="series-board">
        {[{ n: '01', title: 'The Truth Lantern', rule: 'Glows only for honesty', status: 'IN PRODUCTION' }, { n: '02', title: 'The Backward Umbrella', rule: 'Keeps you dry only in the past', status: 'NEXT' }, { n: '03', title: 'The Empty Key', rule: 'Opens any door you never wanted', status: 'SEED' }].map((episode) => <article key={episode.n}><span>{episode.n}</span><Badge>{episode.status}</Badge><h3>{episode.title}</h3><p>{episode.rule}</p><Button size="sm" onClick={() => onUseIdea(`A one-object mystery called ${episode.title}. The object’s impossible rule: ${episode.rule}.`, episode.title)}>Develop episode <ArrowRight size={13} /></Button></article>)}
      </div>}
      {tab === 'replies' && <div className="reply-layout">
        <section><Field label="Viewer comment"><textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} /></Field><Button variant="primary" onClick={() => setReply(comment.toLowerCase().includes('part two') ? 'Part two is already on the storyboard—the next object breaks a very different rule. What would you want the lantern to reveal next?' : 'Thank you for watching closely. I’d love to hear which moment stayed with you—the image, the rule, or Mira’s choice?')}><MessageCircleReply size={15} />Draft a warm reply</Button></section>
        <aside className={reply ? 'has-reply' : ''}><p className="eyebrow">CREATOR REVIEW</p>{reply ? <><blockquote>{reply}</blockquote><Button onClick={() => copy('reply', reply)}><Copy size={14} />Copy reply</Button></> : <><UsersRound size={24} /><h3>No reply drafted yet</h3><p>Add a comment, then generate a local template. Edit it into your own voice before posting.</p></>}</aside>
      </div>}
    </div>
  )
}
