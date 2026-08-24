import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, RefreshCw } from 'lucide-react'
import { addAnnotation, getDocument, retryOcr } from '../../api/documents'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Textarea } from '../../components/ui/form'
import { Section, TwoPaneShell } from '../../components/shared/Layout'
import { AnnotationToolbar, PrivacySelector, StatusBadge, visibilityOptionsFor } from '../../components/shared/Misc'
import { fmt, fmtDateTime } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'
import type { Annotation } from '../../data/types'

export default function DocumentViewer() {
  const { documentId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['document', documentId, userId], queryFn: () => getDocument(userId, documentId) })

  const [tool, setTool] = useState<Annotation['type'] | null>(null)
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<Annotation['visibility']>('Private')
  const [page, setPage] = useState(1)

  const retryMutation = useMutation({ mutationFn: () => retryOcr(userId, documentId), onSuccess: (d) => { toastSuccess(d.ocrStatus === 'Extracted' ? 'OCR succeeded.' : 'OCR failed again — try a clearer scan.'); qc.invalidateQueries({ queryKey: ['document', documentId] }) } })
  const addMutation = useMutation({
    mutationFn: () => addAnnotation(userId, documentId, { page, type: tool ?? 'StickyNote', content, visibility }),
    onSuccess: () => { toastSuccess('Annotation added.'); setContent(''); setTool(null); qc.invalidateQueries({ queryKey: ['document', documentId] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not add annotation.'),
  })

  const data = query.data
  const matter = data?.document.matterId ? matters.find((m) => m.id === data.document.matterId) : undefined

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      {data && (
        <PageHeader
          title={<span className="break-all font-mono text-base">{data.document.name}</span>}
          description={matter ? `${matter.title} · ${matter.caseNumber}` : 'Unfiled'}
          actions={
            <>
              {data.document.privileged && <Badge tone="warn"><Lock className="h-3 w-3" />Privileged</Badge>}
              <StatusBadge variant="review" value={data.document.ocrStatus === 'Extracted' ? 'Confirmed' : data.document.ocrStatus === 'Failed' ? 'NeedsReview' : 'AwaitingInfo'} />
            </>
          }
        />
      )}
      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <TwoPaneShell
            railTitle="Annotations"
            contextSummary={`${data.annotations.length} annotation(s)`}
            primary={
              <div className="flex flex-col gap-3">
                <AnnotationToolbar placement="top" active={tool} onSelect={(t) => setTool(t as Annotation['type'])} />
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink-300 bg-surface p-8 text-center text-sm text-ink-500">
                  <div className="font-mono text-xs uppercase tracking-wide text-ink-400">Page {page}</div>
                  <div>Document preview isn't available in this environment — annotations are still tracked per page.</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous page</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPage((p) => p + 1)}>Next page</Button>
                  </div>
                </div>
                {data.document.ocrStatus === 'Failed' && (
                  <div className="flex items-center justify-between rounded-md border border-risk-critical-border bg-risk-critical-bg px-3.5 py-2.5 text-[13px] text-risk-critical">
                    <span>OCR failed on this document.</span>
                    <Button size="sm" variant="danger" loading={retryMutation.isPending} onClick={() => retryMutation.mutate()}><RefreshCw className="h-3.5 w-3.5" />Retry OCR</Button>
                  </div>
                )}
                {tool && (
                  <Section title={`New ${tool.toLowerCase()} on page ${page}`}>
                    <div className="flex flex-col gap-3 p-3.5">
                      <Textarea placeholder="Note content (optional for highlight/underline/strike)" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-16 text-sm" />
                      <PrivacySelector value={visibility} options={visibilityOptionsFor('annotation')} onChange={setVisibility} />
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" loading={addMutation.isPending} onClick={() => addMutation.mutate()}>Save annotation</Button>
                        <Button variant="secondary" size="sm" onClick={() => { setTool(null); setContent('') }}>Cancel</Button>
                      </div>
                    </div>
                  </Section>
                )}
                <Section title="Document details">
                  <div className="divide-y divide-ink-100">
                    <Row label="Type" value={data.document.type} />
                    <Row label="Source" value={data.document.source} />
                    <Row label="Document date" value={fmt(data.document.documentDate)} />
                    <Row label="Size" value={`${(data.document.sizeBytes / 1e6).toFixed(1)} MB`} />
                    <Row label="Version" value={`v${data.document.version}`} />
                  </div>
                </Section>
              </div>
            }
            contextRail={
              <Section title="Annotations">
                {data.annotations.length === 0 ? (
                  <div className="px-3.5 py-4 text-sm text-ink-500">No annotations yet.</div>
                ) : (
                  <div className="divide-y divide-ink-100">
                    {data.annotations.map((a) => (
                      <div key={a.id} className="px-3.5 py-2.5">
                        <div className="flex items-center justify-between text-[12.5px]">
                          <span className="font-semibold text-ink-900">{a.type} · p.{a.page}</span>
                          <Badge tone={a.visibility === 'Private' ? 'neutral' : 'brand'}>{a.visibility}</Badge>
                        </div>
                        {a.content && <div className="mt-1 text-xs text-ink-600">{a.content}</div>}
                        <div className="mt-1 text-[10.5px] text-ink-400">{fmtDateTime(a.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            }
          />
        )}
      </SixState>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  )
}
