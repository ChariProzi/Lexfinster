import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { listMyWorklist } from '../../api/work'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { TaskRow } from '../../components/shared/TaskRow'
import { Section } from '../../components/shared/Layout'

export default function MyWorklist() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['my-worklist', userId], queryFn: () => listMyWorklist(userId) })
  const tasks = query.data ?? []
  const open = tasks.filter((t) => t.status !== 'Done').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const done = tasks.filter((t) => t.status === 'Done')

  return (
    <div>
      <PageHeader
        title="My Worklist"
        description="Tasks assigned to you, or where you're the reviewer."
        actions={<Button variant="primary" onClick={() => navigate('/work/tasks/new')}><Plus className="h-3.5 w-3.5" />New task</Button>}
      />
      <SixState
        query={query}
        isEmpty={!!query.data && tasks.length === 0}
        emptyState={<EmptyState title="Nothing on your worklist" description="Tasks assigned to you will show up here." primaryAction={{ label: 'New task', onClick: () => navigate('/work/tasks/new') }} />}
      >
        <div className="flex flex-col gap-4">
          <Section title={`Open (${open.length})`}>
            {open.length === 0 ? <div className="px-3.5 py-4 text-sm text-ink-500">Nothing open.</div> : open.map((t) => <TaskRow key={t.id} task={t} />)}
          </Section>
          {done.length > 0 && (
            <Section title={`Done (${done.length})`}>
              {done.map((t) => <TaskRow key={t.id} task={t} />)}
            </Section>
          )}
        </div>
      </SixState>
    </div>
  )
}
