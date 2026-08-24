import type { ReactNode } from 'react'
import { useSession } from '../../lib/session'
import { OfflineUnavailableContent } from '../../pages/offline/OfflineUnavailable'

/** Group H (offline/court mode) is desktop-client + native-mobile only — a plain browser gets the honest S-40b stub. */
export function RequireDesktopClient({ children }: { children: ReactNode }) {
  const isDesktopClient = useSession((s) => s.isDesktopClient)
  if (!isDesktopClient) return <OfflineUnavailableContent />
  return <>{children}</>
}
