import { useSession } from '../lib/session'

export function sleep(ms = 260 + Math.random() * 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class NetworkOfflineError extends Error {
  constructor(msg = 'This action needs a connection and cannot run offline.') {
    super(msg)
    this.name = 'NetworkOfflineError'
  }
}

/** Throw for endpoints that represent live server/court-data calls, unavailable offline. */
export function assertOnline() {
  if (useSession.getState().simulatedOffline) throw new NetworkOfflineError()
}

export function isOffline(): boolean {
  return useSession.getState().simulatedOffline
}

export { PermissionError } from '../lib/rbac'
