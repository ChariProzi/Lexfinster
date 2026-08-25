import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, Scale } from 'lucide-react'
import { NAV_GROUPS } from './navConfig'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { getUser, canSeeModule, displayTitle } from '../../lib/rbac'
import { cn } from '../../lib/cn'
import { Avatar } from '../ui/primitives'

export function Sidebar() {
  const userId = useSession((s) => s.userId)
  const collapsed = useSession((s) => s.sidebarCollapsed)
  const toggle = useSession((s) => s.toggleSidebar)
  const isDesktopClient = useSession((s) => s.isDesktopClient)
  const orders = useDb((s) => s.orders)
  const questions = useDb((s) => s.forumQuestions)
  const firmName = useDb((s) => s.firm.name)
  const visibleMatters = useDb((s) => s.caseAccessGrants.filter((g) => g.userId === userId).length)
  const user = getUser(userId)
  if (!user) return null

  const orderBadge = orders.filter((o) => o.reviewStatus === 'NeedsReview').length
  const questionBadge = questions.filter((q) => q.clearanceState === 'Open').length

  const isIntern = user.role === 'Intern'

  return (
    <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col border-r border-ink-200 bg-paper lg:flex', collapsed ? 'w-[76px]' : 'w-[240px]')}>
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold text-ink-900">
            <Scale className="h-4.5 w-4.5" />
            <span className="text-sm">{firmName}</span>
          </div>
        )}
        {collapsed && <Scale className="mx-auto h-5 w-5 text-ink-900" />}
        <button onClick={toggle} className="rounded p-1 text-ink-400 hover:bg-ink-100">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {isIntern ? (
          <InternNav questionBadge={questionBadge} collapsed={collapsed} />
        ) : (
          NAV_GROUPS.map((group) => {
            if (!canSeeModule(user.role, group.moduleKey)) return null
            if (group.moduleKey === 'offline' && !isDesktopClient) return null
            const items = group.items.filter((it) => !it.roles || it.roles.includes(user.role))
            if (items.length === 0) return null
            return (
              <div key={group.label} className="mb-1 px-2">
                {!collapsed && <div className="px-2 pb-1 pt-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink-400">{group.label}</div>}
                {items.map((item) => {
                  const badge = item.badgeKey === 'orderInbox' ? orderBadge : item.badgeKey === 'openQuestions' ? questionBadge : 0
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) => cn(
                        'mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                        isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                        collapsed && 'justify-center',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && badge > 0 && <span className="rounded-full bg-risk-critical px-1.5 py-0 text-[10px] font-bold text-white">{badge}</span>}
                    </NavLink>
                  )
                })}
              </div>
            )
          })
        )}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <Avatar initials={user.initials} size={30} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-ink-900">{user.name}</div>
              <div className="truncate text-[11px] text-ink-500">{displayTitle(user)}</div>
            </div>
          )}
        </div>
        {isIntern && !collapsed && <div className="mt-2 text-[11px] text-ink-500">{visibleMatters} matters shared (read-only)</div>}
      </div>
    </aside>
  )
}

function InternNav({ questionBadge, collapsed }: { questionBadge: number; collapsed: boolean }) {
  const items = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Calendar', href: '/calendar' },
    { label: 'Open Questions', href: '/forum', badge: questionBadge },
    { label: 'My Research', href: '/forum/my-research' },
    { label: 'Research Library', href: '/forum/library' },
  ]
  return (
    <div className="px-2">
      {!collapsed && <div className="px-2 pb-1 pt-3 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink-400">Home</div>}
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) => cn('mb-0.5 flex items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] font-medium', isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50')}
        >
          {!collapsed ? item.label : item.label[0]}
          {!collapsed && item.badge ? <span className="rounded-full bg-ink-200 px-1.5 text-[10px]">{item.badge}</span> : null}
        </NavLink>
      ))}
      {!collapsed && (
        <div className="mx-2 mt-4 border-t border-dashed border-ink-200 pt-3 text-[11px] leading-relaxed text-ink-400">
          No Matters, Court, Work, Documents, Offline, Reports or Admin. Calendar is view-only — flag a discrepancy instead of editing. An intern never sees a nav item they cannot use.
        </div>
      )}
    </div>
  )
}
