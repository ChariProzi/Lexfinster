import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Flag, Gavel, CalendarClock, CheckCircle2 } from 'lucide-react'
import { listCalendarEvents, listCalendarFlags, flagCalendarDiscrepancy, resolveCalendarFlag, type CalendarEvent } from '../../api/calendar'
import { useSession } from '../../lib/session'
import { getUser, isRole } from '../../lib/rbac'
import { PageHeader, Badge, Button } from '../../components/ui/primitives'
import { Modal } from '../../components/ui/overlay'
import { Textarea } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess, toastError } from '../../lib/toast'
import { fmt, fmtDateTime, isoDateOnly } from '../../lib/dates'

const SEVERITY_TONE = { critical: 'critical', warn: 'warn', normal: 'neutral' } as const

export default function CalendarPage() {
  const userId = useSession((s) => s.userId)!
  const user = getUser(userId)!
  const isIntern = user.role === 'Intern'
  const isPartnerOrAdmin = isRole(userId, 'Admin', 'Partner')
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => isoDateOnly(new Date()))
  const [flagTarget, setFlagTarget] = useState<CalendarEvent | null>(null)
  const [flagNote, setFlagNote] = useState('')
  const [resolveTarget, setResolveTarget] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')

  const eventsQuery = useQuery({ queryKey: ['calendar-events', userId], queryFn: () => listCalendarEvents(userId) })
  const flagsQuery = useQuery({ queryKey: ['calendar-flags', userId], queryFn: () => listCalendarFlags(userId), enabled: isPartnerOrAdmin })

  const flagMutation = useMutation({
    mutationFn: (vars: { matterId: string; eventKind: 'hearing' | 'deadline'; eventLabel: string; eventDate: string; note: string }) => flagCalendarDiscrepancy(userId, vars),
    onSuccess: () => { toastSuccess('Flagged for your Partner to review.'); setFlagTarget(null); setFlagNote(''); qc.invalidateQueries({ queryKey: ['calendar-flags'] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not submit the flag.'),
  })
  const resolveMutation = useMutation({
    mutationFn: (vars: { flagId: string; note?: string }) => resolveCalendarFlag(userId, vars.flagId, vars.note),
    onSuccess: () => { toastSuccess('Marked resolved.'); setResolveTarget(null); setResolveNote(''); qc.invalidateQueries({ queryKey: ['calendar-flags'] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not resolve.'),
  })

  const events = eventsQuery.data ?? []
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [events])

  const gridStart = startOfWeek(startOfMonth(cursor))
  const gridEnd = endOfWeek(endOfMonth(cursor))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const selectedEvents = eventsByDay.get(selectedDate) ?? []

  function openEvent(e: CalendarEvent) {
    if (isIntern) {
      setFlagTarget(e)
      return
    }
    navigate(e.kind === 'deadline' ? `/matters/${e.matterId}/deadlines` : `/matters/${e.matterId}`)
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={isIntern ? 'Hearings and deadlines on the matters shared with you — view only. Spot something wrong? Flag it for your Partner.' : 'Every upcoming hearing and deadline across the matters you can see.'}
      />

      <SixState query={eventsQuery} onRetry={() => eventsQuery.refetch()}>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 rounded-lg border border-ink-200 bg-paper p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-ink-900">{format(cursor, 'MMMM yyyy')}</div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="secondary" size="sm" onClick={() => { setCursor(startOfMonth(new Date())); setSelectedDate(isoDateOnly(new Date())) }}>Today</Button>
                <Button variant="ghost" size="sm" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const key = isoDateOnly(day)
                const dayEvents = eventsByDay.get(key) ?? []
                const inMonth = isSameMonth(day, cursor)
                const selected = isSameDay(day, parseISO(selectedDate))
                const severity = dayEvents.some((e) => e.severity === 'critical') ? 'critical' : dayEvents.some((e) => e.severity === 'warn') ? 'warn' : dayEvents.length > 0 ? 'normal' : null
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`flex min-h-16 flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-left transition-colors ${
                      selected ? 'border-ink-900 bg-ink-50' : 'border-ink-100 hover:border-ink-300'
                    } ${!inMonth ? 'opacity-40' : ''}`}
                  >
                    <span className={`font-mono text-xs ${isToday(day) ? 'flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white' : 'text-ink-700'}`}>{format(day, 'd')}</span>
                    {dayEvents.length > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${severity === 'critical' ? 'bg-risk-critical' : severity === 'warn' ? 'bg-risk-warn-ink' : 'bg-ink-500'}`}
                        title={`${dayEvents.length} event(s)`}
                      />
                    )}
                    {dayEvents.length > 1 && <span className="font-mono text-[9px] text-ink-400">{dayEvents.length}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-80 lg:shrink-0">
            <Section title={fmt(selectedDate, 'EEEE, d MMMM')}>
              {selectedEvents.length === 0 ? (
                <div className="px-3.5 py-4 text-sm text-ink-500">Nothing on this day.</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {selectedEvents.map((e) => (
                    <button key={e.id} onClick={() => openEvent(e)} className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-ink-50">
                      {e.kind === 'hearing' ? <Gavel className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" /> : <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-ink-900">{e.label}</div>
                        <div className="truncate text-xs text-ink-500">{e.matterTitle} · {e.caseNumber}</div>
                      </div>
                      {e.severity !== 'normal' && <Badge tone={SEVERITY_TONE[e.severity]}>{e.severity === 'critical' ? 'Missed' : 'Attention'}</Badge>}
                    </button>
                  ))}
                </div>
              )}
            </Section>
            {isIntern && <div className="rounded-md border border-dashed border-ink-200 px-3.5 py-2.5 text-xs text-ink-500">Tap an event to flag a date or detail that looks wrong. You can view, not edit — flags go straight to your Partner.</div>}
          </div>
        </div>
      </SixState>

      {isPartnerOrAdmin && (
        <div className="mt-5">
          <Section title={<span className="flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" />Discrepancy flags raised{flagsQuery.data ? ` (${flagsQuery.data.filter((f) => f.status === 'Open').length} open)` : ''}</span>}>
            <SixState query={flagsQuery} isEmpty={(flagsQuery.data ?? []).length === 0} emptyState={<div className="px-3.5 py-4 text-sm text-ink-500">No discrepancies have been flagged.</div>}>
              <div className="divide-y divide-ink-100">
                {(flagsQuery.data ?? []).map((f) => {
                  const raiser = getUser(f.raisedByUserId)
                  return (
                    <div key={f.id} className="flex flex-col gap-1.5 px-3.5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => navigate(`/matters/${f.matterId}`)} className="text-[13px] font-medium text-ink-900 hover:underline">{f.eventLabel} · {fmt(f.eventDate)}</button>
                        <Badge tone={f.status === 'Open' ? 'warn' : 'safe'}>{f.status}</Badge>
                      </div>
                      <div className="text-sm text-ink-700">{f.note}</div>
                      <div className="text-xs text-ink-400">Raised by {raiser?.name ?? f.raisedByUserId} · {fmtDateTime(f.raisedAt)}</div>
                      {f.status === 'Resolved' ? (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-500"><CheckCircle2 className="h-3.5 w-3.5 text-risk-safe" />Resolved by {getUser(f.resolvedByUserId)?.name ?? '—'}{f.resolutionNote ? ` — ${f.resolutionNote}` : ''}</div>
                      ) : (
                        <div className="mt-1"><Button variant="secondary" size="sm" onClick={() => setResolveTarget(f.id)}>Mark resolved</Button></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </SixState>
          </Section>
        </div>
      )}

      <Modal open={!!flagTarget} onClose={() => { setFlagTarget(null); setFlagNote('') }} title="Flag a discrepancy" footer={
        <>
          <Button variant="secondary" onClick={() => { setFlagTarget(null); setFlagNote('') }}>Cancel</Button>
          <Button
            variant="primary"
            loading={flagMutation.isPending}
            disabled={!flagNote.trim()}
            onClick={() => flagTarget && flagMutation.mutate({ matterId: flagTarget.matterId, eventKind: flagTarget.kind, eventLabel: flagTarget.label, eventDate: flagTarget.date, note: flagNote })}
          >
            Submit flag
          </Button>
        </>
      }>
        {flagTarget && (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-ink-200 bg-surface px-3 py-2.5 text-sm">
              <div className="font-medium text-ink-900">{flagTarget.label} · {fmt(flagTarget.date)}</div>
              <div className="text-xs text-ink-500">{flagTarget.matterTitle} · {flagTarget.caseNumber}</div>
            </div>
            <Textarea rows={4} placeholder="What looks wrong about this date or event?" value={flagNote} onChange={(e) => setFlagNote(e.target.value)} />
          </div>
        )}
      </Modal>

      <Modal open={!!resolveTarget} onClose={() => { setResolveTarget(null); setResolveNote('') }} title="Resolve discrepancy flag" footer={
        <>
          <Button variant="secondary" onClick={() => { setResolveTarget(null); setResolveNote('') }}>Cancel</Button>
          <Button variant="primary" loading={resolveMutation.isPending} onClick={() => resolveTarget && resolveMutation.mutate({ flagId: resolveTarget, note: resolveNote })}>Mark resolved</Button>
        </>
      }>
        <Textarea rows={3} placeholder="Optional note on how this was resolved…" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
      </Modal>
    </div>
  )
}
