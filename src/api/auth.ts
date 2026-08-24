import { db, nextId } from '../data/db'
import { sleep } from './client'
import { appendAudit } from '../lib/audit'
import type { Device } from '../data/types'

export interface LoginResult {
  userId: string
  deviceId: string
}

export async function login(email: string, _password: string, deviceLabel = 'This device'): Promise<LoginResult> {
  await sleep()
  const user = db().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) {
    appendAudit({ action: 'auth.login_failed', objectType: 'Session', actorUserId: undefined })
    throw new Error('No account found for that email. Try one of the demo accounts below.')
  }
  if (user.status === 'Suspended') {
    appendAudit({ action: 'auth.login_failed_suspended', objectType: 'Session', actorUserId: user.id })
    throw new Error('This account has been suspended. Contact your firm Admin.')
  }
  let device = db().devices.find((d) => d.userId === user.id)
  if (!device) {
    device = {
      id: nextId('dev'),
      userId: user.id,
      label: deviceLabel,
      platform: 'Web',
      registeredAt: new Date().toISOString(),
      offlineConsentAt: null,
      encryptionKeyRef: '',
    } satisfies Device
    db().update('devices', (prev) => [...prev, device!])
  }
  db().update('users', (prev) => prev.map((u) => (u.id === user.id ? { ...u, lastActiveAt: new Date().toISOString() } : u)))
  appendAudit({ action: 'auth.login', objectType: 'Session', actorUserId: user.id })
  return { userId: user.id, deviceId: device.id }
}

export async function logout(userId: string) {
  await sleep(120)
  appendAudit({ action: 'auth.logout', objectType: 'Session', actorUserId: userId })
}

export async function registerOfflineConsent(deviceId: string) {
  await sleep()
  db().update('devices', (prev) => prev.map((d) => (d.id === deviceId ? { ...d, offlineConsentAt: new Date().toISOString() } : d)))
  appendAudit({ action: 'device.offline_consent', objectType: 'Device', objectId: deviceId })
}
