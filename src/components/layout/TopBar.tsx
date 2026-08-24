import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, ChevronDown, LogOut, WifiOff, Wifi, Monitor, RotateCcw } from 'lucide-react'
import { useDb } from '../../data/db'
import { useSession } from '../../lib/session'
import { getUser, displayTitle, visibleMatterIds } from '../../lib/rbac'
import { Avatar } from '../ui/primitives'
import { SyncStatusPill } from '../shared/Banners'
import { fmtDateTime } from '../../lib/dates'
import { toastInfo } from '../../lib/toast'
import { logout as apiLogout } from '../../api/auth'
import { useOnClickOutside } from '../../lib/useOnClickOutside'

export function TopBar() {
  const navigate = useNavigate()
  const userId = useSession((s) => s.userId)
  const logout = useSession((s) => s.logout)
  const simulatedOffline = useSession((s) => s.simulatedOffline)
  const setSimulatedOffline = useSession((s) => s.setSimulatedOffline)
  const isDesktopClient = useSession((s) => s.isDesktopClient)
  const setDesktopClient = useSession((s) => s.setDesktopClient)
  const resetDemoData = useDb((s) => s.resetDemoData)
  const user = getUser(userId)

  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(notifRef, () => setNotifOpen(false))
  useOnClickOutside(userRef, () => setUserMenuOpen(false))

  const matters = useDb((s) => s.matters)
  const documents = useDb((s) => s.documents)
  const notifications = useDb((s) => s.notifications)

  const visible = userId ? visibleMatterIds(userId) : new Set<string>()
  const myNotifs = notifications.filter((n) => n.userId === userId).sort((a, b) => (b.sentAt.at(-1) ?? '').localeCompare(a.sentAt.at(-1) ?? ''))
  const unread = myNotifs.filter((n) => !n.readAt).length

  const results = useMemo(() => {
    if (!query.trim()) return { matters: [], documents: [] }
    const q = query.toLowerCase()
    return {
      matters: matters.filter((m) => visible.has(m.id) && (m.title.toLowerCase().includes(q) || m.caseNumber.toLowerCase().includes(q))).slice(0, 5),
      documents: documents.filter((d) => (!d.matterId || visible.has(d.matterId)) && d.name.toLowerCase().includes(q)).slice(0, 5),
    }
  }, [query, matters, documents, visible])

  if (!user) return null

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-200 bg-paper/95 px-4 py-2.5 backdrop-blur">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search matters, parties, CNR, documents, forum posts…"
          className="w-full rounded-md border border-ink-300 bg-surface py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-paper focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {query.trim() && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-md border border-ink-200 bg-paper shadow-pop">
            {results.matters.length === 0 && results.documents.length === 0 && <div className="px-3 py-3 text-sm text-ink-500">No results in what you have access to.</div>}
            {results.matters.map((m) => (
              <button key={m.id} onClick={() => { navigate(`/matters/${m.id}`); setQuery('') }} className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-ink-50">
                <span className="text-sm font-medium text-ink-900">{m.title}</span>
                <span className="font-mono text-xs text-ink-500">{m.caseNumber}</span>
              </button>
            ))}
            {results.documents.map((d) => (
              <button key={d.id} onClick={() => { navigate(`/documents/${d.id}`); setQuery('') }} className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-ink-50">
                <span className="truncate text-sm font-medium text-ink-900">{d.name}</span>
                <span className="text-xs text-ink-500">Document</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <SyncStatusPill />

      <div className="relative" ref={notifRef}>
        <button onClick={() => setNotifOpen((v) => !v)} className="relative flex h-8 w-8 items-center justify-center rounded border border-ink-300 text-ink-700 hover:bg-ink-50">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-risk-critical px-1.5 text-[9px] font-bold text-white">{unread}</span>}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full z-40 mt-1.5 w-80 rounded-md border border-ink-200 bg-paper shadow-pop">
            <div className="flex items-center justify-between border-b border-ink-100 px-3.5 py-2.5 text-sm font-semibold text-ink-900">Notifications</div>
            <div className="max-h-72 overflow-y-auto">
              {myNotifs.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { setNotifOpen(false); navigate(n.actionHref ?? '/notifications') }}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-ink-50 px-3.5 py-2.5 text-left last:border-0 hover:bg-ink-50"
                >
                  <span className={`text-[13px] ${n.readAt ? 'text-ink-600' : 'font-semibold text-ink-900'}`}>{n.title}</span>
                  <span className="text-[11px] text-ink-400">{fmtDateTime(n.sentAt.at(-1))}</span>
                </button>
              ))}
              {myNotifs.length === 0 && <div className="px-3.5 py-4 text-sm text-ink-500">Nothing yet.</div>}
            </div>
            <button onClick={() => { setNotifOpen(false); navigate('/notifications') }} className="block w-full border-t border-ink-100 px-3.5 py-2 text-center text-xs font-semibold text-brand-500 hover:bg-ink-50">
              See all notifications
            </button>
          </div>
        )}
      </div>

      <div className="relative" ref={userRef}>
        <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-1.5 rounded border border-ink-300 px-1.5 py-1 hover:bg-ink-50">
          <Avatar initials={user.initials} size={26} />
          <ChevronDown className="h-3.5 w-3.5 text-ink-500" />
        </button>
        {userMenuOpen && (
          <div className="absolute right-0 top-full z-40 mt-1.5 w-64 rounded-md border border-ink-200 bg-paper py-1.5 shadow-pop">
            <div className="px-3.5 py-2 text-sm">
              <div className="font-semibold text-ink-900">{user.name}</div>
              <div className="text-xs text-ink-500">{displayTitle(user)} · {user.email}</div>
            </div>
            <div className="my-1 border-t border-ink-100" />
            <button onClick={() => { setSimulatedOffline(!simulatedOffline); setUserMenuOpen(false); toastInfo(simulatedOffline ? 'Back online.' : 'Simulating offline mode.') }} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
              {simulatedOffline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {simulatedOffline ? 'Go back online' : 'Simulate offline'}
            </button>
            <button onClick={() => { setDesktopClient(!isDesktopClient); setUserMenuOpen(false); toastInfo(isDesktopClient ? 'Switched to web view.' : 'Switched to desktop-client view — Offline module unlocked.') }} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
              <Monitor className="h-4 w-4" />
              {isDesktopClient ? 'Switch to web view' : 'Switch to desktop client'}
            </button>
            <button onClick={() => { resetDemoData(); setUserMenuOpen(false); toastInfo('Demo data reset to the seed state.') }} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50">
              <RotateCcw className="h-4 w-4" />
              Reset demo data
            </button>
            <div className="my-1 border-t border-ink-100" />
            <button
              onClick={async () => { await apiLogout(user.id); logout(); navigate('/login') }}
              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-risk-critical hover:bg-risk-critical-bg"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
