import { useState } from 'react'
import { ArrowRight, Braces, Check, Clipboard, Clock3, MapPin, Play, ShieldCheck, Sparkles, TriangleAlert, UserRound } from 'lucide-react'
import { Badge, Button, Field, PanelHeader, SectionHeading } from '@/components/UI'
import type { Project, Scene, StylePreset, View } from '@/types/studio'

export default function ScriptStudio({ project, styles, scenes, onProjectChange, onGenerate, onSceneChange, onNavigate, notify }: {
  project: Project
  styles: StylePreset[]
  scenes: Scene[]
  onProjectChange: (project: Project) => void
  onGenerate: () => void
  onSceneChange: (scene: Scene) => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
}) {
  const [selectedId, setSelectedId] = useState(scenes[0]?.id || '')
  const [tab, setTab] = useState<'scenes' | 'json'>('scenes')
  const selected = scenes.find((scene) => scene.id === selectedId) || scenes[0]
  const duration = scenes.reduce((total, scene) => total + scene.duration, 0)
  const risks = scenes.reduce((total, scene) => total + scene.aiRiskFlags.length, 0)
  const update = <K extends keyof Project>(key: K, value: Project[K]) => onProjectChange({ ...project, [key]: value })

  const copyScript = () => {
    const payload = { hook: scenes[0]?.narration, scenes, cta: scenes.at(-1)?.narration, title: project.title, description: project.idea }
    void navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => notify('Scene JSON copied to clipboard'))
  }

  return (
    <div className="page script-page">
      <SectionHeading eyebrow="SCREENWRITING · SCENE ENGINE" title="Script Studio" description="Direct the visible action first. The scene validator protects pacing, continuity, and model-friendly shots." action={<Button onClick={copyScript}><Clipboard size={15} />Copy scene JSON</Button>} />
      <div className="script-layout">
        <form className="brief-panel" onSubmit={(event) => { event.preventDefault(); onGenerate() }}>
          <PanelHeader title="Creative brief" meta="LOCAL DRAFT" />
          <Field label="Project title"><input value={project.title} onChange={(e) => update('title', e.target.value)} required /></Field>
          <Field label="Idea or topic" hint="Required"><textarea rows={4} value={project.idea} onChange={(e) => update('idea', e.target.value)} placeholder="A tiny robot learns why waiting can be kind…" required /></Field>
          <div className="field-pair">
            <Field label="Genre"><select value={project.genre} onChange={(e) => update('genre', e.target.value)}>{['Funny', 'Kids', 'Facts', 'Science', 'Life', 'Horror & Mystery', 'Motivation', 'Storytelling', 'History', 'Tech', 'Moral Stories'].map((genre) => <option key={genre}>{genre}</option>)}</select></Field>
            <Field label="Length"><select value={project.targetLength} onChange={(e) => update('targetLength', Number(e.target.value))}>{[15, 24, 30, 45, 60].map((length) => <option key={length} value={length}>{length} seconds</option>)}</select></Field>
          </div>
          <Field label="Animation style"><select value={project.styleId} onChange={(e) => update('styleId', e.target.value)}>{styles.map((style) => <option key={style.id} value={style.id}>{style.name} · {style.route}</option>)}</select></Field>
          <Field label="Audience"><textarea rows={2} value={project.audience} onChange={(e) => update('audience', e.target.value)} /></Field>
          <Field label="Tone"><input value={project.tone} onChange={(e) => update('tone', e.target.value)} /></Field>
          <div className="brief-rules"><ShieldCheck size={16} /><p>One location · one subject · one action<br />3–6s clips · concrete visual nouns</p></div>
          <Button variant="primary" type="submit" className="full-width"><Sparkles size={16} />Generate local director draft</Button>
          <p className="form-footnote">Uses the built-in sample scene engine. No LLM or paid API is called.</p>
        </form>

        <section className="scene-workspace">
          <div className="scene-toolbar">
            <div className="tab-list"><button className={tab === 'scenes' ? 'active' : ''} onClick={() => setTab('scenes')}><Play size={14} />Scenes</button><button className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}><Braces size={14} />JSON</button></div>
            <div className="scene-stats"><span><Clock3 size={13} />{duration}s</span><span><Check size={13} />{scenes.length} valid</span>{risks > 0 && <span className="risk-text"><TriangleAlert size={13} />{risks} flags</span>}</div>
          </div>
          {tab === 'json' ? <pre className="script-json">{JSON.stringify({ title: project.title, hook: scenes[0]?.narration, scenes, cta: scenes.at(-1)?.narration }, null, 2)}</pre> : (
            <div className="scene-list">
              {scenes.map((scene) => (
                <button key={scene.id} className={`scene-row ${selected?.id === scene.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(scene.id)}>
                  <span className="scene-number">{scene.id}</span>
                  <span className="scene-main"><span><Badge tone={scene.phase === 'hook' ? 'red' : scene.phase === 'cta' ? 'green' : 'neutral'}>{scene.phase}</Badge><small>{scene.duration}s</small></span><strong>{scene.action}</strong><small>{scene.narration}</small></span>
                  <span className="scene-state">{scene.aiRiskFlags.length ? <TriangleAlert size={16} className="risk-text" /> : <Check size={16} />}</span>
                </button>
              ))}
            </div>
          )}
          <div className="scene-footer"><span>Hook 0–4s · Value 4–19s · CTA 19–24s</span><Button variant="primary" size="sm" onClick={() => onNavigate('builder')}>Send to builder <ArrowRight size={14} /></Button></div>
        </section>

        {selected && <aside className="scene-inspector">
          <PanelHeader title={`${selected.id} inspector`} meta={selected.phase.toUpperCase()} />
          <div className="inspector-section"><span className="mini-label">VISIBLE ACTION</span><textarea rows={3} value={selected.action} onChange={(e) => onSceneChange({ ...selected, action: e.target.value })} /></div>
          <div className="inspector-section"><span className="mini-label">NARRATION</span><textarea rows={3} value={selected.narration} onChange={(e) => onSceneChange({ ...selected, narration: e.target.value })} /></div>
          <div className="inspector-section"><span className="mini-label">ON-SCREEN TEXT · MAX 5 WORDS</span><input value={selected.onScreenText} onChange={(e) => onSceneChange({ ...selected, onScreenText: e.target.value.toUpperCase().slice(0, 42) })} /></div>
          <div className="continuity-box"><span className="mini-label">CONTINUITY TAGS</span><p><UserRound size={13} />{selected.continuityTags.character}</p><p><span className="outfit-swatch" />{selected.continuityTags.outfit}</p><p><MapPin size={13} />{selected.continuityTags.environment}</p></div>
          <div className="inspector-section"><span className="mini-label">CAMERA</span><p className="small-copy">{selected.camera}</p></div>
          {selected.aiRiskFlags.length > 0 ? <div className="risk-box"><TriangleAlert size={15} /><div><strong>AI risk flagged</strong>{selected.aiRiskFlags.map((risk) => <p key={risk}>{risk}</p>)}</div></div> : <div className="pass-box"><Check size={15} />No model-risk flags</div>}
        </aside>}
      </div>
    </div>
  )
}
