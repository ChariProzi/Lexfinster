import { useNavigate } from 'react-router-dom'
import { LogOut, Settings2, Laptop, ChevronRight } from 'lucide-react'
import { useSession } from '../lib/session'
import { getUser, canSeeModule, displayTitle } from '../lib/rbac'
import { NAV_GROUPS } from '../components/layout/navConfig'
import { PageHeader, Avatar } from '../components/ui/primitives'
import { Section } from '../components/shared/Layout'
import { logout as apiLogout } from '../api/auth'

export default function More() {
  const navigate = useNavigate()
  const userId = useSession((s) => s.userId)
  const logout = useSession((s) => s.logout)
  const user = getUser(userId)
  if (!user) return null

  const groups = NAV_GROUPS.filter((g) => g.moduleKey !== 'home' && g.moduleKey !== 'matters' && g.moduleKey !== 'work')
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.roles || it.roles.includes(user.role)) }))
    .filter((g) => canSeeModule(user.role, g.moduleKey) && g.items.length > 0 && (g.moduleKey !== 'offline'))

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="More" />
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-ink-200 bg-paper p-4">
        <Avatar initials={user.initials} size={40} />
        <div>
          <div className="text-sm font-semibold text-ink-900">{user.name}</div>
          <div className="text-xs text-ink-500">{displayTitle(user)} · {user.email}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <Section key={g.label} title={g.label}>
            <div className="divide-y divide-ink-100">
              {g.items.map((it) => (
                <button key={it.href} onClick={() => navigate(it.href)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-ink-50">
                  <span className="flex items-center gap-2.5 text-sm text-ink-800"><it.icon className="h-4 w-4 text-ink-500" />{it.label}</span>
                  <ChevronRight className="h-4 w-4 text-ink-300" />
                </button>
              ))}
            </div>
          </Section>
        ))}

        <Section title="Settings">
          <div className="divide-y divide-ink-100">
            <button onClick={() => navigate('/settings/notifications')} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-ink-50">
              <span className="flex items-center gap-2.5 text-sm text-ink-800"><Settings2 className="h-4 w-4 text-ink-500" />Notification preferences</span>
              <ChevronRight className="h-4 w-4 text-ink-300" />
            </button>
            <button onClick={() => navigate('/onboarding/device-registration')} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-ink-50">
              <span className="flex items-center gap-2.5 text-sm text-ink-800"><Laptop className="h-4 w-4 text-ink-500" />Device & offline consent</span>
              <ChevronRight className="h-4 w-4 text-ink-300" />
            </button>
          </div>
        </Section>

        <button
          onClick={async () => { await apiLogout(user.id); logout(); navigate('/login') }}
          className="flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-paper px-4 py-3 text-sm font-semibold text-risk-critical hover:bg-risk-critical-bg"
        >
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </div>
  )
}
