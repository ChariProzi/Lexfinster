import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getFirmSettings, updateFirmSettings } from '../../api/admin'
import { listSopTemplates } from '../../api/work'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Field, Input, Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess } from '../../lib/toast'
import type { Firm } from '../../data/types'

export default function FirmSettings() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['firm-settings'], queryFn: () => getFirmSettings() })
  const sopQuery = useQuery({ queryKey: ['sop-templates'], queryFn: () => listSopTemplates() })
  const [form, setForm] = useState<Firm | null>(null)

  useEffect(() => { if (query.data && !form) setForm(query.data) }, [query.data, form])

  const mutation = useMutation({
    mutationFn: () => updateFirmSettings(userId, form!),
    onSuccess: () => { toastSuccess('Firm settings saved.'); qc.invalidateQueries({ queryKey: ['firm-settings'] }) },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Firm Settings"
        description="Firm profile, subscription, and default document/court-data configuration."
        actions={<Button variant="ghost" size="sm" onClick={() => navigate('/onboarding/firm-setup')}>Re-run firm setup</Button>}
      />
      <SixState query={query} onRetry={() => query.refetch()}>
        {form && (
          <div className="flex flex-col gap-4">
            <Section title="Firm profile">
              <div className="flex flex-col gap-3 p-3.5">
                <Field label="Firm name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Registered address"><Input value={form.registeredAddress} onChange={(e) => setForm({ ...form, registeredAddress: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Subscription plan">
                    <Select value={form.subscriptionPlan} onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value as Firm['subscriptionPlan'] })}>
                      <option value="Trial">Trial</option><option value="Growth">Growth</option><option value="Scale">Scale</option>
                    </Select>
                  </Field>
                  <Field label="Seats purchased"><Input type="number" min={1} value={form.seatsPurchased} onChange={(e) => setForm({ ...form, seatsPurchased: Number(e.target.value) })} /></Field>
                </div>
                <Field label="Court data vendor"><Input value={form.courtDataVendor} onChange={(e) => setForm({ ...form, courtDataVendor: e.target.value })} /></Field>
                <Field label="Breach notification contact">
                  <Select value={form.breachNotificationContactUserId} onChange={(e) => setForm({ ...form, breachNotificationContactUserId: e.target.value })}>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </Field>
                <div><Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>Save firm settings</Button></div>
              </div>
            </Section>

            <Section title="SOP Templates" actions={<Button size="sm" variant="secondary" onClick={() => navigate('/admin/sop-templates/new')}><Plus className="h-3.5 w-3.5" />New template</Button>}>
              <div className="divide-y divide-ink-100">
                {(sopQuery.data ?? []).map((t) => (
                  <button key={t.id} onClick={() => navigate(`/admin/sop-templates/${t.id}`)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-ink-50">
                    <div>
                      <div className="text-[13px] font-semibold text-ink-900">{t.name}</div>
                      <div className="text-xs text-ink-500">{t.steps.length} step(s) · due {t.dueOffsetDays}d {t.appliesToIntakeType ? `· ${t.appliesToIntakeType}` : ''}</div>
                    </div>
                  </button>
                ))}
                {(sopQuery.data ?? []).length === 0 && <div className="px-3.5 py-4 text-sm text-ink-500">No SOP templates yet.</div>}
              </div>
            </Section>
          </div>
        )}
      </SixState>
    </div>
  )
}
