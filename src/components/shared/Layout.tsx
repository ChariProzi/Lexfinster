import { useState, type ReactNode } from 'react'
import { ChevronUp, Monitor } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Sheet } from '../ui/overlay'
import { Button } from '../ui/primitives'

/**
 * Desktop: literal two-pane (primary + fixed-width context rail).
 * Mobile: primary pane full-width; context rail collapses to a bottom summary
 * strip that expands into a full bottom sheet on tap.
 */
export function TwoPaneShell({ primary, contextRail, contextSummary, railTitle = 'Details' }: {
  primary: ReactNode
  contextRail: ReactNode
  contextSummary?: ReactNode
  railTitle?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-1 gap-4 pb-14 lg:pb-0">
      <div className="min-w-0 flex-1">{primary}</div>
      <div className="hidden w-[320px] shrink-0 lg:block">{contextRail}</div>
      <button
        onClick={() => setOpen(true)}
        className="fixed inset-x-0 bottom-14 z-20 flex items-center justify-between border-t border-ink-200 bg-paper px-4 py-2.5 text-sm shadow-pop lg:hidden"
      >
        <span className="flex items-center gap-1.5 font-medium text-ink-800"><ChevronUp className="h-3.5 w-3.5" />{railTitle}</span>
        <span className="text-ink-500">{contextSummary}</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={railTitle} side="bottom">
        {contextRail}
      </Sheet>
    </div>
  )
}

/**
 * Tier-C (desktop-primary) screens show a genuine reduced mobile summary and
 * an explicit hand-off to desktop — never a squeezed replica of the table.
 */
export function TierCReducedView({ desktop, summaryItems, editOnDesktopHref }: {
  desktop: ReactNode
  summaryItems: { label: string; value: ReactNode }[]
  editOnDesktopHref?: string
}) {
  return (
    <>
      <div className="hidden md:block">{desktop}</div>
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start gap-2.5 rounded-md border border-ink-300 bg-surface px-3.5 py-3">
          <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
          <div className="text-xs text-ink-600">This screen is built for a larger display. Here's a summary — open it on desktop to make changes.</div>
        </div>
        <div className="divide-y divide-ink-100 rounded-lg border border-ink-200 bg-paper">
          {summaryItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <span className="text-ink-500">{item.label}</span>
              <span className="font-medium text-ink-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function SegmentedTabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="inline-flex rounded-md border border-ink-300 bg-surface p-0.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn('rounded px-3 py-1.5 text-xs font-semibold transition-colors', active === t.key ? 'bg-paper text-ink-900 shadow-card' : 'text-ink-500')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Section({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-ink-200 bg-paper', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-ink-200 px-3.5 py-2.5">
          {typeof title === 'string' ? <span className="text-[13px] font-semibold text-ink-900">{title}</span> : title}
          {actions}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

export function ConfirmInline({ onConfirm, label = 'Are you sure?', confirmLabel = 'Confirm', onCancel }: { onConfirm: () => void; label?: string; confirmLabel?: string; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-risk-critical-border bg-risk-critical-bg px-3 py-2 text-xs text-risk-critical">
      <span className="flex-1">{label}</span>
      <Button size="sm" variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      <Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  )
}
