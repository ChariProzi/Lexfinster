import { useNavigate } from 'react-router-dom'
import type { Deadline } from '../../data/types'
import { fmt, daysUntil } from '../../lib/dates'
import { RiskDot } from './MatterCard'
import { ProvisionChip } from './Misc'
import { cn } from '../../lib/cn'

function riskFor(d: Deadline): 'safe' | 'approaching' | 'critical' | 'breached' {
  if (d.status === 'Missed') return 'breached'
  const n = daysUntil(d.computedDate)
  if (n === null) return 'safe'
  if (n <= 2) return 'critical'
  if (n <= 7) return 'approaching'
  return 'safe'
}

export function DeadlineRow({ deadline, matterTitle, showMatter, onOverride }: { deadline: Deadline; matterTitle?: string; showMatter?: boolean; onOverride?: () => void }) {
  const navigate = useNavigate()
  const isJudgement = deadline.status === 'NeedsJudgement'
  const risk = riskFor(deadline)
  const badge = isJudgement ? 'JUDGE' : deadline.status === 'Overridden' ? 'MANUAL' : deadline.overriddenByUserId ? 'MANUAL' : 'AUTO'

  return (
    <div className={cn('grid grid-cols-[22px_1fr_auto_auto_auto] items-center gap-3 border-b border-ink-100 px-3 py-2.5 last:border-0', isJudgement && 'bg-risk-warn-bg')}>
      {isJudgement ? <span className="font-mono text-sm text-risk-warn-ink">◇?</span> : <RiskDot level={risk} />}
      <div className="min-w-0">
        <div className={cn('truncate text-[13px] font-semibold text-ink-900', deadline.status === 'Overridden' && risk === 'breached' && 'line-through decoration-1')}>{deadline.name}</div>
        {showMatter && matterTitle && <div className="truncate text-[11.5px] text-ink-500">{matterTitle}</div>}
        {deadline.status === 'Overridden' && <div className="text-[11px] text-ink-500">Overridden {deadline.overrideReason ? `— ${deadline.overrideReason}` : ''}</div>}
      </div>
      {deadline.provision && (
        <ProvisionChip
          label={deadline.provision}
          dual={deadline.provisionDual}
          notEncoded={deadline.ruleNotEncoded}
          onClick={() => navigate(`/matters/${deadline.matterId}/deadlines/${deadline.id}/why`)}
        />
      )}
      <span className={cn('whitespace-nowrap font-mono text-[12.5px] font-semibold', risk === 'critical' || risk === 'breached' ? 'text-risk-critical' : isJudgement ? 'text-risk-warn-ink' : 'text-ink-900')}>
        {isJudgement ? 'no countdown' : fmt(deadline.computedDate)}
      </span>
      <div className="flex items-center gap-2 justify-self-end">
        <span className={cn('rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold', badge === 'AUTO' ? 'bg-ink-900 text-white' : badge === 'JUDGE' ? 'border border-risk-warn-border text-risk-warn-ink' : 'border border-ink-900 text-ink-900')}>{badge}</span>
        {onOverride && (
          <button onClick={onOverride} className="whitespace-nowrap text-[11px] font-medium text-brand-500 underline underline-offset-2 hover:text-brand-700">
            {isJudgement ? 'Set date' : 'Override'}
          </button>
        )}
      </div>
    </div>
  )
}
