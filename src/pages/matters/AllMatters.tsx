import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Kanban, Plus, Download } from 'lucide-react'
import { listMatters } from '../../api/matters'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Select } from '../../components/ui/form'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { ImportanceTierChip, RiskDot } from '../../components/shared/MatterCard'
import { fmt, daysUntil } from '../../lib/dates'
import type { Matter } from '../../data/types'

export default function AllMatters() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const forums = useDb((s) => s.forums)
  const query = useQuery({ queryKey: ['matters', userId], queryFn: () => listMatters(userId) })
  const [stage, setStage] = useState('')
  const [forum, setForum] = useState('')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    let r = query.data ?? []
    if (stage) r = r.filter((m) => m.stage === stage)
    if (forum) r = r.filter((m) => m.forumId === forum)
    if (q.trim()) r = r.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()) || m.caseNumber.toLowerCase().includes(q.toLowerCase()))
    return r
  }, [query.data, stage, forum, q])

  const columns: Column<Matter>[] = [
    { key: 'case', header: 'Case', mobile: 'primary', render: (m) => (<div><div className="font-mono text-[11px] text-ink-500">{m.caseNumber}</div><div className="font-medium text-ink-900">{m.title}</div></div>) },
    { key: 'forum', header: 'Forum', mobile: 'secondary', render: (m) => forums.find((f) => f.id === m.forumId)?.name ?? '—' },
    { key: 'stage', header: 'Stage', render: (m) => <span className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{m.stage}</span> },
    { key: 'tier', header: 'Tier', render: (m) => <ImportanceTierChip tier={m.importanceTier} /> },
    { key: 'hearing', header: 'Next hearing', mobile: 'tertiary', render: (m) => m.nextHearingDate ? fmt(m.nextHearingDate) : '—' },
    { key: 'risk', header: 'Risk', mobile: 'status', render: (m) => <RiskDot level={riskFor(m.id)} /> },
  ]

  return (
    <div>
      <PageHeader
        title="All Matters"
        description="Firm-wide matter list, scoped to what you have access to."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/matters/board')}><Kanban className="h-3.5 w-3.5" />Board</Button>
            <Button variant="secondary"><Download className="h-3.5 w-3.5" />Export</Button>
            <Button variant="primary" onClick={() => navigate('/matters/new')}><Plus className="h-3.5 w-3.5" />New intake</Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title or case number…" className="w-64 rounded-md border border-ink-300 px-3 py-1.5 text-sm" />
        <Select value={stage} onChange={(e) => setStage(e.target.value)} className="w-auto">
          <option value="">All stages</option>
          {['Intake', 'PreInstitution', 'Pleadings', 'Evidence', 'Arguments', 'Reserved', 'Closed'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={forum} onChange={(e) => setForum(e.target.value)} className="w-auto">
          <option value="">All forums</option>
          {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </div>

      <SixState
        query={query}
        isEmpty={!!query.data && rows.length === 0}
        emptyState={
          <EmptyState
            title="No matters yet"
            description="Pull an existing case straight from the court portal with its CNR, or create one manually through intake."
            primaryAction={{ label: 'Import from court portal', onClick: () => navigate('/matters/new') }}
            secondaryAction={{ label: 'New intake', onClick: () => navigate('/matters/new') }}
          />
        }
      >
        <DataTable columns={columns} rows={rows} onRowClick={(m) => navigate(`/matters/${m.id}`)} />
      </SixState>
    </div>
  )
}

function riskFor(matterId: string): 'safe' | 'approaching' | 'critical' | 'breached' {
  const deadlines = useDb.getState().deadlines.filter((d) => d.matterId === matterId)
  if (deadlines.some((d) => d.status === 'Missed')) return 'breached'
  const soonest = deadlines.filter((d) => d.status === 'Upcoming').map((d) => daysUntil(d.computedDate)).filter((n): n is number => n !== null).sort((a, b) => a - b)[0]
  if (soonest === undefined) return 'safe'
  if (soonest <= 2) return 'critical'
  if (soonest <= 7) return 'approaching'
  return 'safe'
}
