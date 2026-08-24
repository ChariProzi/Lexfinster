import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MessageSquarePlus } from 'lucide-react'
import { listForumQuestions } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { isRole } from '../../lib/rbac'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge, EmptyState } from '../../components/ui/primitives'
import { Tabs } from '../../components/ui/overlay'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'

export default function ForumIndex() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['forum-questions', userId], queryFn: () => listForumQuestions(userId) })
  const [tab, setTab] = useState('All')

  const all = query.data ?? []
  const rows = useMemo(() => (tab === 'All' ? all : all.filter((q) => q.clearanceState === tab)), [all, tab])

  return (
    <div>
      <PageHeader
        title="Forum"
        description="Ask the firm, get a Partner-cleared answer before relying on it in a matter."
        actions={<Button variant="primary" onClick={() => navigate('/forum/ask')}><MessageSquarePlus className="h-3.5 w-3.5" />Ask a question</Button>}
      />
      <div className="mb-3">
        <Tabs
          tabs={[
            { key: 'All', label: 'All' },
            { key: 'Open', label: 'Open', count: all.filter((q) => q.clearanceState === 'Open').length },
            { key: 'Answered', label: 'Answered', count: all.filter((q) => q.clearanceState === 'Answered').length },
            { key: 'PartnerCleared', label: 'Partner-cleared' },
            { key: 'Closed', label: 'Closed' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>
      <SixState
        query={query}
        isEmpty={rows.length === 0}
        emptyState={<EmptyState title="No questions here" description="Be the first to ask in this category." primaryAction={{ label: 'Ask a question', onClick: () => navigate('/forum/ask') }} />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {rows.map((q) => (
            <button key={q.id} onClick={() => navigate(`/forum/questions/${q.id}`)} className="flex w-full flex-col gap-1 border-b border-ink-100 px-4 py-3 text-left last:border-0 hover:bg-ink-50">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-semibold text-ink-900">{q.title}</div>
                <StatusBadge variant="clearance" value={q.clearanceState} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                <span>{users.find((u) => u.id === q.askerUserId)?.name ?? 'Unknown'}</span>
                <span>·</span>
                <span>{q.practiceArea}</span>
                {q.audience !== 'WholeFirm' && <Badge tone="neutral">{q.audience === 'PartnersOnly' ? 'Partners only' : 'Open to interns'}</Badge>}
                {q.neededByDate && <span>· needed by {fmt(q.neededByDate)}</span>}
                {!isRole(userId, 'Partner', 'Admin') && q.audience === 'PartnersOnly' && <Badge tone="neutral">Partners only</Badge>}
              </div>
            </button>
          ))}
        </div>
      </SixState>
    </div>
  )
}
