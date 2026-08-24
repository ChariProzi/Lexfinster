import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { listEscalationRules, updateEscalationRule } from '../../api/notifications'
import { useSession } from '../../lib/session'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Checkbox, Input, Select, Textarea } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess } from '../../lib/toast'
import type { EscalationRule } from '../../data/types'

const CHANNELS: EscalationRule['channels'][number][] = ['InApp', 'Email', 'SMS', 'Push']
const TIER_TONE = { Crucial: 'ink', Medium: 'warn', Low: 'neutral' } as const

export default function EscalationRules() {
  const userId = useSession((s) => s.userId)!
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['escalation-rules'], queryFn: () => listEscalationRules() })
  const [rules, setRules] = useState<EscalationRule[]>([])

  useEffect(() => { if (query.data) setRules(query.data) }, [query.data])

  const mutation = useMutation({
    mutationFn: (rule: EscalationRule) => updateEscalationRule(userId, rule),
    onSuccess: () => { toastSuccess('Escalation rule saved.'); qc.invalidateQueries({ queryKey: ['escalation-rules'] }) },
  })

  function updateRule(id: string, patch: Partial<EscalationRule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function toggleChannel(id: string, ch: EscalationRule['channels'][number]) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, channels: r.channels.includes(ch) ? r.channels.filter((c) => c !== ch) : [...r.channels, ch] } : r)))
  }
  function updateStep(id: string, i: number, patch: Partial<EscalationRule['steps'][number]>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, steps: r.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) } : r)))
  }
  function addStep(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, steps: [...r.steps, { notifyRole: 'Assignee', afterHours: 24 }] } : r)))
  }
  function removeStep(id: string, i: number) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, steps: r.steps.filter((_, idx) => idx !== i) } : r)))
  }

  return (
    <div>
      <PageHeader title="Escalation Rules" description="Who gets notified, in what order, and through which channels — per importance tier." />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="flex flex-col gap-4">
          {rules.map((r) => (
            <Section key={r.id} title={<span className="flex items-center gap-2">{r.importanceTier} <Badge tone={TIER_TONE[r.importanceTier]}>{r.importanceTier}</Badge></span>} actions={<Button size="sm" variant="primary" loading={mutation.isPending} onClick={() => mutation.mutate(r)}>Save</Button>}>
              <div className="flex flex-col gap-3 p-3.5">
                <Textarea value={r.conditionDescription} onChange={(e) => updateRule(r.id, { conditionDescription: e.target.value })} className="min-h-12 text-sm" />
                <div>
                  <div className="mb-1.5 text-xs font-medium text-ink-600">Channels</div>
                  <div className="flex flex-wrap gap-3">
                    {CHANNELS.map((ch) => <Checkbox key={ch} checked={r.channels.includes(ch)} onChange={() => toggleChannel(r.id, ch)} label={ch} />)}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-600">Escalation steps (in order)</span>
                    <Button size="sm" variant="ghost" onClick={() => addStep(r.id)}><Plus className="h-3.5 w-3.5" />Add step</Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {r.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md border border-ink-200 p-2">
                        <span className="w-5 shrink-0 text-center font-mono text-xs text-ink-400">{i + 1}</span>
                        <Select value={s.notifyRole} onChange={(e) => updateStep(r.id, i, { notifyRole: e.target.value })} className="flex-1 text-xs">
                          <option value="Assignee">Assignee</option>
                          <option value="Responsible Partner">Responsible Partner</option>
                          <option value="Case Admin">Case Admin</option>
                          <option value="Reviewer">Reviewer</option>
                        </Select>
                        <span className="shrink-0 text-xs text-ink-500">after</span>
                        <Input type="number" min={0} value={s.afterHours} onChange={(e) => updateStep(r.id, i, { afterHours: Number(e.target.value) })} className="w-20 text-xs" />
                        <span className="shrink-0 text-xs text-ink-500">hours</span>
                        <button onClick={() => removeStep(r.id, i)} className="shrink-0 text-ink-400 hover:text-risk-critical"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          ))}
        </div>
      </SixState>
    </div>
  )
}
