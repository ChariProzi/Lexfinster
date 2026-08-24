import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarPlus, MessageSquare, GitBranch, Flag, RefreshCw, WifiOff } from 'lucide-react'
import { courtModeCapture, getOfflineQueue, syncQueueNow } from '../../api/offline'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { visibleMatterIds } from '../../lib/rbac'
import { PageHeader, Button, Badge, EmptyState } from '../../components/ui/primitives'
import { Input, Textarea } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { relDateOnly, fmtDateTime } from '../../lib/dates'
import { toastSuccess } from '../../lib/toast'

const TODAY = relDateOnly(0)

export default function CourtMode() {
  const { forumId = 'current' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const simulatedOffline = useSession((s) => s.simulatedOffline)
  const forums = useDb((s) => s.forums)
  const matters = useDb((s) => s.matters)
  const visible = visibleMatterIds(userId)
  const todaysList = useDb(useShallow((s) => s.causeList.filter((c) => c.date === TODAY && (forumId === 'current' || c.forumId === forumId) && c.matterId && visible.has(c.matterId))))

  const [openCapture, setOpenCapture] = useState<{ matterId: string; kind: 'next-date' | 'what-happened' | 'new-direction' } | null>(null)
  const [captureValue, setCaptureValue] = useState('')
  const [queue, setQueue] = useState(() => getOfflineQueue())

  function refreshQueue() { setQueue(getOfflineQueue()) }

  const captureMutation = useMutation({
    mutationFn: (vars: { matterId: string; kind: Parameters<typeof courtModeCapture>[2]; label: string }) => courtModeCapture(userId, vars.matterId, vars.kind, vars.label),
    onSuccess: () => { toastSuccess('Captured.'); refreshQueue(); setOpenCapture(null); setCaptureValue('') },
  })
  const syncMutation = useMutation({
    mutationFn: () => syncQueueNow(),
    onSuccess: (res) => { toastSuccess(`Synced ${res.synced} item(s).${res.conflicts > 0 ? ` ${res.conflicts} conflict(s) need review.` : ''}`); refreshQueue(); qc.invalidateQueries() },
  })

  const rows = useMemo(() => todaysList.map((c) => ({ entry: c, matter: matters.find((m) => m.id === c.matterId) })), [todaysList, matters])
  const forum = forumId !== 'current' ? forums.find((f) => f.id === forumId) : undefined
  const pendingCount = queue.filter((q) => !q.synced).length

  function quickFlag(matterId: string) {
    captureMutation.mutate({ matterId, kind: 'flag', label: 'Flagged for follow-up' })
  }
  function submitCapture() {
    if (!openCapture || !captureValue.trim()) return
    const labels = { 'next-date': `Next date: ${captureValue}`, 'what-happened': `What happened: ${captureValue}`, 'new-direction': `New direction: ${captureValue}` }
    captureMutation.mutate({ matterId: openCapture.matterId, kind: openCapture.kind, label: labels[openCapture.kind] })
  }

  return (
    <div>
      <PageHeader
        title={forum ? `Court Mode — ${forum.name}` : 'Court Mode — Today'}
        description="Works without a connection. Everything you capture here is queued and synced when you're back online."
        actions={
          <>
            {simulatedOffline && <Badge tone="warn"><WifiOff className="h-3 w-3" />Offline</Badge>}
            <Button variant="secondary" loading={syncMutation.isPending} onClick={() => syncMutation.mutate()}><RefreshCw className="h-3.5 w-3.5" />Sync now{pendingCount > 0 ? ` (${pendingCount})` : ''}</Button>
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="Nothing on today's list" description="Matters listed for hearing today, in forums you have access to, will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ entry, matter }) => (
            <Section key={entry.id} title={matter ? `${matter.title} (${matter.caseNumber})` : entry.matterId}>
              <div className="flex flex-col gap-2 p-3.5">
                <div className="text-xs text-ink-500">{entry.courtOrBench} · {entry.purposeOfListing}{entry.opposingCounsel ? ` · vs. ${entry.opposingCounsel}` : ''}</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setOpenCapture({ matterId: matter!.id, kind: 'next-date' })}><CalendarPlus className="h-3.5 w-3.5" />Next date</Button>
                  <Button size="sm" variant="secondary" onClick={() => setOpenCapture({ matterId: matter!.id, kind: 'what-happened' })}><MessageSquare className="h-3.5 w-3.5" />What happened</Button>
                  <Button size="sm" variant="secondary" onClick={() => setOpenCapture({ matterId: matter!.id, kind: 'new-direction' })}><GitBranch className="h-3.5 w-3.5" />New direction</Button>
                  <Button size="sm" variant="ghost" loading={captureMutation.isPending} onClick={() => quickFlag(matter!.id)}><Flag className="h-3.5 w-3.5" />Flag</Button>
                </div>
                {openCapture && openCapture.matterId === matter?.id && (
                  <div className="mt-1 flex gap-2">
                    {openCapture.kind === 'next-date' ? (
                      <Input type="date" value={captureValue} onChange={(e) => setCaptureValue(e.target.value)} className="max-w-xs" />
                    ) : (
                      <Textarea value={captureValue} onChange={(e) => setCaptureValue(e.target.value)} placeholder="A quick note — you can tidy it up later" className="min-h-16 flex-1 text-sm" />
                    )}
                    <Button size="sm" variant="primary" loading={captureMutation.isPending} disabled={!captureValue.trim()} onClick={submitCapture}>Save</Button>
                  </div>
                )}
              </div>
            </Section>
          ))}
        </div>
      )}

      <Section title={`Captured on this device (${queue.length})`} className="mt-4">
        {queue.length === 0 ? (
          <div className="px-3.5 py-4 text-sm text-ink-500">Nothing captured yet today.</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {queue.slice(0, 20).map((q) => (
              <div key={q.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <div>
                  <span className="text-ink-900">{q.label}</span>
                  <span className="ml-2 text-xs text-ink-400">{fmtDateTime(q.createdAt)}</span>
                </div>
                <Badge tone={q.synced ? 'safe' : 'warn'}>{q.synced ? 'Synced' : 'Queued'}</Badge>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="mt-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/offline/sync-conflicts')}>View sync conflicts</Button>
      </div>
    </div>
  )
}
