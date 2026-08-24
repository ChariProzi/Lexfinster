import { useNavigate } from 'react-router-dom'
import { useDb } from '../../data/db'
import type { Matter } from '../../data/types'
import { fmt, daysUntil } from '../../lib/dates'
import { cn } from '../../lib/cn'
import { useSession } from '../../lib/session'

export type Allocation = 'mine' | 'team' | 'other'

export function allocationFor(userId: string | null, matter: Matter): Allocation {
  if (!userId) return 'other'
  if (matter.responsiblePartnerId === userId || matter.assignedAssociateIds.includes(userId) || matter.paralegalId === userId) return 'mine'
  return 'team'
}

export function AllocationStripe({ allocation, className }: { allocation: Allocation; className?: string }) {
  return (
    <div
      className={cn('w-1.5 shrink-0', className)}
      style={{
        background:
          allocation === 'mine' ? 'var(--color-ink-900)' :
          allocation === 'team' ? 'repeating-linear-gradient(135deg, var(--color-ink-900) 0 3px, transparent 3px 6px)' :
          'var(--color-ink-100)',
      }}
    />
  )
}

function riskDotFor(matterId: string) {
  const deadlines = useDb.getState().deadlines.filter((d) => d.matterId === matterId && (d.status === 'Upcoming' || d.status === 'Missed'))
  if (deadlines.some((d) => d.status === 'Missed')) return 'breached'
  const soonest = deadlines
    .map((d) => daysUntil(d.computedDate))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b)[0]
  if (soonest === undefined) return 'safe'
  if (soonest <= 2) return 'critical'
  if (soonest <= 7) return 'approaching'
  return 'safe'
}

export function RiskDot({ level, size = 11 }: { level: 'safe' | 'approaching' | 'critical' | 'breached'; size?: number }) {
  const style = { width: size, height: size }
  if (level === 'safe') return <span className="inline-block rounded-full border-2 border-ink-900 box-border" style={style} />
  if (level === 'approaching') return <span className="inline-block rounded-full border-[1.5px] border-ink-900 box-border" style={{ ...style, background: 'linear-gradient(90deg, var(--color-ink-900) 50%, transparent 50%)' }} />
  if (level === 'critical') return <span className="inline-block rounded-full bg-risk-critical" style={style} />
  return (
    <span className="relative inline-block rounded-full bg-risk-critical" style={style}>
      <span className="absolute left-[-3px] top-1/2 h-[1.5px] w-[calc(100%+6px)] -translate-y-1/2 bg-ink-900" />
    </span>
  )
}

export function ImportanceTierChip({ tier }: { tier: Matter['importanceTier'] }) {
  const glyph = tier === 'Crucial' ? '▲' : tier === 'Medium' ? '●' : '○'
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-ink-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-900">
      {glyph} {tier.toUpperCase()}
    </span>
  )
}

export function MatterCard({ matter, dense }: { matter: Matter; dense?: boolean }) {
  const navigate = useNavigate()
  const userId = useSession((s) => s.userId)
  const isDesktopClient = useSession((s) => s.isDesktopClient)
  const forum = useDb((s) => s.forums.find((f) => f.id === matter.forumId))
  const bundle = useDb((s) => s.bundles.find((b) => b.matterId === matter.id))
  const allocation = allocationFor(userId, matter)
  const risk = riskDotFor(matter.id)
  const stale = forum && (forum.courtDataSyncStatus === 'Delayed' || forum.courtDataSyncStatus === 'Failing' || forum.courtDataSyncStatus === 'ManualOnly')

  return (
    <button
      onClick={() => navigate(`/matters/${matter.id}`)}
      className={cn(
        'flex w-full overflow-hidden rounded-md border bg-paper text-left transition-shadow hover:shadow-card',
        stale ? 'border-dashed border-ink-400' : 'border-ink-200',
      )}
    >
      <AllocationStripe allocation={allocation} />
      <div className={cn('flex-1', dense ? 'p-2.5' : 'p-3.5')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[11px] font-semibold text-ink-500">{matter.caseNumber}</div>
            <div className="mt-0.5 truncate text-[14px] font-semibold text-ink-900">{matter.title}</div>
          </div>
          <ImportanceTierChip tier={matter.importanceTier} />
        </div>
        <div className="mt-1.5 truncate text-xs text-ink-500">{forum?.name}{matter.bench ? ` · ${matter.bench}` : ''}</div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-ink-100 px-2 py-0.5 text-[11px] text-ink-700">{matter.stage}</span>
            {matter.nextHearingDate && <span className="text-[11px] text-ink-500">Next hearing <b className="text-ink-900">{fmt(matter.nextHearingDate)}</b></span>}
            {stale && <span className="text-[11px] text-risk-warn-ink">Court data stale</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <RiskDot level={risk} />
            {isDesktopClient && (
              <span className="font-mono text-xs" title="Offline availability">
                {bundle?.downloadState === 'OnDevice' ? '●' : bundle?.downloadState === 'Downloading' ? '◐' : bundle?.downloadState === 'Evicted' ? '⊘' : '○'}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
