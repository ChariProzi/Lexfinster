import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Share2, UploadCloud } from 'lucide-react'
import { getDraft, publishDraft, saveDraft, shareDraft } from '../../api/documents'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Checkbox, Textarea } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { Section } from '../../components/shared/Layout'
import { fmtDateTime } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'
import type { DraftStatus } from '../../data/types'

const STATUS_TONE: Record<DraftStatus, 'neutral' | 'brand' | 'safe' | 'warn'> = {
  Private: 'neutral', SharedNotPublished: 'brand', Published: 'safe', ReturnedFromReview: 'warn',
}

export default function DraftWorkspace() {
  const { draftId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['draft', draftId, userId], queryFn: () => getDraft(userId, draftId) })

  const [content, setContent] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareWith, setShareWith] = useState<string[]>([])

  useEffect(() => { if (query.data) { setContent(query.data.content); setShareWith(query.data.sharedWithUserIds) } }, [query.data])

  const saveMutation = useMutation({ mutationFn: () => saveDraft(userId, draftId, content), onSuccess: () => { toastSuccess('Saved.'); qc.invalidateQueries({ queryKey: ['draft', draftId] }) } })
  const shareMutation = useMutation({
    mutationFn: () => shareDraft(userId, draftId, shareWith),
    onSuccess: () => { toastSuccess('Shared.'); setShareOpen(false); qc.invalidateQueries({ queryKey: ['draft', draftId] }) },
  })
  const publishMutation = useMutation({
    mutationFn: () => publishDraft(userId, draftId),
    onSuccess: () => { toastSuccess('Published to the matter\'s documents.'); qc.invalidateQueries({ queryKey: ['draft', draftId] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not publish.'),
  })

  const draft = query.data
  const matter = draft?.matterId ? matters.find((m) => m.id === draft.matterId) : undefined
  const dirty = draft ? content !== draft.content : false

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <SixState query={query} onRetry={() => query.refetch()}>
        {draft && (
          <>
            <PageHeader
              title={draft.title}
              description={matter ? `${matter.title} · ${matter.caseNumber}` : 'Not linked to a matter'}
              actions={<Badge tone={STATUS_TONE[draft.status]}>{draft.status === 'SharedNotPublished' ? 'Shared, not published' : draft.status}</Badge>}
            />
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" loading={saveMutation.isPending} disabled={!dirty} onClick={() => saveMutation.mutate()}><Save className="h-3.5 w-3.5" />Save</Button>
              <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}><Share2 className="h-3.5 w-3.5" />Share</Button>
              {draft.status !== 'Published' && (
                <Button variant="secondary" size="sm" loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}><UploadCloud className="h-3.5 w-3.5" />Publish to matter</Button>
              )}
              <span className="ml-auto text-xs text-ink-400">Last saved {fmtDateTime(draft.lastSavedAt)}</span>
            </div>

            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[420px] font-mono text-[13px] leading-relaxed" />

            {draft.sharedWithUserIds.length > 0 && (
              <Section title="Shared with" className="mt-4">
                <div className="flex flex-wrap gap-2 p-3.5">
                  {draft.sharedWithUserIds.map((uid) => {
                    const u = users.find((uu) => uu.id === uid)
                    return <Badge key={uid} tone="brand">{u?.name ?? uid}</Badge>
                  })}
                </div>
              </Section>
            )}

            {draft.status === 'Published' && (
              <div className="mt-4 rounded-md border border-risk-safe-border bg-risk-safe-bg px-3.5 py-2.5 text-[13px] text-risk-safe">
                Published as version {draft.publishedVersion} on {fmtDateTime(draft.publishedAt)} — a copy now lives in this matter's documents.
              </div>
            )}
          </>
        )}
      </SixState>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share draft" footer={<><Button variant="secondary" onClick={() => setShareOpen(false)}>Cancel</Button><Button variant="primary" loading={shareMutation.isPending} onClick={() => shareMutation.mutate()}>Share</Button></>}>
        <div className="flex flex-col gap-2">
          {users.filter((u) => u.id !== userId && u.status === 'Active').map((u) => (
            <Checkbox
              key={u.id}
              checked={shareWith.includes(u.id)}
              onChange={(e) => setShareWith((prev) => e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id))}
              label={`${u.name} · ${u.role}`}
            />
          ))}
        </div>
      </Modal>
    </div>
  )
}
