import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listMatters } from '../../api/matters'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader } from '../../components/ui/primitives'
import { MatterCard } from '../../components/shared/MatterCard'
import { Select } from '../../components/ui/form'
import type { MatterStage } from '../../data/types'

const STAGES: MatterStage[] = ['Intake', 'PreInstitution', 'Pleadings', 'Evidence', 'Arguments', 'Reserved', 'Closed']

export default function Board() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['matters', userId], queryFn: () => listMatters(userId) })
  const [mobileStage, setMobileStage] = useState<MatterStage>('Pleadings')

  return (
    <div>
      <PageHeader title="Matters by Stage" description="Kanban view of every matter you can see, grouped by stage." />
      <SixState query={query} isEmpty={!!query.data && query.data.length === 0}>
        {query.data && (
          <>
            <div className="mb-3 md:hidden">
              <Select value={mobileStage} onChange={(e) => setMobileStage(e.target.value as MatterStage)}>
                {STAGES.map((s) => <option key={s} value={s}>{s} ({query.data!.filter((m) => m.stage === s).length})</option>)}
              </Select>
              <div className="mt-3 flex flex-col gap-2">
                {query.data.filter((m) => m.stage === mobileStage).map((m) => <MatterCard key={m.id} matter={m} />)}
                {query.data.filter((m) => m.stage === mobileStage).length === 0 && <div className="py-6 text-center text-sm text-ink-500">No matters at this stage.</div>}
              </div>
            </div>

            <div className="hidden gap-3 overflow-x-auto pb-2 md:flex">
              {STAGES.map((stage) => {
                const matters = query.data!.filter((m) => m.stage === stage)
                return (
                  <div key={stage} className="w-72 shrink-0 rounded-lg border border-ink-200 bg-surface">
                    <div className="flex items-center justify-between border-b border-ink-200 px-3 py-2">
                      <span className="text-[13px] font-semibold text-ink-900">{stage}</span>
                      <span className="rounded-full bg-ink-100 px-1.5 font-mono text-[10px] text-ink-600">{matters.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 p-2">
                      {matters.map((m) => <MatterCard key={m.id} matter={m} dense />)}
                      {matters.length === 0 && <div className="px-2 py-6 text-center text-xs text-ink-400">Empty</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </SixState>
      {query.data && query.data.length === 0 && (
        <button onClick={() => navigate('/matters/new')} className="mt-3 text-sm text-brand-500 underline">Start your first intake →</button>
      )}
    </div>
  )
}
