import { addDays as fnsAddDays, format, differenceInCalendarDays, isBefore, isValid, parseISO } from 'date-fns'

export function today(): Date {
  const d = new Date()
  d.setHours(9, 0, 0, 0)
  return d
}

export function iso(d: Date): string {
  return d.toISOString()
}

export function isoDateOnly(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Offset from "today" — negative = past, positive = future. Returns full ISO datetime. */
export function rel(days: number, hours = 0): string {
  let d = fnsAddDays(today(), days)
  if (hours) d = new Date(d.getTime() + hours * 3600_000)
  return iso(d)
}

export function relDateOnly(days: number): string {
  return isoDateOnly(fnsAddDays(today(), days))
}

export function fmt(dateIso: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!dateIso) return '—'
  const d = parseISO(dateIso)
  if (!isValid(d)) return '—'
  return format(d, pattern)
}

export function fmtDateTime(dateIso: string | null | undefined): string {
  if (!dateIso) return '—'
  const d = parseISO(dateIso)
  if (!isValid(d)) return '—'
  return format(d, 'd MMM yyyy, h:mm a')
}

export function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null
  const d = parseISO(dateIso)
  if (!isValid(d)) return null
  return differenceInCalendarDays(d, today())
}

export function isPast(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false
  const d = parseISO(dateIso)
  return isValid(d) && isBefore(d, today())
}

export function relTime(dateIso: string): string {
  const diffMs = today().getTime() - parseISO(dateIso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export { fnsAddDays as addDays }

export function parseISOSafe(s: string): Date | null {
  const d = parseISO(s)
  return isValid(d) ? d : null
}
