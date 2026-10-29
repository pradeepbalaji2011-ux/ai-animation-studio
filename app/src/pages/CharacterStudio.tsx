import { useState } from 'react'
import { Check, ChevronRight, Lock, MapPin, Plus, Unlock, UserRound } from 'lucide-react'
import { Badge, Button, Field, Modal, PanelHeader, SectionHeading } from '@/components/UI'
import { CharacterPortrait } from '@/components/StudioVisuals'
import type { StylePreset } from '@/types/studio'

const expressions = ['neutral', 'happy', 'surprised']

export default function CharacterStudio({ style, notify }: { style: StylePreset; notify: (message: string) => void }) {
  const [tab, setTab] = useState<'characters' | 'backgrounds' | 'continuity'>('characters')
  const [characters, setCharacters] = useState(['Mira', 'Station Keeper'])
  const [selectedCharacter, setSelectedCharacter] = useState('Mira')
  const [expression, setExpression] = useState('neutral')
  const [selectedBackground, setSelectedBackground] = useState(style.backgrounds[0])
  const [locked, setLocked] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  return (
    <div className="page">
      <SectionHeading eyebrow="ASSET & CONTINUITY BIBLE" title="Character & Background Studio" description="Lock the face, outfit, palette, and place before a single keyframe enters the render queue." action={<Button variant={locked ? 'secondary' : 'primary'} onClick={() => { setLocked(!locked); notify(locked ? 'Continuity bible unlocked for editing' : 'Continuity bible locked for this draft') }}>{locked ? <Unlock size={15} /> : <Lock size={15} />}{locked ? 'Unlock bible' : 'Lock continuity bible'}</Button>} />
      <div className="studio-tabs tab-list">
        <button className={tab === 'characters' ? 'active' : ''} onClick={() => setTab('characters')}><UserRound size={15} />Characters <span>{characters.length}</span></button>
        <button className={tab === 'backgrounds' ? 'active' : ''} onClick={() => setTab('backgrounds')}><MapPin size={15} />Backgrounds <span>{style.backgrounds.length}</span></button>
        <button className={tab === 'continuity' ? 'active' : ''} onClick={() => setTab('continuity')}><Lock size={15} />Continuity <span>v1</span></button>
      </div>

      {tab === 'characters' && <div className="character-layout">
        <aside className="asset-list">
          <PanelHeader title="Project cast" meta="2 ORIGINAL" action={<Button size="icon" variant="ghost" aria-label="Add character" onClick={() => setShowNew(true)}><Plus size={17} /></Button>} />
          {characters.map((character, index) => <button key={character} className={selectedCharacter === character ? 'active' : ''} onClick={() => setSelectedCharacter(character)}><span className="asset-avatar"><CharacterPortrait className="h-full w-full" /></span><span><strong>{character}</strong><small>{index === 0 ? 'Lead · mira_v1' : 'Supporting · keeper_v1'}</small></span><ChevronRight size={15} /></button>)}
          <div className="compatible-types"><span className="mini-label">COMPATIBLE WITH {style.name.toUpperCase()}</span>{style.characterTypes.map((type) => <p key={type}>{type}</p>)}</div>
        </aside>
        <section className="character-sheet">
          <div className="sheet-heading"><div><p className="eyebrow">EXPRESSION & ANGLE SHEET</p><h2>{selectedCharacter}</h2></div><Badge tone={locked ? 'green' : 'amber'}>{locked ? 'LOCKED V1' : 'DRAFT V1'}</Badge></div>
          <div className="expression-grid">
            {[...expressions, 'neutral'].map((item, index) => <button key={`${item}-${index}`} className={expression === item && index < 3 ? 'active' : ''} onClick={() => setExpression(item)}><CharacterPortrait expression={item} /><span>{index === 3 ? 'three-quarter' : item}</span></button>)}
          </div>
          <div className="character-notes">
            <div><span>FACE ANCHOR</span><strong>Round face · short black bob · warm brown skin</strong></div>
            <div><span>OUTFIT ANCHOR</span><strong>Mustard raincoat · cream shirt · dark trousers</strong></div>
            <div><span>DO NOT CHANGE</span><strong>Eye spacing · coat color · hair length · lantern color</strong></div>
          </div>
        </section>
        <aside className="expression-inspector">
          <CharacterPortrait expression={expression} className="expression-large" />
          <p className="eyebrow">SELECTED EXPRESSION</p><h3>{expression}</h3>
          <p>Large, readable facial shapes. No micro-gestures are sent to the video model.</p>
          <Button className="full-width" onClick={() => notify(`${selectedCharacter} ${expression} reference marked as scene anchor`)}><Check size={15} />Use as expression anchor</Button>
        </aside>
      </div>}

      {tab === 'backgrounds' && <div className="background-layout">
        <div className="background-grid">
          {style.backgrounds.map((background, index) => <button key={background} className={selectedBackground === background ? 'active' : ''} onClick={() => setSelectedBackground(background)} style={{ '--bg-accent': style.palette[(index + 2) % style.palette.length] } as React.CSSProperties}>
            <span className={`background-art background-art-${index}`}><i /><i /><i /></span>
            <span><strong>{background}</strong><small>{style.name} · {index === 0 ? 'Hero environment' : 'Compatible variation'}</small></span>
          </button>)}
        </div>
        <aside className="background-inspector">
          <p className="eyebrow">ENVIRONMENT ANCHOR</p><h2>{selectedBackground}</h2>
          <dl className="technical-list"><div><dt>Continuity ID</dt><dd>platform_blue_hour_v1</dd></div><div><dt>Lighting</dt><dd>Cool ambient · warm practical</dd></div><div><dt>Depth</dt><dd>3 layered planes</dd></div><div><dt>Forbidden</dt><dd>Signage, logos, extra people</dd></div></dl>
          <Button variant="primary" className="full-width" onClick={() => notify(`${selectedBackground} assigned to all compatible scenes`)}>Assign to current scenes</Button>
        </aside>
      </div>}

      {tab === 'continuity' && <div className="bible-layout">
        <section className="bible-document">
          <p className="eyebrow">THE LAST LANTERN · BIBLE V1</p><h2>What must never drift.</h2><p className="bible-lead">One visual source of truth shared by keyframes, clips, captions, and QA.</p>
          <div className="bible-rule"><span>01</span><div><h3>Character identity</h3><p>Mira retains the same round face, short black bob, warm brown skin, and eye spacing in every scene.</p></div><Badge tone="green">LOCKED</Badge></div>
          <div className="bible-rule"><span>02</span><div><h3>Outfit continuity</h3><p>Mustard raincoat, cream shirt, dark trousers. No added bags, jewelry, gloves, or color shifts.</p></div><Badge tone="green">LOCKED</Badge></div>
          <div className="bible-rule"><span>03</span><div><h3>Environment & light</h3><p>Blue-hour platform, wet paving, cool ambient light, warm lantern practical, three depth planes.</p></div><Badge tone="green">LOCKED</Badge></div>
          <div className="bible-rule"><span>04</span><div><h3>Style language</h3><p>{style.promptPrefix}</p></div><Badge>{style.route}</Badge></div>
        </section>
        <aside className="bible-status"><Lock size={24} /><h3>{locked ? 'Bible locked' : 'Bible ready to lock'}</h3><p>{locked ? 'All five scenes reference these exact continuity tags.' : 'Review the anchors, then lock before keyframe generation.'}</p><ul><li><Check size={14} />5 character tags</li><li><Check size={14} />5 outfit tags</li><li><Check size={14} />5 environment tags</li></ul><Button variant="primary" className="full-width" onClick={() => { setLocked(true); notify('Continuity bible locked across 5 scenes') }}><Lock size={15} />Lock across 5 scenes</Button></aside>
      </div>}

      {showNew && <Modal title="Add an original character" description="Create a local placeholder; no image provider is called." onClose={() => setShowNew(false)}>
        <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) { setCharacters([...characters, newName.trim()]); setSelectedCharacter(newName.trim()); setShowNew(false); setNewName(''); notify('Character added to the local project cast') } }}>
          <Field label="Character name"><input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. The Night Conductor" required /></Field>
          <Field label="Compatible character type"><select>{style.characterTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
          <div className="modal-actions"><Button onClick={() => setShowNew(false)}>Cancel</Button><Button variant="primary" type="submit">Add character</Button></div>
        </form>
      </Modal>}
    </div>
  )
}
