import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Trash2, Clock } from 'lucide-react'
import { downloadBundle, deleteBundle, keepBundleLonger, listBundles, respondToRetentionPrompt } from '../../api/offline'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { visibleMatterIds } from '../../lib/rbac'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Field, Select, Checkbox, Textarea, RadioCard } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { SixState } from '../../components/shared/SixState'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt, fmtDateTime, isPast } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'
import type { Bundle } from '../../data/types'

export default function CaseBundles() {
  const userId = useSession((s) => s.userId)!
  const deviceId = useSession((s) => s.deviceId)!
  const qc = useQueryClient()
  const visible = visibleMatterIds(userId)
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['bundles', deviceId], queryFn: () => listBundles(deviceId) })

  const [matterId, setMatterId] = useState('')
  const [promptFor, setPromptFor] = useState<Bundle | null>(null)
  const [choice, setChoice] = useState<'KeepAnnotations' | 'ShareAnnotations' | 'DiscardAll'>('KeepAnnotations')
  const [keepLonger, setKeepLonger] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (promptFor || !query.data) return
    const due = query.data.find((b) => b.downloadState === 'OnDevice' && isPast(b.autoDeleteAt))
    if (due) setPromptFor(due)
  }, [query.data, promptFor])

  function invalidate() { qc.invalidateQueries({ queryKey: ['bundles'] }) }
  const downloadMutation = useMutation({ mutationFn: () => downloadBundle(userId, matterId, deviceId), onSuccess: () => { toastSuccess('Bundle queued for download.'); setMatterId(''); invalidate() } })
  const deleteMutation = useMutation({ mutationFn: (bundleId: string) => deleteBundle(userId, bundleId), onSuccess: () => { toastSuccess('Removed from this device.'); invalidate() } })
  const keepLongerMutation = useMutation({ mutationFn: (bundleId: string) => keepBundleLonger(userId, bundleId), onSuccess: () => { toastSuccess('Kept 48 more hours.'); invalidate() } })

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (keepLonger && promptFor) {
        await keepBundleLonger(userId, promptFor.id, 168)
      } else if (promptFor) {
        await respondToRetentionPrompt(userId, promptFor.id, choice)
      }
    },
    onSuccess: () => { toastSuccess(keepLonger ? 'Bundle kept for 7 more days.' : 'Retention choice recorded.'); setPromptFor(null); setKeepLonger(false); setReason(''); setChoice('KeepAnnotations'); invalidate() },
  })

  const bundles = query.data ?? []
  const bundledMatterIds = new Set(bundles.filter((b) => b.downloadState !== 'Evicted').map((b) => b.matterId))
  const downloadable = matters.filter((m) => visible.has(m.id) && !bundledMatterIds.has(m.id))
  const promptMatter = promptFor ? matters.find((m) => m.id === promptFor.matterId) : undefined

  return (
    <div>
      <PageHeader title="Case Bundles" description="Documents downloaded for offline / in-court use on this device." />

      <div className="mb-4 flex items-end gap-2 rounded-lg border border-ink-200 bg-paper p-3.5">
        <Field label="Download a matter for offline use" className="flex-1">
          <Select value={matterId} onChange={(e) => setMatterId(e.target.value)}>
            <option value="">Select matter</option>
            {downloadable.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
          </Select>
        </Field>
        <Button variant="primary" disabled={!matterId} loading={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}><Download className="h-3.5 w-3.5" />Download</Button>
      </div>

      <SixState
        query={query}
        isEmpty={bundles.length === 0}
        emptyState={<EmptyState title="Nothing downloaded yet" description="Download a matter above before heading to court without a connection." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {bundles.map((b) => {
            const m = matters.find((mm) => mm.id === b.matterId)
            const dueSoon = b.downloadState === 'OnDevice' && !isPast(b.autoDeleteAt)
            return (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink-900">{m?.title ?? b.matterId}</div>
                  <div className="text-xs text-ink-500">
                    Hearing {fmt(b.hearingDate)} · {(b.sizeBytes / 1e9).toFixed(1)} GB · {b.annotationCount} annotation(s)
                    {b.downloadState === 'OnDevice' && <> · auto-removes {fmtDateTime(b.autoDeleteAt)}</>}
                  </div>
                  {b.downloadState === 'Downloading' && (
                    <div className="mt-1.5 h-1 w-48 rounded bg-ink-100"><div className="h-1 rounded bg-ink-900" style={{ width: `${Math.round(b.downloadProgress * 100)}%` }} /></div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant="download" value={b.downloadState} />
                  {dueSoon && <Button size="sm" variant="secondary" loading={keepLongerMutation.isPending} onClick={() => keepLongerMutation.mutate(b.id)}><Clock className="h-3.5 w-3.5" />Keep 48h longer</Button>}
                  {b.downloadState !== 'Evicted' && <Button size="sm" variant="ghost" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(b.id)}><Trash2 className="h-3.5 w-3.5" />Remove</Button>}
                </div>
              </div>
            )
          })}
        </div>
      </SixState>

      <Modal
        open={!!promptFor}
        onClose={() => {}}
        title={`Bundle for ${promptMatter?.title ?? 'this matter'} is being removed from this device`}
        footer={<Button variant="primary" loading={respondMutation.isPending} disabled={keepLonger && !reason.trim()} onClick={() => respondMutation.mutate()}>Confirm</Button>}
      >
        {promptFor && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-ink-500">Hearing was {fmt(promptFor.hearingDate)} · 48 hours have passed</div>
            <div className="text-sm text-ink-800">You made {promptFor.annotationCount} annotation(s) on this bundle.</div>
            <div className="flex flex-col gap-2">
              <RadioCard selected={choice === 'KeepAnnotations'} onClick={() => setChoice('KeepAnnotations')} title="Keep my annotations" description="Synced to the case, stay private to me" />
              <RadioCard selected={choice === 'ShareAnnotations'} onClick={() => setChoice('ShareAnnotations')} title="Keep and share with the matter team" />
              <RadioCard selected={choice === 'DiscardAll'} onClick={() => setChoice('DiscardAll')} title="Discard my annotations" />
            </div>
            <Checkbox checked={keepLonger} onChange={(e) => setKeepLonger(e.target.checked)} label="Instead, keep the bundle on this device for 7 more days (needs a reason)" />
            {keepLonger && <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need it longer?" className="min-h-16 text-sm" />}
            <div className="rounded-md border border-ink-200 bg-surface px-3 py-2 text-[11px] text-ink-500">Files themselves are always removed on schedule. Annotations are stored separately and never alter the original documents.</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
