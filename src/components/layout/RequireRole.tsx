import type { ReactNode } from 'react'
import { useSession } from '../../lib/session'
import { getUser } from '../../lib/rbac'
import type { Role } from '../../data/types'
import { Lock } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const userId = useSession((s) => s.userId)
  const user = getUser(userId)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-300">
          <Lock className="h-4.5 w-4.5 text-ink-600" />
        </div>
        <div className="text-[15px] font-semibold text-ink-900">This area is restricted</div>
        <div className="max-w-md text-sm text-ink-500">
          This screen requires the {roles.join(' or ')} role. You're signed in as {user.role}. Nothing on this screen is shown.
        </div>
      </div>
    )
  }
  return <>{children}</>
}
