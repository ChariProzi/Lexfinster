import { db, nextId } from '../data/db'
import { sleep } from './client'
import { assertCaseAccess, assertRole, visibleMatterIds } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import { rel } from '../lib/dates'
import type { CalendarFlag } from '../data/types'

export interface CalendarEvent {
  id: string
  matterId: string
  matterTitle: string
  caseNumber: string
  kind: 'hearing' | 'deadline'
  label: string
  date: string
  severity: 'critical' | 'warn' | 'normal'
}

/** Every hearing + deadline across the matters this user can see (Partner/Admin: firm-wide; everyone else: explicit grants only). */
export async function listCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  await sleep()
  const visible = visibleMatterIds(userId)
  const state = db()
  const events: CalendarEvent[] = []

  for (const m of state.matters) {
    if (!visible.has(m.id)) continue
    if (m.nextHearingDate) {
      events.push({ id: `hearing-${m.id}`, matterId: m.id, matterTitle: m.title, caseNumber: m.caseNumber, kind: 'hearing', label: 'Hearing', date: m.nextHearingDate, severity: 'normal' })
    }
  }
  for (const d of state.deadlines) {
    if (!visible.has(d.matterId) || !d.computedDate) continue
    const m = state.matters.find((mm) => mm.id === d.matterId)
    if (!m) continue
    events.push({
      id: `deadline-${d.id}`,
      matterId: d.matterId,
      matterTitle: m.title,
      caseNumber: m.caseNumber,
      kind: 'deadline',
      label: d.name,
      date: d.computedDate,
      severity: d.status === 'Missed' ? 'critical' : d.status === 'NeedsJudgement' ? 'warn' : 'normal',
    })
  }
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

/** Intern (or any view-limited role): flag a date/event they believe is wrong, instead of editing it. Notifies the matter's responsible partner. */
export async function flagCalendarDiscrepancy(userId: string, input: { matterId: string; eventKind: 'hearing' | 'deadline'; eventLabel: string; eventDate: string; note: string }): Promise<CalendarFlag> {
  await sleep()
  assertCaseAccess(userId, input.matterId)
  if (!input.note.trim()) throw new Error('Describe what looks wrong before submitting.')
  const state = db()
  const raiser = state.users.find((u) => u.id === userId)
  const matter = state.matters.find((m) => m.id === input.matterId)
  const flag: CalendarFlag = {
    id: nextId('cf'),
    matterId: input.matterId,
    eventKind: input.eventKind,
    eventLabel: input.eventLabel,
    eventDate: input.eventDate,
    note: input.note.trim(),
    raisedByUserId: userId,
    raisedAt: rel(0),
    status: 'Open',
  }
  db().update('calendarFlags', (prev) => [flag, ...prev])
  appendAudit({ action: 'calendar.flag_raised', objectType: 'CalendarFlag', objectId: flag.id, matterId: input.matterId, actorUserId: userId, afterState: { eventLabel: input.eventLabel, eventDate: input.eventDate } })

  if (matter?.responsiblePartnerId) {
    db().update('notifications', (prev) => [
      {
        id: nextId('n'),
        userId: matter.responsiblePartnerId,
        category: 'NeedsAction' as const,
        title: `${raiser?.name ?? 'A team member'} flagged a calendar discrepancy — ${matter.title}`,
        body: input.note.trim(),
        matterId: input.matterId,
        channelsSent: ['InApp' as const],
        sentAt: [rel(0)],
        actionHref: '/calendar',
      },
      ...prev,
    ])
  }
  return flag
}

/** Partner/Admin queue of open (and recently resolved) discrepancy flags across the firm. */
export async function listCalendarFlags(userId: string): Promise<CalendarFlag[]> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  return db().calendarFlags.slice().sort((a, b) => (a.status === b.status ? b.raisedAt.localeCompare(a.raisedAt) : a.status === 'Open' ? -1 : 1))
}

export async function resolveCalendarFlag(userId: string, flagId: string, resolutionNote?: string): Promise<CalendarFlag> {
  await sleep()
  assertRole(userId, 'Admin', 'Partner')
  let updated: CalendarFlag | undefined
  db().update('calendarFlags', (prev) => prev.map((f) => (f.id === flagId ? (updated = { ...f, status: 'Resolved', resolvedByUserId: userId, resolvedAt: rel(0), resolutionNote: resolutionNote?.trim() || undefined }) : f)))
  if (!updated) throw new Error('Flag not found')
  appendAudit({ action: 'calendar.flag_resolved', objectType: 'CalendarFlag', objectId: flagId, matterId: updated.matterId, actorUserId: userId })
  return updated
}
