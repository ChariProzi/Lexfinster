import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listSyncConflicts, resolveSyncConflict } from '../../api/offline'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { fmtDateTime } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'
import type { SyncConflict } from '../../data/types'

const RESOLUTIONS: { key: NonNullable<SyncConflict['resolution']>; label: string }[] = [
  { key: 'KeepMine', label: 'Keep my (device) version' },
  { key: 'KeepTheirs', label: 'Keep the server version' },
  { key: 'KeepBoth', label: 'Keep both' },
  { key: 'MergeManually', label: 'Merge manually' },
]

export default function SyncConflicts() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['sync-conflicts'], queryFn: () => listSyncConflicts() })

  const mutation = useMutation({
    mutationFn: (vars: { id: string; resolution: SyncConflict['resolution'] }) => resolveSyncConflict(userId, vars.id, vars.resolution),
    onSuccess: () => { toastSuccess('Resolved.'); qc.invalidateQueries({ queryKey: ['sync-conflicts'] }) },
  })

  const rows = query.data ?? []

  return (
    <div>
      <PageHeader title="Sync Conflicts" description="Never silently overwritten — every conflict between what happened on a device and what the server has waits for a decision." />
      <SixState
        query={query}
        isEmpty={rows.length === 0}
        emptyState={<EmptyState title="Nothing to resolve" description="All devices agree with the server right now." />}
      >
        <div className="flex flex-col gap-3">
          {rows.map((c) => (
            <Section key={c.id} title={c.entityLabel}>
              <div className="flex flex-col gap-3 p-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-ink-200 bg-surface p-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">On device — {users.find((u) => u.id === c.deviceUserId)?.name ?? c.deviceUserId}</div>
                    <div className="text-[11px] text-ink-400">{fmtDateTime(c.deviceTimestamp)}</div>
                    <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[11px] text-ink-700">{JSON.stringify(c.deviceVersion, null, 2)}</pre>
                  </div>
                  <div className="rounded-md border border-ink-200 bg-surface p-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">On server</div>
                    <div className="text-[11px] text-ink-400">{fmtDateTime(c.serverTimestamp)}</div>
                    <pre className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[11px] text-ink-700">{JSON.stringify(c.serverVersion, null, 2)}</pre>
                  </div>
                </div>
                {c.defaultAppliedReason && <div className="text-xs italic text-ink-500">Current default kept: {c.defaultAppliedReason}</div>}
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <Button key={r.key} size="sm" variant="secondary" loading={mutation.isPending} onClick={() => mutation.mutate({ id: c.id, resolution: r.key })}>{r.label}</Button>
                  ))}
                </div>
              </div>
            </Section>
          ))}
        </div>
      </SixState>
    </div>
  )
}
