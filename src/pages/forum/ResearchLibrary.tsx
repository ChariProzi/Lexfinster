import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listResearchLibrary } from '../../api/forum'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, EmptyState, Badge } from '../../components/ui/primitives'
import { Input } from '../../components/ui/form'
import { fmt, isPast } from '../../lib/dates'

export default function ResearchLibrary() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['research-library', userId], queryFn: () => listResearchLibrary(userId) })
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const all = query.data ?? []
    if (!q.trim()) return all
    const needle = q.toLowerCase()
    return all.filter((e) => e.title.toLowerCase().includes(needle) || e.issue.toLowerCase().includes(needle))
  }, [query.data, q])

  return (
    <div>
      <PageHeader title="Research Library" description="Partner-cleared research, reusable across matters." />
      <div className="mb-3"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by issue or title…" className="max-w-md" /></div>
      <SixState
        query={query}
        isEmpty={rows.length === 0}
        emptyState={<EmptyState title="Nothing in the library yet" description="Cleared answers and accepted research submissions land here." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {rows.map((e) => {
            const reviewDue = e.stillGoodLawReviewDate ? isPast(e.stillGoodLawReviewDate) : false
            return (
              <button key={e.id} onClick={() => navigate(`/forum/library/${e.id}`)} className="flex w-full flex-col gap-1 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[13px] font-semibold text-ink-900">{e.title}</div>
                  {reviewDue && <Badge tone="warn">Review due</Badge>}
                </div>
                <div className="text-xs text-ink-500">{e.shortAnswer}</div>
                <div className="text-[11px] text-ink-400">Source: {e.source} · {e.stillGoodLawReviewDate ? `Next review ${fmt(e.stillGoodLawReviewDate)}` : 'No review date set'}</div>
              </button>
            )
          })}
        </div>
      </SixState>
    </div>
  )
}
