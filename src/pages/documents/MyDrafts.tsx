import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileEdit, Plus } from 'lucide-react'
import { createDraft, listMyDrafts } from '../../api/documents'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { visibleMatterIds } from '../../lib/rbac'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState, Badge } from '../../components/ui/primitives'
import { Field, Input, Select } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { fmtDateTime } from '../../lib/dates'
import { toastError } from '../../lib/toast'
import type { DraftStatus } from '../../data/types'

const STATUS_TONE: Record<DraftStatus, 'neutral' | 'brand' | 'safe' | 'warn'> = {
  Private: 'neutral', SharedNotPublished: 'brand', Published: 'safe', ReturnedFromReview: 'warn',
}
const STATUS_LABEL: Record<DraftStatus, string> = {
  Private: 'Private', SharedNotPublished: 'Shared', Published: 'Published', ReturnedFromReview: 'Returned',
}

export default function MyDrafts() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const visible = visibleMatterIds(userId)
  const matters = useDb(useShallow((s) => s.matters.filter((m) => visible.has(m.id))))
  const query = useQuery({ queryKey: ['my-drafts', userId], queryFn: () => listMyDrafts(userId) })

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [matterId, setMatterId] = useState('')

  const mutation = useMutation({
    mutationFn: () => createDraft(userId, { title, matterId: matterId || undefined }),
    onSuccess: (draft) => { setOpen(false); setTitle(''); setMatterId(''); qc.invalidateQueries({ queryKey: ['my-drafts'] }); navigate(`/drafts/${draft.id}`) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not create draft.'),
  })

  const rows = query.data ?? []

  return (
    <div>
      <PageHeader title="My Drafts" description="Private working documents — share or publish when ready." actions={<Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />New draft</Button>} />
      <SixState
        query={query}
        isEmpty={rows.length === 0}
        emptyState={<EmptyState title="No drafts yet" description="Start a new draft to work on a document before it's published to the matter." primaryAction={{ label: 'New draft', onClick: () => setOpen(true) }} />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {rows.map((d) => {
            const matter = matters.find((m) => m.id === d.matterId)
            return (
              <button key={d.id} onClick={() => navigate(`/drafts/${d.id}`)} className="flex w-full items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50">
                <div className="flex min-w-0 items-start gap-2.5">
                  <FileEdit className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-ink-900">{d.title}</div>
                    <div className="text-xs text-ink-500">{matter ? `${matter.title} · ${matter.caseNumber}` : 'Not linked to a matter'} · saved {fmtDateTime(d.lastSavedAt)}</div>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
              </button>
            )
          })}
        </div>
      </SixState>

      <Modal open={open} onClose={() => setOpen(false)} title="New draft" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" loading={mutation.isPending} disabled={!title.trim()} onClick={() => mutation.mutate()}>Create</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rejoinder — Sharma Industries" /></Field>
          <Field label="Matter (optional)">
            <Select value={matterId} onChange={(e) => setMatterId(e.target.value)}>
              <option value="">Not linked to a matter</option>
              {matters.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
