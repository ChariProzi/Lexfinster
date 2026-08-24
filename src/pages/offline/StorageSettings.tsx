import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { deleteBundle, getDeviceStorageSettings, listBundles } from '../../api/offline'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess } from '../../lib/toast'

export default function StorageSettings() {
  const userId = useSession((s) => s.userId)!
  const deviceId = useSession((s) => s.deviceId)!
  const qc = useQueryClient()
  const devices = useDb((s) => s.devices)
  const device = devices.find((d) => d.id === deviceId)
  const query = useQuery({ queryKey: ['device-storage', deviceId], queryFn: () => getDeviceStorageSettings(deviceId) })
  const bundlesQuery = useQuery({ queryKey: ['bundles', deviceId], queryFn: () => listBundles(deviceId) })

  const purgeMutation = useMutation({
    mutationFn: async () => {
      const onDevice = (bundlesQuery.data ?? []).filter((b) => b.downloadState !== 'Evicted')
      for (const b of onDevice) await deleteBundle(userId, b.id)
    },
    onSuccess: () => { toastSuccess('All bundles purged from this device.'); qc.invalidateQueries({ queryKey: ['bundles'] }); qc.invalidateQueries({ queryKey: ['device-storage'] }) },
  })

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Local Storage & Retention Settings" description={device ? `${device.label} · ${device.platform}` : 'This device'} />
      <SixState query={query} onRetry={() => query.refetch()}>
        {query.data && (
          <div className="flex flex-col gap-4">
            <Section title="Storage on this device">
              <div className="flex flex-col gap-2 p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">Used</span>
                  <span className="font-mono font-semibold text-ink-900">{query.data.usedGb.toFixed(1)} GB of {query.data.capGb} GB</span>
                </div>
                <div className="h-2 w-full rounded bg-ink-100"><div className="h-2 rounded bg-ink-900" style={{ width: `${Math.min(100, (query.data.usedGb / query.data.capGb) * 100)}%` }} /></div>
              </div>
            </Section>

            <Section title="Retention policy">
              <div className="flex flex-col gap-2 p-3.5 text-sm text-ink-700">
                <div className="flex items-center justify-between"><span className="text-ink-500">Auto-delete window</span><span className="font-mono">{query.data.autoDeleteHours}h after hearing</span></div>
                <div className="mt-1 rounded-md border border-ink-200 bg-surface px-3 py-2 text-xs text-ink-500">
                  The storage cap and auto-delete window are set firm-wide by your Admin (see Firm Settings) — an individual device can't loosen them, only purge early.
                </div>
              </div>
            </Section>

            <Button variant="danger" loading={purgeMutation.isPending} onClick={() => purgeMutation.mutate()}><Trash2 className="h-3.5 w-3.5" />Purge all bundles from this device now</Button>
          </div>
        )}
      </SixState>
    </div>
  )
}
