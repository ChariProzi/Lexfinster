import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { approveReview, completeTask, getTask, returnReview, setTaskBlocked, submitForReview, toggleChecklistItem, updateTask } from '../../api/work'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge, Avatar } from '../../components/ui/primitives'
import { Textarea } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SopChecklist, ProvisionChip, StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'

export default function TaskExecution() {
  const { taskId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const matters = useDb((s) => s.matters)
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['task', taskId], queryFn: () => getTask(userId, taskId) })

  const [blockReason, setBlockReason] = useState('')
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [returnComments, setReturnComments] = useState('')
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [pendingObligation, setPendingObligation] = useState<string | null>(null)

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['task', taskId] })
    qc.invalidateQueries({ queryKey: ['my-worklist'] })
    qc.invalidateQueries({ queryKey: ['review-queue'] })
  }

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, checked, naReason }: { itemId: string; checked: boolean; naReason?: string }) => toggleChecklistItem(userId, itemId, checked, naReason),
    onSuccess: invalidate,
  })
  const blockMutation = useMutation({ mutationFn: () => setTaskBlocked(userId, taskId, blockReason), onSuccess: () => { toastSuccess('Marked blocked.'); setShowBlockForm(false); invalidate() } })
  const resumeMutation = useMutation({ mutationFn: () => updateTask(userId, taskId, { status: 'InProgress', blockedReason: undefined }), onSuccess: () => { toastSuccess('Resumed.'); invalidate() } })
  const submitReviewMutation = useMutation({ mutationFn: () => submitForReview(userId, taskId), onSuccess: () => { toastSuccess('Submitted for review.'); invalidate() } })
  const approveMutation = useMutation({ mutationFn: () => approveReview(userId, taskId), onSuccess: () => { toastSuccess('Approved.'); invalidate() } })
  const returnMutation = useMutation({ mutationFn: () => returnReview(userId, taskId, returnComments), onSuccess: () => { toastSuccess('Returned to assignee.'); setShowReturnForm(false); invalidate() } })
  const completeMutation = useMutation({
    mutationFn: (confirmed?: boolean) => completeTask(userId, taskId, confirmed),
    onSuccess: (res) => {
      if (res.obligationPrompt) { setPendingObligation(res.obligationPrompt); return }
      setPendingObligation(null)
      toastSuccess('Task completed.')
      invalidate()
    },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not complete.'),
  })

  const task = query.data?.task
  const checklist = query.data?.checklist ?? []
  const matter = task ? matters.find((m) => m.id === task.matterId) : undefined
  const assignee = task ? users.find((u) => u.id === task.assigneeId) : undefined
  const reviewer = task ? users.find((u) => u.id === task.reviewerId) : undefined
  const isReviewer = task?.reviewerId === userId

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader eyebrow={matter?.caseNumber} title={task?.title ?? 'Task'} description={matter?.title} actions={task && <StatusBadge variant="taskStatus" value={task.status} />} />

      <SixState query={query} onRetry={() => query.refetch()}>
        {task && (
          <div className="flex flex-col gap-4">
            <Section title="Details">
              <div className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-3">
                <Fact label="Type" value={task.type} />
                <Fact label="Priority" value={<Badge tone={task.priority === 'High' ? 'critical' : task.priority === 'Medium' ? 'warn' : 'neutral'}>{task.priority}</Badge>} />
                <Fact label="Due" value={fmt(task.dueDate)} />
                <Fact label="Assignee" value={assignee ? <span className="flex items-center gap-1.5"><Avatar initials={assignee.initials} size={20} />{assignee.name}</span> : 'Unassigned'} />
                <Fact label="Reviewer" value={reviewer ? <span className="flex items-center gap-1.5"><Avatar initials={reviewer.initials} size={20} dashed />{reviewer.name}</span> : 'None'} />
                {task.provision && <Fact label="Linked provision" value={<ProvisionChip label={task.provision} />} />}
              </div>
              {task.description && <div className="border-t border-ink-100 px-3.5 py-3 text-sm text-ink-700">{task.description}</div>}
              {task.status === 'Blocked' && task.blockedReason && (
                <div className="border-t border-ink-100 px-3.5 py-3 text-[13px] text-risk-critical">Blocked: {task.blockedReason}</div>
              )}
            </Section>

            {checklist.length > 0 && (
              <SopChecklist
                steps={checklist.map((c) => ({ id: c.id, order: c.order, label: c.label, checked: c.checked, guidance: c.guidance, naReason: c.naReason, requiredAttachment: c.requiredAttachment }))}
                onToggle={(id, checked) => toggleMutation.mutate({ itemId: id, checked })}
                onMarkNA={(id, reason) => toggleMutation.mutate({ itemId: id, checked: false, naReason: reason })}
              />
            )}

            {pendingObligation && (
              <div className="rounded-md border border-risk-warn-border bg-risk-warn-bg p-3.5">
                <div className="text-[13px] font-semibold text-risk-warn-ink">{pendingObligation}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="primary" loading={completeMutation.isPending} onClick={() => completeMutation.mutate(true)}>Yes, mark the deadline met</Button>
                  <Button size="sm" variant="secondary" loading={completeMutation.isPending} onClick={() => completeMutation.mutate(false)}>No, just complete the task</Button>
                </div>
              </div>
            )}

            {task.status === 'Done' ? (
              <div className="flex items-center gap-2 rounded-md border border-risk-safe-border bg-risk-safe-bg px-3.5 py-2.5 text-[13px] text-ink-900">
                <CheckCircle2 className="h-4 w-4 text-risk-safe" /> Completed.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {task.status === 'Blocked' ? (
                  <Button variant="primary" loading={resumeMutation.isPending} onClick={() => resumeMutation.mutate()}>Resume</Button>
                ) : task.status === 'Returned' ? (
                  <Button variant="primary" loading={resumeMutation.isPending} onClick={() => resumeMutation.mutate()}>Resume work</Button>
                ) : task.status === 'InReview' ? (
                  isReviewer ? (
                    showReturnForm ? (
                      <div className="rounded-md border border-ink-200 bg-paper p-3.5">
                        <Textarea placeholder="What needs to change?" value={returnComments} onChange={(e) => setReturnComments(e.target.value)} className="min-h-16 text-sm" />
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="danger" disabled={!returnComments.trim()} loading={returnMutation.isPending} onClick={() => returnMutation.mutate()}>Return with comments</Button>
                          <Button size="sm" variant="secondary" onClick={() => setShowReturnForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="primary" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve</Button>
                        <Button variant="secondary" onClick={() => setShowReturnForm(true)}>Return with comments</Button>
                      </div>
                    )
                  ) : (
                    <div className="rounded-md border border-ink-200 bg-surface px-3.5 py-2.5 text-[13px] text-ink-500">Awaiting review{reviewer ? ` by ${reviewer.name}` : ''}.</div>
                  )
                ) : (
                  <>
                    {showBlockForm ? (
                      <div className="rounded-md border border-ink-200 bg-paper p-3.5">
                        <Textarea placeholder="Why is this blocked?" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="min-h-16 text-sm" />
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="danger" disabled={!blockReason.trim()} loading={blockMutation.isPending} onClick={() => blockMutation.mutate()}>Mark blocked</Button>
                          <Button size="sm" variant="secondary" onClick={() => setShowBlockForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {task.reviewerId ? (
                          <Button variant="primary" loading={submitReviewMutation.isPending} onClick={() => submitReviewMutation.mutate()}>Submit for review</Button>
                        ) : (
                          <Button variant="primary" loading={completeMutation.isPending} onClick={() => completeMutation.mutate(undefined)}>Mark complete</Button>
                        )}
                        <Button variant="secondary" onClick={() => setShowBlockForm(true)}>Mark blocked</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </SixState>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-paper px-3.5 py-3">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  )
}
