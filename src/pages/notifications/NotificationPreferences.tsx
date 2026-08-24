import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { listNotificationPreferences, updateNotificationPreference } from '../../api/notifications'
import { useSession } from '../../lib/session'
import { nextId } from '../../data/db'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Checkbox, Field, Input } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'
import { SixState } from '../../components/shared/SixState'
import { toastSuccess } from '../../lib/toast'
import type { NotificationPreference } from '../../data/types'

const CHANNELS: NotificationPreference['channels'][number][] = ['InApp', 'Email', 'SMS', 'Push']

export default function NotificationPreferences() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['notification-preferences', userId], queryFn: () => listNotificationPreferences(userId) })
  const [newEventType, setNewEventType] = useState('')

  const mutation = useMutation({
    mutationFn: (pref: NotificationPreference) => updateNotificationPreference(userId, pref),
    onSuccess: () => { toastSuccess('Saved.'); qc.invalidateQueries({ queryKey: ['notification-preferences'] }) },
  })

  function toggleChannel(pref: NotificationPreference, ch: NotificationPreference['channels'][number]) {
    mutation.mutate({ ...pref, channels: pref.channels.includes(ch) ? pref.channels.filter((c) => c !== ch) : [...pref.channels, ch] })
  }

  function addPreference() {
    if (!newEventType.trim()) return
    mutation.mutate({ id: nextId('np'), userId, eventType: newEventType, channels: ['InApp'], quietHoursStart: '22:00', quietHoursEnd: '07:00', overrideQuietHoursForCritical: false, perMatterMutes: [] })
    setNewEventType('')
  }

  const rows = query.data ?? []

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader title="Notification Preferences" description="Channels and quiet hours, per event type." />
      <SixState query={query} onRetry={() => query.refetch()}>
        <div className="flex flex-col gap-3">
          {rows.map((p) => (
            <Section key={p.id} title={p.eventType}>
              <div className="flex flex-col gap-3 p-3.5">
                <div className="flex flex-wrap gap-3">
                  {CHANNELS.map((ch) => <Checkbox key={ch} checked={p.channels.includes(ch)} onChange={() => toggleChannel(p, ch)} label={ch} />)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quiet hours start"><Input type="time" value={p.quietHoursStart} onChange={(e) => mutation.mutate({ ...p, quietHoursStart: e.target.value })} /></Field>
                  <Field label="Quiet hours end"><Input type="time" value={p.quietHoursEnd} onChange={(e) => mutation.mutate({ ...p, quietHoursEnd: e.target.value })} /></Field>
                </div>
                <Checkbox checked={p.overrideQuietHoursForCritical} onChange={(e) => mutation.mutate({ ...p, overrideQuietHoursForCritical: e.target.checked })} label="Override quiet hours for Crucial-tier alerts" />
              </div>
            </Section>
          ))}

          <Section title="Add a preference">
            <div className="flex items-end gap-2 p-3.5">
              <Field label="Event type" className="flex-1"><Input value={newEventType} onChange={(e) => setNewEventType(e.target.value)} placeholder="e.g. Task returned for review" /></Field>
              <Button variant="secondary" disabled={!newEventType.trim()} onClick={addPreference}><Plus className="h-3.5 w-3.5" />Add</Button>
            </div>
          </Section>
        </div>
      </SixState>
    </div>
  )
}
