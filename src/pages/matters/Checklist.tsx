import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Circle } from 'lucide-react'
import { getMatter, patchMatter } from '../../api/matters'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { SixState } from '../../components/shared/SixState'
import { PageHeader } from '../../components/ui/primitives'
import { Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { toastSuccess } from '../../lib/toast'
import type { Matter } from '../../data/types'

export default function Checklist() {
  const { matterId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['matter', matterId, userId], queryFn: () => getMatter(userId, matterId) })
  const conflictChecks = useDb(useShallow((s) => s.conflictChecks.filter((c) => c.matterId === matterId)))
  const grants = useDb(useShallow((s) => s.caseAccessGrants.filter((g) => g.matterId === matterId)))
  const deadlines = useDb(useShallow((s) => s.deadlines.filter((d) => d.matterId === matterId)))

  const mutation = useMutation({
    mutationFn: (patch: Partial<Matter>) => patchMatter(userId, matterId, patch),
    onSuccess: () => { toastSuccess('Updated.'); qc.invalidateQueries({ queryKey: ['matter', matterId] }); qc.invalidateQueries({ queryKey: ['matter-overview', matterId] }) },
  })

  const derived = [
    { label: 'Conflict check cleared', done: conflictChecks.every((c) => c.result !== 'Blocked'), note: `${conflictChecks.length} check(s) run` },
    { label: 'Case access granted to the matter team', done: grants.length > 0, note: `${grants.length} grant(s)` },
    { label: 'Initial deadlines computed', done: deadlines.length > 0, note: `${deadlines.length} deadline(s)` },
  ]

  return (
    <div>
      <PageHeader title="Engagement Checklist" description={query.data?.title} />
      <SixState query={query}>
        {query.data && (
          <div className="flex max-w-xl flex-col gap-4">
            <Section title="Vakalatnama & engagement">
              <div className="flex flex-col gap-3 p-4">
                <label className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">Vakalatnama status</span>
                  <Select className="w-40" value={query.data.vakalatnamaStatus} onChange={(e) => mutation.mutate({ vakalatnamaStatus: e.target.value as Matter['vakalatnamaStatus'] })}>
                    {['NotRequired', 'Pending', 'Signed', 'Filed'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">Engagement letter</span>
                  <Select className="w-40" value={query.data.engagementLetterStatus} onChange={(e) => mutation.mutate({ engagementLetterStatus: e.target.value as Matter['engagementLetterStatus'] })}>
                    {['Sent', 'Signed'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </label>
              </div>
            </Section>
            <Section title="Automatically tracked">
              <div className="divide-y divide-ink-100">
                {derived.map((d) => (
                  <div key={d.label} className="flex items-center gap-3 px-4 py-3 text-sm">
                    {d.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-risk-safe" /> : <Circle className="h-4 w-4 shrink-0 text-ink-300" />}
                    <span className="flex-1 text-ink-800">{d.label}</span>
                    <span className="text-xs text-ink-500">{d.note}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </SixState>
    </div>
  )
}
