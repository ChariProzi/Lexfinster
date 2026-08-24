import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { createTask, checkAssignmentClash, listSopTemplates } from '../../api/work'
import { useSession } from '../../lib/session'
import { visibleMatterIds } from '../../lib/rbac'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Field, Input, Select, Textarea } from '../../components/ui/form'
import { toastSuccess, toastError } from '../../lib/toast'
import type { TaskType } from '../../data/types'

const TASK_TYPES: TaskType[] = ['Drafting', 'Filing', 'Research', 'CourtAppearance', 'ClientCommunication', 'Compliance', 'Administrative']

export default function TaskCreate() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const visible = visibleMatterIds(userId)
  const matters = useDb(useShallow((s) => s.matters.filter((m) => visible.has(m.id))))
  const users = useDb((s) => s.users)
  const sopQuery = useQuery({ queryKey: ['sop-templates'], queryFn: () => listSopTemplates() })

  const [matterId, setMatterId] = useState(params.get('matterId') ?? '')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<TaskType>('Drafting')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [sopTemplateId, setSopTemplateId] = useState('')

  const deadlines = useDb(useShallow((s) => s.deadlines.filter((d) => d.matterId === matterId)))
  const [linkedDeadlineId, setLinkedDeadlineId] = useState('')

  const clashQuery = useQuery({
    queryKey: ['assignment-clash', assigneeId, dueDate],
    queryFn: () => checkAssignmentClash(assigneeId, dueDate),
    enabled: !!assigneeId && !!dueDate,
  })

  const mutation = useMutation({
    mutationFn: () => createTask(userId, {
      matterId, title, type, description, assigneeId: assigneeId || undefined, reviewerId: reviewerId || undefined,
      dueDate, priority, linkedDeadlineId: linkedDeadlineId || undefined, sopTemplateId: sopTemplateId || undefined,
    }),
    onSuccess: (task) => {
      toastSuccess('Task created.')
      qc.invalidateQueries({ queryKey: ['my-worklist'] })
      navigate(`/work/tasks/${task.id}`)
    },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not create task.'),
  })

  const relevantSops = (sopQuery.data ?? []).filter((s) => !s.appliesToIntakeType || true)

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader title="New task" description="Creates a task on a matter, with an optional SOP checklist and reviewer." />
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
        className="flex flex-col gap-3.5 rounded-lg border border-ink-200 bg-paper p-4"
      >
        <Field label="Matter" required>
          <Select required value={matterId} onChange={(e) => { setMatterId(e.target.value); setLinkedDeadlineId('') }}>
            <option value="">Select matter</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
          </Select>
        </Field>
        <Field label="Title" required><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Draft rejoinder to written statement" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
              <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
            </Select>
          </Field>
        </div>
        <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to happen and why" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {users.filter((u) => u.role !== 'BillingStaff').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Reviewer (optional)">
            <Select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)}>
              <option value="">No reviewer</option>
              {users.filter((u) => u.role === 'Partner' || u.role === 'Admin').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Due date" required><Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>

        {clashQuery.data && (
          <div className="flex items-start gap-2 rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-2.5 text-[12.5px] text-risk-warn-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {clashQuery.data.assigneeName} already has a hearing that day — {clashQuery.data.hearing}. You can still assign; this is a heads-up, not a block.
          </div>
        )}

        {matterId && deadlines.length > 0 && (
          <Field label="Link to a deadline (optional)" hint="Completing this task can then confirm the statutory obligation is met.">
            <Select value={linkedDeadlineId} onChange={(e) => setLinkedDeadlineId(e.target.value)}>
              <option value="">No linked deadline</option>
              {deadlines.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
        )}

        {relevantSops.length > 0 && (
          <Field label="SOP checklist (optional)" hint="Adds a pre-built step-by-step checklist to this task.">
            <Select value={sopTemplateId} onChange={(e) => setSopTemplateId(e.target.value)}>
              <option value="">No SOP</option>
              {relevantSops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!matterId || !title.trim() || !dueDate}>Create task</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
