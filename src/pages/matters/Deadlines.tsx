import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listDeadlines } from '../../api/deadlines'
import { getMatter } from '../../api/matters'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { DeadlineRow } from '../../components/shared/DeadlineRow'

export default function Deadlines() {
  const { matterId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const matterQuery = useQuery({ queryKey: ['matter', matterId, userId], queryFn: () => getMatter(userId, matterId) })
  const query = useQuery({ queryKey: ['deadlines', matterId, userId], queryFn: () => listDeadlines(userId, matterId) })

  const needsJudgement = (query.data ?? []).filter((d) => d.status === 'NeedsJudgement')
  const rest = (query.data ?? []).filter((d) => d.status !== 'NeedsJudgement')

  return (
    <div>
      <PageHeader
        eyebrow={matterQuery.data?.caseNumber}
        title="Deadlines"
        description={matterQuery.data?.title}
      />
      <SixState query={query} isEmpty={!!query.data && query.data.length === 0} onRetry={() => query.refetch()}
        emptyState={<div className="rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center text-sm text-ink-500">No deadlines computed yet for this matter.</div>}
      >
        <div className="flex flex-col gap-4">
          {needsJudgement.length > 0 && (
            <Section title="Needs a judgement call — pinned above computed dates">
              {needsJudgement.map((d) => <DeadlineRow key={d.id} deadline={d} onOverride={() => navigate(`/matters/${matterId}/deadlines/${d.id}/override`)} />)}
            </Section>
          )}
          <Section title="Computed deadlines">
            {rest.length === 0 ? <div className="px-3.5 py-4 text-sm text-ink-500">Nothing else to show.</div> : rest.map((d) => <DeadlineRow key={d.id} deadline={d} onOverride={() => navigate(`/matters/${matterId}/deadlines/${d.id}/override`)} />)}
          </Section>
        </div>
      </SixState>
    </div>
  )
}

export function useInvalidateDeadlines() {
  const qc = useQueryClient()
  return (matterId: string) => qc.invalidateQueries({ queryKey: ['deadlines', matterId] })
}
