import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  loading,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'
  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-[15px] px-5 py-2.5',
  }
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-ink-900 text-white hover:bg-ink-800 shadow-card',
    secondary: 'bg-paper border border-ink-300 text-ink-900 hover:bg-ink-50',
    ghost: 'text-ink-700 hover:bg-ink-100',
    danger: 'bg-risk-critical text-white hover:brightness-110',
    link: 'text-brand-500 hover:text-brand-700 underline underline-offset-2 px-0 py-0',
  }
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest} disabled={rest.disabled || loading}>
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Badge / chip — semantic risk colours reserved strictly for risk states.
// ---------------------------------------------------------------------------
type BadgeTone = 'neutral' | 'ink' | 'critical' | 'warn' | 'safe' | 'brand'

export function Badge({ tone = 'neutral', className, children, mono }: { tone?: BadgeTone; className?: string; children: ReactNode; mono?: boolean }) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-ink-100 text-ink-700 border-ink-200',
    ink: 'bg-ink-900 text-white border-ink-900',
    critical: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
    warn: 'bg-risk-warn-bg text-risk-warn-ink border-risk-warn-border',
    safe: 'bg-risk-safe-bg text-risk-safe border-risk-safe-border',
    brand: 'bg-brand-100 text-brand-700 border-brand-200',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold leading-tight', mono && 'font-mono', tones[tone], className)}>
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-lg border border-ink-200 bg-paper shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export function Avatar({ initials, dashed, size = 28, title }: { initials: string; dashed?: boolean; size?: number; title?: string }) {
  return (
    <span
      title={title}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 font-mono text-[10px] font-semibold text-ink-700', dashed ? 'border border-dashed border-ink-400' : 'border border-ink-200')}
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Empty state block
// ---------------------------------------------------------------------------
export function EmptyState({ title, description, primaryAction, secondaryAction }: {
  title: string
  description: string
  primaryAction?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center">
      <div className="flex h-16 w-20 items-center justify-center rounded border border-dashed border-ink-300 bg-[repeating-linear-gradient(135deg,var(--color-ink-100)_0,var(--color-ink-100)_5px,transparent_5px,transparent_10px)] font-mono text-[10px] text-ink-400">
        empty
      </div>
      <div className="text-[15px] font-semibold text-ink-900">{title}</div>
      <div className="max-w-md text-sm text-ink-500">{description}</div>
      {(primaryAction || secondaryAction) && (
        <div className="mt-1 flex gap-2">
          {primaryAction && <Button variant="primary" onClick={primaryAction.onClick}>{primaryAction.label}</Button>}
          {secondaryAction && <Button variant="secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
        </div>
      )}
    </div>
  )
}

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-500">{eyebrow}</div>}
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('border-t border-ink-200', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-ink-100', className)} />
}
