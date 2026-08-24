import { db, nextId } from '../data/db'
import { sleep } from './client'
import { assertRole } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import type { User, Role, CaseAccessGrant, CaseAccessLevel, Firm, DataPrincipalRequest } from '../data/types'

export async function listUsers(userId: string): Promise<User[]> {
  await sleep()
  assertRole(userId, 'Admin')
  return db().users
}

export async function inviteUser(userId: string, input: { name: string; email: string; role: Role }): Promise<User> {
  await sleep()
  assertRole(userId, 'Admin')
  const user: User = { id: nextId('u'), firmId: db().firm.id, name: input.name, initials: input.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase(), email: input.email, role: input.role, status: 'Invited', lastActiveAt: new Date().toISOString() }
  db().update('users', (prev) => [...prev, user])
  appendAudit({ action: 'user.invite', objectType: 'User', objectId: user.id, actorUserId: userId, afterState: { email: input.email, role: input.role } })
  return user
}

export interface RoleChangeResult { user: User; requiresReassignment: string[] }
export async function changeUserRole(userId: string, targetUserId: string, newRole: Role): Promise<RoleChangeResult> {
  await sleep()
  assertRole(userId, 'Admin')
  const state = db()
  const target = state.users.find((u) => u.id === targetUserId)
  if (!target) throw new Error('User not found')
  const wasPartnerOrAdmin = target.role === 'Partner' || target.role === 'Admin'
  const losingSeniority = wasPartnerOrAdmin && newRole !== 'Partner' && newRole !== 'Admin'
  const caseAdminMatters = losingSeniority
    ? state.caseAccessGrants.filter((g) => g.userId === targetUserId && g.level === 'CaseAdmin').map((g) => state.matters.find((m) => m.id === g.matterId)?.title ?? g.matterId)
    : []
  if (caseAdminMatters.length > 0) {
    return { user: target, requiresReassignment: caseAdminMatters }
  }
  let updated: User | undefined
  db().update('users', (prev) => prev.map((u) => (u.id === targetUserId ? (updated = { ...u, role: newRole }) : u)))
  appendAudit({ action: 'user.role_change', objectType: 'User', objectId: targetUserId, actorUserId: userId, beforeState: { role: target.role }, afterState: { role: newRole } })
  return { user: updated!, requiresReassignment: [] }
}

export async function suspendUser(userId: string, targetUserId: string): Promise<User> {
  await sleep()
  assertRole(userId, 'Admin')
  let updated: User | undefined
  db().update('users', (prev) => prev.map((u) => (u.id === targetUserId ? (updated = { ...u, status: 'Suspended' }) : u)))
  appendAudit({ action: 'user.suspend', objectType: 'User', objectId: targetUserId, actorUserId: userId })
  return updated!
}

export async function reactivateUser(userId: string, targetUserId: string): Promise<User> {
  await sleep()
  assertRole(userId, 'Admin')
  let updated: User | undefined
  db().update('users', (prev) => prev.map((u) => (u.id === targetUserId ? (updated = { ...u, status: 'Active' }) : u)))
  appendAudit({ action: 'user.reactivate', objectType: 'User', objectId: targetUserId, actorUserId: userId })
  return updated!
}

export async function forceSignOut(userId: string, targetUserId: string): Promise<void> {
  await sleep()
  assertRole(userId, 'Admin')
  appendAudit({ action: 'user.force_sign_out', objectType: 'User', objectId: targetUserId, actorUserId: userId })
}

// ---------------------------------------------------------------------------
// Case access (S-55)
// ---------------------------------------------------------------------------
export async function listCaseAccess(userId: string): Promise<CaseAccessGrant[]> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  return db().caseAccessGrants
}

export async function grantCaseAccess(userId: string, matterId: string, targetUserId: string, level: CaseAccessLevel): Promise<CaseAccessGrant | null> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  if (level === 'NoAccess') {
    db().update('caseAccessGrants', (prev) => prev.filter((g) => !(g.matterId === matterId && g.userId === targetUserId)))
    appendAudit({ action: 'access.revoke', objectType: 'CaseAccessGrant', matterId, actorUserId: userId, afterState: { userId: targetUserId } })
    return null
  }
  const grant: CaseAccessGrant = { id: nextId('cag'), matterId, userId: targetUserId, level, grantedByUserId: userId, grantedAt: new Date().toISOString() }
  db().update('caseAccessGrants', (prev) => [...prev.filter((g) => !(g.matterId === matterId && g.userId === targetUserId)), grant])
  appendAudit({ action: 'access.grant', objectType: 'CaseAccessGrant', matterId, actorUserId: userId, afterState: { userId: targetUserId, level } })
  return grant
}

export async function requestAccess(userId: string, matterId: string, reason: string): Promise<void> {
  await sleep()
  appendAudit({ action: 'access.request', objectType: 'CaseAccessGrant', matterId, actorUserId: userId, afterState: { reason } })
}

// ---------------------------------------------------------------------------
// Audit log (S-56) — read-only, insert-only.
// ---------------------------------------------------------------------------
export async function listAuditLog(userId: string) {
  await sleep()
  assertRole(userId, 'Admin')
  return db().auditLog
}

// ---------------------------------------------------------------------------
// Firm settings (S-60)
// ---------------------------------------------------------------------------
export async function getFirmSettings(): Promise<Firm> {
  await sleep()
  return db().firm
}

export async function updateFirmSettings(userId: string, patch: Partial<Firm>): Promise<Firm> {
  await sleep()
  assertRole(userId, 'Admin')
  db().update('firm', (prev) => ({ ...prev, ...patch }))
  appendAudit({ action: 'firm.update', objectType: 'Firm', actorUserId: userId, afterState: patch })
  return db().firm
}

// ---------------------------------------------------------------------------
// Data retention / DPDPA (S-59)
// ---------------------------------------------------------------------------
export async function listDprRequests(userId: string): Promise<DataPrincipalRequest[]> {
  await sleep()
  assertRole(userId, 'Admin')
  return db().dprRequests
}

export async function respondToDpr(userId: string, requestId: string, note: string): Promise<DataPrincipalRequest> {
  await sleep()
  assertRole(userId, 'Admin')
  let updated: DataPrincipalRequest | undefined
  db().update('dprRequests', (prev) => prev.map((r) => (r.id === requestId ? (updated = { ...r, status: 'Completed', handledByUserId: userId, detail: note }) : r)))
  appendAudit({ action: 'dpr.respond', objectType: 'DataPrincipalRequest', objectId: requestId, actorUserId: userId, afterState: { note } })
  return updated!
}
