import { db, nextId } from '../data/db'
import { sleep, assertOnline } from './client'
import { assertCaseAccess, visibleMatterIds, isRole, PermissionError } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import { scanConflict, computeDeadline } from '../lib/dateEngine'
import { relDateOnly } from '../lib/dates'
import type { Matter, ConflictCheck, Deadline, Party, IntakeType, ImportanceTier } from '../data/types'

export async function listMatters(userId: string): Promise<Matter[]> {
  await sleep()
  const visible = visibleMatterIds(userId)
  const isFirmWideRole = isRole(userId, 'Admin') // still subject to explicit grants per CONFLICTS_AND_ASSUMPTIONS #10
  void isFirmWideRole
  return db().matters.filter((m) => visible.has(m.id))
}

export async function getMatter(userId: string, matterId: string): Promise<Matter> {
  await sleep()
  assertCaseAccess(userId, matterId)
  const m = db().matters.find((mm) => mm.id === matterId)
  if (!m) throw new PermissionError('Matter not found', false, null)
  return m
}

export interface MatterHealth {
  matterId: string
  flags: { key: string; label: string; severity: 'critical' | 'warn'; action: string; actionHref: string }[]
}

export function computeMatterHealth(matterId: string): MatterHealth {
  const state = db()
  const m = state.matters.find((mm) => mm.id === matterId)
  const flags: MatterHealth['flags'] = []
  if (!m) return { matterId, flags }

  if (m.vakalatnamaStatus === 'Pending') {
    flags.push({ key: 'vakalatnama', label: 'Vakalatnama not yet signed', severity: 'warn', action: 'Open checklist', actionHref: `/matters/${matterId}/checklist` })
  }
  const forum = state.forums.find((f) => f.id === m.forumId)
  if (forum && (forum.courtDataSyncStatus === 'Delayed' || forum.courtDataSyncStatus === 'Failing' || forum.courtDataSyncStatus === 'ManualOnly')) {
    flags.push({ key: 'stale-court-data', label: `Court data ${forum.courtDataSyncStatus === 'ManualOnly' ? 'is manual-only' : forum.courtDataSyncStatus.toLowerCase()} for ${forum.name}`, severity: 'warn', action: 'View court data health', actionHref: '/court/data-health' })
  }
  const bundle = state.bundles.find((b) => b.matterId === matterId)
  if (!bundle || bundle.downloadState !== 'OnDevice') {
    flags.push({ key: 'no-bundle', label: 'No downloaded bundle for the next hearing', severity: m.importanceTier === 'Crucial' ? 'critical' : 'warn', action: 'Open case bundles', actionHref: '/offline/bundles' })
  }
  const grants = state.caseAccessGrants.filter((g) => g.matterId === matterId)
  if (grants.length <= 1) {
    flags.push({ key: 'single-access', label: 'Single person has access to this matter', severity: 'warn', action: 'Manage case access', actionHref: '/admin/case-access' })
  }
  const staleOrder = state.orders.find((o) => o.matterId === matterId && o.reviewStatus === 'NeedsReview')
  if (staleOrder) {
    flags.push({ key: 'order-unreviewed', label: 'Order detected and unreviewed', severity: 'critical', action: 'Open order inbox', actionHref: '/court/order-inbox' })
  }
  const missedDeadline = state.deadlines.find((d) => d.matterId === matterId && d.status === 'Missed')
  if (missedDeadline) {
    flags.push({ key: 'missed-deadline', label: `Deadline missed — ${missedDeadline.name}`, severity: 'critical', action: 'Review deadlines', actionHref: `/matters/${matterId}/deadlines` })
  }
  return { matterId, flags }
}

// ---------------------------------------------------------------------------
// Intake — S-07/S-08/S-09
// ---------------------------------------------------------------------------
export interface IntakeInput {
  intakeType: IntakeType
  title: string
  caseNumber: string
  forumId: string
  bench?: string
  practiceArea: string
  importanceTier: ImportanceTier
  isCommercialDispute: boolean
  responsiblePartnerId: string
  assignedAssociateIds: string[]
  paralegalId?: string
  parties: { name: string; role: Party['role']; weActFor: boolean }[]
}

export async function liveConflictCheck(userId: string, partyName: string): Promise<ConflictCheck[]> {
  await sleep(180)
  assertOnline()
  void userId
  const state = db()
  const matches = scanConflict(partyName, state.parties.map((p) => ({ name: p.name, weActFor: p.weActFor, matterId: p.matterId })), (id) => state.matters.find((m) => m.id === id)?.title ?? 'a matter')
  return matches.map((m, i) => ({
    id: nextId('cc'),
    partyName,
    result: m.result,
    checkedAt: new Date().toISOString(),
    detail: m.detail,
  }))
}

