import { addDays, isoDateOnly, parseISOSafe } from './dates'
import type { HolidayCalendar, Rule } from '../data/types'

function isWeekend(d: Date): boolean {
  const day = d.getDay()
  return day === 0 || day === 6
}

function isHoliday(d: Date, cal: HolidayCalendar | undefined): boolean {
  if (!cal) return false
  const iso = isoDateOnly(d)
  if (cal.holidays.includes(iso)) return true
  return cal.vacationPeriods.some((p) => iso >= p.start && iso <= p.end)
}

/**
 * Computes a deadline date from a trigger date + rule. Discretionary rules
 * (§5 Limitation Act condonation etc.) never compute — the engine must not
 * imply confidence it does not have (see Batch 0, callout 6).
 */
export function computeDeadline(
  triggerDateIso: string,
  rule: Pick<Rule, 'durationDays' | 'calendarOrWorkingDays' | 'discretionaryDoNotAutoCompute'>,
  holidayCalendar?: HolidayCalendar,
): string | null {
  if (rule.discretionaryDoNotAutoCompute) return null
  const start = parseISOSafe(triggerDateIso)
  if (!start) return null

  if (rule.calendarOrWorkingDays === 'Calendar') {
    return isoDateOnly(addDays(start, rule.durationDays))
  }

  // Working-days: step forward one day at a time, skipping weekends + forum holidays.
  let cursor = start
  let remaining = rule.durationDays
  while (remaining > 0) {
    cursor = addDays(cursor, 1)
    if (!isWeekend(cursor) && !isHoliday(cursor, holidayCalendar)) remaining--
  }
  return isoDateOnly(cursor)
}

export interface ConflictMatch {
  partyName: string
  result: 'Clear' | 'PotentialConflict' | 'Blocked'
  detail: string
}

/**
 * Naive fuzzy conflict scan against existing parties/clients — a stand-in for
 * the "licensed" conflict engine. Flags: (a) direct — we already act against
 * this exact name; (b) name-similarity — partial token overlap.
 */
export function scanConflict(
  candidateName: string,
  parties: { name: string; weActFor: boolean; matterId: string }[],
  matterTitleById: (id: string) => string,
): ConflictMatch[] {
  const name = candidateName.trim().toLowerCase()
  if (!name) return []
  const matches: ConflictMatch[] = []
  const tokens = new Set(name.split(/\s+/).filter((t) => t.length > 2))

  for (const p of parties) {
    const pName = p.name.toLowerCase()
    if (pName === name) {
      matches.push({
        partyName: p.name,
        result: p.weActFor ? 'Clear' : 'PotentialConflict',
        detail: p.weActFor
          ? 'Existing client — same entity, no conflict.'
          : `Direct — we act against this party in ${matterTitleById(p.matterId)}`,
      })
      continue
    }
    const pTokens = pName.split(/\s+/).filter((t) => t.length > 2)
    const overlap = pTokens.filter((t) => tokens.has(t)).length
    const score = pTokens.length ? overlap / pTokens.length : 0
    if (score >= 0.5 && pName !== name) {
      matches.push({
        partyName: p.name,
        result: 'PotentialConflict',
        detail: `Name similarity ${Math.round(score * 100)}% — may be a different person/entity, verify before proceeding.`,
      })
    }
  }
  return matches
}
