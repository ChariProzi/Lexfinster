import { db, nextId } from '../data/db'
import { sleep, assertOnline } from './client'
import { assertCaseAccess, assertRole, visibleMatterIds, getUser } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import type { Task, ChecklistItemInstance, SopTemplate } from '../data/types'

export async function listMyWorklist(userId: string): Promise<Task[]> {
  await sleep()
  return db().tasks.filter((t) => t.assigneeId === userId || t.reviewerId === userId)
}

export async function listMatterTasks(userId: string, matterId: string): Promise<Task[]> {
  await sleep()
  assertCaseAccess(userId, matterId)
  return db().tasks.filter((t) => t.matterId === matterId)
}

export async function listUnallocated(userId: string): Promise<Task[]> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  return db().tasks.filter((t) => !t.assigneeId)
}

export async function getTask(userId: string, taskId: string): Promise<{ task: Task; checklist: ChecklistItemInstance[] }> {
  await sleep()
  const task = db().tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Task not found')
  assertCaseAccess(userId, task.matterId)
  const checklist = db().checklistInstances.filter((c) => c.taskId === taskId).sort((a, b) => a.order - b.order)
  return { task, checklist }
}

export interface TaskInput {
  matterId: string
  title: string
  type: Task['type']
  description: string
  assigneeId?: string
  reviewerId?: string
  dueDate: string
  priority: Task['priority']
  linkedDeadlineId?: string
  sopTemplateId?: string
  visibility?: Task['visibility']
}

export async function createTask(userId: string, input: TaskInput): Promise<Task> {
  await sleep()
  assertCaseAccess(userId, input.matterId, 'CaseContributor')
  const task: Task = {
    id: nextId('t'), status: 'ToDo', visibility: input.visibility ?? 'MatterTeam', sourceType: 'Manual', ...input,
  }
  db().update('tasks', (prev) => [task, ...prev])
  if (input.sopTemplateId) {
    const tmpl = db().sopTemplates.find((s) => s.id === input.sopTemplateId)
    if (tmpl) {
      db().update('checklistInstances', (prev) => [
        ...prev,
        ...tmpl.steps.map((s) => ({ id: nextId('ci'), taskId: task.id, order: s.order, label: s.label, checked: false, guidance: s.guidance, requiredAttachment: s.requiredAttachment })),
      ])
    }
  }
  appendAudit({ action: 'task.create', objectType: 'Task', objectId: task.id, matterId: input.matterId, actorUserId: userId })
  return task
}

export async function updateTask(userId: string, taskId: string, patch: Partial<Task>): Promise<Task> {
  await sleep()
  const task = db().tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Task not found')
  assertCaseAccess(userId, task.matterId, 'CaseContributor')
  let updated: Task | undefined
  db().update('tasks', (prev) => prev.map((t) => (t.id === taskId ? (updated = { ...t, ...patch }) : t)))
  appendAudit({ action: 'task.update', objectType: 'Task', objectId: taskId, matterId: task.matterId, actorUserId: userId, afterState: patch })
  return updated!
}

export async function assignTask(userId: string, taskId: string, assigneeId: string, opts?: { grantAccess?: boolean }): Promise<Task> {
  await sleep()
  const task = db().tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Task not found')
  assertRole(userId, 'Admin', 'Partner')
  if (opts?.grantAccess) {
    db().update('caseAccessGrants', (prev) => {
      if (prev.some((g) => g.matterId === task.matterId && g.userId === assigneeId)) return prev
      return [...prev, { id: nextId('cag'), matterId: task.matterId, userId: assigneeId, level: 'CaseViewer' as const, grantedByUserId: userId, grantedAt: new Date().toISOString() }]
    })
    appendAudit({ action: 'access.grant', objectType: 'CaseAccessGrant', matterId: task.matterId, actorUserId: userId, afterState: { userId: assigneeId, level: 'CaseViewer' } })
  }
  let updated: Task | undefined
  db().update('tasks', (prev) => prev.map((t) => (t.id === taskId ? (updated = { ...t, assigneeId }) : t)))
  appendAudit({ action: 'task.assign', objectType: 'Task', objectId: taskId, matterId: task.matterId, actorUserId: userId, afterState: { assigneeId } })
  return updated!
}

export interface ClashWarning { assigneeName: string; hearing: string }
export async function checkAssignmentClash(assigneeId: string, dueDate: string): Promise<ClashWarning | null> {
  await sleep(150)
  const state = db()
  const clash = state.matters.find((m) => (m.assignedAssociateIds.includes(assigneeId) || m.paralegalId === assigneeId) && m.nextHearingDate === dueDate)
  if (!clash) return null
  const user = getUser(assigneeId)
  return { assigneeName: user?.name ?? 'This person', hearing: `${clash.title} (${clash.caseNumber}) — hearing on ${dueDate}` }
}

