import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { listResearchLibrary } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { SixState } from '../../components/shared/SixState'
import { PageHeader, Badge, EmptyState } from '../../components/ui/primitives'
import { Section } from '../../components/shared/Layout'
import { fmt, isPast } from '../../lib/dates'

export default function LibraryEntryDetail() {
  const { entryId = '' } = useParams()
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const users = useDb((s) => s.users)
  const matters = useDb((s) => s.matters)
  const query = useQuery({ queryKey: ['research-library', userId], queryFn: () => listResearchLibrary(userId) })

  const entry = query.data?.find((e) => e.id === entryId)
  const reviewDue = entry?.stillGoodLawReviewDate ? isPast(entry.stillGoodLawReviewDate) : false

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <SixState query={query} isEmpty={!!query.data && !entry} emptyState={<EmptyState title="Not found" description="This library entry does not exist, or has been removed." />}>
        {entry && (
          <>
            <PageHeader
              title={entry.title}
              description={`Source: ${entry.source} · Cleared by ${users.find((u) => u.id === entry.clearedByUserId)?.name ?? 'Unknown'} on ${fmt(entry.clearedAt)}`}
            />
            {reviewDue && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-2.5 text-[13px] text-risk-warn-ink">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Review due — confirm this entry is still good law before relying on it.
              </div>
            )}
            <Section title="Issue"><div className="px-3.5 py-2.5 text-sm text-ink-700">{entry.issue}</div></Section>
            <Section title="Short answer" className="mt-3"><div className="px-3.5 py-2.5 text-sm text-ink-700">{entry.shortAnswer}</div></Section>
            <Section title="Authorities" className="mt-3">
              <div className="divide-y divide-ink-100">
                {entry.authorities.map((c, i) => (
                  <div key={i} className="px-3.5 py-2.5 text-[12.5px]">
                    <span className="font-semibold text-ink-800">{c.case}</span> · {c.court} {c.year} · <Badge tone={c.weight === 'Binding' ? 'ink' : c.weight === 'Persuasive' ? 'brand' : 'neutral'}>{c.weight}</Badge>
                    <div className="mt-0.5 text-ink-600">{c.ratio}</div>
                  </div>
                ))}
              </div>
            </Section>
            {entry.linkedMatterIds.length > 0 && (
              <Section title="Linked matters" className="mt-3">
                <div className="flex flex-wrap gap-2 p-3.5">
                  {entry.linkedMatterIds.map((mid) => {
                    const m = matters.find((mm) => mm.id === mid)
                    return m ? <button key={mid} onClick={() => navigate(`/matters/${mid}`)} className="rounded border border-ink-300 px-2 py-1 text-xs text-ink-700 hover:border-ink-900">{m.title}</button> : null
                  })}
                </div>
              </Section>
            )}
            {entry.stillGoodLawReviewDate && <div className="mt-3 text-xs text-ink-400">Next still-good-law review: {fmt(entry.stillGoodLawReviewDate)}</div>}
          </>
        )}
      </SixState>
    </div>
  )
}
