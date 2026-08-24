import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../../api/today'
import { useSession } from '../../lib/session'
import { getUser, displayTitle } from '../../lib/rbac'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Card } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { fmtDateTime } from '../../lib/dates'

function StatTile({ label, value, href, tone }: { label: string; value: number; href: string; tone?: 'critical' | 'warn' }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(href)} className="flex flex-col items-start gap-1 rounded-lg border border-ink-200 bg-paper px-4 py-3.5 text-left hover:shadow-card">
      <span className={`font-mono text-2xl font-bold ${tone === 'critical' ? 'text-risk-critical' : tone === 'warn' ? 'text-risk-warn-ink' : 'text-ink-900'}`}>{value}</span>
      <span className="text-xs text-ink-500">{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const userId = useSession((s) => s.userId)!
  const user = getUser(userId)!
  const query = useQuery({ queryKey: ['dashboard', userId], queryFn: () => getDashboard(userId) })
  const data = query.data

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.name.split(' ')[0]}`} description={`${displayTitle(user)} · Kapoor & Associates`} />
      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatTile label={data.scope === 'firm' ? 'Firm-wide matters' : 'Matters I can see'} value={data.openMatters} href="/matters" />
              <StatTile label="Tasks due this week" value={data.tasksDueThisWeek} href="/work/my-worklist" />
              <StatTile label="Orders needing review" value={data.ordersNeedingReview} href="/court/order-inbox" tone={data.ordersNeedingReview > 0 ? 'critical' : undefined} />
              <StatTile label="At-risk matters" value={data.atRiskMatters} href="/reports/at-risk" tone={data.atRiskMatters > 0 ? 'warn' : undefined} />
            </div>

            {data.scope === 'firm' && (
              <Section title="Team workload — open tasks">
                <div className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-3 md:grid-cols-6">
                  {data.workloadByPerson.map((p) => (
                    <div key={p.name} className="bg-paper px-3 py-3 text-center">
                      <div className="font-mono text-xl font-bold text-ink-900">{p.open}</div>
                      <div className="mt-0.5 truncate text-[11px] text-ink-500">{p.name}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {data.scope === 'firm' && (
              <Section title="Recent activity (firm audit log)">
                {data.recentAudit.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b border-ink-100 px-3.5 py-2.5 text-sm last:border-0">
                    <span className="text-ink-800"><b>{a.actorName ?? 'System'}</b> · {a.action.replaceAll('_', ' ').replaceAll('.', ' → ')}</span>
                    <span className="font-mono text-xs text-ink-400">{fmtDateTime(a.timestamp)}</span>
                  </div>
                ))}
              </Section>
            )}

            {data.scope === 'intern' && (
              <Card className="px-4 py-3.5 text-sm text-ink-600">
                Your home base for research: <b>{data.forumOpenQuestions}</b> open forum questions and your assigned research tasks are in My Research.
              </Card>
            )}
          </div>
        )}
      </SixState>
    </div>
  )
}
