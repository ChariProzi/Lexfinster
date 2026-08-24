import { db, nextId } from '../data/db'
import { sleep, assertOnline } from './client'
import { assertCaseAccess, visibleMatterIds, PermissionError } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import { scanConflict, computeDeadline } from '../lib/dateEngine'
import { relDateOnly, isoDateOnly, parseISOSafe } from '../lib/dates'
import type { Matter, ConflictCheck, Deadline, Party, IntakeType, ImportanceTier, MatterStage } from '../data/types'

export async function listMatters(userId: string): Promise<Matter[]> {
  await sleep()
  // Partner/Admin: every firm matter (see hasFirmWideMatterAccess). Everyone else: explicit CaseAccessGrant only.
  const visible = visibleMatterIds(userId)
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
  // Limitation-critical dates — which ones are meaningful depends on intakeType (S-08).
  causeOfActionDate?: string
  impugnedOrderDate?: string
  certifiedCopyAppliedFor?: string
  certifiedCopyReceived?: string
  dateOfService?: string
  currentStage?: MatterStage
  nextHearingDate?: string
}

export interface ConflictDecision {
  partyName: string
  outcome: 'NotAConflict' | 'Decline' | 'SeekWaiver'
  reason: string
}

export async function liveConflictCheck(userId: string, partyName: string): Promise<ConflictCheck[]> {
  await sleep(180)
  assertOnline()
  void userId
  const state = db()
  const matches = scanConflict(partyName, state.parties.map((p) => ({ name: p.name, weActFor: p.weActFor, matterId: p.matterId })), (id) => state.matters.find((m) => m.id === id)?.title ?? 'a matter')
  return matches.map((m) => ({
    id: nextId('cc'),
    partyName,
    result: m.result,
    checkedAt: new Date().toISOString(),
    detail: m.detail,
  }))
}

/** Picks the rule + trigger date that drives the S-08 "proposed deadline chain" preview for a given intake type. */
export function rulesForIntakeType(intakeType: IntakeType, input: Pick<IntakeInput, 'causeOfActionDate' | 'impugnedOrderDate' | 'certifiedCopyAppliedFor' | 'certifiedCopyReceived' | 'dateOfService'>): { ruleName: string; triggerDate?: string; exclusionDays: number } | null {
  switch (intakeType) {
    case 'FreshCase':
      return { ruleName: 'Written Statement', triggerDate: input.causeOfActionDate, exclusionDays: 0 }
    case 'AppealRevision': {
      let exclusionDays = 0
      if (input.certifiedCopyAppliedFor && input.certifiedCopyReceived) {
        const a = parseISOSafe(input.certifiedCopyAppliedFor)
        const r = parseISOSafe(input.certifiedCopyReceived)
        if (a && r) exclusionDays = Math.max(0, Math.round((r.getTime() - a.getTime()) / 86_400_000))
      }
      return { ruleName: 'Appeal / revision limitation', triggerDate: input.impugnedOrderDate, exclusionDays }
    }
    case 'ReplyRequired':
      return { ruleName: 'Reply / response window', triggerDate: input.dateOfService, exclusionDays: 0 }
    case 'ExistingMidStream':
      return null // no trigger to compute from — existing deadlines are entered/confirmed separately, never invented.
  }
}

