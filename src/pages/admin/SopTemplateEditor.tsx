import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { listSopTemplates, saveSopTemplate } from '../../api/work'
import { useSession } from '../../lib/session'
import { useDb, nextId } from '../../data/db'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Checkbox, Field, Input, Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess, toastError } from '../../lib/toast'
import type { IntakeType, Role, SopTemplate } from '../../data/types'

const BLANK: SopTemplate = { id: '', name: '', dueOffsetDays: 7, steps: [] }
const ROLES: Role[] = ['Admin', 'Partner', 'Associate', 'Paralegal', 'BillingStaff', 'Intern']
const INTAKE_TYPES: IntakeType[] = ['FreshCase', 'AppealRevision', 'ReplyRequired', 'ExistingMidStream']

export default function SopTemplateEditor() {
  const { templateId = '' } = useParams()
  const isNew = templateId === 'new'
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const forums = useDb((s) => s.forums)
  const query = useQuery({ queryKey: ['sop-templates'], queryFn: () => listSopTemplates() })
  const [tmpl, setTmpl] = useState<SopTemplate | null>(isNew ? { ...BLANK, id: nextId('sop') } : null)

  useEffect(() => {
    if (!isNew && query.data && !tmpl) {
      const found = query.data.find((t) => t.id === templateId)
      if (found) setTmpl(found)
    }
  }, [query.data, isNew, templateId, tmpl])

  const mutation = useMutation({
    mutationFn: () => saveSopTemplate(userId, tmpl!),
    onSuccess: () => { toastSuccess('SOP template saved.'); qc.invalidateQueries({ queryKey: ['sop-templates'] }); navigate('/admin/firm-settings') },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not save.'),
  })

  function addStep() {
    setTmpl((t) => t && { ...t, steps: [...t.steps, { order: t.steps.length + 1, label: '', guidance: '', requiredAttachment: false, defaultAssigneeRole: 'Associate' }] })
  }
  function updateStep(i: number, patch: Partial<SopTemplate['steps'][number]>) {
    setTmpl((t) => t && { ...t, steps: t.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) })
  }
  function removeStep(i: number) {
    setTmpl((t) => t && { ...t, steps: t.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })) })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader title={isNew ? 'New SOP template' : 'Edit SOP template'} description="Reusable step-by-step checklist that can be attached to a task." />
      {!isNew && (
        <SixState query={query} isEmpty={!!query.data && !tmpl} emptyState={<EmptyState title="Not found" description="This SOP template does not exist, or has been removed." />} onRetry={() => query.refetch()}>
          {null}
        </SixState>
      )}
      {tmpl && (
        <div className="flex flex-col gap-4">
          <Section title="Details">
            <div className="flex flex-col gap-3 p-3.5">
              <Field label="Name" required><Input required value={tmpl.name} onChange={(e) => setTmpl({ ...tmpl, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Applies to intake type (optional)">
                  <Select value={tmpl.appliesToIntakeType ?? ''} onChange={(e) => setTmpl({ ...tmpl, appliesToIntakeType: (e.target.value || undefined) as IntakeType | undefined })}>
                    <option value="">Any</option>
                    {INTAKE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Applies to forum (optional)">
                  <Select value={tmpl.appliesToForum ?? ''} onChange={(e) => setTmpl({ ...tmpl, appliesToForum: e.target.value || undefined })}>
                    <option value="">Any</option>
                    {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Applies to statute (optional)"><Input value={tmpl.appliesToStatute ?? ''} onChange={(e) => setTmpl({ ...tmpl, appliesToStatute: e.target.value || undefined })} /></Field>
                <Field label="Default due offset (days)"><Input type="number" value={tmpl.dueOffsetDays} onChange={(e) => setTmpl({ ...tmpl, dueOffsetDays: Number(e.target.value) })} /></Field>
              </div>
            </div>
          </Section>

          <Section title="Steps" actions={<Button size="sm" variant="secondary" onClick={addStep}><Plus className="h-3.5 w-3.5" />Add step</Button>}>
            <div className="flex flex-col gap-2 p-3.5">
              {tmpl.steps.map((s, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-md border border-ink-200 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-center font-mono text-xs text-ink-400">{s.order}</span>
                    <Input value={s.label} onChange={(e) => updateStep(i, { label: e.target.value })} placeholder="Step label" className="flex-1 text-sm" />
                    <button onClick={() => removeStep(i)} className="shrink-0 text-ink-400 hover:text-risk-critical"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <Input value={s.guidance} onChange={(e) => updateStep(i, { guidance: e.target.value })} placeholder="Guidance text (optional)" className="text-xs" />
                  <div className="flex items-center gap-4">
                    <Checkbox checked={s.requiredAttachment} onChange={(e) => updateStep(i, { requiredAttachment: e.target.checked })} label="Requires attachment" />
                    <Select value={s.defaultAssigneeRole} onChange={(e) => updateStep(i, { defaultAssigneeRole: e.target.value as Role })} className="w-40 text-xs">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  </div>
                </div>
              ))}
              {tmpl.steps.length === 0 && <div className="text-sm text-ink-500">No steps yet — add one above.</div>}
            </div>
          </Section>

          <div><Button variant="primary" loading={mutation.isPending} disabled={!tmpl.name.trim()} onClick={() => mutation.mutate()}>Save template</Button></div>
        </div>
      )}
    </div>
  )
}
