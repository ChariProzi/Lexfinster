import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAuditLog } from '../../api/admin'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, EmptyState } from '../../components/ui/primitives'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { fmtDateTime } from '../../lib/dates'
import type { AuditLogEntry } from '../../data/types'

export default function AuditLog() {
  const userId = useSession((s) => s.userId)!
  const query = useQuery({ queryKey: ['audit-log', userId], queryFn: () => listAuditLog(userId) })
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const all = (query.data ?? []) as AuditLogEntry[]
    const sorted = [...all].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    if (!q.trim()) return sorted
    const needle = q.toLowerCase()
    return sorted.filter((e) => e.action.toLowerCase().includes(needle) || (e.actorName ?? '').toLowerCase().includes(needle) || e.objectType.toLowerCase().includes(needle))
  }, [query.data, q])

  const columns: Column<AuditLogEntry>[] = [
    { key: 'time', header: 'Timestamp', mobile: 'primary', className: 'whitespace-nowrap', render: (e) => <span className="font-mono text-xs">{fmtDateTime(e.timestamp)}</span> },
    { key: 'actor', header: 'Actor', mobile: 'secondary', render: (e) => e.actorName ?? '—' },
    { key: 'action', header: 'Action', mobile: 'tertiary', render: (e) => <span className="font-mono text-xs">{e.action}</span> },
    { key: 'object', header: 'Object', render: (e) => `${e.objectType}${e.objectId ? ` · ${e.objectId}` : ''}` },
    { key: 'ip', header: 'IP', render: (e) => <span className="font-mono text-xs">{e.ipAddress}</span> },
  ]

  return (
    <div>
      <PageHeader title="Audit Log" description="Insert-only. Every audit-relevant action in the firm, oldest last." />
      <div className="mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by actor, action or object type…" className="w-full max-w-md rounded-md border border-ink-300 px-3 py-1.5 text-sm sm:w-80" />
      </div>
      <SixState
        query={query}
        isEmpty={!!query.data && rows.length === 0}
        emptyState={<EmptyState title="No matching entries" description="Try a different filter." />}
      >
        <DataTable columns={columns} rows={rows.map((r) => ({ ...r, id: r.id }))} />
      </SixState>
    </div>
  )
}
