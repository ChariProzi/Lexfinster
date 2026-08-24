import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  /** Included in the mobile stacked card's 3-field summary. Omit for desktop-only columns. */
  mobile?: 'primary' | 'secondary' | 'tertiary' | 'status' | 'hide'
}

/**
 * Merges the four dense-table screens (All Matters, Document Manager, Case
 * Bundles, Audit Log) into one generic table→card pair, per
 * CONFLICTS_AND_ASSUMPTIONS.md's reconciliation decision.
 */
export function DataTable<T extends { id: string }>({ columns, rows, onRowClick }: { columns: Column<T>[]; rows: T[]; onRowClick?: (row: T) => void }) {
  const primary = columns.find((c) => c.mobile === 'primary') ?? columns[0]
  const secondary = columns.find((c) => c.mobile === 'secondary')
  const tertiary = columns.find((c) => c.mobile === 'tertiary')
  const status = columns.find((c) => c.mobile === 'status')

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-lg border border-ink-200 bg-paper md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-surface">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-ink-500', c.className)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick?.(row)} className={cn('border-b border-ink-100 last:border-0', onRowClick && 'cursor-pointer hover:bg-ink-50')}>
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-3 py-2.5 align-middle', c.className)}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards — 3 fields + 1 status glyph, tap to expand (navigates like a row click). */}
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <button key={row.id} onClick={() => onRowClick?.(row)} className="flex flex-col gap-1 rounded-lg border border-ink-200 bg-paper p-3 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-[13px] font-semibold text-ink-900">{primary.render(row)}</div>
              {status && <div className="shrink-0">{status.render(row)}</div>}
            </div>
            {secondary && <div className="text-xs text-ink-500">{secondary.render(row)}</div>}
            {tertiary && <div className="text-xs text-ink-500">{tertiary.render(row)}</div>}
          </button>
        ))}
      </div>
    </>
  )
}
