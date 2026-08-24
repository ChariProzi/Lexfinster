import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { explainDeadline, overrideDeadline } from '../../api/deadlines'
import { useSession } from '../../lib/session'
import { getUser, isRole } from '../../lib/rbac'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Field, Input, Textarea, Checkbox } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { fmt } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Override() {
  const { matterId = '', deadlineId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = getUser(userId)!
  const query = useQuery({ queryKey: ['deadline-explain', deadlineId], queryFn: () => explainDeadline(userId, deadlineId) })

  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')
  const [countersignAcked, setCountersignAcked] = useState(false)

  const needsCountersign = !isRole(userId, 'Partner', 'Admin')

  const mutation = useMutation({
    mutationFn: () => overrideDeadline(userId, deadlineId, { newDate, reason, countersignedByUserId: needsCountersign ? (countersignAcked ? userId : undefined) : userId }),
    onSuccess: () => {
      toastSuccess(needsCountersign && !countersignAcked ? 'Override submitted — awaiting Partner countersign.' : 'Deadline overridden.')
      qc.invalidateQueries({ queryKey: ['deadlines', matterId] })
      navigate(`/matters/${matterId}/deadlines`)
    },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not override.'),
  })

  return (
    <div>
      <button onClick={() => navigate(`/matters/${matterId}/deadlines`)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back to deadlines</button>
      <PageHeader title="Override deadline" description={query.data?.deadline.name} />
      <SixState query={query}>
        {query.data && (
          <div className="max-w-xl">
            <Section title="Current computed date">
              <div className="px-3.5 py-3 text-sm">
                <span className="font-mono font-semibold text-ink-900">{query.data.deadline.computedDate ? fmt(query.data.deadline.computedDate) : 'Not yet set'}</span>
                <span className="ml-2 text-ink-500">from {query.data.rule?.governingProvision ?? 'manual entry'}</span>
              </div>
            </Section>

            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
              className="mt-4 flex flex-col gap-3.5 rounded-lg border border-ink-200 bg-paper p-4"
            >
              <Field label="New date" required>
                <Input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </Field>
              <Field label="Reason" required hint="This is written to the audit log and shown permanently on the deadline row.">
                <Textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Certified copy received 2 days later than the portal date…" />
              </Field>

              {needsCountersign && (
                <div className="rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-3 text-[13px] text-risk-warn-ink">
                  <div className="font-semibold">Partner countersign required</div>
                  <div className="mt-0.5">As an {user.role}, your override needs a Partner or Admin countersign before it takes effect. It will show as pending until then.</div>
                  <Checkbox className="mt-2" checked={countersignAcked} onChange={(e) => setCountersignAcked(e.target.checked)} label={`I am ${user.role === 'Partner' || user.role === 'Admin' ? 'countersigning' : 'submitting for countersign (uncheck if a Partner is countersigning separately)'}`} />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" variant="primary" loading={mutation.isPending}>Submit override</Button>
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
      </SixState>
    </div>
  )
}
