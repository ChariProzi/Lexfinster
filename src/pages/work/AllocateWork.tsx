import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { assignTask, checkAssignmentClash, listUnallocated } from '../../api/work'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, EmptyState } from '../../components/ui/primitives'
import { Select } from '../../components/ui/form'
import { fmt } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

export default function AllocateWork() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const matters = useDb((s) => s.matters)
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['unallocated', userId], queryFn: () => listUnallocated(userId) })
  const [picked, setPicked] = useState<Record<string, string>>({})

  const assignMutation = useMutation({
    mutationFn: (taskId: string) => assignTask(userId, taskId, picked[taskId], { grantAccess: true }),
    onSuccess: () => { toastSuccess('Assigned.'); qc.invalidateQueries({ queryKey: ['unallocated'] }); qc.invalidateQueries({ queryKey: ['my-worklist'] }) },
  })

  const tasks = query.data ?? []

  return (
    <div>
      <PageHeader title="Allocate Work" description="Tasks without an assignee. Assigning grants view access to the matter if the person doesn't already have it." />
      <SixState
        query={query}
        isEmpty={!!query.data && tasks.length === 0}
        emptyState={<EmptyState title="Nothing unallocated" description="Every task currently has an assignee." />}
      >
        <div className="rounded-lg border border-ink-200 bg-paper">
          {tasks.map((t) => {
            const matter = matters.find((m) => m.id === t.matterId)
            return <AllocateRow key={t.id} taskId={t.id} title={t.title} matterTitle={matter?.title} dueDate={t.dueDate} picked={picked[t.id] ?? ''} onPick={(v) => setPicked((p) => ({ ...p, [t.id]: v }))} onAssign={() => assignMutation.mutate(t.id)} assigning={assignMutation.isPending && assignMutation.variables === t.id} users={users} navigate={navigate} />
          })}
        </div>
      </SixState>
    </div>
  )
}

function AllocateRow({ taskId, title, matterTitle, dueDate, picked, onPick, onAssign, assigning, users, navigate }: {
  taskId: string; title: string; matterTitle?: string; dueDate: string; picked: string; onPick: (v: string) => void; onAssign: () => void; assigning: boolean
  users: { id: string; name: string; role: string }[]; navigate: (href: string) => void
}) {
  const clashQuery = useQuery({
    queryKey: ['assignment-clash', picked, dueDate],
    queryFn: () => checkAssignmentClash(picked, dueDate),
    enabled: !!picked,
  })
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
      <button onClick={() => navigate(`/work/tasks/${taskId}`)} className="min-w-0 text-left hover:underline">
        <div className="text-[13px] font-semibold text-ink-900">{title}</div>
        <div className="text-xs text-ink-500">{matterTitle} · due {fmt(dueDate)}</div>
      </button>
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <Select className="w-44" value={picked} onChange={(e) => onPick(e.target.value)}>
            <option value="">Select person</option>
            {users.filter((u) => u.role === 'Associate' || u.role === 'Paralegal').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Button size="sm" variant="primary" disabled={!picked} loading={assigning} onClick={onAssign}>Assign</Button>
        </div>
        {clashQuery.data && (
          <div className="flex items-center gap-1 text-[11px] text-risk-warn-ink"><AlertTriangle className="h-3 w-3" />{clashQuery.data.hearing}</div>
        )}
      </div>
    </div>
  )
}
