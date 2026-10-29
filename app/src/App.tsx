import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Bell, BookOpenCheck, CalendarDays, Clapperboard, Command, Film, FolderKanban, LayoutDashboard, Menu, Palette, PlaySquare, Plus, Search, Sparkles, TrendingUp, UserRound, UsersRound, WandSparkles, X } from 'lucide-react'
import { Button, Field, Modal } from '@/components/UI'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { cx } from '@/lib/cx'
import Dashboard from '@/pages/Dashboard'
import StyleLibrary from '@/pages/StyleLibrary'
import ScriptStudio from '@/pages/ScriptStudio'
import CharacterStudio from '@/pages/CharacterStudio'
import VideoBuilder from '@/pages/VideoBuilder'
import AIVideoGenerator from '@/pages/AIVideoGenerator'
import CharacterAnimator from '@/pages/CharacterAnimator'
import TrendAnalyzer from '@/pages/TrendAnalyzer'
import Scheduler from '@/pages/Scheduler'
import VideoAnalyzer from '@/pages/VideoAnalyzer'
import AudienceCoach from '@/pages/AudienceCoach'
import WorkSummary, { type KanbanItem } from '@/pages/WorkSummary'
import styleData from '@/data/style-presets.json'
import { initialProject, initialReminders, initialScenes, initialSchedule, kanbanItems } from '@/data/demo'
import type { Project, Reminder, Scene, ScheduledPost, StylePreset, View } from '@/types/studio'

const styles = styleData as StylePreset[]
const validViews: View[] = ['dashboard', 'styles', 'script', 'studio', 'builder', 'aigenerate', 'character', 'trends', 'scheduler', 'analyzer', 'coach', 'work']
const navGroups: { label: string; items: { id: View; label: string; icon: typeof LayoutDashboard; shortcut?: string }[] }[] = [
  { label: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'CREATE', items: [
    { id: 'styles', label: 'Style Library', icon: Palette },
    { id: 'script', label: 'Script Studio', icon: WandSparkles },
    { id: 'studio', label: 'Characters & Worlds', icon: UserRound },
    { id: 'builder', label: 'Video Builder', icon: Clapperboard },
  ] },
  { label: 'GROW', items: [
    { id: 'trends', label: 'Trend Analyzer', icon: TrendingUp },
    { id: 'scheduler', label: 'Scheduler', icon: CalendarDays },
    { id: 'analyzer', label: 'Video Analyzer', icon: BarChart3 },
    { id: 'coach', label: 'Audience Coach', icon: UsersRound },
  ] },
  { label: 'WORK', items: [{ id: 'work', label: 'Summary & Reminders', icon: FolderKanban }] },
]
const viewNames: Record<View, string> = {
  dashboard: 'Studio overview', styles: 'Style Library', script: 'Script Studio', studio: 'Character & Background Studio', builder: 'Video Builder', aigenerate: 'AI Video Generator (Experimental Canvas Lab)', character: 'Character Animator (Experimental Canvas Lab)', trends: 'Trend Analyzer', scheduler: 'Posting Scheduler', analyzer: 'Video Analyzer', coach: 'Audience Coach', work: 'Work Summary & Reminders',
}

function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? JSON.parse(stored) as T : initialValue
    } catch { return initialValue }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)) } catch { /* Browser storage may be unavailable. */ }
  }, [key, value])
  return [value, setValue] as const
}

function initialView(): View {
  const hash = window.location.hash.replace('#', '') as View
  return validViews.includes(hash) ? hash : 'dashboard'
}

