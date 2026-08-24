import { useNavigate } from 'react-router-dom'
import { useDb } from '../../data/db'
import { useSession } from '../../lib/session'
import { fmtDateTime } from '../../lib/dates'
import { cn } from '../../lib/cn'

export function OfflineBanner() {
  const offline = useSession((s) => s.simulatedOffline)
  if (!offline) return null
  return (
    <div className="flex items-center justify-between gap-3 bg-ink-900 px-4 py-2.5 text-white">
      <span className="text-[13px]"><b>Offline — working locally.</b> Documents on this device stay readable; court data, cause lists and new orders are unavailable.</span>
      <SyncQueueChip inverse />
    </div>
  )
}

export function StaleDataBanner() {
  const navigate = useNavigate()
  const forums = useDb((s) => s.forums)
  const stale = forums.filter((f) => f.courtDataSyncStatus === 'Delayed' || f.courtDataSyncStatus === 'Failing' || f.courtDataSyncStatus === 'ManualOnly')
  if (stale.length === 0) return null
  return (
    <div className="flex items-center justify-between gap-3 border-b border-risk-warn-border bg-risk-warn-bg px-4 py-2.5">
      <span className="text-[13px] text-risk-warn-ink">
        <b>Court data isn't current for {stale.length} forum{stale.length > 1 ? 's' : ''}.</b> Verify hearing dates manually. {stale.map((f) => f.name).join(' · ')}.
      </span>
      <button onClick={() => navigate('/court/data-health')} className="whitespace-nowrap font-mono text-[11px] font-semibold text-risk-warn-ink underline">
        VIEW DETAILS →
      </button>
    </div>
  )
}

export function SyncQueueChip({ inverse }: { inverse?: boolean }) {
  const count = useQueueCount()
  if (count === 0) return null
  return (
    <span className={cn('whitespace-nowrap rounded border px-2 py-1 font-mono text-[11px]', inverse ? 'border-white text-white' : 'border-ink-900 text-ink-900')}>
      {count} CHANGES QUEUED
    </span>
  )
}

function useQueueCount(): number {
  // localStorage-backed offline queue; re-read is cheap and this only mounts in a couple of places.
  try {
    const raw = localStorage.getItem('litigation-app-offline-queue-v1')
    if (!raw) return 0
    const items = JSON.parse(raw) as { synced: boolean }[]
    return items.filter((i) => !i.synced).length
  } catch {
    return 0
  }
}

export function SyncStatusPill() {
  const offline = useSession((s) => s.simulatedOffline)
  const forums = useDb((s) => s.forums)
  const staleCount = forums.filter((f) => f.courtDataSyncStatus !== 'Healthy').length

  if (offline) {
    return <span className="whitespace-nowrap rounded border border-ink-900 bg-ink-900 px-2.5 py-1 font-mono text-[11px] text-white">◼ Offline — working locally</span>
  }
  if (staleCount > 0) {
    return <span className="whitespace-nowrap rounded border border-risk-warn-border bg-risk-warn-bg px-2.5 py-1 font-mono text-[11px] text-risk-warn-ink">⚠ Court data stale ({staleCount})</span>
  }
  const lastSync = forums.filter((f) => f.lastSyncedAt).sort((a, b) => (b.lastSyncedAt ?? '').localeCompare(a.lastSyncedAt ?? ''))[0]
  return <span className="hidden whitespace-nowrap rounded border border-ink-300 px-2.5 py-1 font-mono text-[11px] text-ink-700 sm:inline-block">◍ Synced {lastSync ? fmtRelShort(lastSync.lastSyncedAt!) : ''}</span>
}

function fmtRelShort(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  return fmtDateTime(iso)
}