export async function createMatterFromIntake(userId: string, input: IntakeInput): Promise<{ matter: Matter; conflictChecks: ConflictCheck[]; blocked: boolean }> {
  await sleep(400)
  assertOnline()
  const state = db()
  const allChecks: ConflictCheck[] = []
  for (const party of input.parties) {
    if (party.weActFor) continue
    const matches = await liveConflictCheck(userId, party.name)
    allChecks.push(...matches)
  }
  const blocked = allChecks.some((c) => c.result === 'Blocked')
  if (blocked) {
    return { matter: undefined as unknown as Matter, conflictChecks: allChecks, blocked: true }
  }

  const matterId = nextId('m')
  const matter: Matter = {
    id: matterId,
    firmId: state.firm.id,
    caseNumber: input.caseNumber,
    title: input.title,
    forumId: input.forumId,
    bench: input.bench,
    stage: 'Intake',
    importanceTier: input.importanceTier,
    practiceArea: input.practiceArea,
    governingStatutes: [],
    isCommercialDispute: input.isCommercialDispute,
    responsiblePartnerId: input.responsiblePartnerId,
    assignedAssociateIds: input.assignedAssociateIds,
    paralegalId: input.paralegalId,
    intakeType: input.intakeType,
    vakalatnamaStatus: 'Pending',
    engagementLetterStatus: 'Sent',
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  }
  db().update('matters', (prev) => [...prev, matter])
  db().update('parties', (prev) => [
    ...prev,
    ...input.parties.map((p, i) => ({ id: nextId('p'), matterId, name: p.name, role: p.role, weActFor: p.weActFor, isOpposingInOtherMatter: allChecks.some((c) => c.partyName === p.name && c.result !== 'Clear') } satisfies Party)),
  ])
  db().update('conflictChecks', (prev) => [...prev, ...allChecks.map((c) => ({ ...c, matterId }))])

  // Grant CaseAdmin to the responsible partner + CaseContributor to the team, so the new matter is immediately visible.
  db().update('caseAccessGrants', (prev) => [
    ...prev,
    { id: nextId('cag'), matterId, userId: input.responsiblePartnerId, level: 'CaseAdmin', grantedByUserId: userId, grantedAt: new Date().toISOString() },
    ...input.assignedAssociateIds.map((a) => ({ id: nextId('cag'), matterId, userId: a, level: 'CaseContributor' as const, grantedByUserId: userId, grantedAt: new Date().toISOString() })),
    ...(input.paralegalId ? [{ id: nextId('cag'), matterId, userId: input.paralegalId, level: 'CaseContributor' as const, grantedByUserId: userId, grantedAt: new Date().toISOString() }] : []),
  ])

  // Seed a starter deadline set from Limitation Act as a plausible default, demonstrating the differentiator live.
  const rule = state.rules.find((r) => r.name === 'Written statement')
  const deadlines: Deadline[] = []
  if (rule && input.intakeType !== 'ExistingMidStream') {
    const computed = computeDeadline(new Date().toISOString(), rule)
    deadlines.push({
      id: nextId('d'), matterId, ruleId: rule.id, name: rule.name, computedDate: computed, status: 'Upcoming',
      lastRecomputedAt: new Date().toISOString(), ruleVersionAtComputation: state.rulePacks.find((rp) => rp.id === rule.rulePackId)?.version, provision: rule.governingProvision,
    })
  }
  if (deadlines.length) db().update('deadlines', (prev) => [...prev, ...deadlines])

  appendAudit({ action: 'matter.create', objectType: 'Matter', objectId: matterId, matterId, actorUserId: userId, afterState: { title: matter.title, caseNumber: matter.caseNumber } })
  return { matter, conflictChecks: allChecks, blocked: false }
}

export async function importFromPortal(userId: string, cnr: string): Promise<{ found: boolean; title?: string; forumName?: string }> {
  await sleep(500)
  assertOnline()
  void userId
  // Mock: deterministic "found" based on string length so the demo is repeatable either way.
  const found = cnr.trim().length >= 6
  if (!found) return { found: false }
  return { found: true, title: 'Matter imported from court portal (draft — confirm details)', forumName: 'Delhi High Court (Commercial Division)' }
}

export async function patchMatter(userId: string, matterId: string, patch: Partial<Matter>): Promise<Matter> {
  await sleep()
  assertCaseAccess(userId, matterId, 'CaseContributor')
  let updated: Matter | undefined
  db().update('matters', (prev) => prev.map((m) => {
    if (m.id !== matterId) return m
    updated = { ...m, ...patch, lastActivityAt: new Date().toISOString() }
    return updated
  }))
  appendAudit({ action: 'matter.update', objectType: 'Matter', objectId: matterId, matterId, beforeState: patch })
  return updated!
}

export function relLabel() {
  return relDateOnly(0)
}
