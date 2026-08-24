import { db } from '../data/db'
import { sleep } from './client'
import { getUser } from '../lib/rbac'
import type { Client, Matter, ConflictCheck } from '../data/types'

export async function listClients(): Promise<Client[]> {
  await sleep()
  return db().clients
}

export interface ClientRecord {
  client: Client
  matters: Matter[]
  conflictHistory: ConflictCheck[]
  visibility: 'full' | 'nameOnly' | 'contactAndBillingOnly'
}

export async function getClient(userId: string, clientId: string): Promise<ClientRecord> {
  await sleep()
  const state = db()
  const client = state.clients.find((c) => c.id === clientId)
  if (!client) throw new Error('Client not found')
  const matters = state.matters.filter((m) => state.parties.some((p) => p.matterId === m.id && p.clientOrEntityRef === clientId))
  const user = getUser(userId)
  const visibility: ClientRecord['visibility'] = user?.role === 'Intern' ? 'nameOnly' : user?.role === 'BillingStaff' ? 'contactAndBillingOnly' : 'full'
  return { client, matters, conflictHistory: state.conflictChecks.filter((c) => c.partyName === client.name), visibility }
}
