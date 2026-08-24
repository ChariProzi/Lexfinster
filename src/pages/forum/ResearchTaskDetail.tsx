import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { acceptSubmission, getResearchTask, returnSubmission, submitResearch, type SubmissionInput } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { Section } from '../../components/shared/Layout'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'
import type { Citation, ResearchConfidence } from '../../data/types'

const BLANK_CITATION: Citation = { case: '', citation: '', court: '', year: new Date().getFullYear(), ratio: '', weight: 'Persuasive' }

export default function ResearchTaskDetail() {
  const { taskId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['research-task', taskId, userId], queryFn: () => getResearchTask(userId, taskId) })

  const [form, setForm] = useState<SubmissionInput>({ issue: '', shortAnswer: '', applicableProvisions: [], authorities: [], analysis: '', contraryAuthority: '', recommendation: '', confidence: 'Arguable' })
  const [provisionsText, setProvisionsText] = useState('')
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnComments, setReturnComments] = useState('')
  const [addToLibrary, setAddToLibrary] = useState(true)

  useEffect(() => {
    if (query.data?.submission) {
      const s = query.data.submission
      setForm({ issue: s.issue, shortAnswer: s.shortAnswer, applicableProvisions: s.applicableProvisions, authorities: s.authorities, analysis: s.analysis, contraryAuthority: s.contraryAuthority, recommendation: s.recommendation, confidence: s.confidence })
      setProvisionsText(s.applicableProvisions.join(', '))
    } else if (query.data) {
      setForm((f) => ({ ...f, issue: query.data!.task.question }))
    }
  }, [query.data])

  function invalidate() { qc.invalidateQueries({ queryKey: ['research-task', taskId] }); qc.invalidateQueries({ queryKey: ['my-research'] }) }

  const submitMutation = useMutation({
    mutationFn: () => submitResearch(userId, taskId, { ...form, applicableProvisions: provisionsText.split(',').map((s) => s.trim()).filter(Boolean) }),
    onSuccess: () => { toastSuccess('Submitted for review.'); invalidate() },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not submit.'),
  })
  const acceptMutation = useMutation({
    mutationFn: (submissionId: string) => acceptSubmission(userId, submissionId, addToLibrary),
    onSuccess: () => { toastSuccess('Accepted.' + (addToLibrary ? ' Added to the research library.' : '')); invalidate() },
  })
  const returnMutation = useMutation({
    mutationFn: (submissionId: string) => returnSubmission(userId, submissionId, returnComments),
    onSuccess: () => { toastSuccess('Returned with comments.'); setReturnOpen(false); setReturnComments(''); invalidate() },
  })

  function addAuthority() { setForm((f) => ({ ...f, authorities: [...f.authorities, { ...BLANK_CITATION }] })) }
  function updateAuthority(i: number, patch: Partial<Citation>) { setForm((f) => ({ ...f, authorities: f.authorities.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) })) }
  function removeAuthority(i: number) { setForm((f) => ({ ...f, authorities: f.authorities.filter((_, idx) => idx !== i) })) }

  const data = query.data
  const task = data?.task
  const submission = data?.submission
  const matter = task?.matterId ? matters.find((m) => m.id === task.matterId) : undefined
  const isAssignee = task?.assignedToUserId === userId
  const isRequesterReviewer = task?.requestedByUserId === userId
  const canEdit = isAssignee && (!submission || submission.status === 'ReturnedWithComments' || task?.status === 'NotStarted' || task?.status === 'InProgress')
  const canReview = isRequesterReviewer && submission?.status === 'Submitted'

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <SixState query={query} onRetry={() => query.refetch()}>
        {task && (
          <>
            <PageHeader
              title={task.question}
              description={matter ? `${matter.title} · ${matter.caseNumber}` : 'General research'}
              actions={<StatusBadge variant="taskStatus" value={task.status === 'NotStarted' ? 'ToDo' : task.status === 'InProgress' ? 'InProgress' : task.status === 'Submitted' ? 'InReview' : task.status === 'Returned' ? 'Returned' : 'Done'} />}
            />
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
              <span>Requested by {users.find((u) => u.id === task.requestedByUserId)?.name}</span>
              <span>·</span>
              <span>Assigned to {users.find((u) => u.id === task.assignedToUserId)?.name}</span>
              <span>·</span>
              <span>Needed by {fmt(task.neededByDate)}</span>
            </div>
            <Section title="Scope"><div className="px-3.5 py-2.5 text-sm text-ink-700">{task.scope || <span className="italic text-ink-400">No additional scope given.</span>}</div></Section>

            {submission?.reviewComments && (
              <div className="mt-4 rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-2.5 text-[13px] text-risk-warn-ink">
                <span className="font-semibold">Review comments:</span> {submission.reviewComments}
              </div>
            )}

            {canEdit ? (
              <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate() }} className="mt-4 flex flex-col gap-3.5 rounded-lg border border-ink-200 bg-paper p-4">
                <div className="text-[13px] font-semibold text-ink-900">Submission</div>
                <Field label="Issue" required><Input required value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} /></Field>
                <Field label="Short answer" required><Textarea required value={form.shortAnswer} onChange={(e) => setForm({ ...form, shortAnswer: e.target.value })} className="min-h-16" /></Field>
                <Field label="Applicable provisions" hint="Comma-separated"><Input value={provisionsText} onChange={(e) => setProvisionsText(e.target.value)} placeholder="e.g. §61(2) IBC, §5 Limitation Act" /></Field>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-ink-800">Authorities</span>
                    <Button type="button" size="sm" variant="ghost" onClick={addAuthority}><Plus className="h-3.5 w-3.5" />Add</Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {form.authorities.map((c, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-ink-200 p-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={c.case} onChange={(e) => updateAuthority(i, { case: e.target.value })} placeholder="Case name" className="col-span-2 text-xs" />
                          <Input value={c.court} onChange={(e) => updateAuthority(i, { court: e.target.value })} placeholder="Court" className="text-xs" />
                          <Input type="number" value={c.year} onChange={(e) => updateAuthority(i, { year: Number(e.target.value) })} placeholder="Year" className="text-xs" />
                          <Select value={c.weight} onChange={(e) => updateAuthority(i, { weight: e.target.value as Citation['weight'] })} className="col-span-2 text-xs">
                            <option value="Binding">Binding</option><option value="Persuasive">Persuasive</option><option value="Distinguishable">Distinguishable</option>
                          </Select>
                          <Textarea value={c.ratio} onChange={(e) => updateAuthority(i, { ratio: e.target.value })} placeholder="Ratio / holding" className="col-span-2 min-h-12 text-xs" />
                        </div>
                        <button type="button" onClick={() => removeAuthority(i)} className="self-start text-ink-400 hover:text-risk-critical"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <Field label="Analysis"><Textarea value={form.analysis} onChange={(e) => setForm({ ...form, analysis: e.target.value })} className="min-h-20" /></Field>
                <Field label="Contrary authority" required hint="Must be addressed even if only to say none was found"><Textarea required value={form.contraryAuthority} onChange={(e) => setForm({ ...form, contraryAuthority: e.target.value })} /></Field>
                <Field label="Recommendation"><Textarea value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })} className="min-h-16" /></Field>
                <Field label="Confidence">
                  <Select value={form.confidence} onChange={(e) => setForm({ ...form, confidence: e.target.value as ResearchConfidence })}>
                    <option value="Settled">Settled</option><option value="Arguable">Arguable</option><option value="Unsettled">Unsettled</option>
                  </Select>
                </Field>
                <div><Button type="submit" variant="primary" loading={submitMutation.isPending} disabled={!form.issue.trim() || !form.shortAnswer.trim() || !form.contraryAuthority.trim()}>Submit for review</Button></div>
              </form>
            ) : submission ? (
              <Section title="Submission" className="mt-4">
                <div className="flex flex-col gap-3 p-3.5 text-sm">
                  <Row label="Issue" value={submission.issue} />
                  <Row label="Short answer" value={submission.shortAnswer} />
                  {submission.applicableProvisions.length > 0 && <Row label="Provisions" value={submission.applicableProvisions.join(', ')} />}
                  <Row label="Analysis" value={submission.analysis} />
                  <Row label="Contrary authority" value={submission.contraryAuthority} />
                  <Row label="Recommendation" value={submission.recommendation} />
                  <div className="flex items-center gap-2"><span className="text-ink-500">Confidence</span><Badge tone={submission.confidence === 'Settled' ? 'safe' : submission.confidence === 'Arguable' ? 'warn' : 'critical'}>{submission.confidence}</Badge></div>
                  {submission.authorities.map((c, i) => (
                    <div key={i} className="rounded border border-ink-200 bg-surface px-2.5 py-1.5 text-[11.5px]">
                      <span className="font-semibold text-ink-800">{c.case}</span> · {c.court} {c.year} · <Badge tone={c.weight === 'Binding' ? 'ink' : 'brand'}>{c.weight}</Badge>
                      <div className="mt-0.5 text-ink-600">{c.ratio}</div>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {canReview && submission && (
              <div className="mt-4 flex gap-2">
                <Button variant="primary" loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate(submission.id)}>Accept</Button>
                <Button variant="secondary" onClick={() => setReturnOpen(true)}>Return with comments</Button>
                <Checkbox checked={addToLibrary} onChange={(e) => setAddToLibrary(e.target.checked)} label="Add to research library" className="ml-2 self-center" />
              </div>
            )}
          </>
        )}
      </SixState>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Return with comments" footer={<><Button variant="secondary" onClick={() => setReturnOpen(false)}>Cancel</Button><Button variant="primary" disabled={!returnComments.trim()} loading={returnMutation.isPending} onClick={() => submission && returnMutation.mutate(submission.id)}>Return</Button></>}>
        <Textarea value={returnComments} onChange={(e) => setReturnComments(e.target.value)} placeholder="What needs to change before this can be accepted?" />
      </Modal>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-0.5 text-ink-800">{value}</div>
    </div>
  )
}
