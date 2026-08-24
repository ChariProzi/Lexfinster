import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Field({ label, hint, error, required, children, className }: { label?: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-ink-800">
          {label} {required && <span className="text-risk-critical">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-risk-critical">{error}</span>}
    </label>
  )
}

const controlClass = 'w-full rounded-md border border-ink-300 bg-paper px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200'

export function Input({ className, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={cn(controlClass, error && 'border-risk-critical', className)} {...rest} />
}

export function Textarea({ className, error, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cn(controlClass, 'min-h-24 resize-y', error && 'border-risk-critical', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, 'pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-start gap-2 text-sm text-ink-800', className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-400 text-ink-900 focus:ring-brand-300" {...rest} />
      {label}
    </label>
  )
}

export function RadioCard({ selected, onClick, title, description, disabled }: { selected: boolean; onClick: () => void; title: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full flex-col gap-0.5 rounded-md border px-3.5 py-2.5 text-left transition-colors disabled:opacity-40',
        selected ? 'border-ink-900 bg-ink-50 ring-1 ring-ink-900' : 'border-ink-300 hover:border-ink-500',
      )}
    >
      <span className="text-sm font-semibold text-ink-900">{title}</span>
      {description && <span className="text-xs text-ink-500">{description}</span>}
    </button>
  )
}

export function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span
        onClick={() => onChange(!checked)}
        className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-ink-900' : 'bg-ink-200')}
      >
        <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-1')} />
      </span>
      {label && <span className="text-sm text-ink-800">{label}</span>}
    </label>
  )
}

export function FieldLabel({ children, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1.5 block text-[13px] font-medium text-ink-800" {...rest}>{children}</label>
}
