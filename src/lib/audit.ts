import { db, nextId } from '../data/db'
import { useSession } from './session'
import { getUser } from './rbac'
import type { AuditLogEntry } from '../data/types'

let simulatedIp = '103.21.244.11'

export function appendAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorUserId' | 'actorName' | 'ipAddress'> & { actorUserId?: string }) {
  const userId = entry.actorUserId ?? useSession.getState().userId ?? undefined
  const user = getUser(userId)
  const row: AuditLogEntry = {
    id: nextId('al'),
    timestamp: new Date().toISOString(),
    actorUserId: userId,
    actorName: user?.name,
    ipAddress: simulatedIp,
    ...entry,
  }
  db().update('auditLog', (prev) => [row, ...prev])
  return row
}

export function setSimulatedIp(ip: string) {
  simulatedIp = ip
}
