import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { grantCaseAccess, listCaseAccess } from '../../api/admin'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge, EmptyState } from '../../components/ui/primitives'
import { Field, Select } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { toastSuccess, toastError } from '../../lib/toast'
import type { CaseAccessGrant, CaseAccessLevel } from '../../data/types'

const LEVEL_TONE: Record<CaseAccessLevel, 'ink' | 'brand' | 'neutral' | 'critical'> = { CaseAdmin: 'ink', CaseContributor: 'brand', CaseViewer: 'neutral', NoAccess: 'critical' }
const LEVEL_LABEL: Record<CaseAccessLevel, string> = { CaseAdmin: 'Case Admin', CaseContributor: 'Contributor', CaseViewer: 'Viewer', NoAccess: 'No access' }

export default function CaseAccess() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const matters = useDb((s) => s.matters)
  const users = useDb((s) => s.users)
  const query = useQuery({ queryKey: ['case-access', userId], queryFn: () => listCaseAccess(userId) })

  const [matterId, setMatterId] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [level, setLevel] = useState<CaseAccessLevel>('CaseViewer')

  function invalidate() { qc.invalidateQueries({ queryKey: ['case-access'] }) }
  const grantMutation = useMutation({
    mutationFn: (vars: { matterId: string; targetUserId: string; level: CaseAccessLevel }) => grantCaseAccess(userId, vars.matterId, vars.targetUserId, vars.level),
    onSuccess: () => { toastSuccess('Access updated.'); setTargetUserId(''); invalidate() },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not update access.'),
  })

  const grouped = useMemo(() => {
    const map = new Map<string, CaseAccessGrant[]>()
    for (const g of query.data ?? []) {
      const list = map.get(g.matterId) ?? []
      list.push(g)
      map.set(g.matterId, list)
    }
    return map
  }, [query.data])

  return (
    <div>
      <PageHeader title="Case Access" description="Partners and Admins see every matter automatically. Grant access here for anyone below Partner — Associate, Paralegal, Billing Staff, or Intern — before they can open a specific matter." />

      <Section title="Grant access" className="mb-4">
        <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-[1fr_1fr_auto_auto]">
          <Field label="Matter">
            <Select value={matterId} onChange={(e) => setMatterId(e.target.value)}>
              <option value="">Select matter</option>
              {matters.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
            </Select>
          </Field>
          <Field label="Person">
            <Select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              <option value="">Select person</option>
              {users.filter((u) => u.status === 'Active' && u.role !== 'Admin' && u.role !== 'Partner').map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
            </Select>
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(e) => setLevel(e.target.value as CaseAccessLevel)}>
              <option value="CaseViewer">Viewer</option>
              <option value="CaseContributor">Contributor</option>
              <option value="CaseAdmin">Case Admin</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="primary" disabled={!matterId || !targetUserId} loading={grantMutation.isPending} onClick={() => grantMutation.mutate({ matterId, targetUserId, level })}>Grant</Button>
          </div>
        </div>
      </Section>

      <SixState query={query} isEmpty={(query.data ?? []).length === 0} emptyState={<EmptyState title="No grants yet" description="Grant access to a matter above." />}>
        <div className="flex flex-col gap-3">
          {matters.filter((m) => grouped.has(m.id)).map((m) => (
            <Section key={m.id} title={`${m.title} (${m.caseNumber})`}>
              <div className="divide-y divide-ink-100">
                {(grouped.get(m.id) ?? []).map((g) => (
                  <div key={g.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="text-sm text-ink-800">{users.find((u) => u.id === g.userId)?.name ?? g.userId}</span>
                    <div className="flex items-center gap-2">
                      <Badge tone={LEVEL_TONE[g.level]}>{LEVEL_LABEL[g.level]}</Badge>
                      <Select
                        className="w-36"
                        value={g.level}
                        onChange={(e) => grantMutation.mutate({ matterId: m.id, targetUserId: g.userId, level: e.target.value as CaseAccessLevel })}
                      >
                        <option value="CaseViewer">Viewer</option>
                        <option value="CaseContributor">Contributor</option>
                        <option value="CaseAdmin">Case Admin</option>
                        <option value="NoAccess">Revoke</option>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ))}
        </div>
      </SixState>
    </div>
  )
}
