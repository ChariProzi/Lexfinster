import { db } from '../data/db'
import { sleep } from './client'
import { assertRole } from '../lib/rbac'
import { computeMatterHealth } from './matters'
import { daysUntil } from '../lib/dates'

export async function deadlineComplianceReport(userId: string) {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const deadlines = db().deadlines
  const met = deadlines.filter((d) => d.status === 'Met').length
  const missed = deadlines.filter((d) => d.status === 'Missed').length
  const overridden = deadlines.filter((d) => d.status === 'Overridden').length
  const upcoming = deadlines.filter((d) => d.status === 'Upcoming').length
  const needsJudgement = deadlines.filter((d) => d.status === 'NeedsJudgement').length
  const total = deadlines.length || 1
  return {
    met, missed, overridden, upcoming, needsJudgement,
    complianceRate: Math.round(((met + upcoming) / total) * 100),
    byMatter: db().matters.map((m) => ({
      matterId: m.id, title: m.title,
      deadlines: deadlines.filter((d) => d.matterId === m.id).length,
      missed: deadlines.filter((d) => d.matterId === m.id && d.status === 'Missed').length,
    })).filter((r) => r.deadlines > 0),
  }
}

export async function matterPipelineReport(userId: string) {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const matters = db().matters
  const stages = ['Intake', 'PreInstitution', 'Pleadings', 'Evidence', 'Arguments', 'Reserved', 'Closed'] as const
  return stages.map((stage) => ({ stage, count: matters.filter((m) => m.stage === stage).length, matters: matters.filter((m) => m.stage === stage).map((m) => ({ id: m.id, title: m.title })) }))
}

export async function workloadThroughputReport(userId: string) {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const state = db()
  return state.users.filter((u) => u.role !== 'BillingStaff').map((u) => {
    const tasks = state.tasks.filter((t) => t.assigneeId === u.id)
    return {
      userId: u.id, name: u.name, role: u.role,
      open: tasks.filter((t) => t.status !== 'Done').length,
      done: tasks.filter((t) => t.status === 'Done').length,
      overdue: tasks.filter((t) => t.status !== 'Done' && (daysUntil(t.dueDate) ?? 0) < 0).length,
      blocked: tasks.filter((t) => t.status === 'Blocked').length,
    }
  })
}

export async function courtDataReliabilityReport(userId: string) {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  return db().forums.map((f) => ({ forumId: f.id, name: f.name, status: f.courtDataSyncStatus, lastSyncedAt: f.lastSyncedAt, matterCount: f.matterCount }))
}

export async function hearingScheduleReport(userId: string) {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const state = db()
  return state.matters
    .filter((m) => m.nextHearingDate)
    .map((m) => ({ matterId: m.id, title: m.title, caseNumber: m.caseNumber, forum: state.forums.find((f) => f.id === m.forumId)?.name ?? '', date: m.nextHearingDate! }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface AtRiskRow {
  matterId: string
  title: string
  caseNumber: string
  risks: { key: string; label: string; severity: 'critical' | 'warn'; action: string; actionHref: string }[]
}
export async function atRiskReport(userId: string): Promise<AtRiskRow[]> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const state = db()
  return state.matters
    .map((m) => ({ matterId: m.id, title: m.title, caseNumber: m.caseNumber, risks: computeMatterHealth(m.id).flags }))
    .filter((r) => r.risks.length > 0)
    .sort((a, b) => b.risks.length - a.risks.length)
}
