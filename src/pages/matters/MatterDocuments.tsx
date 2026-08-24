import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { listMatterDocuments } from '../../api/documents'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import type { Document } from '../../data/types'

export default function MatterDocuments() {
  const { matterId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['matter-documents', matterId, userId], queryFn: () => listMatterDocuments(userId, matterId) })

  const columns: Column<Document>[] = [
    { key: 'name', header: 'Filename (auto-renamed)', mobile: 'primary', className: 'max-w-xs truncate font-mono text-xs', render: (d) => <span className="truncate font-mono text-xs">{d.name}</span> },
    { key: 'source', header: 'Source', mobile: 'secondary', render: (d) => d.source },
    { key: 'date', header: 'Doc date', mobile: 'tertiary', render: (d) => fmt(d.documentDate) },
    { key: 'size', header: 'Size', render: (d) => `${(d.sizeBytes / 1e6).toFixed(1)} MB` },
    { key: 'ocr', header: 'OCR', mobile: 'status', render: (d) => <StatusBadge variant="review" value={d.ocrStatus === 'Extracted' ? 'Confirmed' : d.ocrStatus === 'Failed' ? 'NeedsReview' : 'AwaitingInfo'} /> },
  ]

  return (
    <div>
      <PageHeader title="Matter Documents" actions={<Button variant="primary" onClick={() => navigate('/documents/upload')}><Upload className="h-3.5 w-3.5" />Upload</Button>} />
      <SixState
        query={query}
        isEmpty={!!query.data && query.data.length === 0}
        emptyState={<EmptyState title="No documents yet" description="Upload the first document for this matter, or wait for court-portal ingestion." primaryAction={{ label: 'Upload', onClick: () => navigate('/documents/upload') }} />}
      >
        <DataTable columns={columns} rows={query.data ?? []} onRowClick={(d) => navigate(`/documents/${d.id}`)} />
      </SixState>
    </div>
  )
}
