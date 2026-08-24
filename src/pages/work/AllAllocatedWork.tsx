import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listAllAllocatedWork, assignTask } from '../../api/work'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, EmptyState, Badge } from '../../components/ui/primitives'
import { Input, Select } from '../../components/ui/form'
import { StatusBadge } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'

const STATUS_FILTERS = ['All', 'ToDo', 'InProgress', 'Blocked', 'InReview', 'Returned', 'Done'] as const

export default function AllAllocatedWork() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['all-allocated-work', userId], queryFn: () => listAllAllocatedWork(userId) })

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const reassignMutation = useMutation({
    mutationFn: (vars: { taskId: string; assigneeId: string }) => assignTask(userId, vars.taskId, vars.assigneeId, { grantAccess: true }),
    onSuccess: () => { toastSuccess('Reassigned.'); qc.invalidateQueries({ queryKey: ['all-allocated-work'] }); qc.invalidateQueries({ queryKey: ['team-workload'] }) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not reassign.'),
  })

  const rows = query.data ?? []
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== 'All' && r.task.status !== statusFilter) return false
      if (assigneeFilter && r.task.assigneeId !== assigneeFilter && !(assigneeFilter === '__unassigned__' && !r.task.assigneeId)) return false
      if (needle && !(r.task.title.toLowerCase().includes(needle) || r.matterTitle.toLowerCase().includes(needle) || r.caseNumber.toLowerCase().includes(needle))) return false
      return true
    }).sort((a, b) => a.task.dueDate.localeCompare(b.task.dueDate))
  }, [rows, q, statusFilter, assigneeFilter])

  const assignable = users.filter((u) => u.status === 'Active' && (u.role === 'Associate' || u.role === 'Paralegal'))

  return (
    <div>
      <PageHeader title="All Allocated Work" description="Every task the firm has allocated — reassign, or spot who's overloaded, in one place." />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input className="w-56" placeholder="Search task, matter, case no…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
        </Select>
        <Select className="w-48" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="">Everyone</option>
          <option value="__unassigned__">Unassigned only</option>
          {users.filter((u) => u.status === 'Active').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <span className="text-xs text-ink-400">{filtered.length} of {rows.length} tasks</span>
      </div>

      <SixState
        query={query}
        isEmpty={!!query.data && filtered.length === 0}
        emptyState={<EmptyState title="No tasks match" description="Try a different filter or search term." />}
      >
        <div className="overflow-x-auto rounded-lg border border-ink-200 bg-paper">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2.5 font-medium">Task</th>
                <th className="px-4 py-2.5 font-medium">Matter</th>
                <th className="px-4 py-2.5 font-medium">Due</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.task.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                  <td className="px-4 py-2.5">
                    <button onClick={() => navigate(`/work/tasks/${r.task.id}`)} className="text-left font-medium text-ink-900 hover:underline">{r.task.title}</button>
                  </td>
                  <td className="px-4 py-2.5 text-ink-600">
                    <button onClick={() => navigate(`/matters/${r.task.matterId}`)} className="hover:underline">{r.matterTitle}</button>
                    <div className="font-mono text-[11px] text-ink-400">{r.caseNumber}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink-600">{fmt(r.task.dueDate)}</td>
                  <td className="px-4 py-2.5"><Badge tone={r.task.priority === 'High' ? 'critical' : r.task.priority === 'Medium' ? 'warn' : 'neutral'}>{r.task.priority}</Badge></td>
                  <td className="px-4 py-2.5"><StatusBadge variant="taskStatus" value={r.task.status} /></td>
                  <td className="px-4 py-2.5">
                    <Select
                      className="w-40"
                      value={r.task.assigneeId ?? ''}
                      onChange={(e) => e.target.value && reassignMutation.mutate({ taskId: r.task.id, assigneeId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {assignable.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SixState>
    </div>
  )
}
