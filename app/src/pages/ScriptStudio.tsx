import { useState } from 'react'
import { ArrowRight, Bot, Braces, Check, Clipboard, Clock3, DollarSign, Loader2, MapPin, Play, ShieldAlert, ShieldCheck, Sparkles, TriangleAlert, UserRound } from 'lucide-react'
import { Badge, Button, Field, Modal, PanelHeader, SectionHeading } from '@/components/UI'
import type { Project, Scene, StylePreset, View } from '@/types/studio'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

interface CostApprovalData {
  estimatedCostUsd: number
  spendStatus: {
    dailyLimit: number
    spentToday: number
    remainingToday: number
  }
  message: string
}

export default function ScriptStudio({
  project,
  styles,
  scenes,
  onProjectChange,
  onGenerate,
  onScenesSet,
  onSceneChange,
  onNavigate,
  notify,
}: {
  project: Project
  styles: StylePreset[]
  scenes: Scene[]
  onProjectChange: (project: Project) => void
  onGenerate: () => void
  onScenesSet?: (scenes: Scene[]) => void
  onSceneChange: (scene: Scene) => void
  onNavigate: (view: View) => void
  notify: (message: string) => void
}) {
  const [selectedId, setSelectedId] = useState(scenes[0]?.id || '')
  const [tab, setTab] = useState<'scenes' | 'json'>('scenes')
  const [loading, setLoading] = useState(false)
  const [costApprovalData, setCostApprovalData] = useState<CostApprovalData | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const selected = scenes.find((scene) => scene.id === selectedId) || scenes[0]
  const duration = scenes.reduce((total, scene) => total + scene.duration, 0)
  const risks = scenes.reduce((total, scene) => total + scene.aiRiskFlags.length, 0)
  const update = <K extends keyof Project>(key: K, value: Project[K]) => onProjectChange({ ...project, [key]: value })

  const copyScript = () => {
    const payload = { hook: scenes[0]?.narration, scenes, cta: scenes.at(-1)?.narration, title: project.title, description: project.idea }
    void navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => notify('Scene JSON copied to clipboard'))
  }

  const triggerClaudeGeneration = async (approved: boolean) => {
    if (!project.idea.trim()) {
      notify('Please enter an idea or topic first')
      return
    }

    setLoading(true)
    setErrorBanner(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: project.idea,
          genre: project.genre,
          stylePresetId: project.styleId,
          audience: project.audience || 'Short-form viewers',
          tone: project.tone || 'Cinematic, engaging',
          length: project.targetLength || 30,
          approvedSpend: approved,
        }),
      })

      const data = await response.json()

      // Cost approval gate requirement
      if (response.ok && data.status === 'approval_required') {
        setCostApprovalData({
          estimatedCostUsd: data.estimatedCostUsd,
          spendStatus: data.spendStatus,
          message: data.message,
        })
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server responded with ${response.status}`)
      }

      // Success: map validated scenes
      if (data.status === 'success' && data.script) {
        const rawScenes = data.script.scenes as Array<{
          id: string
          duration: number
          location: string
          characters: string | string[]
          action: string
          camera: string
          narration: string
          onScreenText: string
          continuityTags: { character: string; outfit: string; environment: string }
          aiRiskFlags?: string[]
        }>

        const mappedScenes: Scene[] = rawScenes.map((s, idx, arr) => ({
          id: s.id || `S${String(idx + 1).padStart(2, '0')}`,
          duration: s.duration,
          phase: idx === 0 ? 'hook' : idx === arr.length - 1 ? 'cta' : 'value',
          location: s.location,
          subject: Array.isArray(s.characters) ? s.characters.join(', ') : (s.characters || 'Subject'),
          action: s.action,
          camera: s.camera,
          narration: s.narration,
          onScreenText: s.onScreenText,
          continuityTags: s.continuityTags,
          aiRiskFlags: s.aiRiskFlags || [],
        }))

        if (onScenesSet) {
          onScenesSet(mappedScenes)
        }
        setSelectedId(mappedScenes[0]?.id || '')

        onProjectChange({
          ...project,
          title: data.script.title || project.title,
          idea: data.script.description || project.idea,
          status: 'Script',
        })

        setCostApprovalData(null)
        notify(`✓ Claude script generated & validated (${mappedScenes.length} scenes · Cost: $${data.costUsd?.toFixed(4) || '0.015'})`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorBanner(msg)
      notify('Claude script generation failed: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page script-page">
      <SectionHeading
        eyebrow="SCREENWRITING · SCENE ENGINE"
        title="Script Studio"
        description="Direct the visible action first. The scene validator protects pacing, continuity, and model-friendly shots."
        action={<Button onClick={copyScript}><Clipboard size={15} />Copy scene JSON</Button>}
      />

      {errorBanner && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <TriangleAlert size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: '#ef4444', fontSize: 13, display: 'block', marginBottom: 2 }}>Generation Error</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{errorBanner}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setErrorBanner(null); onGenerate() }}>Use Local Fallback</Button>
        </div>
      )}

      <div className="script-layout">
        <form className="brief-panel" onSubmit={(e) => { e.preventDefault(); void triggerClaudeGeneration(false) }}>
          <PanelHeader title="Creative brief" meta="PRODUCTION SCRIPT" />
          <Field label="Project title"><input value={project.title} onChange={(e) => update('title', e.target.value)} required /></Field>
          <Field label="Idea or topic" hint="Required"><textarea rows={4} value={project.idea} onChange={(e) => update('idea', e.target.value)} placeholder="A tiny robot learns why waiting can be kind…" required /></Field>
          <div className="field-pair">
            <Field label="Genre"><select value={project.genre} onChange={(e) => update('genre', e.target.value)}>{['Funny', 'Kids', 'Facts', 'Science', 'Life', 'Horror & Mystery', 'Motivation', 'Storytelling', 'History', 'Tech', 'Moral Stories'].map((genre) => <option key={genre}>{genre}</option>)}</select></Field>
            <Field label="Length"><select value={project.targetLength} onChange={(e) => update('targetLength', Number(e.target.value))}>{[15, 24, 30, 45, 60].map((length) => <option key={length} value={length}>{length} seconds</option>)}</select></Field>
          </div>
          <Field label="Animation style"><select value={project.styleId} onChange={(e) => update('styleId', e.target.value)}>{styles.map((style) => <option key={style.id} value={style.id}>{style.name} · {style.route}</option>)}</select></Field>
          <Field label="Audience"><textarea rows={2} value={project.audience} onChange={(e) => update('audience', e.target.value)} /></Field>
          <Field label="Tone"><input value={project.tone} onChange={(e) => update('tone', e.target.value)} /></Field>
          
          <div className="brief-rules">
            <ShieldCheck size={16} />
            <p>One location · one subject · one action<br />3–6s clips · 140–160 WPM · max 5 on-screen words</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Primary Claude API Button with Cost Gate */}
            <Button variant="primary" type="submit" disabled={loading} className="full-width">
              {loading ? <Loader2 size={16} className="spin" /> : <Bot size={16} />}
              {loading ? 'Consulting Claude API…' : 'Generate with Claude API'}
            </Button>

            {/* Offline Local Draft Fallback */}
            <Button variant="secondary" type="button" disabled={loading} onClick={onGenerate} className="full-width">
              <Sparkles size={15} />
              Generate local draft fallback (Offline · $0.00)
            </Button>
          </div>

          <p className="form-footnote">
            Claude API calls are validated through the server cost-approval gate. Local fallback generates an offline deterministic template.
          </p>
        </form>

        <section className="scene-workspace">
          <div className="scene-toolbar">
            <div className="tab-list">
              <button className={tab === 'scenes' ? 'active' : ''} onClick={() => setTab('scenes')}><Play size={14} />Scenes</button>
              <button className={tab === 'json' ? 'active' : ''} onClick={() => setTab('json')}><Braces size={14} />JSON</button>
            </div>
            <div className="scene-stats">
              <span><Clock3 size={13} />{duration}s</span>
              <span><Check size={13} />{scenes.length} valid</span>
              {risks > 0 && <span className="risk-text"><TriangleAlert size={13} />{risks} flags</span>}
            </div>
          </div>

          {tab === 'json' ? (
            <pre className="script-json">{JSON.stringify({ title: project.title, hook: scenes[0]?.narration, scenes, cta: scenes.at(-1)?.narration }, null, 2)}</pre>
          ) : (
            <div className="scene-list">
              {scenes.map((scene) => (
                <button key={scene.id} className={`scene-row ${selected?.id === scene.id ? 'is-selected' : ''}`} onClick={() => setSelectedId(scene.id)}>
                  <span className="scene-number">{scene.id}</span>
                  <span className="scene-main">
                    <span><Badge tone={scene.phase === 'hook' ? 'red' : scene.phase === 'cta' ? 'green' : 'neutral'}>{scene.phase}</Badge><small>{scene.duration}s</small></span>
                    <strong>{scene.action}</strong>
                    <small>{scene.narration}</small>
                  </span>
                  <span className="scene-state">{scene.aiRiskFlags.length ? <TriangleAlert size={16} className="risk-text" /> : <Check size={16} />}</span>
                </button>
              ))}
            </div>
          )}

          <div className="scene-footer">
            <span>Hook 0–3s · Value 60–70% · CTA 10–20%</span>
            <Button variant="primary" size="sm" onClick={() => onNavigate('builder')}>Send to builder <ArrowRight size={14} /></Button>
          </div>
        </section>

        {selected && (
          <aside className="scene-inspector">
            <PanelHeader title={`${selected.id} inspector`} meta={selected.phase.toUpperCase()} />
            <div className="inspector-section"><span className="mini-label">VISIBLE ACTION</span><textarea rows={3} value={selected.action} onChange={(e) => onSceneChange({ ...selected, action: e.target.value })} /></div>
            <div className="inspector-section"><span className="mini-label">NARRATION</span><textarea rows={3} value={selected.narration} onChange={(e) => onSceneChange({ ...selected, narration: e.target.value })} /></div>
            <div className="inspector-section"><span className="mini-label">ON-SCREEN TEXT · MAX 5 WORDS</span><input value={selected.onScreenText} onChange={(e) => onSceneChange({ ...selected, onScreenText: e.target.value.toUpperCase().slice(0, 42) })} /></div>
            <div className="continuity-box">
              <span className="mini-label">CONTINUITY TAGS</span>
              <p><UserRound size={13} />{selected.continuityTags.character}</p>
              <p><span className="outfit-swatch" />{selected.continuityTags.outfit}</p>
              <p><MapPin size={13} />{selected.continuityTags.environment}</p>
            </div>
            <div className="inspector-section"><span className="mini-label">CAMERA</span><p className="small-copy">{selected.camera}</p></div>
            {selected.aiRiskFlags.length > 0 ? (
              <div className="risk-box"><TriangleAlert size={15} /><div><strong>AI risk flagged</strong>{selected.aiRiskFlags.map((risk) => <p key={risk}>{risk}</p>)}</div></div>
            ) : (
              <div className="pass-box"><Check size={15} />No model-risk flags</div>
            )}
          </aside>
        )}
      </div>

      {/* Cost-Approval Gate Modal */}
      {costApprovalData && (
        <Modal
          title="Approve Claude API Spend"
          description="Cost-approval gate active. No external provider call is made without your explicit confirmation."
          onClose={() => setCostApprovalData(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <DollarSign size={20} style={{ color: 'var(--color-green)' }} />
                <span style={{ fontSize: 16, fontWeight: 700 }}>Estimated Cost: ~${costApprovalData.estimatedCostUsd.toFixed(3)} USD</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <div>Daily Spend Today: <strong>${costApprovalData.spendStatus.spentToday.toFixed(3)}</strong></div>
                <div>Remaining Limit: <strong>${costApprovalData.spendStatus.remainingToday.toFixed(3)}</strong></div>
                <div>Daily Cap: <strong>${costApprovalData.spendStatus.dailyLimit.toFixed(2)}</strong></div>
                <div>Provider: <strong>Anthropic Claude 3.5 Sonnet</strong></div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              This request will generate a {project.targetLength}-second multi-scene animation script with validated continuity tags, single-action semantics, and 140–160 WPM narration pacing.
            </p>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setCostApprovalData(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => void triggerClaudeGeneration(true)}>
                <ShieldAlert size={15} /> Approve & Dispatch (${costApprovalData.estimatedCostUsd.toFixed(3)})
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
