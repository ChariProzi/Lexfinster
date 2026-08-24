import { db } from '../data/db'
import { sleep } from './client'
import { getUser } from '../lib/rbac'
import type { Client, Matter, ConflictCheck, PartyRole } from '../data/types'

export async function listClients(): Promise<Client[]> {
  await sleep()
  return db().clients
}

export interface ClientMatterRow {
  matter: Matter
  forumName: string
  weActFor: boolean
  role: PartyRole
}

export interface ClientRecord {
  client: Client
  matters: ClientMatterRow[]
  conflictHistory: ConflictCheck[]
  visibility: 'full' | 'nameOnly' | 'contactAndBillingOnly'
  isBothClientAndOpponent: boolean
}

export async function getClient(userId: string, clientId: string): Promise<ClientRecord> {
  await sleep()
  const state = db()
  const client = state.clients.find((c) => c.id === clientId)
  if (!client) throw new Error('Client not found')
  const matters: ClientMatterRow[] = state.matters
    .map((m) => {
      const party = state.parties.find((p) => p.matterId === m.id && p.clientOrEntityRef === clientId)
      if (!party) return null
      return { matter: m, forumName: state.forums.find((f) => f.id === m.forumId)?.name ?? '—', weActFor: party.weActFor, role: party.role }
    })
    .filter((r): r is ClientMatterRow => r !== null)
  const user = getUser(userId)
  const visibility: ClientRecord['visibility'] = user?.role === 'Intern' ? 'nameOnly' : user?.role === 'BillingStaff' ? 'contactAndBillingOnly' : 'full'
  const isBothClientAndOpponent = matters.some((r) => r.weActFor) && matters.some((r) => !r.weActFor)
  return { client, matters, conflictHistory: state.conflictChecks.filter((c) => c.partyName === client.name), visibility, isBothClientAndOpponent }
}
