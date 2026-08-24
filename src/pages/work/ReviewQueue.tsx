import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { approveReview, listReviewQueue, returnReview } from '../../api/work'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState, Avatar } from '../../components/ui/primitives'
import { Textarea } from '../../components/ui/form'
import { ProvisionChip } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

export default function ReviewQueue() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const matters = useDb((s) => s.matters)
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['review-queue', userId], queryFn: () => listReviewQueue(userId) })
  const [returning, setReturning] = useState<string | null>(null)
  const [comments, setComments] = useState('')

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['review-queue'] })
    qc.invalidateQueries({ queryKey: ['task'] })
  }
  const approveMutation = useMutation({ mutationFn: (taskId: string) => approveReview(userId, taskId), onSuccess: () => { toastSuccess('Approved.'); invalidate() } })
  const returnMutation = useMutation({ mutationFn: (taskId: string) => returnReview(userId, taskId, comments), onSuccess: () => { toastSuccess('Returned.'); setReturning(null); setComments(''); invalidate() } })

  const tasks = query.data ?? []

  return (
    <div>
      <PageHeader title="Review Queue" description="Tasks submitted for review — approve, or return with comments." />
      <SixState
        query={query}
        isEmpty={!!query.data && tasks.length === 0}
        emptyState={<EmptyState title="Nothing to review" description="Tasks submitted for your review will appear here." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {tasks.map((t) => {
            const matter = matters.find((m) => m.id === t.matterId)
            const assignee = users.find((u) => u.id === t.assigneeId)
            return (
              <div key={t.id} className="border-b border-ink-100 px-4 py-3 last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button onClick={() => navigate(`/work/tasks/${t.id}`)} className="min-w-0 text-left hover:underline">
                    <div className="text-[13px] font-semibold text-ink-900">{t.title}</div>
                    <div className="text-xs text-ink-500">{matter?.title} · due {fmt(t.dueDate)}</div>
                  </button>
                  <div className="flex items-center gap-2">
                    {t.provision && <ProvisionChip label={t.provision} />}
                    {assignee && <Avatar initials={assignee.initials} size={22} title={assignee.name} />}
                  </div>
                </div>
                {returning === t.id ? (
                  <div className="mt-2.5">
                    <Textarea placeholder="What needs to change?" value={comments} onChange={(e) => setComments(e.target.value)} className="min-h-16 text-sm" />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="danger" disabled={!comments.trim()} loading={returnMutation.isPending} onClick={() => returnMutation.mutate(t.id)}>Return with comments</Button>
                      <Button size="sm" variant="secondary" onClick={() => setReturning(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="primary" loading={approveMutation.isPending} onClick={() => approveMutation.mutate(t.id)}>Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => setReturning(t.id)}>Return with comments</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SixState>
    </div>
  )
}
