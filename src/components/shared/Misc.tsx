import { useState, type ReactNode } from 'react'
import { Highlighter, Underline, PenLine, StickyNote, Type, Minus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Badge } from '../ui/primitives'
import { Sheet } from '../ui/overlay'
import { Checkbox, RadioCard, Textarea } from '../ui/form'
import { fmtDateTime } from '../../lib/dates'
import type { AnnotationVisibility, ExtractionConfidence } from '../../data/types'

// ---------------------------------------------------------------------------
// ProvisionChip — every computed date carries one; click opens the rule explainer.
// ---------------------------------------------------------------------------
export function ProvisionChip({ label, dual, notEncoded, onClick }: { label: string; dual?: string; notEncoded?: boolean; onClick?: () => void }) {
  if (notEncoded) {
    return (
      <button onClick={onClick} className="rounded border border-dashed border-risk-warn-border bg-risk-warn-bg px-2 py-0.5 font-mono text-[11px] text-risk-warn-ink" title="Local rule not encoded — verify">
        {label} · verify
      </button>
    )
  }
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded border border-ink-300 bg-paper px-2 py-0.5 font-mono text-[11px] text-ink-800 hover:border-ink-900">
      {label}
      {dual && <span className="text-ink-400">→ {dual}</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// StatusBadge — variant-driven wrapper over Badge; one component, many enums.
// ---------------------------------------------------------------------------
type StatusVariant = 'tier' | 'deadlineRisk' | 'sync' | 'clearance' | 'download' | 'review' | 'taskStatus'
export function StatusBadge({ variant, value }: { variant: StatusVariant; value: string }) {
  const map: Record<string, { tone: 'neutral' | 'ink' | 'critical' | 'warn' | 'safe' | 'brand'; label: string; prefix?: string }> = {
    // tier
    Crucial: { tone: 'ink', label: 'Crucial', prefix: '▲' },
    Medium: { tone: 'neutral', label: 'Medium', prefix: '●' },
    Low: { tone: 'neutral', label: 'Low', prefix: '○' },
    // deadline risk / status
    Upcoming: { tone: 'neutral', label: 'Upcoming' },
    Met: { tone: 'safe', label: 'Met' },
    Missed: { tone: 'critical', label: 'Breached' },
    Overridden: { tone: 'neutral', label: 'Overridden' },
    NeedsJudgement: { tone: 'warn', label: 'Needs judgement' },
    // sync
    Healthy: { tone: 'safe', label: 'Healthy' },
    Delayed: { tone: 'warn', label: 'Delayed' },
    Failing: { tone: 'critical', label: 'Failing' },
    ManualOnly: { tone: 'critical', label: 'Manual only' },
    // clearance
    Open: { tone: 'neutral', label: 'Open' },
    Answered: { tone: 'brand', label: 'Answered' },
    PartnerCleared: { tone: 'safe', label: 'Partner cleared' },
    Closed: { tone: 'neutral', label: 'Closed' },
    // download
    OnDevice: { tone: 'safe', label: 'On device' },
    Downloading: { tone: 'brand', label: 'Downloading' },
    Queued: { tone: 'neutral', label: 'Queued' },
    CloudOnly: { tone: 'neutral', label: 'Cloud only' },
    Evicted: { tone: 'critical', label: 'Evicted' },
    Failed: { tone: 'critical', label: 'Failed' },
    // review / task status
    NeedsReview: { tone: 'warn', label: 'Needs review' },
    AwaitingInfo: { tone: 'neutral', label: 'Awaiting info' },
    Confirmed: { tone: 'safe', label: 'Confirmed' },
    ToDo: { tone: 'neutral', label: 'To do' },
    InProgress: { tone: 'brand', label: 'In progress' },
    Blocked: { tone: 'critical', label: 'Blocked' },
    InReview: { tone: 'warn', label: 'In review' },
    Returned: { tone: 'critical', label: 'Returned' },
    Done: { tone: 'safe', label: 'Done' },
  }
  const entry = map[value] ?? { tone: 'neutral' as const, label: value }
  return <Badge tone={entry.tone} mono={variant !== 'tier'}>{entry.prefix && <span>{entry.prefix}</span>} {entry.label}</Badge>
}

// ---------------------------------------------------------------------------
// EscalationChain — full send history, never a single timestamp.
// ---------------------------------------------------------------------------
export function EscalationChain({ sentAt, escalatedTo, escalatedAt }: { sentAt: string[]; escalatedTo?: string; escalatedAt?: string }) {
  return (
    <div className="font-mono text-[11px] text-ink-500">
      Sent {sentAt.map((_, i) => `${i === 0 ? '' : ', '}${['now', '3d', '24h'][i] ?? `send ${i + 1}`}`).join('')}
      {escalatedTo && (
        <>
          {' '}· escalated to <span className="font-semibold text-ink-800">{escalatedTo}</span> {escalatedAt ? fmtDateTime(escalatedAt) : ''}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PrivacySelector — enum-driven, used by annotations / forum questions / drafts.
// ---------------------------------------------------------------------------
export function PrivacySelector<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; description?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <RadioCard key={o.value} selected={value === o.value} onClick={() => onChange(o.value)} title={o.label} description={o.description} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RedactedText — server decides redaction; component just renders the string.
// ---------------------------------------------------------------------------
export function RedactedText({ value, isRedacted }: { value: string; isRedacted?: boolean }) {
  if (!isRedacted) return <>{value}</>
  return <span className="italic text-ink-500">{value} <span className="font-mono text-[10px] not-italic text-ink-400">redacted</span></span>
}

// ---------------------------------------------------------------------------
// ConfidenceBadge + SourceSpanLink
// ---------------------------------------------------------------------------
export function ConfidenceBadge({ level }: { level: ExtractionConfidence }) {
  const tone = level === 'High' ? 'safe' : level === 'Medium' ? 'warn' : 'critical'
  return <Badge tone={tone}>Confidence: {level}</Badge>
}

export function SourceSpanLink({ onClick, label = 'View source' }: { onClick?: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="text-xs font-medium text-brand-500 underline underline-offset-2 hover:text-brand-700">
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// ConfidenceBanner — mandatory wherever the system proposes a date/task/field.
// ---------------------------------------------------------------------------
export function ConfidenceBanner({ level, description, onConfirm, onEdit, onDismiss }: { level: ExtractionConfidence; description?: string; onConfirm?: () => void; onEdit?: () => void; onDismiss?: () => void }) {
  return (
    <div className="rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-3">
      <div className="text-[13px] font-semibold text-risk-warn-ink">Extracted automatically · confidence: {level}</div>
      <div className="mt-0.5 text-[12.5px] leading-relaxed text-risk-warn-ink">{description ?? 'Confirm every field before this creates deadlines. Nothing here is binding until a person presses Confirm.'}</div>
      <div className="mt-2.5 flex gap-2">
        {onConfirm && <button onClick={onConfirm} className="rounded bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white">Confirm</button>}
        {onEdit && <button onClick={onEdit} className="rounded border border-ink-900 bg-paper px-3 py-1.5 text-xs font-semibold text-ink-900">Edit</button>}
        {onDismiss && <button onClick={onDismiss} className="rounded border border-ink-300 bg-paper px-3 py-1.5 text-xs font-semibold text-ink-500">Dismiss</button>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SopChecklist — ordered steps, checkbox + guidance + attachment + N/A reason.
// ---------------------------------------------------------------------------
export interface SopStep {
  id: string
  order: number
  label: string
  checked: boolean
  guidance?: string
  naReason?: string
  requiredAttachment?: boolean
}
export function SopChecklist({ steps, onToggle, onMarkNA }: { steps: SopStep[]; onToggle: (id: string, checked: boolean) => void; onMarkNA?: (id: string, reason: string) => void }) {
  const [naFor, setNaFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const done = steps.filter((s) => s.checked).length
  return (
    <div className="rounded-lg border border-ink-200 bg-paper">
      <div className="flex items-center justify-between border-b border-ink-200 px-3.5 py-2.5">
        <span className="text-[13px] font-semibold text-ink-900">SOP checklist</span>
        <span className="font-mono text-xs text-ink-500">{done}/{steps.length}</span>
      </div>
      <div className="h-1 w-full bg-ink-100">
        <div className="h-1 bg-ink-900 transition-all" style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }} />
      </div>
      <ul className="divide-y divide-ink-100">
        {steps.map((s) => (
          <li key={s.id} className="px-3.5 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <Checkbox checked={s.checked} onChange={(e) => onToggle(s.id, e.target.checked)} label={<span className={cn('font-medium', s.checked && 'text-ink-400 line-through')}>{s.order}. {s.label}{s.requiredAttachment && <span className="ml-1 text-ink-400">📎</span>}</span>} />
              {onMarkNA && !s.checked && (
                <button onClick={() => setNaFor(naFor === s.id ? null : s.id)} className="shrink-0 font-mono text-[10px] text-ink-400 underline">N/A</button>
              )}
            </div>
            {s.guidance && <div className="mt-1 pl-6 text-xs text-ink-500">{s.guidance}</div>}
            {s.naReason && <div className="mt-1 pl-6 text-xs italic text-ink-500">Marked N/A: {s.naReason}</div>}
            {naFor === s.id && onMarkNA && (
              <div className="mt-2 flex gap-2 pl-6">
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason this step doesn't apply…" className="min-h-8 flex-1 py-1.5 text-xs" />
                <button
                  onClick={() => { onMarkNA(s.id, reason); setNaFor(null); setReason('') }}
                  className="shrink-0 rounded bg-ink-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                >Save</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AnnotationToolbar — desktop top toolbar, mobile bottom toolbar (thumb zone).
// ---------------------------------------------------------------------------
const TOOLS = [
  { key: 'Highlight', icon: Highlighter },
  { key: 'Underline', icon: Underline },
  { key: 'Strike', icon: Minus },
  { key: 'Freehand', icon: PenLine },
  { key: 'StickyNote', icon: StickyNote },
  { key: 'TextBox', icon: Type },
] as const

export function AnnotationToolbar({ placement, active, onSelect }: { placement: 'top' | 'bottom'; active: string | null; onSelect: (tool: string) => void }) {
  return (
    <div className={cn('flex items-center gap-1 border-ink-200 bg-paper px-2 py-1.5', placement === 'top' ? 'rounded-t-lg border-b' : 'rounded-b-lg border-t')}>
      {TOOLS.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={cn('flex h-8 w-8 items-center justify-center rounded transition-colors', active === t.key ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}
          title={t.key}
        >
          <t.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter sheet wrapper — dense table filters collapse to a bottom sheet on mobile.
// ---------------------------------------------------------------------------
export function FilterSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Sheet open={open} onClose={onClose} title="Filters" side="bottom">
      <div className="flex flex-col gap-3">{children}</div>
    </Sheet>
  )
}

export function visibilityOptionsFor(kind: 'annotation' | 'draft'): { value: AnnotationVisibility; label: string; description?: string }[] {
  if (kind === 'annotation') {
    return [
      { value: 'Private', label: 'Private (only me)', description: 'Default — never shared unless you change this.' },
      { value: 'MatterTeam', label: 'Matter team' },
      { value: 'CaseAdminsOnly', label: 'Case Admins only' },
    ]
  }
  return [
    { value: 'Private', label: 'Private (only me)' },
    { value: 'MatterTeam', label: 'Matter team' },
    { value: 'CaseAdminsOnly', label: 'Case Admins only' },
  ]
}
