import { db } from '../data/db'
import type { CaseAccessLevel, Role, User } from '../data/types'

export function getUser(userId: string | null | undefined): User | undefined {
  if (!userId) return undefined
  return db().users.find((u) => u.id === userId)
}

export function isRole(userId: string | null | undefined, ...roles: Role[]): boolean {
  const u = getUser(userId)
  return !!u && roles.includes(u.role)
}

/** Per CONFLICTS_AND_ASSUMPTIONS.md #10 — explicit grant required even for Admin; no silent bypass. */
export function caseAccessLevel(userId: string | null | undefined, matterId: string): CaseAccessLevel {
  if (!userId) return 'NoAccess'
  const grant = db().caseAccessGrants.find((g) => g.userId === userId && g.matterId === matterId)
  return grant ? grant.level : 'NoAccess'
}

export function hasCaseAccess(userId: string | null | undefined, matterId: string, min: CaseAccessLevel = 'CaseViewer'): boolean {
  const level = caseAccessLevel(userId, matterId)
  if (level === 'NoAccess') return false
  const rank: Record<CaseAccessLevel, number> = { NoAccess: 0, CaseViewer: 1, CaseContributor: 2, CaseAdmin: 3 }
  return rank[level] >= rank[min]
}

export function visibleMatterIds(userId: string | null | undefined): Set<string> {
  if (!userId) return new Set()
  return new Set(db().caseAccessGrants.filter((g) => g.userId === userId).map((g) => g.matterId))
}

export function whoToAskFor(matterId: string): { userId: string; name: string } | null {
  const m = db().matters.find((mm) => mm.id === matterId)
  if (!m) return null
  const partner = getUser(m.responsiblePartnerId)
  return partner ? { userId: partner.id, name: partner.name } : null
}

export class PermissionError extends Error {
  reason: string
  matterExists: boolean
  whoToAsk: { userId: string; name: string } | null
  constructor(reason: string, matterExists: boolean, whoToAsk: { userId: string; name: string } | null) {
    super(reason)
    this.name = 'PermissionError'
    this.reason = reason
    this.matterExists = matterExists
    this.whoToAsk = whoToAsk
  }
}

export function assertCaseAccess(userId: string | null | undefined, matterId: string, min: CaseAccessLevel = 'CaseViewer') {
  const exists = !!db().matters.find((m) => m.id === matterId)
  if (!exists) throw new PermissionError('Matter not found', false, null)
  if (!hasCaseAccess(userId, matterId, min)) {
    throw new PermissionError('You do not have access to this matter', true, whoToAskFor(matterId))
  }
}

export function assertRole(userId: string | null | undefined, ...roles: Role[]) {
  if (!isRole(userId, ...roles)) {
    throw new PermissionError(`Requires role: ${roles.join(' or ')}`, true, null)
  }
}

/** Role-scoped nav visibility, per §3.1. Intern sees only 4 destinations. */
export function canSeeModule(role: Role, moduleKey: string): boolean {
  const hidden: Partial<Record<Role, string[]>> = {
    Intern: ['matters', 'work', 'court', 'documents', 'offline', 'reports', 'admin'],
    BillingStaff: ['work', 'court', 'documents', 'offline', 'forum', 'reports', 'admin'],
    Paralegal: ['reports', 'admin'],
    Associate: ['reports', 'admin'],
    Partner: ['admin'],
  }
  return !hidden[role]?.includes(moduleKey)
}

export const ROLE_LABEL: Record<Role, string> = {
  Admin: 'Admin',
  Partner: 'Partner',
  Associate: 'Associate',
  Paralegal: 'Paralegal',
  BillingStaff: 'Billing Staff',
  Intern: 'Intern',
}

/** Special-case display title for the firm's Admin who is also its senior partner (README: "Meera Kapoor – Partner/Admin"). */
export function displayTitle(user: User): string {
  if (user.id === 'u-meera') return 'Partner & Admin'
  return ROLE_LABEL[user.role]
}
