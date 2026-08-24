import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { confirmOrder, dismissOrder, getOrder } from '../../api/courtData'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Textarea } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { ConfidenceBanner, StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'

export default function OrderReview() {
  const { orderId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['order', orderId, userId], queryFn: () => getOrder(userId, orderId) })
  const [dismissing, setDismissing] = useState(false)
  const [reason, setReason] = useState('')

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrder(userId, orderId),
    onSuccess: (res) => {
      toastSuccess(`Confirmed — ${res.tasksCreated.length} task(s), ${res.deadlinesCreated.length} deadline(s) created.`)
      qc.invalidateQueries({ queryKey: ['order-inbox'] })
      navigate('/court/order-inbox')
    },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not confirm.'),
  })
  const dismissMutation = useMutation({
    mutationFn: () => dismissOrder(userId, orderId, reason),
    onSuccess: () => { toastSuccess('Marked as needing more information.'); qc.invalidateQueries({ queryKey: ['order-inbox'] }); navigate('/court/order-inbox') },
  })

  const data = query.data
  const matter = data ? matters.find((m) => m.id === data.matterId) : undefined

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate('/court/order-inbox')} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back to Order Inbox</button>
      <PageHeader eyebrow={matter?.caseNumber} title={matter?.title ?? 'Order review'} description={data ? `Detected ${data.detectionSource === 'CourtPortalAutomatic' ? 'from the court portal' : 'from a manual upload'} · ${fmt(data.orderDate)}` : undefined} actions={data && <StatusBadge variant="review" value={data.reviewStatus} />} />

      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <div className="flex flex-col gap-4">
            <ConfidenceBanner
              level={data.extractionConfidence}
              description="Confirm every extracted field before this creates tasks or deadlines. Nothing here is binding until you press Confirm."
            />

            <Section title="Extracted fields">
              <div className="divide-y divide-ink-100">
                <Row label="Order type" value={data.extractedFields.orderType} />
                <Row label="Next hearing" value={data.extractedFields.nextHearing ? fmt(data.extractedFields.nextHearing) : undefined} />
                <Row label="Time limit / compliance text" value={data.extractedFields.timeLimitText} />
                <Row label="Comply by" value={data.extractedFields.complianceBy ? fmt(data.extractedFields.complianceBy) : undefined} />
                <Row label="Costs" value={data.extractedFields.costs} />
                <Row label="Summary" value={data.extractedFields.summary} />
              </div>
            </Section>

            {data.proposedItems && data.proposedItems.length > 0 && (
              <Section title={`Will create on confirm (${data.proposedItems.length})`}>
                <div className="divide-y divide-ink-100">
                  {data.proposedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                      <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-mono uppercase text-ink-600">{item.kind}</span>
                      <span className="flex-1 text-ink-800">{item.label}</span>
                      {item.date && <span className="font-mono text-xs text-ink-500">{fmt(item.date)}</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {data.reviewStatus === 'Confirmed' ? (
              <div className="flex items-center gap-2 rounded-md border border-risk-safe-border bg-risk-safe-bg px-3.5 py-2.5 text-[13px] text-ink-900">
                <CheckCircle2 className="h-4 w-4 text-risk-safe" /> Confirmed {data.confirmedAt ? `on ${fmt(data.confirmedAt)}` : ''}.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {dismissing ? (
                  <div className="rounded-md border border-ink-200 bg-paper p-3.5">
                    <Textarea placeholder="Why does this need more information before it can be confirmed?" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-16 text-sm" />
                    <div className="mt-2 flex gap-2">
                      <Button variant="danger" size="sm" disabled={!reason.trim()} loading={dismissMutation.isPending} onClick={() => dismissMutation.mutate()}>Confirm — needs more info</Button>
                      <Button variant="secondary" size="sm" onClick={() => setDismissing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="primary" loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>Confirm order</Button>
                    <Button variant="secondary" onClick={() => setDismissing(true)}>Needs more information</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SixState>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3.5 py-2.5 text-sm">
      <span className="shrink-0 text-ink-500">{label}</span>
      <span className="text-right text-ink-900">{value ?? '—'}</span>
    </div>
  )
}
