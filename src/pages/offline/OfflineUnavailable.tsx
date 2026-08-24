import { MonitorSmartphone } from 'lucide-react'
import { Button, PageHeader } from '../../components/ui/primitives'
import { useSession } from '../../lib/session'
import { toastInfo } from '../../lib/toast'

export function OfflineUnavailableContent() {
  const setDesktopClient = useSession((s) => s.setDesktopClient)
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-300">
        <MonitorSmartphone className="h-4.5 w-4.5 text-ink-600" />
      </div>
      <div className="text-[15px] font-semibold text-ink-900">Offline mode isn't available here</div>
      <div className="max-w-md text-sm text-ink-500">
        A browser tab can't guarantee downloaded files survive a crash or reliably self-delete on schedule — the two promises this feature makes. Case bundles, Court Mode, and offline sync are built for the desktop client and native mobile app instead.
      </div>
      <Button
        variant="primary"
        className="mt-1"
        onClick={() => { setDesktopClient(true); toastInfo('Switched to desktop-client view — this is a demo simulation of that environment.') }}
      >
        Switch to desktop-client view
      </Button>
    </div>
  )
}

export default function OfflineUnavailable() {
  return (
    <div>
      <PageHeader title="Offline & Court Mode" />
      <OfflineUnavailableContent />
    </div>
  )
}
