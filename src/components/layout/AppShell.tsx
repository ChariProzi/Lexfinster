import { Outlet, Navigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileTabBar } from './MobileTabBar'
import { OfflineBanner, StaleDataBanner } from '../shared/Banners'
import { ToastHost } from '../ui/overlay'
import { useSession } from '../../lib/session'

export function AppShell() {
  const userId = useSession((s) => s.userId)
  if (!userId) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <OfflineBanner />
        <StaleDataBanner />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
      <ToastHost />
    </div>
  )
}
