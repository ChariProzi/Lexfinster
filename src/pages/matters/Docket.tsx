import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getMatter } from '../../api/matters'
import { listDeadlines } from '../../api/deadlines'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { SixState } from '../../components/shared/SixState'
import { PageHeader } from '../../components/ui/primitives'
import { fmt } from '../../lib/dates'
import { StatusBadge } from '../../components/shared/Misc'

interface DocketItem { date: string; kind: 'hearing' | 'order' | 'deadline' | 'task'; label: string; detail?: string; href: string }

export default function Docket() {
  const { matterId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const matterQuery = useQuery({ queryKey: ['matter', matterId, userId], queryFn: () => getMatter(userId, matterId) })
  const deadlinesQuery = useQuery({ queryKey: ['deadlines', matterId, userId], queryFn: () => listDeadlines(userId, matterId) })
  const orders = useDb(useShallow((s) => s.orders.filter((o) => o.matterId === matterId)))
  const tasks = useDb(useShallow((s) => s.tasks.filter((t) => t.matterId === matterId)))

  const items: DocketItem[] = []
  if (matterQuery.data?.nextHearingDate) items.push({ date: matterQuery.data.nextHearingDate, kind: 'hearing', label: 'Next hearing', href: `/matters/${matterId}` })
  for (const o of orders) items.push({ date: o.orderDate, kind: 'order', label: o.extractedFields.orderType ?? 'Order', detail: o.extractedFields.summary, href: `/court/order-inbox/${o.id}` })
  for (const d of deadlinesQuery.data ?? []) if (d.computedDate) items.push({ date: d.computedDate, kind: 'deadline', label: d.name, detail: d.provision, href: `/matters/${matterId}/deadlines/${d.id}/why` })
  for (const t of tasks) items.push({ date: t.dueDate, kind: 'task', label: t.title, detail: t.type, href: `/work/tasks/${t.id}` })
  items.sort((a, b) => a.date.localeCompare(b.date))

  const query = { status: (matterQuery.status === 'error' ? 'error' : deadlinesQuery.status === 'pending' || matterQuery.status === 'pending' ? 'pending' : 'success') as 'pending' | 'error' | 'success', error: matterQuery.error }

  return (
    <div>
      <PageHeader title="Docket" description={matterQuery.data?.title} />
      <SixState query={query} isEmpty={items.length === 0 && matterQuery.status === 'success'}>
        <div className="rounded-lg border border-ink-200 bg-paper">
          {items.map((item, i) => (
            <button key={i} onClick={() => navigate(item.href)} className="flex w-full items-start gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50">
              <div className="w-24 shrink-0 font-mono text-xs text-ink-500">{fmt(item.date)}</div>
              <div className="w-20 shrink-0"><StatusBadge variant="review" value={item.kind === 'hearing' ? 'Confirmed' : item.kind === 'order' ? 'NeedsReview' : item.kind === 'deadline' ? 'Upcoming' : 'ToDo'} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-ink-900">{item.label}</div>
                {item.detail && <div className="truncate text-xs text-ink-500">{item.detail}</div>}
              </div>
            </button>
          ))}
        </div>
      </SixState>
    </div>
  )
}
