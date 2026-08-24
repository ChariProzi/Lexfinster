import { db } from '../data/db'
import { sleep } from './client'
import { appendAudit } from '../lib/audit'
import type { Notification, NotificationPreference, EscalationRule } from '../data/types'

export async function listNotifications(userId: string): Promise<Notification[]> {
  await sleep()
  return db().notifications.filter((n) => n.userId === userId).sort((a, b) => (b.sentAt.at(-1) ?? '').localeCompare(a.sentAt.at(-1) ?? ''))
}

export async function markRead(userId: string, notificationId: string): Promise<Notification> {
  await sleep(100)
  let updated: Notification | undefined
  db().update('notifications', (prev) => prev.map((n) => (n.id === notificationId ? (updated = { ...n, readAt: new Date().toISOString() }) : n)))
  void userId
  return updated!
}

export async function markAllRead(userId: string): Promise<void> {
  await sleep(150)
  db().update('notifications', (prev) => prev.map((n) => (n.userId === userId ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)))
}

export async function listNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
  await sleep()
  return db().notificationPreferences.filter((p) => p.userId === userId)
}

export async function updateNotificationPreference(userId: string, pref: NotificationPreference): Promise<NotificationPreference> {
  await sleep()
  db().update('notificationPreferences', (prev) => {
    const exists = prev.some((p) => p.id === pref.id)
    return exists ? prev.map((p) => (p.id === pref.id ? pref : p)) : [...prev, pref]
  })
  void userId
  return pref
}

export async function listEscalationRules(): Promise<EscalationRule[]> {
  await sleep()
  return db().escalationRules
}

export async function updateEscalationRule(userId: string, rule: EscalationRule): Promise<EscalationRule> {
  await sleep()
  db().update('escalationRules', (prev) => prev.map((r) => (r.id === rule.id ? rule : r)))
  appendAudit({ action: 'escalation_rule.update', objectType: 'EscalationRule', objectId: rule.id, actorUserId: userId })
  return rule
}
