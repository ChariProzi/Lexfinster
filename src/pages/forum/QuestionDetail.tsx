import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ClipboardList } from 'lucide-react'
import { clearAnswer, convertToResearchTask, getQuestion, postAnswer } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { isRole } from '../../lib/rbac'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Field, Input, Select, Textarea } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { Section } from '../../components/shared/Layout'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt, fmtDateTime } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'

export default function QuestionDetail() {
  const { questionId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const matters = useDb((s) => s.matters)
  const canClear = isRole(userId, 'Partner', 'Admin')
  const query = useQuery({ queryKey: ['forum-question', questionId, userId], queryFn: () => getQuestion(userId, questionId) })

  const [answerBody, setAnswerBody] = useState('')
  const [convertOpen, setConvertOpen] = useState(false)
  const [assignedTo, setAssignedTo] = useState('')
  const [neededBy, setNeededBy] = useState('')

  function invalidate() { qc.invalidateQueries({ queryKey: ['forum-question', questionId] }); qc.invalidateQueries({ queryKey: ['forum-questions'] }) }

  const answerMutation = useMutation({
    mutationFn: () => postAnswer(userId, questionId, answerBody),
    onSuccess: () => { setAnswerBody(''); invalidate() },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not post answer.'),
  })
  const clearMutation = useMutation({ mutationFn: (answerId: string) => clearAnswer(userId, answerId), onSuccess: () => { toastSuccess('Answer cleared.'); invalidate() } })
  const convertMutation = useMutation({
    mutationFn: () => convertToResearchTask(userId, questionId, assignedTo, neededBy),
    onSuccess: (task) => { toastSuccess('Converted to a research task.'); setConvertOpen(false); navigate(`/forum/research/${task.id}`) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not convert.'),
  })

  const data = query.data
  const matter = data?.question.matterId ? matters.find((m) => m.id === data.question.matterId) : undefined

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <>
            <PageHeader
              title={data.question.title}
              description={matter ? `${matter.title} · ${matter.caseNumber}` : 'General question'}
              actions={<StatusBadge variant="clearance" value={data.question.clearanceState} />}
            />
            <div className="mb-4 rounded-lg border border-ink-200 bg-paper p-4">
              <div className="text-sm leading-relaxed text-ink-700">{data.question.body || <span className="italic text-ink-400">No further detail provided.</span>}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span>Asked by {users.find((u) => u.id === data.question.askerUserId)?.name ?? 'Unknown'}</span>
                <span>·</span>
                <span>{data.question.practiceArea}</span>
                {data.question.neededByDate && <><span>·</span><span>Needed by {fmt(data.question.neededByDate)}</span></>}
              </div>
              {canClear && (
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={() => setConvertOpen(true)}><ClipboardList className="h-3.5 w-3.5" />Convert to research task</Button>
                </div>
              )}
            </div>

            <Section title={`${data.answers.length} answer(s)`}>
              {data.answers.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">No answers yet.</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {data.answers.map((a) => (
                    <div key={a.id} className="px-3.5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[13px] font-semibold text-ink-900">{users.find((u) => u.id === a.authorUserId)?.name ?? 'Unknown'}</div>
                        {a.partnerClearedByUserId ? (
                          <Badge tone="safe"><CheckCircle2 className="h-3 w-3" />Cleared by {users.find((u) => u.id === a.partnerClearedByUserId)?.name}</Badge>
                        ) : canClear ? (
                          <Button size="sm" variant="secondary" loading={clearMutation.isPending} onClick={() => clearMutation.mutate(a.id)}>Clear this answer</Button>
                        ) : (
                          <Badge tone="warn">Not yet cleared</Badge>
                        )}
                      </div>
                      <div className="mt-1.5 text-sm leading-relaxed text-ink-700">{a.body}</div>
                      {a.citations.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {a.citations.map((c, i) => (
                            <div key={i} className="rounded border border-ink-200 bg-surface px-2.5 py-1.5 text-[11.5px]">
                              <span className="font-semibold text-ink-800">{c.case}</span> · {c.court} {c.year} · <Badge tone={c.weight === 'Binding' ? 'ink' : c.weight === 'Persuasive' ? 'brand' : 'neutral'}>{c.weight}</Badge>
                              <div className="mt-0.5 text-ink-600">{c.ratio}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-1.5 text-[10.5px] text-ink-400">{fmtDateTime(a.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {data.question.clearanceState !== 'Closed' && (
              <div className="mt-4 rounded-lg border border-ink-200 bg-paper p-4">
                <div className="mb-2 text-[13px] font-semibold text-ink-900">Post an answer</div>
                <Textarea value={answerBody} onChange={(e) => setAnswerBody(e.target.value)} placeholder="Share your analysis — a Partner still needs to clear it before it's firm guidance." />
                <div className="mt-2"><Button variant="primary" loading={answerMutation.isPending} disabled={!answerBody.trim()} onClick={() => answerMutation.mutate()}>Post answer</Button></div>
              </div>
            )}
          </>
        )}
      </SixState>

      <Modal open={convertOpen} onClose={() => setConvertOpen(false)} title="Convert to research task" footer={<><Button variant="secondary" onClick={() => setConvertOpen(false)}>Cancel</Button><Button variant="primary" loading={convertMutation.isPending} disabled={!assignedTo || !neededBy} onClick={() => convertMutation.mutate()}>Create task</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Assign to" required>
            <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Select person</option>
              {users.filter((u) => u.status === 'Active').map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
            </Select>
          </Field>
          <Field label="Needed by" required><Input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  )
}
