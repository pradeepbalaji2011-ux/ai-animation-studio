import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '@/lib/cx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={cx('btn', `btn-${variant}`, `btn-${size}`, className)} {...props} />
})

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'red' | 'green' | 'amber' | 'blue'; className?: string }) {
  return <span className={cx('badge', `badge-${tone}`, className)}>{children}</span>
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  )
}

export function PanelHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return (
    <div className="panel-header">
      <div className="panel-title"><span>{title}</span>{meta && <span className="panel-meta">{meta}</span>}</div>
      {action}
    </div>
  )
}

export function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const firstField = modalRef.current?.querySelector('input, textarea') as HTMLElement | null
    ;(firstField || closeRef.current)?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab') {
        const focusable = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') || [])
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [])
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <Button ref={closeRef} size="icon" variant="ghost" aria-label="Close dialog" onClick={onClose}><X size={18} /></Button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}{hint && <span>{hint}</span>}</span>{children}</label>
}

export function EmptyState({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{detail}</p>{action}</div>
}