export async function createMatterFromIntake(userId: string, input: IntakeInput, decisions: ConflictDecision[] = []): Promise<{ matter: Matter; conflictChecks: ConflictCheck[]; blocked: boolean; declined: boolean }> {
  await sleep(400)
  assertOnline()
  const state = db()
  const allChecks: ConflictCheck[] = []
  for (const party of input.parties) {
    if (party.weActFor) continue
    const matches = await liveConflictCheck(userId, party.name)
    allChecks.push(...matches)
  }

  // Nothing machine-derived becomes binding silently: every non-Clear result needs a recorded human decision before intake can proceed.
  const unresolved = allChecks.filter((c) => c.result !== 'Clear' && !decisions.some((d) => d.partyName === c.partyName))
  if (unresolved.length > 0) {
    return { matter: undefined as unknown as Matter, conflictChecks: allChecks, blocked: true, declined: false }
  }

  const checksWithDecisions: ConflictCheck[] = allChecks.map((c) => {
    const d = decisions.find((dd) => dd.partyName === c.partyName)
    return d ? { ...c, decision: { outcome: d.outcome, reason: d.reason, byUserId: userId, at: new Date().toISOString() } } : c
  })

  if (checksWithDecisions.some((c) => c.decision?.outcome === 'Decline')) {
    // The firm has decided to decline the matter over a conflict — record it, but do not create the matter.
    appendAudit({ action: 'conflict.decline', objectType: 'ConflictCheck', actorUserId: userId, afterState: { title: input.title, caseNumber: input.caseNumber } })
    return { matter: undefined as unknown as Matter, conflictChecks: checksWithDecisions, blocked: true, declined: true }
  }

  const matterId = nextId('m')
  const matter: Matter = {
    id: matterId,
    firmId: state.firm.id,
    caseNumber: input.caseNumber,
    title: input.title,
    forumId: input.forumId,
    bench: input.bench,
    stage: input.intakeType === 'ExistingMidStream' && input.currentStage ? input.currentStage : 'Intake',
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
    nextHearingDate: input.nextHearingDate || undefined,
  }
  db().update('matters', (prev) => [...prev, matter])
  db().update('parties', (prev) => [
    ...prev,
    ...input.parties.map((p) => ({ id: nextId('p'), matterId, name: p.name, role: p.role, weActFor: p.weActFor, isOpposingInOtherMatter: checksWithDecisions.some((c) => c.partyName === p.name && c.result !== 'Clear') } satisfies Party)),
  ])
  db().update('conflictChecks', (prev) => [...prev, ...checksWithDecisions.map((c) => ({ ...c, matterId }))])

  // Grant CaseAdmin to the responsible partner + CaseContributor to the team, so the new matter is immediately visible.
  db().update('caseAccessGrants', (prev) => [
    ...prev,
    { id: nextId('cag'), matterId, userId: input.responsiblePartnerId, level: 'CaseAdmin', grantedByUserId: userId, grantedAt: new Date().toISOString() },
    ...input.assignedAssociateIds.map((a) => ({ id: nextId('cag'), matterId, userId: a, level: 'CaseContributor' as const, grantedByUserId: userId, grantedAt: new Date().toISOString() })),
    ...(input.paralegalId ? [{ id: nextId('cag'), matterId, userId: input.paralegalId, level: 'CaseContributor' as const, grantedByUserId: userId, grantedAt: new Date().toISOString() }] : []),
  ])

  // Seed the initial deadline chain from the intake-type-specific rule — the differentiator, live from the first screen.
  const picked = rulesForIntakeType(input.intakeType, input)
  const deadlines: Deadline[] = []
  if (picked && picked.triggerDate) {
    const rule = state.rules.find((r) => r.name === picked.ruleName)
    if (rule) {
      let computed = computeDeadline(picked.triggerDate, rule)
      if (computed && picked.exclusionDays > 0) computed = isoDateOnly(addDaysLocal(computed, picked.exclusionDays))
      deadlines.push({
        id: nextId('d'), matterId, ruleId: rule.id, name: rule.name, computedDate: computed, status: computed ? 'Upcoming' : 'NeedsJudgement',
        lastRecomputedAt: new Date().toISOString(), ruleVersionAtComputation: state.rulePacks.find((rp) => rp.id === rule.rulePackId)?.version, provision: rule.governingProvision,
      })
      // Condonation of delay always accompanies an appeal/revision as an explicit, never-auto-computed line — matches S-08's worked example.
      if (input.intakeType === 'AppealRevision') {
        const condonation = state.rules.find((r) => r.name === 'Condonation of delay')
        if (condonation) {
          deadlines.push({ id: nextId('d'), matterId, ruleId: condonation.id, name: condonation.name, computedDate: null, status: 'NeedsJudgement', lastRecomputedAt: new Date().toISOString(), provision: condonation.governingProvision })
        }
      }
    }
  }
  if (deadlines.length) db().update('deadlines', (prev) => [...prev, ...deadlines])

  appendAudit({ action: 'matter.create', objectType: 'Matter', objectId: matterId, matterId, actorUserId: userId, afterState: { title: matter.title, caseNumber: matter.caseNumber } })
  return { matter, conflictChecks: checksWithDecisions, blocked: false, declined: false }
}

function addDaysLocal(iso: string, days: number): Date {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d
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

export interface MatterOverview {
  matter: Matter
  forumName: string
  parties: Party[]
  team: { userId: string; name: string; initials: string; roleLabel: string }[]
  topDeadlines: Deadline[]
  openTaskCount: number
  documentCount: number
  health: ReturnType<typeof computeMatterHealth>
  vakalatnamaStatus: Matter['vakalatnamaStatus']
}
export async function getMatterOverview(userId: string, matterId: string): Promise<MatterOverview> {
  await sleep()
  assertCaseAccess(userId, matterId)
  const state = db()
  const matter = state.matters.find((m) => m.id === matterId)
  if (!matter) throw new PermissionError('Matter not found', false, null)
  const forumName = state.forums.find((f) => f.id === matter.forumId)?.name ?? '—'
  const parties = state.parties.filter((p) => p.matterId === matterId)
  const team: MatterOverview['team'] = []
  const partner = state.users.find((u) => u.id === matter.responsiblePartnerId)
  if (partner) team.push({ userId: partner.id, name: partner.name, initials: partner.initials, roleLabel: 'Responsible partner' })
  for (const aid of matter.assignedAssociateIds) {
    const a = state.users.find((u) => u.id === aid)
    if (a) team.push({ userId: a.id, name: a.name, initials: a.initials, roleLabel: 'Associate' })
  }
  if (matter.paralegalId) {
    const p = state.users.find((u) => u.id === matter.paralegalId)
    if (p) team.push({ userId: p.id, name: p.name, initials: p.initials, roleLabel: 'Paralegal' })
  }
  const topDeadlines = state.deadlines.filter((d) => d.matterId === matterId && d.status !== 'Met').slice(0, 4)
  const openTaskCount = state.tasks.filter((t) => t.matterId === matterId && t.status !== 'Done').length
  const documentCount = state.documents.filter((d) => d.matterId === matterId).length

  return { matter, forumName, parties, team, topDeadlines, openTaskCount, documentCount, health: computeMatterHealth(matterId), vakalatnamaStatus: matter.vakalatnamaStatus }
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
