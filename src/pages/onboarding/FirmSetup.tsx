import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { getFirmSettings, updateFirmSettings } from '../../api/admin'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Field, Input, Select } from '../../components/ui/form'
import { Section, SegmentedTabs } from '../../components/shared/Layout'
import { StatusBadge } from '../../components/shared/Misc'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess } from '../../lib/toast'
import type { Firm } from '../../data/types'

export default function FirmSetup() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const forums = useDb((s) => s.forums)
  const query = useQuery({ queryKey: ['firm-settings'], queryFn: () => getFirmSettings() })
  const [step, setStep] = useState<'profile' | 'forums'>('profile')
  const [form, setForm] = useState<Firm | null>(null)

  useEffect(() => { if (query.data && !form) setForm(query.data) }, [query.data, form])

  const mutation = useMutation({
    mutationFn: () => updateFirmSettings(userId, form!),
    onSuccess: () => { toastSuccess('Firm profile saved.'); qc.invalidateQueries({ queryKey: ['firm-settings'] }); setStep('forums') },
  })

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Firm Setup" description="A one-time walkthrough — you can change any of this later in Firm Settings." />
      <div className="mb-4"><SegmentedTabs tabs={[{ key: 'profile', label: '1. Firm profile' }, { key: 'forums', label: '2. Forums you practice before' }]} active={step} onChange={(k) => setStep(k as typeof step)} /></div>

      <SixState query={query} onRetry={() => query.refetch()}>
        {form && step === 'profile' && (
          <Section title="Firm profile">
            <div className="flex flex-col gap-3 p-3.5">
              <Field label="Firm name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Registered address" required><Input required value={form.registeredAddress} onChange={(e) => setForm({ ...form, registeredAddress: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Subscription plan">
                  <Select value={form.subscriptionPlan} onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value as Firm['subscriptionPlan'] })}>
                    <option value="Trial">Trial</option><option value="Growth">Growth</option><option value="Scale">Scale</option>
                  </Select>
                </Field>
                <Field label="Seats purchased"><Input type="number" min={1} value={form.seatsPurchased} onChange={(e) => setForm({ ...form, seatsPurchased: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Court data vendor"><Input value={form.courtDataVendor} onChange={(e) => setForm({ ...form, courtDataVendor: e.target.value })} placeholder="e.g. eCourts + vendor integration name" /></Field>
              <div><Button variant="primary" loading={mutation.isPending} disabled={!form.name.trim() || !form.registeredAddress.trim()} onClick={() => mutation.mutate()}>Save & continue</Button></div>
            </div>
          </Section>
        )}

        {step === 'forums' && (
          <>
            <Section title="Forums currently tracked">
              <div className="divide-y divide-ink-100">
                {forums.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <div>
                      <div className="text-[13px] font-semibold text-ink-900">{f.name}</div>
                      <div className="text-xs text-ink-500">{f.type.replace('_', ' / ')} · {f.matterCount} matter(s)</div>
                    </div>
                    <StatusBadge variant="sync" value={f.courtDataSyncStatus} />
                  </div>
                ))}
              </div>
            </Section>
            <div className="mt-3 rounded-md border border-ink-200 bg-surface px-3.5 py-2.5 text-xs text-ink-500">
              Additional forum coverage is configured together with your court-data vendor — see <button onClick={() => navigate('/court/data-health')} className="font-medium text-brand-500 underline underline-offset-2">Court Data Health</button> once set up.
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setStep('profile')}>Back</Button>
              <Button variant="primary" onClick={() => navigate('/onboarding/invite')}><Check className="h-3.5 w-3.5" />Finish — invite your team</Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>Skip to dashboard</Button>
            </div>
          </>
        )}
      </SixState>
      {form && step === 'profile' && <Badge tone="neutral" className="mt-3">Step 1 of 2</Badge>}
    </div>
  )
}
