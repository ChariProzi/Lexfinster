import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listCauseLists } from '../../api/courtData'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Badge, EmptyState } from '../../components/ui/primitives'
import { Select } from '../../components/ui/form'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { fmt } from '../../lib/dates'
import type { CauseListEntry, CauseListStatus } from '../../data/types'

const STATUS_MAP: Record<CauseListStatus, { tone: 'neutral' | 'safe' | 'warn' | 'critical'; label: string }> = {
  Published: { tone: 'safe', label: 'Published' },
  NotYetPublished: { tone: 'neutral', label: 'Not yet published' },
  PublicationFailed: { tone: 'critical', label: 'Publication failed' },
  Unexpected: { tone: 'warn', label: 'Unexpected listing' },
  ExpectedButNotListed: { tone: 'warn', label: 'Expected but not listed' },
}

export default function CauseLists() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const forums = useDb((s) => s.forums)
  const matters = useDb((s) => s.matters)
  const [forumId, setForumId] = useState('')
  const query = useQuery({ queryKey: ['cause-lists', userId, forumId], queryFn: () => listCauseLists(userId, forumId || undefined) })

  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => a.date.localeCompare(b.date)), [query.data])

  const columns: Column<CauseListEntry>[] = [
    { key: 'date', header: 'Date', mobile: 'primary', render: (r) => fmt(r.date) },
    { key: 'court', header: 'Court / bench', mobile: 'secondary', render: (r) => r.courtOrBench },
    { key: 'item', header: 'Item #', render: (r) => r.itemNumber ?? '—' },
    { key: 'matter', header: 'Matter', mobile: 'tertiary', render: (r) => (r.matterId ? matters.find((m) => m.id === r.matterId)?.title ?? '—' : '—') },
    { key: 'purpose', header: 'Purpose', render: (r) => r.purposeOfListing },
    { key: 'opp', header: 'Opposing counsel', render: (r) => r.opposingCounsel ?? '—' },
    { key: 'status', header: 'Status', mobile: 'status', render: (r) => <Badge tone={STATUS_MAP[r.status].tone}>{STATUS_MAP[r.status].label}</Badge> },
  ]

  return (
    <div>
      <PageHeader title="Cause Lists" description="Published court listings, matched against your matters." />
      <div className="mb-3 flex flex-wrap gap-2">
        <Select value={forumId} onChange={(e) => setForumId(e.target.value)} className="w-auto">
          <option value="">All forums</option>
          {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </div>
      <SixState
        query={query}
        isEmpty={!!query.data && rows.length === 0}
        emptyState={<EmptyState title="No cause list entries" description="Nothing published for this forum yet, or the court portal hasn't returned a list." />}
      >
        <DataTable columns={columns} rows={rows} onRowClick={(r) => r.matterId && navigate(`/matters/${r.matterId}`)} />
      </SixState>
    </div>
  )
}
