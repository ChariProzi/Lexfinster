import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import {
  courtDataReliabilityReport, deadlineComplianceReport, hearingScheduleReport,
  matterPipelineReport, workloadThroughputReport,
} from '../../api/reports'
import { useSession } from '../../lib/session'
import { PageHeader, Badge, Button } from '../../components/ui/primitives'
import { Tabs } from '../../components/ui/overlay'
import { Section } from '../../components/shared/Layout'
import { StatusBadge } from '../../components/shared/Misc'
import { SixState } from '../../components/shared/SixState'
import { fmt, fmtDateTime } from '../../lib/dates'

const TABS = [
  { key: 'compliance', label: 'Deadline Compliance' },
  { key: 'pipeline', label: 'Matter Pipeline' },
  { key: 'workload', label: 'Workload & Throughput' },
  { key: 'courtData', label: 'Court Data Reliability' },
  { key: 'hearings', label: 'Hearing Schedule' },
]

export default function Reports() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const [tab, setTab] = useState('compliance')

  return (
    <div>
      <PageHeader
        title="Reports & Dashboards"
        description="Firm-performance reports, refreshed on every visit."
        actions={<Button variant="secondary" onClick={() => navigate('/reports/at-risk')}><AlertTriangle className="h-3.5 w-3.5" />At-Risk Matters<ArrowRight className="h-3.5 w-3.5" /></Button>}
      />
      <div className="mb-4"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>
      {tab === 'compliance' && <ComplianceReport userId={userId} onOpenMatter={(id) => navigate(`/matters/${id}`)} />}
      {tab === 'pipeline' && <PipelineReport userId={userId} onOpenMatter={(id) => navigate(`/matters/${id}`)} />}
      {tab === 'workload' && <WorkloadReport userId={userId} />}
      {tab === 'courtData' && <CourtDataReport userId={userId} />}
      {tab === 'hearings' && <HearingScheduleReport userId={userId} onOpenMatter={(id) => navigate(`/matters/${id}`)} />}
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: 'critical' | 'warn' | 'safe' }) {
  const toneClass = tone === 'critical' ? 'text-risk-critical' : tone === 'warn' ? 'text-risk-warn-ink' : tone === 'safe' ? 'text-risk-safe' : 'text-ink-900'
  return (
    <div className="flex-1 rounded-lg border border-ink-200 bg-paper p-3.5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  )
}

function ComplianceReport({ userId, onOpenMatter }: { userId: string; onOpenMatter: (id: string) => void }) {
  const query = useQuery({ queryKey: ['report-compliance', userId], queryFn: () => deadlineComplianceReport(userId) })
  return (
    <SixState query={query} onRetry={() => query.refetch()}>
      {query.data && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <StatTile label="Compliance rate" value={`${query.data.complianceRate}%`} tone={query.data.complianceRate >= 90 ? 'safe' : query.data.complianceRate >= 75 ? 'warn' : 'critical'} />
            <StatTile label="Met" value={query.data.met} tone="safe" />
            <StatTile label="Missed" value={query.data.missed} tone="critical" />
            <StatTile label="Overridden" value={query.data.overridden} />
            <StatTile label="Upcoming" value={query.data.upcoming} />
            <StatTile label="Needs judgement" value={query.data.needsJudgement} tone="warn" />
          </div>
          <Section title="Missed deadlines by matter">
            {query.data.byMatter.filter((m) => m.missed > 0).length === 0 ? (
              <div className="px-3.5 py-4 text-sm text-ink-500">No missed deadlines on any matter — nothing to show here.</div>
            ) : (
              <div className="divide-y divide-ink-100">
                {query.data.byMatter.filter((m) => m.missed > 0).sort((a, b) => b.missed - a.missed).map((m) => (
                  <button key={m.matterId} onClick={() => onOpenMatter(m.matterId)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-ink-50">
                    <span className="text-sm text-ink-900">{m.title}</span>
                    <Badge tone="critical">{m.missed} missed / {m.deadlines} total</Badge>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </SixState>
  )
}

function PipelineReport({ userId, onOpenMatter }: { userId: string; onOpenMatter: (id: string) => void }) {
  const query = useQuery({ queryKey: ['report-pipeline', userId], queryFn: () => matterPipelineReport(userId) })
  const max = Math.max(1, ...(query.data ?? []).map((s) => s.count))
  return (
    <SixState query={query} onRetry={() => query.refetch()}>
      <div className="flex flex-col gap-3">
        {(query.data ?? []).map((s) => (
          <Section key={s.stage} title={<span className="flex items-center gap-2">{s.stage}<span className="font-mono text-xs text-ink-400">({s.count})</span></span>}>
            <div className="p-3.5">
              <div className="mb-2 h-2 w-full rounded bg-ink-100"><div className="h-2 rounded bg-ink-900" style={{ width: `${(s.count / max) * 100}%` }} /></div>
              {s.matters.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.matters.map((m) => (
                    <button key={m.id} onClick={() => onOpenMatter(m.id)} className="rounded border border-ink-200 px-2 py-1 text-xs text-ink-700 hover:border-ink-900">{m.title}</button>
                  ))}
                </div>
              )}
            </div>
          </Section>
        ))}
      </div>
    </SixState>
  )
}

function WorkloadReport({ userId }: { userId: string }) {
  const query = useQuery({ queryKey: ['report-workload', userId], queryFn: () => workloadThroughputReport(userId) })
  return (
    <SixState query={query} onRetry={() => query.refetch()}>
      <div className="rounded-lg border border-ink-200 bg-paper">
        {(query.data ?? []).map((r) => (
          <div key={r.userId} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
            <div>
              <div className="text-[13px] font-semibold text-ink-900">{r.name}</div>
              <div className="text-xs text-ink-500">{r.role}</div>
            </div>
            <div className="flex gap-2">
              <Badge tone="neutral">{r.open} open</Badge>
              <Badge tone="safe">{r.done} done</Badge>
              {r.blocked > 0 && <Badge tone="warn">{r.blocked} blocked</Badge>}
              {r.overdue > 0 && <Badge tone="critical">{r.overdue} overdue</Badge>}
            </div>
          </div>
        ))}
      </div>
    </SixState>
  )
}

function CourtDataReport({ userId }: { userId: string }) {
  const query = useQuery({ queryKey: ['report-court-data', userId], queryFn: () => courtDataReliabilityReport(userId) })
  return (
    <SixState query={query} onRetry={() => query.refetch()}>
      <div className="rounded-lg border border-ink-200 bg-paper">
        {(query.data ?? []).map((f) => (
          <div key={f.forumId} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
            <div>
              <div className="text-[13px] font-semibold text-ink-900">{f.name}</div>
              <div className="text-xs text-ink-500">{f.matterCount} matter(s) · last synced {f.lastSyncedAt ? fmtDateTime(f.lastSyncedAt) : 'never'}</div>
            </div>
            <StatusBadge variant="sync" value={f.status} />
          </div>
        ))}
      </div>
    </SixState>
  )
}

function HearingScheduleReport({ userId, onOpenMatter }: { userId: string; onOpenMatter: (id: string) => void }) {
  const query = useQuery({ queryKey: ['report-hearings', userId], queryFn: () => hearingScheduleReport(userId) })
  return (
    <SixState query={query} onRetry={() => query.refetch()}>
      <div className="rounded-lg border border-ink-200 bg-paper">
        {(query.data ?? []).map((h) => (
          <button key={h.matterId} onClick={() => onOpenMatter(h.matterId)} className="flex w-full items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50">
            <div>
              <div className="text-[13px] font-semibold text-ink-900">{h.title}</div>
              <div className="font-mono text-xs text-ink-500">{h.caseNumber} · {h.forum}</div>
            </div>
            <span className="font-mono text-sm text-ink-700">{fmt(h.date)}</span>
          </button>
        ))}
      </div>
    </SixState>
  )
}