export default function App() {
  const [view, setView] = useState<View>(initialView)
  const [project, setProject] = useStoredState<Project>('animstudio-project', initialProject)
  const [scenes, setScenes] = useStoredState<Scene[]>('animstudio-scenes', initialScenes)
  const [schedule, setSchedule] = useStoredState<ScheduledPost[]>('animstudio-schedule', initialSchedule)
  const [reminders, setReminders] = useStoredState<Reminder[]>('animstudio-reminders', initialReminders)
  const [items, setItems] = useStoredState<KanbanItem[]>('animstudio-kanban', kanbanItems)
  const [toast, setToast] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newIdea, setNewIdea] = useState('')
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(68)
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const currentStyle = styles.find((style) => style.id === project.styleId) || styles[10]
  const openReminderCount = reminders.filter((item) => !item.done).length

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => current === message ? '' : current), 2800)
  }, [])

  const navigate = useCallback((next: View) => {
    setView(next)
    window.location.hash = next
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const onHash = () => setView(initialView())
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault(); setNewOpen(true)
      }
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey) }
  }, [])

  useEffect(() => {
    if (!rendering) return
    const timer = window.setInterval(() => {
      setRenderProgress((current) => {
        const next = Math.min(100, current + 2)
        if (next === 100) {
          window.clearInterval(timer)
          setRendering(false)
          notify('Local pipeline simulation complete; sample QA is ready')
        }
        return next
      })
    }, 140)
    return () => window.clearInterval(timer)
  }, [rendering, notify])

  const generateScenes = () => {
    if (!project.idea.trim()) { notify('Add an idea before generating a director draft'); return }
    const draft = initialScenes.map((scene, index) => ({
      ...scene,
      narration: index === 0 ? `What if ${project.idea.trim().replace(/[.!?]+$/, '')}?` : scene.narration,
    }))
    setScenes(draft)
    setProject({ ...project, status: 'Script' })
    notify('Five-scene local director draft created with continuity tags')
  }

  const useStyle = (style: StylePreset) => {
    setProject({ ...project, styleId: style.id })
    navigate('script')
    notify(`${style.name} applied; compatible assets are now filtered`)
  }

  const developIdea = (idea: string, title = 'Untitled Short') => {
    setProject({ ...project, idea, title, status: 'Idea' })
    navigate('script')
    notify('Idea added to a fresh creative brief')
  }

  const createProject = () => {
    if (!newTitle.trim() || !newIdea.trim()) return
    setProject({ ...initialProject, title: newTitle.trim(), idea: newIdea.trim(), styleId: project.styleId, status: 'Idea' })
    setScenes([])
    setNewTitle(''); setNewIdea(''); setNewOpen(false)
    navigate('script')
    notify('New local project created')
  }

  const downloadSummary = () => {
    const report = `ANIMSTUDIO AI — WORK SUMMARY\n\nProject: ${project.title}\nGenre: ${project.genre}\nStyle: ${currentStyle.name}\nFormat: ${project.aspectRatio} (${project.aspectRatio === '9:16' ? '1080x1920' : '1920x1080'})\nScenes: ${scenes.length}\nDuration: ${scenes.reduce((sum, scene) => sum + scene.duration, 0)} seconds\nStatus: ${project.status}\n\nCOMPLETED\nCreative brief, scene JSON, continuity tags, render plan, caption plan, QA plan.\n\nCREATOR REVIEW\nCheck character continuity, scene 04 lantern glow, caption safe zones, and narration pacing.\n\nRECOMMENDED POST\nFriday at 19:30 IST (starting heuristic).\n\nPrototype note: no paid API or live social platform was used.`
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url; link.download = `${project.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-summary.txt`; link.click()
    URL.revokeObjectURL(url)
    notify('Work summary downloaded')
  }

  const page = (() => {
    switch (view) {
      case 'dashboard': return <Dashboard project={project} style={currentStyle} scene={scenes[0] || initialScenes[0]} schedule={schedule} reminders={reminders} onNavigate={navigate} onToggleReminder={(id) => setReminders(reminders.map((item) => item.id === id ? { ...item, done: !item.done } : item))} />
      case 'styles': return <StyleLibrary styles={styles} currentStyle={currentStyle} onUse={useStyle} notify={notify} />
      case 'script': return <ScriptStudio project={project} styles={styles} scenes={scenes} onProjectChange={setProject} onGenerate={generateScenes} onScenesSet={setScenes} onSceneChange={(scene) => setScenes(scenes.map((item) => item.id === scene.id ? scene : item))} onNavigate={navigate} notify={notify} />
      case 'studio': return <CharacterStudio style={currentStyle} notify={notify} />
      case 'builder': return <VideoBuilder project={project} style={currentStyle} scenes={scenes.length ? scenes : initialScenes} renderProgress={renderProgress} rendering={rendering} onStartRender={() => { setRenderProgress(0); setRendering(true) }} onProjectChange={setProject} onDownload={downloadSummary} notify={notify} />
      case 'aigenerate': return <AIVideoGenerator notify={notify} />
      case 'character': return <CharacterAnimator notify={notify} />
      case 'trends': return <TrendAnalyzer onUseIdea={developIdea} notify={notify} />
      case 'scheduler': return <Scheduler schedule={schedule} projectTitle={project.title} onAdd={(post) => { setSchedule([...schedule, post]); notify(`Reminder saved for ${post.day} at ${post.time} IST`) }} onRemove={(id) => { setSchedule(schedule.filter((post) => post.id !== id)); notify('Posting reminder removed') }} notify={notify} />
      case 'analyzer': return <VideoAnalyzer onApply={(idea) => developIdea(idea, 'The Cloud Repair Shop — Retention Cut')} notify={notify} />
      case 'coach': return <AudienceCoach onUseIdea={developIdea} notify={notify} />
      case 'work': return <WorkSummary project={project} style={currentStyle} items={items} reminders={reminders} onMove={(id, status) => { setItems(items.map((item) => item.id === id ? { ...item, status } : item)); notify(`Project moved to ${status}`) }} onToggleReminder={(id) => setReminders(reminders.map((item) => item.id === id ? { ...item, done: !item.done } : item))} onDownload={downloadSummary} onNavigate={navigate} notify={notify} />
    }
  })()

  const flatNav = navGroups.flatMap((group) => group.items)
  const searchResults = flatNav.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="studio-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={cx('sidebar', mobileOpen && 'is-open')}>
        <div className="brand"><span className="brand-mark"><Film size={20} strokeWidth={1.8} /></span><div><strong>AnimStudio</strong><span>AI DIRECTOR</span></div><Button className="mobile-close" size="icon" variant="ghost" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={18} /></Button></div>
        <Button variant="primary" className="new-project-btn" onClick={() => setNewOpen(true)}><Plus size={16} />New video<span>⌘ N</span></Button>
        <nav className="main-nav" aria-label="Studio modules">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><Icon size={17} strokeWidth={1.7} /><span>{item.label}</span>{item.id === 'builder' && <i />}</button> })}</div>)}
        </nav>
        <div className="sidebar-foot">
          <div className="local-status">
            <span className="status-dot" style={{ background: user ? '#22c55e' : undefined }} />
            <div>
              <strong>{user ? 'Supabase Connected' : 'Local prototype'}</strong>
              <small>{user ? 'Row-Level Security active' : 'Click PR avatar to connect database'}</small>
            </div>
          </div>
          <p>{user ? 'Projects, scripts, and scenes sync to your private cloud database.' : 'Edits stay in this browser. Cloud sync requires Supabase.'}</p>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left"><Button className="mobile-menu" size="icon" variant="ghost" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></Button><BookOpenCheck size={16} /><span>THE LAST LANTERN</span><i>/</i><strong>{viewNames[view]}</strong></div>
          <div className="topbar-right">
            <button className="search-trigger" onClick={() => setSearchOpen(true)}><Search size={15} /><span>Jump to a module</span><kbd>⌘ K</kbd></button>
            <button className="notification-btn" aria-label={`${openReminderCount} open reminders`} onClick={() => navigate('work')}><Bell size={17} />{openReminderCount > 0 && <span>{openReminderCount}</span>}</button>
            <button
              className="creator-avatar"
              onClick={() => setAuthOpen(true)}
              title={user ? `Signed in as ${user.email} (Manage database & migration)` : 'Sign in to Supabase / Database Migration'}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {user ? (user.email?.[0].toUpperCase() || 'PR') : 'PR'}
              {user && <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#22c55e', border: '1.5px solid #1c1d20' }} />}
            </button>
          </div>
        </header>
        <main id="main-content">{page}</main>
      </div>

      {toast && <div className="toast" role="status"><Sparkles size={16} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={14} /></button></div>}

      {authOpen && (
        <AuthModal
          user={user}
          onUserChange={setUser}
          onClose={() => setAuthOpen(false)}
          notify={notify}
        />
      )}

      {searchOpen && <Modal title="Jump to a module" description="Search the complete AnimStudio workspace." onClose={() => { setSearchOpen(false); setSearchQuery('') }}>
        <label className="command-search"><Search size={17} /><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type a module name…" /></label>
        <div className="command-results">{searchResults.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { navigate(item.id); setSearchOpen(false); setSearchQuery('') }}><Icon size={17} /><span>{item.label}</span><Command size={13} /></button> })}</div>
      </Modal>}

      {newOpen && <Modal title="Start a new video" description="Create a local brief. Provider selection and spending come much later." onClose={() => setNewOpen(false)}>
        <form onSubmit={(event) => { event.preventDefault(); createProject() }}>
          <Field label="Working title"><input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. The Clock That Waited" required /></Field>
          <Field label="One-sentence idea"><textarea rows={4} value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="Give the story one visible object, person, or problem…" required /></Field>
          <div className="new-project-format"><PlaySquare size={18} /><span><strong>9:16 vertical master</strong><small>1080 × 1920 · Shorts/Reels safe zones</small></span></div>
          <div className="modal-actions"><Button onClick={() => setNewOpen(false)}>Cancel</Button><Button variant="primary" type="submit">Create creative brief</Button></div>
        </form>
      </Modal>}
    </div>
  )
}
