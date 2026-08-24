import { useQuery } from '@tanstack/react-query'
import { teamWorkload } from '../../api/work'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Avatar, Badge } from '../../components/ui/primitives'
import { ROLE_LABEL } from '../../lib/rbac'
import type { Role } from '../../data/types'

const STATUS_ORDER = ['ToDo', 'InProgress', 'Blocked', 'InReview', 'Returned'] as const

export default function TeamWorkload() {
  const userId = useSession((s) => s.userId)!
  const query = useQuery({ queryKey: ['team-workload', userId], queryFn: () => teamWorkload(userId) })

  return (
    <div>
      <PageHeader title="Team Workload" description="Open tasks per person, across matters you can see." />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="rounded-lg border border-ink-200 bg-paper">
          {(query.data ?? []).map((row) => {
            const open = row.tasks.filter((t) => t.status !== 'Done')
            const overdue = open.filter((t) => t.dueDate < new Date().toISOString())
            const initials = row.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={row.userId} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
                <div className="flex items-center gap-2.5">
                  <Avatar initials={initials} />
                  <div>
                    <div className="text-[13px] font-semibold text-ink-900">{row.name}</div>
                    <div className="text-xs text-ink-500">{ROLE_LABEL[row.role as Role]}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {STATUS_ORDER.map((s) => {
                    const n = open.filter((t) => t.status === s).length
                    if (n === 0) return null
                    return <Badge key={s} tone={s === 'Blocked' ? 'critical' : s === 'InReview' ? 'brand' : 'neutral'} mono>{n} {s}</Badge>
                  })}
                  {overdue.length > 0 && <Badge tone="critical" mono>{overdue.length} overdue</Badge>}
                  {open.length === 0 && <span className="text-xs text-ink-400">No open tasks</span>}
                </div>
              </div>
            )
          })}
        </div>
      </SixState>
    </div>
  )
}
