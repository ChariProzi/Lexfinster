import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { listHolidayCalendars, updateHolidayCalendar } from '../../api/deadlines'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Input } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { fmt, fmtDateTime } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

export default function HolidayCalendars() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const forums = useDb((s) => s.forums)
  const query = useQuery({ queryKey: ['holiday-calendars'], queryFn: () => listHolidayCalendars() })
  const [newDate, setNewDate] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: (vars: { id: string; holidays: string[] }) => updateHolidayCalendar(userId, vars.id, { holidays: vars.holidays }),
    onSuccess: () => { toastSuccess('Holiday calendar updated.'); qc.invalidateQueries({ queryKey: ['holiday-calendars'] }) },
  })

  return (
    <div>
      <PageHeader title="Holiday Calendars" description="Working-day deadline computations skip these dates and vacation periods, per forum." />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="flex flex-col gap-4">
          {(query.data ?? []).map((hc) => {
            const forum = forums.find((f) => f.id === hc.forumId)
            return (
              <Section key={hc.id} title={`${forum?.name ?? hc.forumId} · ${hc.year}`} actions={<span className="text-xs text-ink-400">Source: {hc.source} · updated {fmtDateTime(hc.lastUpdatedAt)}</span>}>
                <div className="flex flex-col gap-3 p-3.5">
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-ink-600">Holidays</div>
                    <div className="flex flex-wrap gap-1.5">
                      {hc.holidays.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1 rounded border border-ink-200 bg-surface px-2 py-1 font-mono text-[11px] text-ink-700">
                          {fmt(d)}
                          <button onClick={() => mutation.mutate({ id: hc.id, holidays: hc.holidays.filter((h) => h !== d) })} className="text-ink-400 hover:text-risk-critical"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input type="date" value={newDate[hc.id] ?? ''} onChange={(e) => setNewDate((p) => ({ ...p, [hc.id]: e.target.value }))} className="w-40 text-xs" />
                      <Button
                        size="sm" variant="secondary"
                        disabled={!newDate[hc.id]}
                        onClick={() => { const d = newDate[hc.id]; if (d && !hc.holidays.includes(d)) mutation.mutate({ id: hc.id, holidays: [...hc.holidays, d].sort() }); setNewDate((p) => ({ ...p, [hc.id]: '' })) }}
                      ><Plus className="h-3.5 w-3.5" />Add date</Button>
                    </div>
                  </div>
                  {hc.vacationPeriods.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs font-medium text-ink-600">Vacation periods</div>
                      <div className="flex flex-col gap-1 text-sm text-ink-700">
                        {hc.vacationPeriods.map((v, i) => <div key={i}>{fmt(v.start)} – {fmt(v.end)}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )
          })}
        </div>
      </SixState>
    </div>
  )
}
