import { db, nextId } from '../data/db'
import { sleep, assertOnline } from './client'
import { assertCaseAccess, isRole, PermissionError } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import { computeDeadline } from '../lib/dateEngine'
import type { Deadline, Rule, RulePack } from '../data/types'

export async function listDeadlines(userId: string, matterId: string): Promise<Deadline[]> {
  await sleep()
  assertCaseAccess(userId, matterId)
  return db().deadlines.filter((d) => d.matterId === matterId)
}

export interface DeadlineExplanation {
  deadline: Deadline
  rule?: Rule
  rulePack?: RulePack
}

export async function explainDeadline(userId: string, deadlineId: string): Promise<DeadlineExplanation> {
  await sleep()
  const state = db()
  const deadline = state.deadlines.find((d) => d.id === deadlineId)
  if (!deadline) throw new PermissionError('Deadline not found', false, null)
  assertCaseAccess(userId, deadline.matterId)
  const rule = deadline.ruleId ? state.rules.find((r) => r.id === deadline.ruleId) : undefined
  const rulePack = rule ? state.rulePacks.find((rp) => rp.id === rule.rulePackId) : undefined
  return { deadline, rule, rulePack }
}

export interface OverrideInput {
  newDate: string
  reason: string
  countersignedByUserId?: string
}

/** Countersign policy (open question, CONFLICTS_AND_ASSUMPTIONS #3): Associates require a Partner/Admin
 *  countersign before an override takes effect; Partner/Admin overrides take effect immediately. */
export async function overrideDeadline(userId: string, deadlineId: string, input: OverrideInput): Promise<Deadline> {
  await sleep()
  assertOnline()
  const state = db()
  const deadline = state.deadlines.find((d) => d.id === deadlineId)
  if (!deadline) throw new PermissionError('Deadline not found', false, null)
  assertCaseAccess(userId, deadline.matterId, 'CaseContributor')
  if (!input.reason.trim()) throw new Error('A reason is required to override a computed deadline.')

  const needsCountersign = !isRole(userId, 'Partner', 'Admin')
  let updated: Deadline | undefined
  db().update('deadlines', (prev) => prev.map((d) => {
    if (d.id !== deadlineId) return d
    updated = {
      ...d,
      originalComputedDate: d.originalComputedDate ?? d.computedDate,
      computedDate: input.newDate,
      status: needsCountersign && !input.countersignedByUserId ? d.status : 'Overridden',
      overrideReason: input.reason,
      overriddenByUserId: userId,
      countersignedByUserId: needsCountersign ? input.countersignedByUserId : userId,
      lastRecomputedAt: new Date().toISOString(),
    }
    return updated
  }))
  appendAudit({
    action: 'deadline.override', objectType: 'Deadline', objectId: deadlineId, matterId: deadline.matterId,
    beforeState: { computedDate: deadline.computedDate }, afterState: { computedDate: input.newDate, reason: input.reason },
  })
  return updated!
}

export async function countersignOverride(userId: string, deadlineId: string): Promise<Deadline> {
  await sleep()
  const deadline = db().deadlines.find((d) => d.id === deadlineId)
  if (!deadline) throw new PermissionError('Deadline not found', false, null)
  assertCaseAccess(userId, deadline.matterId)
  let updated: Deadline | undefined
  db().update('deadlines', (prev) => prev.map((d) => (d.id === deadlineId ? (updated = { ...d, status: 'Overridden', countersignedByUserId: userId }) : d)))
  appendAudit({ action: 'deadline.countersign', objectType: 'Deadline', objectId: deadlineId, matterId: deadline.matterId })
  return updated!
}

