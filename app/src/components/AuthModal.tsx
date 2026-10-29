import { useState, useEffect } from 'react'
import { CheckCircle2, Database, Loader2, LogIn, LogOut } from 'lucide-react'
import { Button, Field, Modal } from '@/components/UI'
import { isSupabaseConfigured, migrateLocalStorageToSupabase, type MigrationResult, supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function AuthModal({
  user,
  onUserChange,
  onClose,
  notify,
}: {
  user: SupabaseUser | null
  onUserChange: (user: SupabaseUser | null) => void
  onClose: () => void
  notify: (msg: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [lastMigrated, setLastMigrated] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('animstudio-migrated-at')
    if (saved) setLastMigrated(saved)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      notify('Supabase is not configured yet. Please provide VITE_SUPABASE_URL.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          onUserChange(data.user)
          notify('Account created successfully! Signed in.')
        } else {
          notify('Confirmation email sent. Please check your inbox.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          onUserChange(data.user)
          notify(`Welcome back, ${data.user.email}! Signed in to Supabase.`)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    onUserChange(null)
    notify('Signed out.')
  }

  const handleMigrate = async () => {
    if (!user) return
    setMigrating(true)
    setErrorMsg(null)

    try {
      const result = await migrateLocalStorageToSupabase(user)
      setMigrationResult(result)
      setLastMigrated(result.migratedAt)
      notify(`✓ Migration complete! Synced project, ${result.scenesCount} scenes, and reminders to Supabase.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      notify('Migration failed: ' + msg)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <Modal
      title={user ? 'Cloud Database & Account' : 'Sign in to AnimStudio Cloud'}
      description={user ? `Signed in as ${user.email} with Row-Level Security` : 'Connect your Supabase database to sync projects, scenes, and schedules.'}
      onClose={onClose}
    >
      {!isSupabaseConfigured && (
        <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: 8, padding: 14, marginBottom: 18 }}>
          <strong style={{ color: '#eab308', fontSize: 13, display: 'block', marginBottom: 4 }}>
            Supabase Connection Pending
          </strong>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            To activate cloud database sync:
            <br />1. Apply <code>AnimStudio AI Database Schema.sql</code> in your Supabase SQL editor.
            <br />2. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your environment.
          </p>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 8, padding: 12, marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="status-dot" style={{ background: 'var(--color-green)' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 14 }}>{user.email}</strong>
                  <small style={{ color: 'var(--text-secondary)' }}>Row-Level Security (RLS) Active</small>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={handleSignOut}><LogOut size={14} /> Sign out</Button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 16 }}>
              <span>User ID: <code>{user.id.slice(0, 8)}…</code></span>
              <span>Timezone: <strong>Asia/Kolkata (IST)</strong></span>
            </div>
          </div>

          {/* Migration Section */}
          <div style={{ background: 'var(--surface-panel)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Database size={17} style={{ color: 'var(--accent)' }} />
              <strong style={{ fontSize: 14 }}>One-Time Database Migration</strong>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Import your current offline browser draft (creative brief, script, 5 validated scenes, reminders, and schedule) into Supabase PostgreSQL tables.
            </p>

            {lastMigrated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-green)', marginBottom: 12 }}>
                <CheckCircle2 size={14} />
                <span>Last migrated: {new Date(lastMigrated).toLocaleString()}</span>
              </div>
            )}

            <Button
              variant="primary"
              className="full-width"
              disabled={migrating}
              onClick={handleMigrate}
            >
              {migrating ? <Loader2 size={16} className="spin" /> : <Database size={16} />}
              {migrating ? 'Migrating localStorage to Supabase…' : lastMigrated ? 'Re-sync LocalStorage to Database' : 'Migrate localStorage Data to Database'}
            </Button>
          </div>

          {migrationResult && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8, padding: 12, fontSize: 13 }}>
              <strong style={{ color: '#22c55e', display: 'block', marginBottom: 4 }}>Migration Summary:</strong>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 12 }}>
                <li>Projects migrated: {migrationResult.projectsCount}</li>
                <li>Scenes migrated: {migrationResult.scenesCount}</li>
                <li>Reminders migrated: {migrationResult.remindersCount}</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Creator email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pradeep@example.com"
              required
              disabled={loading || !isSupabaseConfigured}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading || !isSupabaseConfigured}
            />
          </Field>

          <Button
            variant="primary"
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="full-width"
          >
            {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
            {isSignUp ? 'Create Cloud Account' : 'Sign In with Email'}
          </Button>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button
              type="button"
              className="text-link"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ fontSize: 13 }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
