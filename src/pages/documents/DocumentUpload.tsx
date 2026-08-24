import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, UploadCloud } from 'lucide-react'
import { uploadDocument } from '../../api/documents'
import { useSession } from '../../lib/session'
import { visibleMatterIds } from '../../lib/rbac'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Field, Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { ConfidenceBanner } from '../../components/shared/Misc'
import { toastSuccess, toastError } from '../../lib/toast'
import type { UploadResult } from '../../api/documents'

export default function DocumentUpload() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const visible = visibleMatterIds(userId)
  const matters = useDb(useShallow((s) => s.matters.filter((m) => visible.has(m.id))))

  const [matterId, setMatterId] = useState(params.get('matterId') ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const mutation = useMutation({
    mutationFn: () => uploadDocument(userId, matterId || undefined, file!.name, file!.size || 500_000),
    onSuccess: (res) => { setResult(res); toastSuccess('Uploaded.'); qc.invalidateQueries({ queryKey: ['documents'] }); qc.invalidateQueries({ queryKey: ['matter-documents'] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not upload.'),
  })

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader title="Upload & Extraction" description="Files are automatically renamed per the firm's naming rule, then OCR runs to extract fields." />

      {!result ? (
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="flex flex-col gap-3.5 rounded-lg border border-ink-200 bg-paper p-4">
          <Field label="Matter (optional)">
            <Select value={matterId} onChange={(e) => setMatterId(e.target.value)}>
              <option value="">Unfiled — decide later</option>
              {matters.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
            </Select>
          </Field>
          <Field label="File" required>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-ink-300 px-3.5 py-8 text-center text-sm text-ink-500 hover:border-ink-500">
              <UploadCloud className="h-5 w-5" />
              {file ? file.name : 'Click to choose a file, or drag one here'}
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!file}>Upload</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {result.document.ocrStatus === 'Extracted' ? (
            <ConfidenceBanner level="High" description="Extraction succeeded. Review the fields below before they're relied on elsewhere." />
          ) : (
            <div className="rounded-md border border-risk-critical-border bg-risk-critical-bg px-3.5 py-3 text-[13px] text-risk-critical">
              OCR failed on this file. It's still uploaded and stored, but no fields were extracted — you can retry OCR from the document viewer, or enter fields manually.
            </div>
          )}
          <Section title="Renamed file">
            <div className="px-3.5 py-3 font-mono text-xs text-ink-800">{result.document.name}</div>
          </Section>
          {result.extracted.length > 0 && (
            <Section title="Extracted fields">
              <div className="divide-y divide-ink-100">
                {result.extracted.map((f) => (
                  <div key={f.field} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                    <span className="text-ink-500">{f.field}</span>
                    <span className="font-medium text-ink-900">{f.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => navigate(`/documents/${result.document.id}`)}>Open document</Button>
            <Button variant="secondary" onClick={() => { setResult(null); setFile(null) }}>Upload another</Button>
          </div>
        </div>
      )}
    </div>
  )
}
