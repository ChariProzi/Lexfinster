import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Upload, Settings2 } from 'lucide-react'
import { listDocuments } from '../../api/documents'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { isRole } from '../../lib/rbac'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import type { Document } from '../../data/types'

export default function DocumentManager() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const matters = useDb((s) => s.matters)
  const [q, setQ] = useState('')
  const query = useQuery({ queryKey: ['documents', userId, q], queryFn: () => listDocuments(userId, q || undefined) })

  const columns: Column<Document>[] = [
    { key: 'name', header: 'Filename', mobile: 'primary', className: 'max-w-xs', render: (d) => <span className="line-clamp-2 break-all font-mono text-xs">{d.name}</span> },
    { key: 'matter', header: 'Matter', mobile: 'secondary', render: (d) => (d.matterId ? matters.find((m) => m.id === d.matterId)?.title ?? '—' : '—') },
    { key: 'type', header: 'Type', render: (d) => d.type },
    { key: 'date', header: 'Doc date', mobile: 'tertiary', render: (d) => fmt(d.documentDate) },
    { key: 'size', header: 'Size', render: (d) => `${(d.sizeBytes / 1e6).toFixed(1)} MB` },
    { key: 'ocr', header: 'OCR', mobile: 'status', render: (d) => <StatusBadge variant="review" value={d.ocrStatus === 'Extracted' ? 'Confirmed' : d.ocrStatus === 'Failed' ? 'NeedsReview' : 'AwaitingInfo'} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Document Manager"
        description={query.data ? `${query.data.totalCount} document(s) firm-wide${query.data.excludedNotExtracted ? ` · ${query.data.excludedNotExtracted} not yet searchable (OCR pending/failed)` : ''}` : undefined}
        actions={
          <>
            {isRole(userId, 'Admin') && <Button variant="secondary" onClick={() => navigate('/documents/naming-rules')}><Settings2 className="h-3.5 w-3.5" />Naming rules</Button>}
            <Button variant="primary" onClick={() => navigate('/documents/upload')}><Upload className="h-3.5 w-3.5" />Upload</Button>
          </>
        }
      />
      <div className="mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by filename (extracted documents only)…" className="w-full max-w-md rounded-md border border-ink-300 px-3 py-1.5 text-sm sm:w-80" />
      </div>
      <SixState
        query={query}
        isEmpty={!!query.data && query.data.results.length === 0}
        emptyState={<EmptyState title={q ? 'No matches' : 'No documents yet'} description={q ? 'Try a different filename, or check if OCR is still pending.' : 'Upload the first document, or wait for court-portal ingestion.'} primaryAction={{ label: 'Upload', onClick: () => navigate('/documents/upload') }} />}
      >
        <DataTable columns={columns} rows={query.data?.results ?? []} onRowClick={(d) => navigate(`/documents/${d.id}`)} />
      </SixState>
    </div>
  )
}
