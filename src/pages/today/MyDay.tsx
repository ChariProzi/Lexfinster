import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Gavel, ListChecks, AlertCircle, CalendarClock } from 'lucide-react'
import { getMyDay } from '../../api/today'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { TaskRow } from '../../components/shared/TaskRow'
import { MatterCard } from '../../components/shared/MatterCard'
import { fmt } from '../../lib/dates'

export default function MyDay() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['myday', userId], queryFn: () => getMyDay(userId) })
  const data = query.data

  const totalItems = data ? data.inCourtToday.length + data.dueToday.length + data.needsDecision.length : 0

  return (
    <div>
      <PageHeader title="My Day" description={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
      <SixState
        query={query}
        isEmpty={!!data && totalItems === 0}
        onRetry={() => query.refetch()}
        emptyState={
          <div className="rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center">
            <div className="text-[15px] font-semibold text-ink-900">No hearings today.</div>
            <div className="mt-1 text-sm text-ink-500">{data?.deadlinesThisWeekCount ?? 0} deadlines this week — see Coming up below, or head to My Worklist.</div>
          </div>
        }
      >
        {data && (
          <div className="flex flex-col gap-5">
            <Section title={<span className="flex items-center gap-1.5"><Gavel className="h-3.5 w-3.5" /> In court today ({data.inCourtToday.length})</span>}>
              {data.inCourtToday.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">No hearings today.</div>
              ) : (
                <div className="grid gap-2 p-2.5 sm:grid-cols-2">
                  {data.inCourtToday.map(({ matter, causeListEntry }) => (
                    <div key={matter.id}>
                      <MatterCard matter={matter} />
                      {!causeListEntry?.itemNumber && (
                        <div className="mt-1 rounded bg-risk-warn-bg px-2 py-1 text-[11px] text-risk-warn-ink">Item number not yet listed — cause list expected by 8 PM</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title={<span className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Due today ({data.dueToday.length})</span>}>
              {data.dueToday.length === 0 ? <div className="px-3.5 py-4 text-sm text-ink-500">Nothing due today.</div> : data.dueToday.map((t) => <TaskRow key={t.id} task={t} />)}
            </Section>

            <Section title={<span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Needs a decision from you ({data.needsDecision.length})</span>}>
              {data.needsDecision.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">Nothing waiting on you.</div>
              ) : (
                data.needsDecision.map((d, i) => (
                  <button key={i} onClick={() => navigate(d.href)} className="flex w-full items-center justify-between border-b border-ink-100 px-3.5 py-2.5 text-left last:border-0 hover:bg-ink-50">
                    <div>
                      <div className="text-[13px] font-medium text-ink-900">{d.label}</div>
                      <div className="text-[11.5px] text-ink-500">{d.matterTitle}</div>
                    </div>
                    <span className="text-xs text-brand-500">Open →</span>
                  </button>
                ))
              )}
            </Section>

            <Section title={<span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Coming up (7 days)</span>}>
              {data.comingUp.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">Nothing in the next 7 days.</div>
              ) : (
                data.comingUp.map((c, i) => (
                  <button key={i} onClick={() => navigate(c.href)} className="flex w-full items-center justify-between border-b border-ink-100 px-3.5 py-2.5 text-left last:border-0 hover:bg-ink-50">
                    <div className="text-[13px] text-ink-900">{c.kind === 'hearing' ? '⚖' : '⏱'} {c.label}</div>
                    <span className="font-mono text-xs text-ink-500">{fmt(c.date)}</span>
                  </button>
                ))
              )}
            </Section>
          </div>
        )}
      </SixState>
    </div>
  )
}
