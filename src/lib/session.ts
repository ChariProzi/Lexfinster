import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  userId: string | null
  deviceId: string | null
  isDesktopClient: boolean // simulated: "web" vs "desktop client" shell for Offline/Court Mode gating
  simulatedOffline: boolean // demo toggle — simulates the offline state described throughout the brief
  sidebarCollapsed: boolean
  login: (userId: string, deviceId: string) => void
  logout: () => void
  setDesktopClient: (v: boolean) => void
  setSimulatedOffline: (v: boolean) => void
  toggleSidebar: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      deviceId: null,
      isDesktopClient: false,
      simulatedOffline: false,
      sidebarCollapsed: false,
      login: (userId, deviceId) => set({ userId, deviceId }),
      logout: () => set({ userId: null }),
      setDesktopClient: (v) => set({ isDesktopClient: v }),
      setSimulatedOffline: (v) => set({ simulatedOffline: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'litigation-app-session-v1' },
  ),
)
