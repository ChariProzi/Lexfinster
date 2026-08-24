import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listDprRequests, respondToDpr } from '../../api/admin'
import { useSession } from '../../lib/session'
import { PageHeader, Button, Badge, EmptyState } from '../../components/ui/primitives'
import { Textarea } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { SixState } from '../../components/shared/SixState'
import { fmt } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

const STATUS_TONE = { Pending: 'warn', InProgress: 'brand', Completed: 'safe' } as const
const TYPE_LABEL = { Access: 'Access request', Correction: 'Correction request', Erasure: 'Erasure request' } as const

export default function DataRetention() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['dpr-requests', userId], queryFn: () => listDprRequests(userId) })
  const [respondFor, setRespondFor] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: (requestId: string) => respondToDpr(userId, requestId, note),
    onSuccess: () => { toastSuccess('Marked complete.'); setRespondFor(null); setNote(''); qc.invalidateQueries({ queryKey: ['dpr-requests'] }) },
  })

  const rows = query.data ?? []

  return (
    <div>
      <PageHeader title="Data & Retention" description="Data Principal (DPDPA) requests — access, correction, and erasure." />
      <SixState
        query={query}
        isEmpty={rows.length === 0}
        emptyState={<EmptyState title="No requests" description="Data principal requests will appear here when received." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
              <div>
                <div className="text-[13px] font-semibold text-ink-900">{r.requesterName} — {TYPE_LABEL[r.type]}</div>
                <div className="text-xs text-ink-500">Received {fmt(r.receivedAt)} · respond by {fmt(r.respondByDate)}</div>
                {r.detail && <div className="mt-1 text-xs italic text-ink-500">{r.detail}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                {r.status !== 'Completed' && <Button size="sm" variant="primary" onClick={() => setRespondFor(r.id)}>Respond</Button>}
              </div>
            </div>
          ))}
        </div>
      </SixState>

      <Modal open={!!respondFor} onClose={() => setRespondFor(null)} title="Respond to request" footer={<><Button variant="secondary" onClick={() => setRespondFor(null)}>Cancel</Button><Button variant="primary" loading={mutation.isPending} onClick={() => respondFor && mutation.mutate(respondFor)}>Mark complete</Button></>}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What action was taken?" />
      </Modal>
    </div>
  )
}