export async function recomputeDeadline(userId: string, deadlineId: string): Promise<Deadline> {
  await sleep()
  const state = db()
  const deadline = state.deadlines.find((d) => d.id === deadlineId)
  if (!deadline) throw new PermissionError('Deadline not found', false, null)
  assertCaseAccess(userId, deadline.matterId)
  const rule = deadline.ruleId ? state.rules.find((r) => r.id === deadline.ruleId) : undefined
  let updated: Deadline = deadline
  if (rule) {
    const recomputed = computeDeadline(deadline.lastRecomputedAt, rule)
    db().update('deadlines', (prev) => prev.map((d) => (d.id === deadlineId ? (updated = { ...d, computedDate: recomputed, lastRecomputedAt: new Date().toISOString() }) : d)))
  }
  return updated
}

// ---------------------------------------------------------------------------
// Rule packs (S-57)
// ---------------------------------------------------------------------------
export async function listRulePacks(): Promise<RulePack[]> {
  await sleep()
  return db().rulePacks
}

export async function getRulePackImpact(rulePackId: string): Promise<{ rulePack: RulePack; matters: { matterId: string; title: string; changes: { deadlineId: string; name: string; was: string | null; becomes: string | null }[] }[] }> {
  await sleep()
  const state = db()
  const rulePack = state.rulePacks.find((rp) => rp.id === rulePackId)
  if (!rulePack) throw new PermissionError('Rule pack not found', false, null)
  const affectedIds = rulePack.pendingUpdate?.affectedMatterIds ?? []
  const matters = affectedIds.map((mid) => {
    const m = state.matters.find((mm) => mm.id === mid)!
    const changes = state.deadlines
      .filter((d) => d.matterId === mid && d.ruleId && state.rules.find((r) => r.id === d.ruleId)?.rulePackId === rulePackId)
      .map((d) => ({ deadlineId: d.id, name: d.name, was: d.computedDate, becomes: d.computedDate }))
    return { matterId: mid, title: m?.title ?? mid, changes }
  })
  return { rulePack, matters }
}

export async function applyRulePackUpdate(userId: string, rulePackId: string): Promise<void> {
  await sleep(400)
  assertOnline()
  db().update('rulePacks', (prev) => prev.map((rp) => (rp.id === rulePackId ? { ...rp, status: 'Active', version: bumpVersion(rp.version), pendingUpdate: undefined } : rp)))
  appendAudit({ action: 'rulepack.apply_update', objectType: 'RulePack', objectId: rulePackId, actorUserId: userId })
}

export async function keepCurrentDates(userId: string, rulePackId: string): Promise<void> {
  await sleep()
  db().update('rulePacks', (prev) => prev.map((rp) => (rp.id === rulePackId ? { ...rp, status: 'Disabled' as const } : rp)))
  appendAudit({ action: 'rulepack.keep_current_dates', objectType: 'RulePack', objectId: rulePackId, actorUserId: userId })
}

function bumpVersion(v: string): string {
  const m = v.match(/v(\d+)\.(\d+)/)
  if (!m) return v
  return `v${m[1]}.${String(Number(m[2]) + 1).padStart(2, '0')}`
}

export async function toggleRulePack(userId: string, rulePackId: string, status: RulePack['status']): Promise<void> {
  await sleep()
  db().update('rulePacks', (prev) => prev.map((rp) => (rp.id === rulePackId ? { ...rp, status } : rp)))
  appendAudit({ action: 'rulepack.toggle', objectType: 'RulePack', objectId: rulePackId, actorUserId: userId, afterState: { status } })
}

export async function listHolidayCalendars() {
  await sleep()
  return db().holidayCalendars
}

export async function updateHolidayCalendar(userId: string, id: string, patch: Partial<{ holidays: string[] }>) {
  await sleep()
  db().update('holidayCalendars', (prev) => prev.map((h) => (h.id === id ? { ...h, ...patch, lastUpdatedAt: new Date().toISOString() } : h)))
  appendAudit({ action: 'holiday_calendar.update', objectType: 'HolidayCalendar', objectId: id, actorUserId: userId })
}

export async function listRules() {
  await sleep()
  return db().rules
}
export { nextId }
