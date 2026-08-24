import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useToast } from '../../lib/toast'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export function Modal({ open, onClose, title, children, footer, size = 'md' }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} />
      <div className={cn('relative flex max-h-[88vh] w-full flex-col rounded-lg bg-paper shadow-pop', widths[size])}>
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-3.5">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-ink-500 hover:bg-ink-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-200 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Bottom sheet on mobile widths, side panel on desktop — used for filters and context rails. */
export function Sheet({ open, onClose, title, children, side = 'right' }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; side?: 'right' | 'bottom' }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} />
      <div
        className={cn(
          'relative ml-auto flex flex-col bg-paper shadow-pop',
          side === 'right' ? 'h-full w-full max-w-sm' : 'mt-auto h-auto max-h-[85vh] w-full rounded-t-lg',
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-ink-500 hover:bg-ink-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: ReactNode; count?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-ink-200 scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            active === t.key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800',
          )}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className={cn('rounded-full px-1.5 text-[10px] font-mono', active === t.key ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

export function ToastHost() {
  const { toasts, dismiss } = useToast()
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'flex cursor-pointer items-start gap-2 rounded-md border px-3.5 py-2.5 text-sm shadow-pop',
            t.kind === 'success' && 'border-risk-safe-border bg-paper text-ink-900',
            t.kind === 'error' && 'border-risk-critical-border bg-paper text-ink-900',
            t.kind === 'info' && 'border-ink-300 bg-paper text-ink-900',
          )}
        >
          {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-safe" />}
          {t.kind === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical" />}
          {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>,
    document.body,
  )
}
