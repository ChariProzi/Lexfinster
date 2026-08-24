import { db, nextId } from '../data/db'
import { sleep } from './client'
import { appendAudit } from '../lib/audit'
import { useSession } from '../lib/session'
import type { Bundle, SyncConflict } from '../data/types'

export async function listBundles(deviceId: string): Promise<Bundle[]> {
  await sleep()
  return db().bundles.filter((b) => b.deviceId === deviceId)
}

export async function downloadBundle(userId: string, matterId: string, deviceId: string): Promise<Bundle> {
  await sleep(300)
  const state = db()
  const m = state.matters.find((mm) => mm.id === matterId)
  const existing = state.bundles.find((b) => b.matterId === matterId && b.deviceId === deviceId)
  const bundle: Bundle = existing ?? {
    id: nextId('b'), matterId, deviceId, downloadState: 'Queued', downloadProgress: 0, sizeBytes: 1_200_000_000,
    hearingDate: m?.nextHearingDate ?? new Date().toISOString().slice(0, 10), autoDeleteAt: new Date(Date.now() + 48 * 3600_000).toISOString(), annotationCount: 0,
  }
  db().update('bundles', (prev) => {
    const exists = prev.some((b) => b.id === bundle.id)
    return exists ? prev.map((b) => (b.id === bundle.id ? { ...b, downloadState: 'Downloading' as const } : b)) : [...prev, { ...bundle, downloadState: 'Downloading' as const }]
  })
  appendAudit({ action: 'bundle.create', objectType: 'Bundle', objectId: bundle.id, matterId, deviceId, actorUserId: userId })
  return bundle
}

export async function keepBundleLonger(userId: string, bundleId: string, extraHours = 48): Promise<Bundle> {
  await sleep()
  let updated: Bundle | undefined
  db().update('bundles', (prev) => prev.map((b) => (b.id === bundleId ? (updated = { ...b, autoDeleteAt: new Date(new Date(b.autoDeleteAt).getTime() + extraHours * 3600_000).toISOString() }) : b)))
  appendAudit({ action: 'bundle.keep_longer', objectType: 'Bundle', objectId: bundleId, actorUserId: userId })
  return updated!
}

export async function deleteBundle(userId: string, bundleId: string): Promise<void> {
  await sleep()
  db().update('bundles', (prev) => prev.map((b) => (b.id === bundleId ? { ...b, downloadState: 'Evicted' as const } : b)))
  appendAudit({ action: 'bundle.delete', objectType: 'Bundle', objectId: bundleId, actorUserId: userId })
}

// ---------------------------------------------------------------------------
// Court Mode capture — queues locally when the simulated-offline toggle is on.
// ---------------------------------------------------------------------------
export interface OfflineQueueItem {
  id: string
  kind: 'next-date' | 'what-happened' | 'new-direction' | 'flag' | 'annotation' | 'task-complete'
  matterId: string
  label: string
  createdAt: string
  synced: boolean
  mayConflict?: boolean
}

const QUEUE_KEY = 'litigation-app-offline-queue-v1'
function readQueue(): OfflineQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeQueue(items: OfflineQueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export function getOfflineQueue(): OfflineQueueItem[] {
  return readQueue()
}

export async function courtModeCapture(userId: string, matterId: string, kind: OfflineQueueItem['kind'], label: string): Promise<OfflineQueueItem> {
  await sleep(120)
  void userId
  const item: OfflineQueueItem = { id: nextId('q'), kind, matterId, label, createdAt: new Date().toISOString(), synced: !useSession.getState().simulatedOffline }
  const q = readQueue()
  q.unshift(item)
  writeQueue(q)
  return item
}

export async function syncQueueNow(): Promise<{ synced: number; conflicts: number }> {
  await sleep(500)
  const q = readQueue()
  let synced = 0
  const remaining = q.map((item) => {
    if (item.synced) return item
    synced++
    return { ...item, synced: true }
  })
  writeQueue(remaining)
  return { synced, conflicts: db().syncConflicts.filter((c) => !c.resolution).length }
}

export async function listSyncConflicts(): Promise<SyncConflict[]> {
  await sleep()
  return db().syncConflicts.filter((c) => !c.resolution)
}

export async function resolveSyncConflict(userId: string, conflictId: string, resolution: SyncConflict['resolution']): Promise<SyncConflict> {
  await sleep()
  let updated: SyncConflict | undefined
  db().update('syncConflicts', (prev) => prev.map((c) => (c.id === conflictId ? (updated = { ...c, resolution }) : c)))
  appendAudit({ action: 'sync_conflict.resolve', objectType: 'SyncConflict', objectId: conflictId, actorUserId: userId, afterState: { resolution } })
  return updated!
}

export async function respondToRetentionPrompt(userId: string, bundleId: string, choice: 'KeepAnnotations' | 'ShareAnnotations' | 'DiscardAll'): Promise<Bundle> {
  await sleep()
  let updated: Bundle | undefined
  db().update('bundles', (prev) => prev.map((b) => (b.id === bundleId ? (updated = { ...b, downloadState: 'Evicted' as const, annotationCount: choice === 'DiscardAll' ? 0 : b.annotationCount }) : b)))
  appendAudit({ action: 'retention_prompt.respond', objectType: 'Bundle', objectId: bundleId, actorUserId: userId, afterState: { choice } })
  return updated!
}

export async function getDeviceStorageSettings(deviceId: string) {
  await sleep()
  void deviceId
  return { capGb: 20, usedGb: db().bundles.filter((b) => b.downloadState === 'OnDevice').reduce((s, b) => s + b.sizeBytes, 0) / 1e9, autoDeleteHours: 48 }
}
