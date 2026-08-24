import { NavLink, useLocation } from 'react-router-dom'
import { Sun, FolderKanban, ListChecks, Settings2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from '../ui/overlay'
import { useSession } from '../../lib/session'
import { getUser } from '../../lib/rbac'
import { cn } from '../../lib/cn'
import { useNavigate } from 'react-router-dom'

export function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const userId = useSession((s) => s.userId)
  const user = getUser(userId)
  const [quickOpen, setQuickOpen] = useState(false)
  if (!user) return null

  const onMore = location.pathname.startsWith('/more') || location.pathname.startsWith('/admin') || location.pathname === '/dashboard' || location.pathname.startsWith('/settings')

  const tabs = [
    { key: 'today', label: 'Today', href: '/today', icon: Sun },
    { key: 'matters', label: 'Matters', href: '/matters', icon: FolderKanban },
    { key: 'work', label: 'Work', href: '/work/my-worklist', icon: ListChecks },
  ]

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-ink-200 bg-paper lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map((t) => (
          <NavLink key={t.key} to={t.href} className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium', isActive ? 'text-ink-900' : 'text-ink-400')}>
            <t.icon className="h-5 w-5" />
            {t.label}
          </NavLink>
        ))}
        <button onClick={() => setQuickOpen(true)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-ink-400">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-white"><Plus className="h-4 w-4" /></span>
        </button>
        <NavLink to="/more" className={cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium', onMore ? 'text-ink-900' : 'text-ink-400')}>
          <Settings2 className="h-5 w-5" />
          More
        </NavLink>
      </nav>
      <Sheet open={quickOpen} onClose={() => setQuickOpen(false)} title="Quick create" side="bottom">
        <div className="flex flex-col gap-2">
          {[
            { label: 'New task', href: '/work/tasks/new' },
            { label: 'New intake', href: '/matters/new' },
            { label: 'Upload document', href: '/documents/upload' },
            { label: 'Ask a question', href: '/forum/ask' },
          ].map((a) => (
            <button key={a.href} onClick={() => { setQuickOpen(false); navigate(a.href) }} className="rounded-md border border-ink-200 px-3.5 py-2.5 text-left text-sm font-medium text-ink-900 hover:bg-ink-50">
              {a.label}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
