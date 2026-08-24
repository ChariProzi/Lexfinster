import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, Settings2 } from 'lucide-react'
import { listNotifications, markAllRead, markRead } from '../../api/notifications'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Tabs } from '../../components/ui/overlay'
import { EscalationChain } from '../../components/shared/Misc'
import { relTime } from '../../lib/dates'
import type { NotificationCategory } from '../../data/types'

const CATEGORIES: { key: NotificationCategory | 'All'; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'NeedsAction', label: 'Needs action' },
  { key: 'DeadlinesHearings', label: 'Deadlines & hearings' },
  { key: 'CourtUpdates', label: 'Court updates' },
  { key: 'AssignmentsReviews', label: 'Assignments & reviews' },
  { key: 'Forum', label: 'Forum' },
  { key: 'System', label: 'System' },
]

export default function NotificationCentre() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['notifications', userId], queryFn: () => listNotifications(userId) })
  const users = useDb((s) => s.users)
  const [tab, setTab] = useState<string>('All')

  const markReadMutation = useMutation({ mutationFn: (id: string) => markRead(userId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
  const markAllMutation = useMutation({ mutationFn: () => markAllRead(userId), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })

  const all = query.data ?? []
  const rows = useMemo(() => (tab === 'All' ? all : all.filter((n) => n.category === tab)), [all, tab])
  const unreadCount = all.filter((n) => !n.readAt).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        actions={
          <>
            {unreadCount > 0 && <Button variant="secondary" loading={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}><CheckCheck className="h-3.5 w-3.5" />Mark all read</Button>}
            <Button variant="ghost" onClick={() => navigate('/settings/notifications')}><Settings2 className="h-3.5 w-3.5" />Preferences</Button>
          </>
        }
      />
      <div className="mb-3">
        <Tabs tabs={CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: c.key === 'All' ? undefined : all.filter((n) => n.category === c.key && !n.readAt).length }))} active={tab} onChange={setTab} />
      </div>
      <SixState
        query={query}
        isEmpty={!!query.data && rows.length === 0}
        emptyState={<EmptyState title="Nothing here" description="Notifications in this category will show up here." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {rows.map((n) => (
            <button
              key={n.id}
              onClick={() => { if (!n.readAt) markReadMutation.mutate(n.id); if (n.actionHref) navigate(n.actionHref) }}
              className="flex w-full items-start gap-3 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-brand-500'}`} />
              <div className="min-w-0 flex-1">
                <div className={`text-[13px] ${n.readAt ? 'text-ink-700' : 'font-semibold text-ink-900'}`}>{n.title}</div>
                {n.body && <div className="mt-0.5 text-xs text-ink-500">{n.body}</div>}
                <div className="mt-1"><EscalationChain sentAt={n.sentAt} escalatedTo={n.escalatedToUserId ? users.find((u) => u.id === n.escalatedToUserId)?.name : undefined} escalatedAt={n.escalatedAt} /></div>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[11px] text-ink-400">{relTime(n.sentAt[n.sentAt.length - 1] ?? new Date().toISOString())}</span>
            </button>
          ))}
        </div>
      </SixState>
    </div>
  )
}
