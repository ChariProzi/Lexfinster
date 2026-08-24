import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Laptop, ShieldCheck, Check, Clock, Lock } from 'lucide-react'
import { registerOfflineConsent } from '../../api/auth'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { PageHeader, Button, Badge, EmptyState } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { fmtDateTime } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

const CONSENT_POINTS = [
  { icon: Lock, text: 'Downloaded case bundles are encrypted at rest on this device using a key stored in your OS keychain — never a plain file.' },
  { icon: Clock, text: 'Bundles auto-delete 48 hours after the hearing they were downloaded for, unless you explicitly choose to keep them longer.' },
  { icon: ShieldCheck, text: "If you don't respond to a retention prompt, annotations are kept privately and files are still deleted on schedule — nothing is kept indefinitely by default." },
]

export default function DeviceRegistration() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const deviceId = useSession((s) => s.deviceId)
  const isDesktopClient = useSession((s) => s.isDesktopClient)
  const device = useDb((s) => s.devices.find((d) => d.id === deviceId))

  const mutation = useMutation({
    mutationFn: () => registerOfflineConsent(deviceId!),
    onSuccess: () => { toastSuccess('Offline consent recorded for this device.'); qc.invalidateQueries() },
  })

  if (!deviceId || !device) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Device Registration" />
        <EmptyState title="No device on record" description="Sign in again to register this device." primaryAction={{ label: 'Go to sign in', onClick: () => navigate('/login') }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Device Registration & Offline Consent" description="Required before this device can hold downloaded case bundles for Court Mode." />

      <Section title="This device">
        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <Laptop className="h-4 w-4 text-ink-500" />
            <div>
              <div className="text-[13px] font-semibold text-ink-900">{device.label}</div>
              <div className="text-xs text-ink-500">{isDesktopClient ? 'Desktop client' : device.platform} · registered {fmtDateTime(device.registeredAt)}</div>
            </div>
          </div>
          <Badge tone={device.offlineConsentAt ? 'safe' : 'warn'}>{device.offlineConsentAt ? 'Consent given' : 'Consent needed'}</Badge>
        </div>
      </Section>

      <Section title="What offline mode means on this device" className="mt-4">
        <div className="flex flex-col gap-3 p-3.5">
          {CONSENT_POINTS.map((p, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13px] text-ink-700">
              <p.icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
              <span>{p.text}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-4">
        {device.offlineConsentAt ? (
          <div className="flex items-center gap-2 rounded-md border border-risk-safe-border bg-risk-safe-bg px-3.5 py-2.5 text-[13px] text-risk-safe">
            <Check className="h-4 w-4" />Consent given on {fmtDateTime(device.offlineConsentAt)}. This device can hold case bundles.
          </div>
        ) : (
          <Button variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate()}>I understand — enable offline mode on this device</Button>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
      </div>
    </div>
  )
}
