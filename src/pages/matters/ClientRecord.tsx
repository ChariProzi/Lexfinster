import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { getClient } from '../../api/clients'
import { useSession } from '../../lib/session'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Badge } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { RedactedText } from '../../components/shared/Misc'
import { fmt } from '../../lib/dates'

export default function ClientRecord() {
  const { clientId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['client', clientId, userId], queryFn: () => getClient(userId, clientId) })
  const data = query.data

  return (
    <div className="mx-auto max-w-3xl">
      {data && (
        <PageHeader
          title={data.client.name}
          description={`${data.client.type}${data.client.tags.length ? ' · ' + data.client.tags.join(', ') : ''}`}
        />
      )}
      <SixState query={query} onRetry={() => query.refetch()}>
        {data && (
          <div className="flex flex-col gap-4">
            {data.isBothClientAndOpponent && (
              <div className="flex items-center gap-2 rounded-md bg-ink-900 px-4 py-2.5 text-[13px] text-white">
                <Flag className="h-4 w-4 shrink-0" />
                Our client in {data.matters.filter((m) => m.weActFor).length} matter(s) and an opposing party in {data.matters.filter((m) => !m.weActFor).length} other matter(s) — check both before sharing anything.
              </div>
            )}

            <Section title={`Matters (${data.matters.length})`}>
              {data.matters.length === 0 ? (
                <div className="px-4 py-6 text-sm text-ink-500">No matters on record for this client yet.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                  {data.matters.map((row) => (
                    <button
                      key={row.matter.id}
                      onClick={() => navigate(`/matters/${row.matter.id}`)}
                      className={`rounded-md border p-3 text-left hover:shadow-card ${row.weActFor ? 'border-ink-900' : 'border-risk-critical'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink-900">{row.matter.title}</span>
                        <Badge tone={row.weActFor ? 'ink' : 'critical'} mono>{row.weActFor ? 'OUR CLIENT' : 'OPPOSING PARTY'}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-ink-500">{row.matter.caseNumber} · {row.forumName} · {row.matter.stage}</div>
                    </button>
                  ))}
                </div>
              )}
            </Section>

            {data.visibility === 'full' && (
              <Section title="Contact & fee arrangement">
                <div className="divide-y divide-ink-100">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="text-ink-500">Contact</span><span className="text-ink-900">{data.client.contact ?? '—'}</span></div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="text-ink-500">Fee arrangement</span><span className="text-ink-900">{data.client.feeArrangement ?? '—'}</span></div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm"><span className="text-ink-500">Conflict status</span><Badge tone={data.client.conflictStatus === 'Clear' ? 'safe' : data.client.conflictStatus === 'Flagged' ? 'critical' : 'warn'}>{data.client.conflictStatus}</Badge></div>
                </div>
              </Section>
            )}
            {data.visibility === 'contactAndBillingOnly' && (
              <Section title="Contact">
                <div className="px-4 py-2.5 text-sm text-ink-900">{data.client.contact ?? '—'}</div>
              </Section>
            )}
            {data.visibility === 'nameOnly' && (
              <div className="rounded-md border border-ink-200 bg-surface px-4 py-3 text-[13px] text-ink-500">Contact details and fee arrangement are hidden at your access level.</div>
            )}

            <Section title={`Conflict history (${data.conflictHistory.length})`}>
              {data.conflictHistory.length === 0 ? (
                <div className="px-4 py-4 text-sm text-ink-500">No prior conflict checks recorded against this name.</div>
              ) : (
                <div className="divide-y divide-ink-100">
                  {data.conflictHistory.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-ink-700"><RedactedText value={c.detail ?? c.result} /></span>
                      <span className="text-xs text-ink-400">{fmt(c.checkedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}
      </SixState>
    </div>
  )
}
