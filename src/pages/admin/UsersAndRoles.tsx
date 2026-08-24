import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { changeUserRole, forceSignOut, inviteUser, listUsers, reactivateUser, suspendUser } from '../../api/admin'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Avatar, Badge } from '../../components/ui/primitives'
import { Field, Input, Select } from '../../components/ui/form'
import { Modal } from '../../components/ui/overlay'
import { ROLE_LABEL } from '../../lib/rbac'
import { toastSuccess, toastError } from '../../lib/toast'
import type { Role } from '../../data/types'

const ROLES: Role[] = ['Admin', 'Partner', 'Associate', 'Paralegal', 'BillingStaff', 'Intern']

export default function UsersAndRoles() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['admin-users', userId], queryFn: () => listUsers(userId) })
  const [inviteOpen, setInviteOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('Associate')
  const [reassignWarning, setReassignWarning] = useState<{ userName: string; matters: string[] } | null>(null)

  function invalidate() { qc.invalidateQueries({ queryKey: ['admin-users'] }) }

  const inviteMutation = useMutation({
    mutationFn: () => inviteUser(userId, { name, email, role }),
    onSuccess: () => { toastSuccess('Invitation sent.'); setInviteOpen(false); setName(''); setEmail(''); invalidate() },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not invite.'),
  })
  const roleMutation = useMutation({
    mutationFn: ({ targetId, newRole }: { targetId: string; newRole: Role }) => changeUserRole(userId, targetId, newRole),
    onSuccess: (res, vars) => {
      if (res.requiresReassignment.length > 0) {
        const target = query.data?.find((u) => u.id === vars.targetId)
        setReassignWarning({ userName: target?.name ?? 'This person', matters: res.requiresReassignment })
        return
      }
      toastSuccess('Role updated.'); invalidate()
    },
  })
  const suspendMutation = useMutation({ mutationFn: (targetId: string) => suspendUser(userId, targetId), onSuccess: () => { toastSuccess('Suspended.'); invalidate() } })
  const reactivateMutation = useMutation({ mutationFn: (targetId: string) => reactivateUser(userId, targetId), onSuccess: () => { toastSuccess('Reactivated.'); invalidate() } })
  const signOutMutation = useMutation({ mutationFn: (targetId: string) => forceSignOut(userId, targetId), onSuccess: () => toastSuccess('Signed out on all devices.') })

  return (
    <div>
      <PageHeader title="Users & Roles" description="Firm-level roles. Per-matter access is managed separately in Case Access." actions={<Button variant="primary" onClick={() => setInviteOpen(true)}><UserPlus className="h-3.5 w-3.5" />Invite user</Button>} />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="rounded-lg border border-ink-200 bg-paper">
          {(query.data ?? []).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
              <div className="flex items-center gap-2.5">
                <Avatar initials={u.initials} />
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">{u.name}</div>
                  <div className="text-xs text-ink-500">{u.email}</div>
                </div>
                {u.status === 'Suspended' && <Badge tone="critical">Suspended</Badge>}
                {u.status === 'Invited' && <Badge tone="warn">Invited</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Select className="w-40" value={u.role} onChange={(e) => roleMutation.mutate({ targetId: u.id, newRole: e.target.value as Role })}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </Select>
                {u.status === 'Suspended' ? (
                  <Button size="sm" variant="secondary" loading={reactivateMutation.isPending} onClick={() => reactivateMutation.mutate(u.id)}>Reactivate</Button>
                ) : (
                  <Button size="sm" variant="secondary" loading={suspendMutation.isPending} onClick={() => suspendMutation.mutate(u.id)}>Suspend</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => signOutMutation.mutate(u.id)}>Force sign-out</Button>
              </div>
            </div>
          ))}
        </div>
      </SixState>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite user" footer={<><Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button><Button variant="primary" loading={inviteMutation.isPending} disabled={!name.trim() || !email.trim()} onClick={() => inviteMutation.mutate()}>Send invite</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={!!reassignWarning} onClose={() => setReassignWarning(null)} title="Reassign Case Admin first" footer={<Button variant="primary" onClick={() => setReassignWarning(null)}>Understood</Button>}>
        <div className="text-sm text-ink-700">
          {reassignWarning?.userName} is Case Admin on {reassignWarning?.matters.length} matter(s) and can't lose Partner/Admin seniority until someone else is made Case Admin there. Reassign these in Case Access first:
          <ul className="mt-2 list-disc pl-5">
            {reassignWarning?.matters.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      </Modal>
    </div>
  )
}
