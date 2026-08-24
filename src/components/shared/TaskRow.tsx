import { useNavigate } from 'react-router-dom'
import type { Task } from '../../data/types'
import { useDb } from '../../data/db'
import { fmt, daysUntil } from '../../lib/dates'
import { cn } from '../../lib/cn'
import { Avatar } from '../ui/primitives'
import { AllocationStripe, allocationFor } from './MatterCard'
import { useSession } from '../../lib/session'
import { ProvisionChip } from './Misc'

const TYPE_ICON: Record<Task['type'], string> = {
  Drafting: '✎', Filing: '⇪', Research: '🔎', CourtAppearance: '⚖', ClientCommunication: '💬', Compliance: '☑', Administrative: '⚙',
}

export function TaskRow({ task }: { task: Task }) {
  const navigate = useNavigate()
  const userId = useSession((s) => s.userId)
  const matter = useDb((s) => s.matters.find((m) => m.id === task.matterId))
  const assignee = useDb((s) => s.users.find((u) => u.id === task.assigneeId))
  const reviewer = useDb((s) => s.users.find((u) => u.id === task.reviewerId))
  const checklist = useDb((s) => s.checklistInstances.filter((c) => c.taskId === task.id))
  const n = daysUntil(task.dueDate)
  const overdue = n !== null && n < 0 && task.status !== 'Done'
  const allocation = matter ? allocationFor(userId, matter) : 'other'

  return (
    <button onClick={() => navigate(`/work/tasks/${task.id}`)} className="flex w-full items-stretch gap-3 border-b border-ink-100 px-3 py-2.5 text-left last:border-0 hover:bg-ink-50">
      <span className={cn('w-1 shrink-0 rounded', task.priority === 'High' ? 'bg-risk-critical' : task.priority === 'Medium' ? 'bg-risk-warn' : 'bg-ink-200')} />
      <AllocationStripe allocation={allocation} className="rounded" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-900">
          <span>{TYPE_ICON[task.type]}</span>
          <span className="truncate">{task.title}</span>
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-ink-500">{matter?.title} · {task.type}</div>
      </div>
      {task.provision && <div className="hidden shrink-0 sm:block"><ProvisionChip label={task.provision} /></div>}
      <div className="hidden shrink-0 text-right sm:block">
        <div className={cn('whitespace-nowrap font-mono text-[12px] font-semibold', overdue ? 'text-risk-critical' : 'text-ink-900')}>
          {fmt(task.dueDate)} {n !== null && ` · ${n < 0 ? `${Math.abs(n)}d late` : `${n}d`}`}
        </div>
      </div>
      {checklist.length > 0 && (
        <div className="hidden shrink-0 self-center font-mono text-[11px] text-ink-500 sm:block">{checklist.filter((c) => c.checked).length}/{checklist.length}</div>
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        {assignee && <Avatar initials={assignee.initials} size={22} title={assignee.name} />}
        {reviewer && <Avatar initials={reviewer.initials} size={22} dashed title={`${reviewer.name} (reviewer)`} />}
      </div>
    </button>
  )
}
