import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listMyResearch } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, EmptyState } from '../../components/ui/primitives'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt, daysUntil } from '../../lib/dates'

export default function MyResearch() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['my-research', userId], queryFn: () => listMyResearch(userId) })
  const rows = query.data ?? []

  return (
    <div>
      <PageHeader title="My Research" description="Research tasks assigned to you, converted from forum questions or requested directly." />
      <SixState
        query={query}
        isEmpty={rows.length === 0}
        emptyState={<EmptyState title="Nothing assigned" description="Research tasks assigned to you will show up here." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {rows.map((t) => {
            const matter = t.matterId ? matters.find((m) => m.id === t.matterId) : undefined
            const days = daysUntil(t.neededByDate)
            return (
              <button key={t.id} onClick={() => navigate(`/forum/research/${t.id}`)} className="flex w-full items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink-900">{t.question}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{matter ? `${matter.title} · ${matter.caseNumber}` : 'General'} · needed by {fmt(t.neededByDate)}{days !== null && days < 3 && days >= 0 ? ` (${days}d)` : ''}{days !== null && days < 0 ? ' · overdue' : ''}</div>
                </div>
                <StatusBadge variant="taskStatus" value={t.status === 'NotStarted' ? 'ToDo' : t.status === 'InProgress' ? 'InProgress' : t.status === 'Submitted' ? 'InReview' : t.status === 'Returned' ? 'Returned' : 'Done'} />
              </button>
            )
          })}
        </div>
      </SixState>
    </div>
  )
}
