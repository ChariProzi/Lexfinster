import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { listMatterOrders } from '../../api/courtData'
import { getMatter } from '../../api/matters'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { ConfidenceBadge, StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'

export default function OrdersAndHearings() {
  const { matterId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const matterQuery = useQuery({ queryKey: ['matter', matterId, userId], queryFn: () => getMatter(userId, matterId) })
  const ordersQuery = useQuery({ queryKey: ['matter-orders', matterId, userId], queryFn: () => listMatterOrders(userId, matterId) })

  return (
    <div>
      <PageHeader
        title="Orders & Hearings"
        description={matterQuery.data?.title}
        actions={<Button variant="secondary" onClick={() => navigate('/court/upload')}><Upload className="h-3.5 w-3.5" />Manual upload</Button>}
      />
      {matterQuery.data?.nextHearingDate && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-ink-200 bg-surface px-3.5 py-2.5 text-sm">
          <span className="text-ink-700">Next hearing</span>
          <span className="font-mono font-semibold text-ink-900">{fmt(matterQuery.data.nextHearingDate)}{matterQuery.data.courtRoom ? ` · ${matterQuery.data.courtRoom}` : ''}</span>
        </div>
      )}
      <SixState
        query={ordersQuery}
        isEmpty={!!ordersQuery.data && ordersQuery.data.length === 0}
        emptyState={<EmptyState title="No orders on record" description="Orders detected from the court portal, or uploaded manually, will appear here." primaryAction={{ label: 'Manual upload', onClick: () => navigate('/court/upload') }} />}
      >
        <Section title={`Orders (${ordersQuery.data?.length ?? 0})`}>
          <div className="divide-y divide-ink-100">
            {(ordersQuery.data ?? []).map((o) => (
              <button key={o.id} onClick={() => navigate(`/court/order-inbox/${o.id}`)} className="flex w-full flex-wrap items-center justify-between gap-2 px-3.5 py-3 text-left hover:bg-ink-50">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink-900">{o.extractedFields.orderType ?? 'Order'} · {fmt(o.orderDate)}</div>
                  <div className="truncate text-xs text-ink-500">{o.extractedFields.summary ?? (o.detectionSource === 'CourtPortalAutomatic' ? 'Detected from court portal' : 'Manually uploaded')}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge level={o.extractionConfidence} />
                  <StatusBadge variant="review" value={o.reviewStatus} />
                </div>
              </button>
            ))}
          </div>
        </Section>
      </SixState>
    </div>
  )
}
