import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, FileText, ListChecks, Gavel, CalendarClock, ClipboardList, Users } from 'lucide-react'
import { getMatterOverview } from '../../api/matters'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Avatar, Badge } from '../../components/ui/primitives'
import { Section, TwoPaneShell } from '../../components/shared/Layout'
import { DeadlineRow } from '../../components/shared/DeadlineRow'
import { ImportanceTierChip } from '../../components/shared/MatterCard'
import { fmt } from '../../lib/dates'

const LINKS = [
  { key: 'deadlines', label: 'Deadlines', icon: CalendarClock, suffix: '/deadlines' },
  { key: 'docket', label: 'Docket', icon: CalendarClock, suffix: '/docket' },
  { key: 'orders', label: 'Orders & Hearings', icon: Gavel, suffix: '/orders' },
  { key: 'documents', label: 'Documents', icon: FileText, suffix: '/documents' },
  { key: 'checklist', label: 'Engagement Checklist', icon: ClipboardList, suffix: '/checklist' },
]

export default function MatterOverview() {
  const { matterId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['matter-overview', matterId, userId], queryFn: () => getMatterOverview(userId, matterId) })
  const data = query.data

  return (
    <div>
      {data && (
        <PageHeader
          eyebrow={data.matter.caseNumber}
          title={data.matter.title}
          description={`${data.forumName}${data.matter.bench ? ' · ' + data.matter.bench : ''}`}
          actions={
            <>
              <ImportanceTierChip tier={data.matter.importanceTier} />
              <Button variant="secondary" onClick={() => navigate(`/matters/${matterId}/documents`)}><FileText className="h-3.5 w-3.5" />Documents</Button>
              <Button variant="primary" onClick={() => navigate('/work/tasks/new')}><ListChecks className="h-3.5 w-3.5" />New task</Button>
            </>
          }
        />
      )}
      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <TwoPaneShell
            railTitle="Matter details"
            contextSummary={`${data.team.length} team · ${data.parties.length} parties`}
            primary={
              <div className="flex flex-col gap-4">
                {data.health.flags.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {data.health.flags.map((f) => (
                      <button key={f.key} onClick={() => navigate(f.actionHref)} className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-[13px] ${f.severity === 'critical' ? 'border-risk-critical-border bg-risk-critical-bg text-risk-critical' : 'border-risk-warn-border bg-risk-warn-bg text-risk-warn-ink'}`}>
                        <span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{f.label}</span>
                        <span className="whitespace-nowrap underline">{f.action}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {LINKS.map((l) => (
                    <button key={l.key} onClick={() => navigate(`/matters/${matterId}${l.suffix}`)} className="flex flex-col items-center gap-1.5 rounded-lg border border-ink-200 bg-paper px-2 py-3 text-center hover:shadow-card">
                      <l.icon className="h-4.5 w-4.5 text-ink-600" />
                      <span className="text-[11.5px] font-medium text-ink-800">{l.label}</span>
                    </button>
                  ))}
                </div>

                <Section title={`Top deadlines (${data.topDeadlines.length})`} actions={<button onClick={() => navigate(`/matters/${matterId}/deadlines`)} className="text-xs text-brand-500">View all →</button>}>
                  {data.topDeadlines.length === 0 ? <div className="px-3.5 py-4 text-sm text-ink-500">No open deadlines.</div> : data.topDeadlines.map((d) => <DeadlineRow key={d.id} deadline={d} onOverride={() => navigate(`/matters/${matterId}/deadlines/${d.id}/override`)} />)}
                </Section>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => navigate('/work/my-worklist')} className="rounded-lg border border-ink-200 bg-paper px-4 py-3 text-left hover:shadow-card">
                    <div className="font-mono text-xl font-bold text-ink-900">{data.openTaskCount}</div>
                    <div className="text-xs text-ink-500">Open tasks</div>
                  </button>
                  <button onClick={() => navigate(`/matters/${matterId}/documents`)} className="rounded-lg border border-ink-200 bg-paper px-4 py-3 text-left hover:shadow-card">
                    <div className="font-mono text-xl font-bold text-ink-900">{data.documentCount}</div>
                    <div className="text-xs text-ink-500">Documents</div>
                  </button>
                </div>
              </div>
            }
            contextRail={
              <div className="flex flex-col gap-4">
                <Section title={<span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Team</span>}>
                  <div className="flex flex-col gap-2 p-3">
                    {data.team.map((t) => (
                      <div key={t.userId} className="flex items-center gap-2">
                        <Avatar initials={t.initials} size={26} />
                        <div>
                          <div className="text-[12.5px] font-medium text-ink-900">{t.name}</div>
                          <div className="text-[11px] text-ink-500">{t.roleLabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="Parties">
                  <div className="flex flex-wrap gap-1.5 p-3">
                    {data.parties.map((p) => (
                      <span key={p.id} className={`rounded-full px-2.5 py-1 text-[11.5px] ${p.weActFor ? 'bg-ink-900 text-white' : 'border border-ink-300 text-ink-700'} ${p.isOpposingInOtherMatter ? 'border border-risk-warn-border bg-risk-warn-bg text-risk-warn-ink' : ''}`}>
                        {p.name} <span className="opacity-70">· {p.role}</span>
                      </span>
                    ))}
                  </div>
                </Section>
                <Section title="Vakalatnama & engagement">
                  <div className="flex flex-col gap-2 p-3 text-[13px]">
                    <div className="flex items-center justify-between"><span className="text-ink-500">Vakalatnama</span><Badge tone={data.vakalatnamaStatus === 'Filed' ? 'safe' : 'warn'}>{data.vakalatnamaStatus}</Badge></div>
                    <div className="flex items-center justify-between"><span className="text-ink-500">Engagement letter</span><Badge tone={data.matter.engagementLetterStatus === 'Signed' ? 'safe' : 'warn'}>{data.matter.engagementLetterStatus}</Badge></div>
                    <button onClick={() => navigate(`/matters/${matterId}/checklist`)} className="mt-1 text-left text-xs text-brand-500 underline">Open checklist →</button>
                  </div>
                </Section>
                <Section title="Created">
                  <div className="p-3 text-[13px] text-ink-700">{fmt(data.matter.createdAt)} · last activity {fmt(data.matter.lastActivityAt)}</div>
                </Section>
              </div>
            }
          />
        )}
      </SixState>
    </div>
  )
}
