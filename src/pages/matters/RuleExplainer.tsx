import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { explainDeadline } from '../../api/deadlines'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { fmt, fmtDateTime } from '../../lib/dates'

export default function RuleExplainer() {
  const { matterId = '', deadlineId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['deadline-explain', deadlineId], queryFn: () => explainDeadline(userId, deadlineId) })
  const data = query.data

  return (
    <div>
      <button onClick={() => navigate(`/matters/${matterId}/deadlines`)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back to deadlines</button>
      <PageHeader title="Why this date" description="Full derivation of the computed deadline." />
      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <div className="flex flex-col gap-4">
            <Section title={data.deadline.name}>
              <div className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-3">
                <Fact label="Computed date" value={data.deadline.computedDate ? fmt(data.deadline.computedDate) : 'Needs judgement — no date'} />
                <Fact label="Status" value={<Badge tone={data.deadline.status === 'Missed' ? 'critical' : 'neutral'}>{data.deadline.status}</Badge>} />
                <Fact label="Last recomputed" value={fmtDateTime(data.deadline.lastRecomputedAt)} />
              </div>
            </Section>

            {data.rule ? (
              <Section title="Rule derivation">
                <div className="divide-y divide-ink-100">
                  <Row label="Trigger event" value={data.rule.triggerEvent} />
                  <Row label="Duration" value={`${data.rule.durationDays} ${data.rule.calendarOrWorkingDays.toLowerCase()} days`} />
                  <Row label="Extendable" value={data.rule.extendable ? `Yes — up to ${data.rule.extensionDays ?? '—'} more days` : 'No'} />
                  <Row label="Outer limit" value={data.rule.outerLimitDays ? `${data.rule.outerLimitDays} days` : '—'} />
                  <Row label="Consequence" value={data.rule.consequence} />
                  <Row label="Governing provision" value={<span className="font-mono">{data.rule.governingProvision}</span>} />
                  {data.rule.notes && <Row label="Notes" value={data.rule.notes} />}
                </div>
              </Section>
            ) : (
              <Section title="Rule derivation">
                <div className="px-3.5 py-4 text-sm text-ink-500">This deadline was created manually and isn't tied to a rule pack entry.</div>
              </Section>
            )}

            {data.rulePack && (
              <Section title="Rule pack source">
                <div className="flex items-center justify-between px-3.5 py-3 text-sm">
                  <span className="text-ink-800">{data.rulePack.name}</span>
                  <span className="font-mono text-xs text-ink-500">{data.deadline.ruleVersionAtComputation ?? data.rulePack.version}</span>
                </div>
              </Section>
            )}

            <div className="flex gap-2">
              <Button variant="primary" onClick={() => navigate(`/matters/${matterId}/deadlines/${deadlineId}/override`)}>Override this date</Button>
              <Button variant="secondary" onClick={() => navigate(`/matters/${matterId}/deadlines`)}>Back</Button>
            </div>
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
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3.5 py-2.5 text-sm">
      <span className="shrink-0 text-ink-500">{label}</span>
      <span className="text-right text-ink-900">{value}</span>
    </div>
  )
}
