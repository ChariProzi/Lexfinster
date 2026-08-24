import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applyRulePackUpdate, getRulePackImpact, keepCurrentDates, listRulePacks } from '../../api/deadlines'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Modal } from '../../components/ui/overlay'
import { fmt } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

export default function RulePacks() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const forums = useDb((s) => s.forums)
  const query = useQuery({ queryKey: ['rule-packs'], queryFn: () => listRulePacks() })
  const [impactId, setImpactId] = useState<string | null>(null)
  const impactQuery = useQuery({ queryKey: ['rule-pack-impact', impactId], queryFn: () => getRulePackImpact(impactId!), enabled: !!impactId })

  function invalidate() { qc.invalidateQueries({ queryKey: ['rule-packs'] }) }
  const applyMutation = useMutation({ mutationFn: (id: string) => applyRulePackUpdate(userId, id), onSuccess: () => { toastSuccess('Update applied.'); setImpactId(null); invalidate() } })
  const keepMutation = useMutation({ mutationFn: (id: string) => keepCurrentDates(userId, id), onSuccess: () => { toastSuccess('Kept current dates — pack disabled pending manual review.'); setImpactId(null); invalidate() } })

  return (
    <div>
      <PageHeader title="Rule Packs" description="Statute coverage per pack. An update available means a governing rule changed and computed deadlines may shift." />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="rounded-lg border border-ink-200 bg-paper">
          {(query.data ?? []).map((rp) => (
            <div key={rp.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 last:border-0">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-ink-900">{rp.name}</div>
                <div className="mt-0.5 text-xs text-ink-500">{rp.statuteCoverage.join(', ')} · {rp.applicableForums.map((id) => forums.find((f) => f.id === id)?.name).filter(Boolean).join(', ') || 'All forums'}</div>
                <div className="mt-0.5 font-mono text-[11px] text-ink-400">{rp.version} · published {fmt(rp.publishedAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={rp.status === 'Active' ? 'safe' : rp.status === 'UpdateAvailable' ? 'warn' : 'neutral'}>{rp.status === 'UpdateAvailable' ? 'Update available' : rp.status}</Badge>
                {rp.status === 'UpdateAvailable' && <Button size="sm" variant="primary" onClick={() => setImpactId(rp.id)}>Review update</Button>}
              </div>
            </div>
          ))}
        </div>
      </SixState>

      <Modal open={!!impactId} onClose={() => setImpactId(null)} title="Rule pack update — impact preview" size="lg" footer={
        <>
          <Button variant="secondary" loading={keepMutation.isPending} onClick={() => impactId && keepMutation.mutate(impactId)}>Keep current dates</Button>
          <Button variant="primary" loading={applyMutation.isPending} onClick={() => impactId && applyMutation.mutate(impactId)}>Apply update</Button>
        </>
      }>
        {impactQuery.data && (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-3 text-[13px] text-risk-warn-ink">{impactQuery.data.rulePack.pendingUpdate?.changelog}</div>
            <div className="text-[13px] font-semibold text-ink-900">Affected matters ({impactQuery.data.matters.length})</div>
            <div className="divide-y divide-ink-100 rounded-lg border border-ink-200">
              {impactQuery.data.matters.map((m) => (
                <div key={m.matterId} className="px-3.5 py-2.5 text-sm">
                  <div className="font-medium text-ink-900">{m.title}</div>
                  {m.changes.length === 0 ? (
                    <div className="text-xs text-ink-500">No deadlines currently computed from this pack.</div>
                  ) : (
                    m.changes.map((c) => <div key={c.deadlineId} className="text-xs text-ink-500">{c.name} — will be recomputed on apply</div>)
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-ink-500">"Keep current dates" disables this pack for new computations until a person reviews it manually — nothing recomputes silently either way.</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
