import { db } from '../data/db'
import { sleep } from './client'
import { visibleMatterIds, isRole } from '../lib/rbac'
import { daysUntil } from '../lib/dates'
import { computeMatterHealth } from './matters'
import type { Matter, Task, CauseListEntry } from '../data/types'

export interface MyDay {
  inCourtToday: { matter: Matter; causeListEntry?: CauseListEntry }[]
  dueToday: Task[]
  needsDecision: { kind: 'order' | 'judgement-deadline' | 'review'; label: string; href: string; matterTitle: string }[]
  comingUp: { kind: 'hearing' | 'deadline'; label: string; date: string; href: string }[]
  deadlinesThisWeekCount: number
}

export async function getMyDay(userId: string): Promise<MyDay> {
  await sleep()
  const state = db()
  const visible = visibleMatterIds(userId)
  const todayStr = new Date().toISOString().slice(0, 10)

  const inCourtToday = state.matters
    .filter((m) => visible.has(m.id) && m.nextHearingDate === todayStr)
    .map((m) => ({ matter: m, causeListEntry: state.causeList.find((c) => c.matterId === m.id && c.date === todayStr) }))

  const dueToday = state.tasks.filter((t) => visible.has(t.matterId) && t.status !== 'Done' && daysUntil(t.dueDate) !== null && (daysUntil(t.dueDate)! <= 0))

  const needsDecision: MyDay['needsDecision'] = []
  for (const o of state.orders.filter((o) => visible.has(o.matterId) && o.reviewStatus === 'NeedsReview')) {
    needsDecision.push({ kind: 'order', label: 'New order detected — review before it becomes binding', href: '/court/order-inbox', matterTitle: state.matters.find((m) => m.id === o.matterId)?.title ?? '' })
  }
  for (const d of state.deadlines.filter((d) => visible.has(d.matterId) && d.status === 'NeedsJudgement')) {
    needsDecision.push({ kind: 'judgement-deadline', label: `${d.name} needs a judgement call — no automatic date`, href: `/matters/${d.matterId}/deadlines`, matterTitle: state.matters.find((m) => m.id === d.matterId)?.title ?? '' })
  }
  for (const t of state.tasks.filter((t) => t.reviewerId === userId && t.status === 'InReview')) {
    needsDecision.push({ kind: 'review', label: `Review submitted work: ${t.title}`, href: `/work/tasks/${t.id}`, matterTitle: state.matters.find((m) => m.id === t.matterId)?.title ?? '' })
  }

  const comingUp: MyDay['comingUp'] = []
  for (const m of state.matters.filter((m) => visible.has(m.id) && m.nextHearingDate)) {
    const n = daysUntil(m.nextHearingDate)
    if (n !== null && n > 0 && n <= 7) comingUp.push({ kind: 'hearing', label: m.title, date: m.nextHearingDate!, href: `/matters/${m.id}` })
  }
  const deadlinesThisWeek = state.deadlines.filter((d) => visible.has(d.matterId) && d.status === 'Upcoming' && daysUntil(d.computedDate) !== null && daysUntil(d.computedDate)! >= 0 && daysUntil(d.computedDate)! <= 7)
  for (const d of deadlinesThisWeek) {
    comingUp.push({ kind: 'deadline', label: d.name, date: d.computedDate!, href: `/matters/${d.matterId}/deadlines` })
  }
  comingUp.sort((a, b) => a.date.localeCompare(b.date))

  return { inCourtToday, dueToday, needsDecision, comingUp, deadlinesThisWeekCount: deadlinesThisWeek.length }
}

export interface DashboardData {
  scope: 'firm' | 'personal' | 'intern'
  openMatters: number
  tasksDueThisWeek: number
  ordersNeedingReview: number
  atRiskMatters: number
  forumOpenQuestions: number
  recentAudit: { id: string; action: string; actorName?: string; timestamp: string }[]
  workloadByPerson: { name: string; open: number }[]
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  await sleep()
  const state = db()
  const visible = visibleMatterIds(userId)
  const firmWide = isRole(userId, 'Admin', 'Partner')

  const matterIds = firmWide ? new Set(state.matters.map((m) => m.id)) : visible
  const tasksDueThisWeek = state.tasks.filter((t) => (firmWide || t.assigneeId === userId) && t.status !== 'Done' && (daysUntil(t.dueDate) ?? 99) <= 7).length
  const ordersNeedingReview = state.orders.filter((o) => matterIds.has(o.matterId) && o.reviewStatus === 'NeedsReview').length
  const atRiskMatters = state.matters.filter((m) => matterIds.has(m.id) && computeMatterHealth(m.id).flags.length > 0).length
  const forumOpenQuestions = state.forumQuestions.filter((q) => q.clearanceState === 'Open').length

  const workloadByPerson = firmWide
    ? state.users.filter((u) => u.role !== 'BillingStaff').map((u) => ({ name: u.name, open: state.tasks.filter((t) => t.assigneeId === u.id && t.status !== 'Done').length }))
    : []

  return {
    scope: isRole(userId, 'Intern') ? 'intern' : firmWide ? 'firm' : 'personal',
    openMatters: matterIds.size,
    tasksDueThisWeek,
    ordersNeedingReview,
    atRiskMatters,
    forumOpenQuestions,
    recentAudit: firmWide ? state.auditLog.slice(0, 6).map((a) => ({ id: a.id, action: a.action, actorName: a.actorName, timestamp: a.timestamp })) : [],
    workloadByPerson,
  }
}
