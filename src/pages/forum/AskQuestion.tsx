import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { askQuestion } from '../../api/forum'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { useShallow } from 'zustand/react/shallow'
import { visibleMatterIds } from '../../lib/rbac'
import { PageHeader, Button } from '../../components/ui/primitives'
import { Checkbox, Field, Input, Select, Textarea } from '../../components/ui/form'
import { toastError } from '../../lib/toast'
import type { ForumAudience } from '../../data/types'

export default function AskQuestion() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const visible = visibleMatterIds(userId)
  const matters = useDb(useShallow((s) => s.matters.filter((m) => visible.has(m.id))))

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [matterId, setMatterId] = useState('')
  const [autoRedact, setAutoRedact] = useState(true)
  const [practiceArea, setPracticeArea] = useState('')
  const [neededByDate, setNeededByDate] = useState('')
  const [audience, setAudience] = useState<ForumAudience>('WholeFirm')

  const mutation = useMutation({
    mutationFn: () => askQuestion(userId, { title, body, matterId: matterId || undefined, autoRedactClientNames: autoRedact, practiceArea, neededByDate: neededByDate || undefined, audience }),
    onSuccess: (q) => { qc.invalidateQueries({ queryKey: ['forum-questions'] }); navigate(`/forum/questions/${q.id}`) },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not post question.'),
  })

  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <PageHeader title="Ask a question" description="Firm-wide question and answer, with mandatory Partner clearance before any answer counts as firm guidance." />
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="flex flex-col gap-3.5 rounded-lg border border-ink-200 bg-paper p-4">
        <Field label="Title" required><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A clear, specific legal question" /></Field>
        <Field label="Details"><Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Facts, provisions in play, what you've already checked" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Practice area" required><Input required value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} placeholder="e.g. Limitation, IBC, NI Act" /></Field>
          <Field label="Needed by (optional)"><Input type="date" value={neededByDate} onChange={(e) => setNeededByDate(e.target.value)} /></Field>
        </div>
        <Field label="Related matter (optional)">
          <Select value={matterId} onChange={(e) => setMatterId(e.target.value)}>
            <option value="">General — not matter-specific</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.caseNumber})</option>)}
          </Select>
        </Field>
        <Field label="Who can see this">
          <Select value={audience} onChange={(e) => setAudience(e.target.value as ForumAudience)}>
            <option value="WholeFirm">Whole firm</option>
            <option value="PartnersOnly">Partners only</option>
            <option value="OpenToInterns">Open to interns</option>
          </Select>
        </Field>
        {matterId && (
          <Checkbox checked={autoRedact} onChange={(e) => setAutoRedact(e.target.checked)} label="Auto-redact client and opposing-party names for anyone without access to this matter" />
        )}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!title.trim() || !practiceArea.trim()}>Post question</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
