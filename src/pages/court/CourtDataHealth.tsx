import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { getCourtDataHealth, syncForumNow } from '../../api/courtData'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button } from '../../components/ui/primitives'
import { StatusBadge } from '../../components/shared/Misc'
import { fmtDateTime } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

export default function CourtDataHealth() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['court-data-health'], queryFn: () => getCourtDataHealth() })
  const syncMutation = useMutation({
    mutationFn: (forumId: string) => syncForumNow(userId, forumId),
    onSuccess: (forum) => { toastSuccess(`${forum.name} synced.`); qc.invalidateQueries({ queryKey: ['court-data-health'] }) },
  })

  return (
    <div>
      <PageHeader title="Court Data Health" description="Sync status per forum. Stale or manual-only forums need hearing dates verified by hand." />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="rounded-lg border border-ink-200 bg-paper">
          {(query.data ?? []).map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <div className="font-semibold text-ink-900">{f.name}</div>
                <div className="mt-0.5 text-xs text-ink-500">{f.type} · {f.matterCount} matter(s) · last synced {fmtDateTime(f.lastSyncedAt)}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge variant="sync" value={f.courtDataSyncStatus} />
                <Button size="sm" variant="secondary" loading={syncMutation.isPending && syncMutation.variables === f.id} onClick={() => syncMutation.mutate(f.id)}>
                  <RefreshCw className="h-3.5 w-3.5" />Sync now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SixState>
    </div>
  )
}