export async function toggleChecklistItem(userId: string, itemId: string, checked: boolean, naReason?: string): Promise<ChecklistItemInstance> {
  await sleep(150)
  let updated: ChecklistItemInstance | undefined
  db().update('checklistInstances', (prev) => prev.map((c) => (c.id === itemId ? (updated = { ...c, checked, naReason }) : c)))
  void userId
  return updated!
}

export async function setTaskBlocked(userId: string, taskId: string, blockedReason: string): Promise<Task> {
  return updateTask(userId, taskId, { status: 'Blocked', blockedReason })
}

export async function submitForReview(userId: string, taskId: string): Promise<Task> {
  return updateTask(userId, taskId, { status: 'InReview' })
}

export interface CompleteTaskResult { task: Task; obligationPrompt: string | null }
export async function completeTask(userId: string, taskId: string, obligationConfirmed?: boolean): Promise<CompleteTaskResult> {
  await sleep()
  const task = db().tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Task not found')
  assertCaseAccess(userId, task.matterId, 'CaseContributor')

  if (task.linkedDeadlineId && obligationConfirmed === undefined) {
    const deadline = db().deadlines.find((d) => d.id === task.linkedDeadlineId)
    return { task, obligationPrompt: deadline ? `Does this complete the statutory obligation '${deadline.name}'?` : null }
  }

  let updated: Task | undefined
  db().update('tasks', (prev) => prev.map((t) => (t.id === taskId ? (updated = { ...t, status: 'Done' }) : t)))
  if (task.linkedDeadlineId && obligationConfirmed) {
    db().update('deadlines', (prev) => prev.map((d) => (d.id === task.linkedDeadlineId ? { ...d, status: 'Met' } : d)))
  }
  appendAudit({ action: 'task.complete', objectType: 'Task', objectId: taskId, matterId: task.matterId, actorUserId: userId, afterState: { obligationConfirmed } })
  return { task: updated!, obligationPrompt: null }
}

export async function listReviewQueue(userId: string): Promise<Task[]> {
  await sleep()
  return db().tasks.filter((t) => t.status === 'InReview' && (t.reviewerId === userId || !t.reviewerId))
}

export async function approveReview(userId: string, taskId: string): Promise<Task> {
  await sleep()
  assertOnline()
  return updateTask(userId, taskId, { status: 'Done' })
}

export async function returnReview(userId: string, taskId: string, comments: string): Promise<Task> {
  await sleep()
  const t = await updateTask(userId, taskId, { status: 'Returned' })
  appendAudit({ action: 'task.review_returned', objectType: 'Task', objectId: taskId, matterId: t.matterId, actorUserId: userId, afterState: { comments } })
  return t
}

export async function listSopTemplates(): Promise<SopTemplate[]> {
  await sleep()
  return db().sopTemplates
}

export async function saveSopTemplate(userId: string, tmpl: SopTemplate): Promise<SopTemplate> {
  await sleep()
  assertRole(userId, 'Admin')
  db().update('sopTemplates', (prev) => {
    const exists = prev.some((s) => s.id === tmpl.id)
    return exists ? prev.map((s) => (s.id === tmpl.id ? tmpl : s)) : [...prev, tmpl]
  })
  appendAudit({ action: 'sop_template.save', objectType: 'SopTemplate', objectId: tmpl.id, actorUserId: userId })
  return tmpl
}

export interface AllocatedWorkRow {
  task: Task
  matterTitle: string
  caseNumber: string
  assigneeName: string | null
}

/** Every task the firm has allocated (or left unallocated), across every matter — for Admin/Partner to manage in one place. */
export async function listAllAllocatedWork(userId: string): Promise<AllocatedWorkRow[]> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const state = db()
  return state.tasks.map((task) => {
    const matter = state.matters.find((m) => m.id === task.matterId)
    const assignee = task.assigneeId ? getUser(task.assigneeId) : undefined
    return { task, matterTitle: matter?.title ?? 'Unknown matter', caseNumber: matter?.caseNumber ?? '—', assigneeName: assignee?.name ?? null }
  })
}

export async function teamWorkload(userId: string): Promise<{ userId: string; name: string; role: string; tasks: Task[] }[]> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  const state = db()
  const visible = visibleMatterIds(userId)
  return state.users
    .filter((u) => u.role !== 'BillingStaff')
    .map((u) => ({ userId: u.id, name: u.name, role: u.role, tasks: state.tasks.filter((t) => t.assigneeId === u.id && visible.has(t.matterId)) }))
}
