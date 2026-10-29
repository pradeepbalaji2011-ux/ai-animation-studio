import { useMemo, useState } from 'react'
import { Check, Code2, Copy, Search, WandSparkles } from 'lucide-react'
import { Badge, Button, Modal, SectionHeading } from '@/components/UI'
import { StyleArt } from '@/components/StudioVisuals'
import type { StylePreset } from '@/types/studio'

export default function StyleLibrary({ styles, currentStyle, onUse, notify }: {
  styles: StylePreset[]
  currentStyle: StylePreset
  onUse: (style: StylePreset) => void
  notify: (message: string) => void
}) {
  const [selected, setSelected] = useState(currentStyle)
  const [filter, setFilter] = useState<'all' | 'generative' | 'programmatic'>('all')
  const [query, setQuery] = useState('')
  const [showJson, setShowJson] = useState(false)
  const filtered = useMemo(() => styles.filter((style) => {
    const matchesRoute = filter === 'all' || style.route === filter
    const text = `${style.name} ${style.bestFor} ${style.mainStrength}`.toLowerCase()
    return matchesRoute && text.includes(query.toLowerCase())
  }), [styles, filter, query])

  const copyJson = () => {
    void navigator.clipboard.writeText(JSON.stringify(selected, null, 2)).then(() => notify('Style JSON copied to clipboard'))
  }

  return (
    <div className="page">
      <SectionHeading eyebrow="DIRECTOR’S REGISTRY" title="Style Library" description="Eighteen locked visual systems. Choose the route before the render, then keep every scene inside the same bible." action={<Badge tone="green">18 VALIDATED PRESETS</Badge>} />
      <div className="library-toolbar">
        <label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search styles, strengths, formats…" aria-label="Search styles" /></label>
        <div className="segmented" aria-label="Filter style route">
          {(['all', 'generative', 'programmatic'] as const).map((route) => <button key={route} className={filter === route ? 'active' : ''} onClick={() => setFilter(route)}>{route === 'all' ? 'All 18' : route === 'generative' ? 'Generative · 11' : 'Programmatic · 7'}</button>)}
        </div>
      </div>
      <div className="style-layout">
        <div>
          <div className="style-grid">
            {filtered.map((style) => (
              <button key={style.id} className={`style-card ${selected.id === style.id ? 'is-selected' : ''}`} onClick={() => setSelected(style)}>
                <StyleArt preset={style} className="style-card-art" />
                <span className="style-card-copy">
                  <span className="style-card-title"><strong>{style.name}</strong>{currentStyle.id === style.id && <Check size={14} />}</span>
                  <span>{style.mainStrength}</span>
                  <small>{style.fps} FPS · {style.route}</small>
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <div className="inline-empty">No presets match “{query}”. <button onClick={() => { setQuery(''); setFilter('all') }}>Clear filters</button></div>}
        </div>
        <aside className="style-inspector">
          <StyleArt preset={selected} className="inspector-art" />
          <div className="inspector-heading"><div><p className="eyebrow">SELECTED PRESET</p><h2>{selected.name}</h2></div><Badge tone={selected.route === 'generative' ? 'red' : 'blue'}>{selected.route}</Badge></div>
          <p className="inspector-description">{selected.bestFor}. {selected.mainStrength}.</p>
          <div className="palette-row">{selected.palette.map((color) => <span key={color} style={{ backgroundColor: color }} title={color} />)}</div>
          <dl className="technical-list">
            <div><dt>Render route</dt><dd>{selected.route === 'generative' ? 'Keyframe → image-to-video' : 'Remotion composition'}</dd></div>
            <div><dt>Frame rate</dt><dd>{selected.fps} fps</dd></div>
            <div><dt>Backgrounds</dt><dd>{selected.backgrounds.length} compatible</dd></div>
            <div><dt>Characters</dt><dd>{selected.characterTypes.length} compatible</dd></div>
          </dl>
          <div className="rule-block"><span>CAMERA DIRECTION</span><p>{selected.cameraRules[0]}</p></div>
          <div className="rule-block"><span>MOTION DIRECTION</span><p>{selected.motionRules[0]}</p></div>
          <div className="inspector-actions">
            <Button variant="primary" onClick={() => onUse(selected)}><WandSparkles size={15} />Use in current project</Button>
            <Button onClick={() => setShowJson(true)}><Code2 size={15} />Inspect JSON</Button>
          </div>
        </aside>
      </div>
      {showJson && <Modal title={`${selected.name} preset`} description="Versioned style contract shared by the director and renderer." onClose={() => setShowJson(false)}>
        <pre className="json-view">{JSON.stringify(selected, null, 2)}</pre>
        <div className="modal-actions"><Button onClick={copyJson}><Copy size={15} />Copy JSON</Button><Button variant="primary" onClick={() => setShowJson(false)}>Done</Button></div>
      </Modal>}
    </div>
  )
}
