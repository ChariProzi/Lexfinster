import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { acceptSubmission, listClearanceQueue, returnSubmission } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Checkbox, Textarea } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { Section } from '../../components/shared/Layout'
import { StatusBadge } from '../../components/shared/Misc'
import { toastSuccess } from '../../lib/toast'

export default function ClearanceQueue() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const researchTasks = useDb((s) => s.researchTasks)
  const query = useQuery({ queryKey: ['clearance-queue', userId], queryFn: () => listClearanceQueue(userId) })

  const [addToLibrary, setAddToLibrary] = useState(true)
  const [returnFor, setReturnFor] = useState<string | null>(null)
  const [comments, setComments] = useState('')

  function invalidate() { qc.invalidateQueries({ queryKey: ['clearance-queue'] }) }
  const acceptMutation = useMutation({ mutationFn: (submissionId: string) => acceptSubmission(userId, submissionId, addToLibrary), onSuccess: () => { toastSuccess('Accepted.'); invalidate() } })
  const returnMutation = useMutation({ mutationFn: (submissionId: string) => returnSubmission(userId, submissionId, comments), onSuccess: () => { toastSuccess('Returned.'); setReturnFor(null); setComments(''); invalidate() } })

  const data = query.data
  const isEmpty = !!data && data.questions.length === 0 && data.submissions.length === 0

  return (
    <div>
      <PageHeader title="Clearance Queue" description="Answered questions awaiting Partner clearance, and research submissions awaiting review." />
      <SixState query={query} isEmpty={isEmpty} emptyState={<EmptyState title="All clear" description="Nothing is waiting on you right now." />}>
        {data && (
          <div className="flex flex-col gap-4">
            <Section title={`Questions answered, not yet cleared (${data.questions.length})`}>
              {data.questions.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">Nothing here.</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {data.questions.map((q) => (
                    <button key={q.id} onClick={() => navigate(`/forum/questions/${q.id}`)} className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-ink-50">
                      <span className="text-[13px] text-ink-900">{q.title}</span>
                      <StatusBadge variant="clearance" value={q.clearanceState} />
                    </button>
                  ))}
                </div>
              )}
            </Section>

            <Section title={`Research submitted, awaiting review (${data.submissions.length})`}>
              {data.submissions.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">Nothing here.</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {data.submissions.map((s) => {
                    const task = researchTasks.find((t) => t.id === s.researchTaskId)
                    return (
                      <div key={s.id} className="px-3.5 py-3">
                        <button onClick={() => task && navigate(`/forum/research/${task.id}`)} className="text-left">
                          <div className="text-[13px] font-semibold text-ink-900 hover:underline">{s.issue}</div>
                          <div className="mt-0.5 text-xs text-ink-500">{s.shortAnswer}</div>
                          {task && <div className="mt-1 text-xs text-ink-400">Assigned to {users.find((u) => u.id === task.assignedToUserId)?.name}</div>}
                        </button>
                        <div className="mt-2 flex items-center gap-2">
                          <Button size="sm" variant="primary" loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate(s.id)}>Accept</Button>
                          <Button size="sm" variant="secondary" onClick={() => setReturnFor(s.id)}>Return with comments</Button>
                          <Checkbox checked={addToLibrary} onChange={(e) => setAddToLibrary(e.target.checked)} label="Add to library" className="ml-1" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>
          </div>
        )}
      </SixState>

      <Modal open={!!returnFor} onClose={() => setReturnFor(null)} title="Return with comments" footer={<><Button variant="secondary" onClick={() => setReturnFor(null)}>Cancel</Button><Button variant="primary" disabled={!comments.trim()} loading={returnMutation.isPending} onClick={() => returnFor && returnMutation.mutate(returnFor)}>Return</Button></>}>
        <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="What needs to change?" />
      </Modal>
    </div>
  )
}
