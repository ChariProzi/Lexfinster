import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, UserPlus, Check } from 'lucide-react'
import { inviteUser, listUsers } from '../../api/admin'
import { useSession } from '../../lib/session'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Input, Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { ROLE_LABEL } from '../../lib/rbac'
import { toastSuccess, toastError } from '../../lib/toast'
import type { Role } from '../../data/types'

const ROLES: Role[] = ['Admin', 'Partner', 'Associate', 'Paralegal', 'BillingStaff', 'Intern']

interface Row { name: string; email: string; role: Role }
const BLANK_ROW: Row = { name: '', email: '', role: 'Associate' }

export default function Invite() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['admin-users', userId], queryFn: () => listUsers(userId) })
  const [rows, setRows] = useState<Row[]>([{ ...BLANK_ROW }])
  const [sent, setSent] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: (row: Row) => inviteUser(userId, row),
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not send an invite.'),
  })

  function updateRow(i: number, patch: Partial<Row>) { setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r))) }
  function addRow() { setRows((prev) => [...prev, { ...BLANK_ROW }]) }
  function removeRow(i: number) { setRows((prev) => prev.filter((_, idx) => idx !== i)) }

  async function sendAll() {
    const valid = rows.filter((r) => r.name.trim() && r.email.trim())
    const sentEmails: string[] = []
    for (const row of valid) {
      try {
        await mutation.mutateAsync(row)
        sentEmails.push(row.email)
      } catch {
        // error already toasted by mutation.onError
      }
    }
    if (sentEmails.length > 0) {
      toastSuccess(`${sentEmails.length} invitation(s) sent.`)
      setSent(sentEmails)
      setRows([{ ...BLANK_ROW }])
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    }
  }

  const canSend = rows.some((r) => r.name.trim() && r.email.trim())

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Invite your team" description="Add everyone who needs a seat — you can change roles any time in Users & Roles." />

      <Section title="New invitations" actions={<Button size="sm" variant="ghost" onClick={addRow}><Plus className="h-3.5 w-3.5" />Add row</Button>}>
        <div className="flex flex-col gap-2 p-3.5">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_140px_auto] items-center gap-2">
              <Input value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} placeholder="Full name" />
              <Input type="email" value={r.email} onChange={(e) => updateRow(i, { email: e.target.value })} placeholder="name@firm.in" />
              <Select value={r.role} onChange={(e) => updateRow(i, { role: e.target.value as Role })}>
                {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
              </Select>
              <button onClick={() => removeRow(i)} disabled={rows.length === 1} className="text-ink-400 hover:text-risk-critical disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="mt-1">
            <Button variant="primary" loading={mutation.isPending} disabled={!canSend} onClick={sendAll}><UserPlus className="h-3.5 w-3.5" />Send invitations</Button>
          </div>
          {sent.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-risk-safe-border bg-risk-safe-bg px-3 py-2 text-[12.5px] text-risk-safe">
              <Check className="h-3.5 w-3.5" />Sent to {sent.join(', ')}.
            </div>
          )}
        </div>
      </Section>

      <Section title="Current roster" className="mt-4">
        <SixState query={query} onRetry={() => query.refetch()}>
          <div className="divide-y divide-ink-100">
            {(query.data ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-ink-900">{u.name}</span> <span className="text-ink-500">· {ROLE_LABEL[u.role]}</span>
                </div>
                <Badge tone={u.status === 'Active' ? 'safe' : u.status === 'Invited' ? 'warn' : 'critical'}>{u.status}</Badge>
              </div>
            ))}
          </div>
        </SixState>
      </Section>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => navigate('/onboarding/device-registration')}>Continue — register this device</Button>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Skip to dashboard</Button>
      </div>
    </div>
  )
}
