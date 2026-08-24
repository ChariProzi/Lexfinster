import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { FileText, Scale, Mail, History, Search, ArrowLeft, ShieldAlert, ShieldCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { createMatterFromIntake, importFromPortal, liveConflictCheck, rulesForIntakeType, type IntakeInput, type ConflictDecision } from '../../api/matters'
import { useSession } from '../../lib/session'
import { useDb } from '../../data/db'
import { isRole } from '../../lib/rbac'
import { PageHeader, Button, Badge } from '../../components/ui/primitives'
import { Field, Input, Select, Textarea, Checkbox, RadioCard } from '../../components/ui/form'
import { Section, TwoPaneShell } from '../../components/shared/Layout'
import { computeDeadline } from '../../lib/dateEngine'
import { fmt } from '../../lib/dates'
import { toastSuccess, toastError } from '../../lib/toast'
import type { ConflictCheck, IntakeType, MatterStage, PartyRole } from '../../data/types'

const TYPES: { key: IntakeType; title: string; description: string; needs: string; icon: typeof FileText }[] = [
  { key: 'FreshCase', title: '1. Fresh case', description: 'Instituting a suit, complaint or petition.', needs: 'Needs: cause of action date · forum · court fee · vakalatnama', icon: FileText },
  { key: 'AppealRevision', title: '2. Appeal / revision', description: 'Challenging an existing order.', needs: 'Needs: impugned order date · certified copy applied/received · forum below/above', icon: Scale },
  { key: 'ReplyRequired', title: '3. Brief to counsel / reply required', description: 'Respond to a notice, summons or application.', needs: 'Needs: document received · date of service · reply deadline & rule', icon: Mail },
  { key: 'ExistingMidStream', title: '4. Existing matter — mid-stream', description: "Pleadings already filed, we're taking over.", needs: "Needs: current stage · next hearing · what's filed · running deadlines", icon: History },
]

const PARTY_ROLES: PartyRole[] = ['Plaintiff', 'Defendant', 'Appellant', 'Respondent', 'Applicant', 'Accused', 'Other']
const STAGES: MatterStage[] = ['PreInstitution', 'Pleadings', 'Evidence', 'Arguments', 'Reserved']

interface PartyDraft { name: string; role: PartyRole; weActFor: boolean }

type Step = 'type' | 'form' | 'conflict'

export default function Intake() {
  const userId = useSession((s) => s.userId)!
  const navigate = useNavigate()
  const qc = useQueryClient()
  const forums = useDb((s) => s.forums)
  const users = useDb((s) => s.users)
  const rules = useDb((s) => s.rules)

  const [step, setStep] = useState<Step>('type')
  const [intakeType, setIntakeType] = useState<IntakeType | null>(null)

  const [cnr, setCnr] = useState('')
  const [cnrChecked, setCnrChecked] = useState(false)
  const [cnrFound, setCnrFound] = useState<{ title?: string; forumName?: string } | null>(null)

  const [title, setTitle] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [forumId, setForumId] = useState('')
  const [bench, setBench] = useState('')
  const [practiceArea, setPracticeArea] = useState('')
  const [importanceTier, setImportanceTier] = useState<'Crucial' | 'Medium' | 'Low'>('Medium')
  const [isCommercialDispute, setIsCommercialDispute] = useState(false)
  const [responsiblePartnerId, setResponsiblePartnerId] = useState('')
  const [assignedAssociateIds, setAssignedAssociateIds] = useState<string[]>([])
  const [paralegalId, setParalegalId] = useState('')

  const [causeOfActionDate, setCauseOfActionDate] = useState('')
  const [impugnedOrderDate, setImpugnedOrderDate] = useState('')
  const [certifiedCopyAppliedFor, setCertifiedCopyAppliedFor] = useState('')
  const [certifiedCopyReceived, setCertifiedCopyReceived] = useState('')
  const [dateOfService, setDateOfService] = useState('')
  const [currentStage, setCurrentStage] = useState<MatterStage>('Pleadings')
  const [nextHearingDate, setNextHearingDate] = useState('')

  const [parties, setParties] = useState<PartyDraft[]>([
    { name: '', role: 'Plaintiff', weActFor: true },
    { name: '', role: 'Defendant', weActFor: false },
  ])
  const [livePreview, setLivePreview] = useState<Record<number, ConflictCheck[]>>({})
  const [errors, setErrors] = useState<string[]>([])

  const [conflictChecks, setConflictChecks] = useState<ConflictCheck[]>([])
  const [declined, setDeclined] = useState(false)
  const [decisions, setDecisions] = useState<Record<string, ConflictDecision>>({})
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({})

  const partners = users.filter((u) => u.role === 'Partner' || u.role === 'Admin')
  const associates = users.filter((u) => u.role === 'Associate')
  const paralegals = users.filter((u) => u.role === 'Paralegal')
  const canDecideConflicts = isRole(userId, 'Partner', 'Admin')

  const cnrMutation = useMutation({
    mutationFn: () => importFromPortal(userId, cnr),
    onSuccess: (res) => {
      setCnrChecked(true)
      if (!res.found) { setCnrFound(null); return }
      setCnrFound(res)
      setIntakeType('ExistingMidStream')
      setTitle(res.title ?? '')
      setStep('form')
    },
  })

  const liveCheckMutation = useMutation({ mutationFn: (name: string) => liveConflictCheck(userId, name) })

  function checkPartyLive(i: number, name: string) {
    if (name.trim().length < 3) { setLivePreview((prev) => { const n = { ...prev }; delete n[i]; return n }); return }
    liveCheckMutation.mutate(name, { onSuccess: (res) => setLivePreview((prev) => ({ ...prev, [i]: res })) })
  }

  function updateParty(i: number, patch: Partial<PartyDraft>) {
    setParties((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function addParty() {
    setParties((prev) => [...prev, { name: '', role: 'Respondent', weActFor: false }])
  }
  function removeParty(i: number) {
    setParties((prev) => prev.filter((_, idx) => idx !== i))
  }

  function buildInput(): IntakeInput {
    return {
      intakeType: intakeType!,
      title, caseNumber, forumId, bench: bench || undefined, practiceArea,
      importanceTier, isCommercialDispute, responsiblePartnerId, assignedAssociateIds,
      paralegalId: paralegalId || undefined,
      parties: parties.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), role: p.role, weActFor: p.weActFor })),
      causeOfActionDate: causeOfActionDate || undefined,
      impugnedOrderDate: impugnedOrderDate || undefined,
      certifiedCopyAppliedFor: certifiedCopyAppliedFor || undefined,
      certifiedCopyReceived: certifiedCopyReceived || undefined,
      dateOfService: dateOfService || undefined,
      currentStage: intakeType === 'ExistingMidStream' ? currentStage : undefined,
      nextHearingDate: nextHearingDate || undefined,
    }
  }

  const submitMutation = useMutation({
    mutationFn: (decisionsArr: ConflictDecision[]) => createMatterFromIntake(userId, buildInput(), decisionsArr),
    onSuccess: (res) => {
      if (res.declined) { setDeclined(true); setConflictChecks(res.conflictChecks); setStep('conflict'); return }
      if (res.blocked) { setConflictChecks(res.conflictChecks); setStep('conflict'); return }
      toastSuccess(`Matter created — ${res.matter.caseNumber}.`)
      qc.invalidateQueries({ queryKey: ['matters'] })
      navigate(`/matters/${res.matter.id}/checklist`)
    },
    onError: (e) => toastError(e instanceof Error ? e.message : 'Could not create matter.'),
  })

  function validate(): boolean {
    const errs: string[] = []
    if (!title.trim()) errs.push('Title is required.')
    if (!caseNumber.trim()) errs.push('Case number is required.')
    if (!forumId) errs.push('Forum is required.')
    if (!responsiblePartnerId) errs.push('A responsible partner must be assigned.')
    if (parties.filter((p) => p.name.trim()).length === 0) errs.push('At least one party is required.')
    setErrors(errs)
    return errs.length === 0
  }

  function handleContinue() {
    if (!validate()) return
    submitMutation.mutate([])
  }

  function recordDecision(partyName: string, outcome: ConflictDecision['outcome']) {
    const reason = reasonDraft[partyName]?.trim()
    if (!reason) { toastError('A reason is required before recording a decision.'); return }
    setDecisions((prev) => ({ ...prev, [partyName]: { partyName, outcome, reason } }))
  }

  const preview = useMemo(() => {
    if (!intakeType) return null
    const picked = rulesForIntakeType(intakeType, { causeOfActionDate, impugnedOrderDate, certifiedCopyAppliedFor, certifiedCopyReceived, dateOfService })
    if (!picked || !picked.triggerDate) return null
    const rule = rules.find((r) => r.name === picked.ruleName)
    if (!rule) return null
    let computed = computeDeadline(picked.triggerDate, rule)
    if (computed && picked.exclusionDays > 0) {
      const d = new Date(computed)
      d.setDate(d.getDate() + picked.exclusionDays)
      computed = d.toISOString().slice(0, 10)
    }
    return { rule, computed, exclusionDays: picked.exclusionDays }
  }, [intakeType, causeOfActionDate, impugnedOrderDate, certifiedCopyAppliedFor, certifiedCopyReceived, dateOfService, rules])

  const unresolvedConflicts = conflictChecks.filter((c) => c.result !== 'Clear' && !decisions[c.partyName])
  const allResolved = unresolvedConflicts.length === 0

  // ------------------------------------------------------------------- STEP 1
  if (step === 'type') {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="New Matter — how are we starting?" description="Each intake type captures different limitation-critical fields." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => { setIntakeType(t.key); setStep('form') }}
              className="flex flex-col gap-1.5 rounded-lg border border-ink-300 bg-paper p-4 text-left transition-colors hover:border-ink-900 hover:shadow-card"
            >
              <div className="flex items-center gap-2">
                <t.icon className="h-4 w-4 text-ink-600" />
                <span className="text-[15px] font-semibold text-ink-900">{t.title}</span>
              </div>
              <div className="text-[13px] text-ink-600">{t.description}</div>
              <div className="mt-1 font-mono text-[11px] text-ink-500">{t.needs}</div>
            </button>
          ))}
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-200" />
          <span className="text-xs text-ink-400">OR IMPORT FROM COURT PORTAL</span>
          <div className="h-px flex-1 bg-ink-200" />
        </div>
        <div className="mx-auto flex max-w-md gap-2">
          <Input placeholder="Enter CNR or case number" value={cnr} onChange={(e) => { setCnr(e.target.value); setCnrChecked(false) }} error={cnrChecked && !cnrFound} />
          <Button variant="primary" loading={cnrMutation.isPending} onClick={() => cnrMutation.mutate()} disabled={!cnr.trim()}>
            <Search className="h-3.5 w-3.5" />Fetch
          </Button>
        </div>
        {cnrChecked && !cnrFound && (
          <div className="mx-auto mt-3 max-w-md rounded-md border border-risk-warn-border bg-risk-warn-bg px-3.5 py-2.5 text-[12.5px] text-risk-warn-ink">
            No record found for this CNR — the forum may not be covered, or the number may be incorrect. Continue manually using one of the cards above.
          </div>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------------- STEP 3 — conflict results (S-09)
  if (step === 'conflict') {
    if (declined) {
      return (
        <div className="mx-auto max-w-lg">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-risk-critical-border bg-risk-critical-bg px-8 py-14 text-center">
            <ShieldAlert className="h-8 w-8 text-risk-critical" />
            <div className="text-[15px] font-semibold text-ink-900">Intake declined</div>
            <div className="max-w-md text-sm text-ink-600">This matter was not created because a conflict of interest was recorded as a decline. The decision and reason are in the audit log.</div>
            <Button variant="primary" onClick={() => navigate('/matters')}>Back to All Matters</Button>
          </div>
        </div>
      )
    }
    const searched = parties.filter((p) => !p.weActFor && p.name.trim()).map((p) => p.name).join(' · ')
    return (
      <div className="mx-auto max-w-2xl">
        <button onClick={() => setStep('form')} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Back to form</button>
        <PageHeader title={`Conflict check — ${title || 'New matter'}`} description={searched ? `Searched: ${searched}` : undefined} />
        {conflictChecks.every((c) => c.result === 'Clear') ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-ink-200 bg-paper px-8 py-12 text-center">
            <CheckCircle2 className="h-7 w-7 text-risk-safe" />
            <div className="text-[15px] font-semibold text-ink-900">No conflicts found</div>
            <Button variant="primary" onClick={handleContinue} loading={submitMutation.isPending}>Continue</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conflictChecks.filter((c) => c.result !== 'Clear').map((c) => {
              const isDirect = c.result === 'Blocked' || (c.detail ?? '').startsWith('Direct')
              return (
              <div key={c.partyName} className={`rounded-lg border p-3.5 ${isDirect ? 'border-risk-critical' : 'border-risk-warn-border bg-risk-warn-bg'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink-900">{c.partyName}</span>
                  <Badge tone={isDirect ? 'critical' : 'warn'}>{isDirect ? 'Direct conflict' : 'Name similarity'}</Badge>
                </div>
                <div className="mt-1 text-[13px] text-ink-600">{c.detail}</div>
                {decisions[c.partyName] ? (
                  <div className="mt-2 rounded border border-ink-200 bg-paper px-3 py-2 text-[12.5px] text-ink-700">
                    Decision: <b>{decisions[c.partyName].outcome}</b> — {decisions[c.partyName].reason}
                  </div>
                ) : canDecideConflicts ? (
                  <div className="mt-2.5 flex flex-col gap-2">
                    <Textarea
                      placeholder="Reason (required to proceed) — written to the audit log"
                      value={reasonDraft[c.partyName] ?? ''}
                      onChange={(e) => setReasonDraft((prev) => ({ ...prev, [c.partyName]: e.target.value }))}
                      className="min-h-16 text-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => recordDecision(c.partyName, 'NotAConflict')}><ShieldCheck className="h-3.5 w-3.5" />Not a conflict</Button>
                      <Button size="sm" variant="danger" onClick={() => recordDecision(c.partyName, 'Decline')}>Conflict — decline</Button>
                      <Button size="sm" variant="secondary" onClick={() => recordDecision(c.partyName, 'SeekWaiver')}>Conflict — seek waiver</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-[12.5px] text-ink-500">A Partner or Admin needs to review this before you can continue.</div>
                )}
              </div>
              )
            })}
            <div className="mt-1 flex gap-2">
              <Button variant="primary" disabled={!allResolved} loading={submitMutation.isPending} onClick={() => submitMutation.mutate(Object.values(decisions))}>
                {allResolved ? 'Continue' : 'Continue (blocked until decided)'}
              </Button>
              <Button variant="secondary" onClick={() => setStep('form')}>Back</Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------------- STEP 2 — intake form (S-08)
  const typeInfo = TYPES.find((t) => t.key === intakeType)!
  return (
    <div>
      <button onClick={() => setStep('type')} className="mb-3 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"><ArrowLeft className="h-3.5 w-3.5" />Change intake type</button>
      <PageHeader title={typeInfo.title.replace(/^\d+\.\s*/, '')} description={cnrFound?.forumName ? `Pre-filled from court portal · ${cnrFound.forumName}` : 'New matter intake'} />

      {errors.length > 0 && (
        <div className="mb-4 rounded-md border border-risk-critical-border bg-risk-critical-bg px-3.5 py-3 text-[13px] text-risk-critical">
          <div className="font-semibold">{errors.length} field(s) need attention before you can continue.</div>
          <ul className="mt-1 list-disc pl-5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <TwoPaneShell
        railTitle="Proposed deadline chain"
        contextSummary={preview ? (preview.computed ? fmt(preview.computed) : 'Needs judgement') : 'No dates yet'}
        primary={
          <div className="flex flex-col gap-4">
            <Section title="Forum & case identity">
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                <Field label="Matter title" required><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vikram Bhasin v. Delhi Development Authority" /></Field>
                <Field label="Case / diary number" required><Input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="e.g. FAO 88/2026" /></Field>
                <Field label="Forum" required>
                  <Select value={forumId} onChange={(e) => setForumId(e.target.value)}>
                    <option value="">Select forum</option>
                    {forums.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Select>
                </Field>
                <Field label="Bench (optional)"><Input value={bench} onChange={(e) => setBench(e.target.value)} placeholder="e.g. Bench III" /></Field>
                <Field label="Practice area"><Input value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} placeholder="e.g. Commercial dispute" /></Field>
                <Field label="Commercial dispute?"><Checkbox checked={isCommercialDispute} onChange={(e) => setIsCommercialDispute(e.target.checked)} label="Governed by the Commercial Courts Act" /></Field>
              </div>
            </Section>

            <Section title="Client & parties">
              <div className="flex flex-col gap-2.5 p-4">
                {parties.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      className="min-w-[160px] flex-1"
                      placeholder="Party name"
                      value={p.name}
                      onChange={(e) => updateParty(i, { name: e.target.value })}
                      onBlur={() => !p.weActFor && checkPartyLive(i, p.name)}
                    />
                    <Select className="w-36" value={p.role} onChange={(e) => updateParty(i, { role: e.target.value as PartyRole })}>
                      {PARTY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                    <Checkbox checked={p.weActFor} onChange={(e) => updateParty(i, { weActFor: e.target.checked })} label="We act for" />
                    <button onClick={() => removeParty(i)} className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-risk-critical"><Trash2 className="h-3.5 w-3.5" /></button>
                    {!p.weActFor && livePreview[i] && livePreview[i].length > 0 && (
                      <div className="w-full rounded border border-risk-warn-border bg-risk-warn-bg px-2.5 py-1.5 text-[11.5px] text-risk-warn-ink">
                        {livePreview[i].map((c, ci) => <div key={ci}>{c.result === 'Blocked' ? 'Direct conflict' : 'Possible match'} — {c.detail}</div>)}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={addParty} className="flex items-center gap-1 self-start text-xs font-medium text-brand-500 hover:text-brand-700"><Plus className="h-3.5 w-3.5" />Add party</button>
              </div>
            </Section>

            <Section title="Limitation-critical dates">
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                {intakeType === 'FreshCase' && (
                  <Field label="Cause of action date" required hint="Starting point for the limitation clock."><Input type="date" value={causeOfActionDate} onChange={(e) => setCauseOfActionDate(e.target.value)} /></Field>
                )}
                {intakeType === 'AppealRevision' && (
                  <>
                    <Field label="Date of impugned order" required hint="Starting point for the limitation clock (Art. 116)."><Input type="date" value={impugnedOrderDate} onChange={(e) => setImpugnedOrderDate(e.target.value)} /></Field>
                    <Field label="Certified copy applied for" hint="Used to exclude time under §12 Limitation Act."><Input type="date" value={certifiedCopyAppliedFor} onChange={(e) => setCertifiedCopyAppliedFor(e.target.value)} /></Field>
                    <Field label="Certified copy received"><Input type="date" value={certifiedCopyReceived} onChange={(e) => setCertifiedCopyReceived(e.target.value)} /></Field>
                  </>
                )}
                {intakeType === 'ReplyRequired' && (
                  <Field label="Date of service" required hint="Reply deadline is computed from this date."><Input type="date" value={dateOfService} onChange={(e) => setDateOfService(e.target.value)} /></Field>
                )}
                {intakeType === 'ExistingMidStream' && (
                  <>
                    <Field label="Current stage">
                      <Select value={currentStage} onChange={(e) => setCurrentStage(e.target.value as MatterStage)}>
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </Field>
                    <Field label="Next hearing date"><Input type="date" value={nextHearingDate} onChange={(e) => setNextHearingDate(e.target.value)} /></Field>
                  </>
                )}
              </div>
              {intakeType === 'ExistingMidStream' && (
                <div className="border-t border-ink-100 px-4 py-3 text-[12.5px] text-ink-500">No chain is computed from a trigger here — record whatever deadlines the incoming file already shows on the Deadlines screen after the matter is created, each flagged "confirm — not verified by this system."</div>
              )}
            </Section>

            <Section title="Importance & allocation">
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                <Field label="Importance tier">
                  <Select value={importanceTier} onChange={(e) => setImportanceTier(e.target.value as typeof importanceTier)}>
                    <option value="Crucial">Crucial</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </Select>
                </Field>
                <Field label="Responsible partner" required>
                  <Select value={responsiblePartnerId} onChange={(e) => setResponsiblePartnerId(e.target.value)}>
                    <option value="">Select partner</option>
                    {partners.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </Field>
                <Field label="Paralegal">
                  <Select value={paralegalId} onChange={(e) => setParalegalId(e.target.value)}>
                    <option value="">None</option>
                    {paralegals.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </Field>
                <Field label="Assigned associates">
                  <div className="flex flex-col gap-1.5 pt-1">
                    {associates.map((u) => (
                      <Checkbox
                        key={u.id}
                        checked={assignedAssociateIds.includes(u.id)}
                        onChange={(e) => setAssignedAssociateIds((prev) => (e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)))}
                        label={u.name}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            </Section>

            <div className="flex gap-2">
              <Button variant="primary" size="lg" loading={submitMutation.isPending} onClick={handleContinue}>Continue</Button>
              <Button variant="secondary" size="lg" onClick={() => setStep('type')}>Back</Button>
            </div>
          </div>
        }
        contextRail={
          <div className="flex flex-col gap-3">
            <Section title="Proposed deadline chain">
              {preview ? (
                <div className="p-3.5">
                  <div className="rounded-md border border-ink-300 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-ink-900">{preview.rule.name}</span>
                      <span className="text-[13px] font-semibold text-ink-900">{preview.computed ? fmt(preview.computed) : '?'}</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-ink-500">{preview.rule.governingProvision}</div>
                    {preview.exclusionDays > 0 && <div className="mt-1 text-[11px] text-ink-500">+ {preview.exclusionDays} days excluded under §12 (certified copy)</div>}
                  </div>
                  {intakeType === 'AppealRevision' && (
                    <div className="mt-2.5 rounded-md border border-dashed border-risk-warn-border bg-risk-warn-bg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-risk-warn-ink">Condonation of delay</span>
                        <span className="font-mono text-sm text-risk-warn-ink">?</span>
                      </div>
                      <div className="mt-1 text-[11px] text-risk-warn-ink">§5 Limitation Act — discretionary, not auto-computed</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 text-[13px] text-ink-500">Fill in the limitation-critical dates to see the proposed deadline chain.</div>
              )}
            </Section>
          </div>
        }
      />
    </div>
  )
}
