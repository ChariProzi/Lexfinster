import { db, nextId } from '../data/db'
import { sleep, assertOnline } from './client'
import { assertCaseAccess, visibleMatterIds } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import type { CauseListEntry, Order, Forum, Task, Deadline } from '../data/types'

export async function getCourtDataHealth(): Promise<Forum[]> {
  await sleep()
  return db().forums
}

export async function syncForumNow(userId: string, forumId: string): Promise<Forum> {
  await sleep(700)
  assertOnline()
  let updated: Forum | undefined
  db().update('forums', (prev) => prev.map((f) => (f.id === forumId ? (updated = { ...f, courtDataSyncStatus: 'Healthy', lastSyncedAt: new Date().toISOString() }) : f)))
  appendAudit({ action: 'court_data.sync_now', objectType: 'Forum', objectId: forumId, actorUserId: userId })
  return updated!
}

export async function listCauseLists(userId: string, forumId?: string): Promise<CauseListEntry[]> {
  await sleep()
  assertOnline()
  const visible = visibleMatterIds(userId)
  return db().causeList.filter((c) => (!forumId || c.forumId === forumId) && (!c.matterId || visible.has(c.matterId)))
}

export async function listOrderInbox(userId: string): Promise<Order[]> {
  await sleep()
  const visible = visibleMatterIds(userId)
  return db().orders.filter((o) => visible.has(o.matterId))
}

export async function getOrder(userId: string, orderId: string): Promise<Order> {
  await sleep()
  const order = db().orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  assertCaseAccess(userId, order.matterId)
  return order
}

export async function confirmOrder(userId: string, orderId: string): Promise<{ order: Order; tasksCreated: Task[]; deadlinesCreated: Deadline[] }> {
  await sleep(400)
  assertOnline()
  const state = db()
  const order = state.orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  assertCaseAccess(userId, order.matterId, 'CaseContributor')

  const tasksCreated: Task[] = []
  const deadlinesCreated: Deadline[] = []
  for (const item of order.proposedItems ?? []) {
    if (item.kind === 'task') {
      const t: Task = {
        id: nextId('t'), matterId: order.matterId, title: item.label, type: 'Compliance',
        description: `Created from confirmed order dated ${order.orderDate}.`, dueDate: item.date ?? order.orderDate,
        priority: 'High', status: 'ToDo', visibility: 'MatterTeam', sourceType: 'ConfirmedOrder',
      }
      tasksCreated.push(t)
    } else {
      const d: Deadline = {
        id: nextId('d'), matterId: order.matterId, name: item.label, computedDate: item.date ?? null, status: 'Upcoming',
        lastRecomputedAt: new Date().toISOString(),
      }
      deadlinesCreated.push(d)
    }
  }
  if (tasksCreated.length) db().update('tasks', (prev) => [...prev, ...tasksCreated])
  if (deadlinesCreated.length) db().update('deadlines', (prev) => [...prev, ...deadlinesCreated])

  let updatedOrder: Order | undefined
  db().update('orders', (prev) => prev.map((o) => (o.id === orderId ? (updatedOrder = { ...o, reviewStatus: 'Confirmed', confirmedByUserId: userId, confirmedAt: new Date().toISOString() }) : o)))
  appendAudit({ action: 'order.confirm', objectType: 'Order', objectId: orderId, matterId: order.matterId, actorUserId: userId, afterState: { tasksCreated: tasksCreated.length, deadlinesCreated: deadlinesCreated.length } })
  return { order: updatedOrder!, tasksCreated, deadlinesCreated }
}

export async function dismissOrder(userId: string, orderId: string, reason: string): Promise<Order> {
  await sleep()
  const order = db().orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')
  assertCaseAccess(userId, order.matterId, 'CaseContributor')
  let updated: Order | undefined
  db().update('orders', (prev) => prev.map((o) => (o.id === orderId ? (updated = { ...o, reviewStatus: 'AwaitingInfo' }) : o)))
  appendAudit({ action: 'order.dismiss', objectType: 'Order', objectId: orderId, matterId: order.matterId, actorUserId: userId, afterState: { reason } })
  return updated!
}

export interface ManualUploadInput {
  matterId: string
  orderDate: string
  fileName: string
}
export async function manualUploadOrder(userId: string, input: ManualUploadInput): Promise<Order> {
  await sleep(600)
  assertCaseAccess(userId, input.matterId, 'CaseContributor')
  const matter = db().matters.find((m) => m.id === input.matterId)!
  const order: Order = {
    id: nextId('o'), matterId: input.matterId, forumId: matter.forumId, orderDate: input.orderDate,
    detectionSource: 'ManualUpload', detectedAt: new Date().toISOString(), extractionConfidence: 'Medium',
    reviewStatus: 'NeedsReview', extractedFields: { summary: `Uploaded manually: ${input.fileName}` },
    proposedItems: [{ kind: 'task', label: 'Review uploaded order and diarise next steps' }],
  }
  db().update('orders', (prev) => [order, ...prev])
  db().update('documents', (prev) => [
    { id: nextId('doc'), matterId: input.matterId, name: input.fileName, type: 'Order', source: 'Uploaded', documentDate: input.orderDate, uploadedByUserId: userId, sizeBytes: 500_000, ocrStatus: 'Pending', privileged: true, version: 1 },
    ...prev,
  ])
  appendAudit({ action: 'order.manual_upload', objectType: 'Order', objectId: order.id, matterId: input.matterId, actorUserId: userId })
  return order
}
