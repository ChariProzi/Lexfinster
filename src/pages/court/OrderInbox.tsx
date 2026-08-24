import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { listOrderInbox } from '../../api/courtData'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge, ConfidenceBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import type { Order } from '../../data/types'

export default function OrderInbox() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['order-inbox', userId], queryFn: () => listOrderInbox(userId) })

  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)), [query.data])

  const columns: Column<Order>[] = [
    { key: 'matter', header: 'Matter', mobile: 'primary', render: (o) => matters.find((m) => m.id === o.matterId)?.title ?? '—' },
    { key: 'type', header: 'Order type', mobile: 'secondary', render: (o) => o.extractedFields.orderType ?? '—' },
    { key: 'date', header: 'Order date', mobile: 'tertiary', render: (o) => fmt(o.orderDate) },
    { key: 'source', header: 'Source', render: (o) => (o.detectionSource === 'CourtPortalAutomatic' ? 'Court portal' : 'Manual upload') },
    { key: 'confidence', header: 'Confidence', render: (o) => <ConfidenceBadge level={o.extractionConfidence} /> },
    { key: 'status', header: 'Status', mobile: 'status', render: (o) => <StatusBadge variant="review" value={o.reviewStatus} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Order Inbox"
        description="Orders detected from the court portal or uploaded manually — nothing here creates a task or deadline until a person confirms it."
        actions={<Button variant="primary" onClick={() => navigate('/court/upload')}><Upload className="h-3.5 w-3.5" />Manual upload</Button>}
      />
      <SixState
        query={query}
        isEmpty={!!query.data && rows.length === 0}
        emptyState={<EmptyState title="Inbox is empty" description="No orders detected yet. Upload one manually if you have a physical copy." primaryAction={{ label: 'Manual upload', onClick: () => navigate('/court/upload') }} />}
      >
        <DataTable columns={columns} rows={rows} onRowClick={(o) => navigate(`/court/order-inbox/${o.id}`)} />
      </SixState>
    </div>
  )
}
