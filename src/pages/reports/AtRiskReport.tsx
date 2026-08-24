import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { atRiskReport } from '../../api/reports'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, EmptyState } from '../../components/ui/primitives'

export default function AtRiskReport() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['at-risk-report', userId], queryFn: () => atRiskReport(userId) })

  return (
    <div>
      <PageHeader title="At-Risk Matters" description="Every matter with at least one open risk flag, ranked by how many." />
      <SixState
        query={query}
        isEmpty={!!query.data && query.data.length === 0}
        emptyState={<EmptyState title="Nothing at risk" description="No matter currently has an open risk flag." />}
      >
        <div className="flex flex-col gap-3">
          {(query.data ?? []).map((row) => (
            <button key={row.matterId} onClick={() => navigate(`/matters/${row.matterId}`)} className="rounded-lg border border-ink-200 bg-paper p-3.5 text-left hover:shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-[11px] text-ink-500">{row.caseNumber}</div>
                  <div className="text-[14px] font-semibold text-ink-900">{row.title}</div>
                </div>
                <span className="rounded bg-ink-900 px-2 py-1 font-mono text-xs font-bold text-white">{row.risks.length}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {row.risks.map((r) => (
                  <div key={r.key} className={`flex items-center gap-2 text-[12.5px] ${r.severity === 'critical' ? 'text-risk-critical' : 'text-risk-warn-ink'}`}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{r.label}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </SixState>
    </div>
  )
}
