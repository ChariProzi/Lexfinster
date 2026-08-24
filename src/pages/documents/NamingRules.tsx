import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getNamingRule, saveNamingRule } from '../../api/documents'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Field, Input, Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { toastSuccess, toastError } from '../../lib/toast'
import type { NamingRule } from '../../data/types'

const DOC_TYPES = ['Order', 'Pleading', 'Notice', 'CertifiedCopy', 'Evidence', 'Correspondence', 'Draft']

export default function NamingRules() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['naming-rule'], queryFn: () => getNamingRule() })
  const [rule, setRule] = useState<NamingRule | null>(null)

  useEffect(() => { if (query.data && !rule) setRule(query.data) }, [query.data, rule])

  const mutation = useMutation({
    mutationFn: () => saveNamingRule(userId, rule!),
    onSuccess: () => { toastSuccess('Naming rule saved.'); qc.invalidateQueries({ queryKey: ['naming-rule'] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not save.'),
  })

  function setOverride(docType: string, pattern: string) {
    setRule((r) => r && { ...r, perDocTypeOverrides: { ...r.perDocTypeOverrides, [docType]: pattern } })
  }

  const preview = rule
    ? rule.tokenPattern
        .replace('{date}', '2026-08-24')
        .replace('{case_no}', 'CS-COMM-412-2025')
        .replace('{forum}', 'DelhiHC')
        .replace('{doc_type}', 'Order')
        .split(/[_\-\s]+/)
        .join(rule.separator)
    : ''

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader title="Document Naming Rules" description="Controls how uploaded and drafted documents are auto-renamed firm-wide." />
      <SixState query={query} onRetry={() => query.refetch()}>
        {rule && (
          <div className="flex flex-col gap-4">
            <Section title="Base pattern">
              <div className="flex flex-col gap-3 p-3.5">
                <Field label="Token pattern" hint="Available tokens: {date} {case_no} {forum} {doc_type}">
                  <Input value={rule.tokenPattern} onChange={(e) => setRule({ ...rule, tokenPattern: e.target.value })} className="font-mono text-sm" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Separator">
                    <Select value={rule.separator} onChange={(e) => setRule({ ...rule, separator: e.target.value })}>
                      <option value="_">Underscore ( _ )</option>
                      <option value="-">Hyphen ( - )</option>
                      <option value=" ">Space</option>
                    </Select>
                  </Field>
                  <Field label="Case style">
                    <Select value={rule.caseStyle} onChange={(e) => setRule({ ...rule, caseStyle: e.target.value as NamingRule['caseStyle'] })}>
                      <option value="TitleCase">Title Case</option>
                      <option value="lower">lowercase</option>
                      <option value="UPPER">UPPERCASE</option>
                    </Select>
                  </Field>
                </div>
                <div className="rounded-md border border-ink-200 bg-surface px-3 py-2 font-mono text-xs text-ink-600">Preview: {preview}.pdf</div>
              </div>
            </Section>

            <Section title="Per document-type overrides" actions={<span className="text-xs text-ink-400">Optional — falls back to the base pattern</span>}>
              <div className="divide-y divide-ink-100">
                {DOC_TYPES.map((dt) => (
                  <div key={dt} className="flex items-center gap-3 px-3.5 py-2.5">
                    <span className="w-32 shrink-0 text-[13px] font-medium text-ink-800">{dt}</span>
                    <Input
                      value={rule.perDocTypeOverrides?.[dt] ?? ''}
                      onChange={(e) => setOverride(dt, e.target.value)}
                      placeholder={rule.tokenPattern}
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </Section>

            <div className="flex gap-2">
              <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>Save naming rule</Button>
            </div>
          </div>
        )}
      </SixState>
    </div>
  )
}
