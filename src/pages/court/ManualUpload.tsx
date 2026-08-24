import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UploadCloud } from 'lucide-react'
import { manualUploadOrder } from '../../api/courtData'
import { useSession } from '../../lib/session'
import { visibleMatterIds } from '../../lib/rbac'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Field, Input, Select } from '../../components/ui/form'
import { toastSuccess, toastError } from '../../lib/toast'

export default function ManualUpload() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const visible = visibleMatterIds(userId)
  const matters = useDb(useShallow((s) => s.matters.filter((m) => visible.has(m.id))))

  const [matterId, setMatterId] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [fileName, setFileName] = useState('')

  const mutation = useMutation({
    mutationFn: () => manualUploadOrder(userId, { matterId, orderDate, fileName: fileName || 'uploaded-order.pdf' }),
    onSuccess: (order) => {
      toastSuccess('Uploaded — now in the Order Inbox for review.')
      qc.invalidateQueries({ queryKey: ['order-inbox'] })
      navigate(`/court/order-inbox/${order.id}`)
    },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not upload.'),
  })

  return (
    <div className="mx-auto max-w-lg">
      <button onClick={() => navigate('/court/order-inbox')} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back to Order Inbox</button>
      <PageHeader title="Manual order upload" description="For a physical order that isn't in the court portal feed. It lands in the Order Inbox for the same confirm-before-binding review." />
      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate() }}
        className="flex flex-col gap-3.5 rounded-lg border border-ink-200 bg-paper p-4"
      >
        <Field label="Matter" required>
          <Select required value={matterId} onChange={(e) => setMatterId(e.target.value)}>
            <option value="">Select matter</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
          </Select>
        </Field>
        <Field label="Order date" required>
          <Input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </Field>
        <Field label="File" required hint="This preview doesn't store real files — the name below stands in for the upload.">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-ink-300 px-3.5 py-6 text-sm text-ink-500 hover:border-ink-500">
            <UploadCloud className="h-4 w-4" />
            {fileName || 'Click to choose a file…'}
            <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} />
          </label>
        </Field>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!matterId || !orderDate || !fileName}>Upload</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/court/order-inbox')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
