import { db, nextId } from '../data/db'
import { sleep } from './client'
import { assertRole, isRole, getUser, visibleMatterIds } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import type { ForumQuestion, ForumAnswer, ResearchTask, ResearchSubmission, ResearchLibraryEntry, Citation } from '../data/types'

function redact(text: string, matterId: string | undefined, userId: string): string {
  if (!matterId) return text
  const visible = visibleMatterIds(userId)
  if (visible.has(matterId)) return text
  const m = db().matters.find((mm) => mm.id === matterId)
  if (!m) return text
  // naive redaction: replace known party names with generic placeholders
  const parties = db().parties.filter((p) => p.matterId === matterId)
  let out = text
  for (const p of parties) out = out.split(p.name).join(p.weActFor ? '[Client]' : '[Opposing Party]')
  return out
}

export async function listForumQuestions(userId: string): Promise<ForumQuestion[]> {
  await sleep()
  const state = db()
  const user = getUser(userId)
  return state.forumQuestions
    .filter((q) => q.audience !== 'PartnersOnly' || isRole(userId, 'Partner', 'Admin'))
    .filter((q) => q.audience !== 'OpenToInterns' || user?.role !== 'Intern' || true)
    .map((q) => ({ ...q, title: redact(q.title, q.matterId, userId), body: redact(q.body, q.matterId, userId) }))
}

export async function getQuestion(userId: string, questionId: string): Promise<{ question: ForumQuestion; answers: ForumAnswer[] }> {
  await sleep()
  const state = db()
  const question = state.forumQuestions.find((q) => q.id === questionId)
  if (!question) throw new Error('Question not found')
  const answers = state.forumAnswers.filter((a) => a.questionId === questionId)
  return {
    question: { ...question, title: redact(question.title, question.matterId, userId), body: redact(question.body, question.matterId, userId) },
    answers: answers.map((a) => ({ ...a, body: redact(a.body, question.matterId, userId) })),
  }
}

export interface AskQuestionInput {
  title: string
  body: string
  matterId?: string
  autoRedactClientNames: boolean
  practiceArea: string
  neededByDate?: string
  audience: ForumQuestion['audience']
}
export async function askQuestion(userId: string, input: AskQuestionInput): Promise<ForumQuestion> {
  await sleep()
  const q: ForumQuestion = { id: nextId('fq'), firmId: db().firm.id, askerUserId: userId, clearanceState: 'Open', createdAt: new Date().toISOString(), ...input }
  db().update('forumQuestions', (prev) => [q, ...prev])
  return q
}

export async function postAnswer(userId: string, questionId: string, body: string, citations: Citation[] = []): Promise<ForumAnswer> {
  await sleep()
  const answer: ForumAnswer = { id: nextId('fa'), questionId, authorUserId: userId, body, citations, createdAt: new Date().toISOString() }
  db().update('forumAnswers', (prev) => [...prev, answer])
  db().update('forumQuestions', (prev) => prev.map((q) => (q.id === questionId ? { ...q, clearanceState: q.clearanceState === 'Open' ? 'Answered' : q.clearanceState } : q)))
  return answer
}

export async function clearAnswer(userId: string, answerId: string): Promise<ForumAnswer> {
  await sleep()
  assertRole(userId, 'Partner', 'Admin')
  let updated: ForumAnswer | undefined
  db().update('forumAnswers', (prev) => prev.map((a) => (a.id === answerId ? (updated = { ...a, partnerClearedByUserId: userId, partnerClearedAt: new Date().toISOString() }) : a)))
  const answer = updated!
  db().update('forumQuestions', (prev) => prev.map((q) => (q.id === answer.questionId ? { ...q, clearanceState: 'PartnerCleared' } : q)))
  appendAudit({ action: 'forum.clear_answer', objectType: 'ForumAnswer', objectId: answerId, actorUserId: userId })
  return answer
}

export async function listClearanceQueue(userId: string): Promise<{ questions: ForumQuestion[]; submissions: ResearchSubmission[] }> {
  await sleep()
  assertRole(userId, 'Partner', 'Admin')
  const state = db()
  return {
    questions: state.forumQuestions.filter((q) => q.clearanceState === 'Answered'),
    submissions: state.researchSubmissions.filter((s) => s.status === 'Submitted'),
  }
}

export async function convertToResearchTask(userId: string, questionId: string, assignedToUserId: string, neededByDate: string): Promise<ResearchTask> {
  await sleep()
  const q = db().forumQuestions.find((qq) => qq.id === questionId)
  if (!q) throw new Error('Question not found')
  const task: ResearchTask = { id: nextId('rt'), requestedByUserId: userId, assignedToUserId, matterId: q.matterId, question: q.title, scope: q.body, neededByDate, status: 'NotStarted' }
  db().update('researchTasks', (prev) => [task, ...prev])
  return task
}

export async function listMyResearch(userId: string): Promise<ResearchTask[]> {
  await sleep()
  return db().researchTasks.filter((t) => t.assignedToUserId === userId)
}

export async function getResearchTask(userId: string, taskId: string): Promise<{ task: ResearchTask; submission?: ResearchSubmission }> {
  await sleep()
  const state = db()
  const task = state.researchTasks.find((t) => t.id === taskId)
  if (!task) throw new Error('Research task not found')
  const submission = state.researchSubmissions.find((s) => s.researchTaskId === taskId)
  void userId
  return { task, submission }
}

export interface SubmissionInput {
  issue: string
  shortAnswer: string
  applicableProvisions: string[]
  authorities: Citation[]
  analysis: string
  contraryAuthority: string
  recommendation: string
  confidence: ResearchSubmission['confidence']
}
export async function submitResearch(userId: string, taskId: string, input: SubmissionInput): Promise<ResearchSubmission> {
  await sleep()
  if (!input.contraryAuthority.trim()) throw new Error('Contrary authority is required before submission.')
  const submission: ResearchSubmission = { id: nextId('rs'), researchTaskId: taskId, status: 'Submitted', ...input }
  db().update('researchSubmissions', (prev) => {
    const exists = prev.some((s) => s.researchTaskId === taskId)
    return exists ? prev.map((s) => (s.researchTaskId === taskId ? submission : s)) : [...prev, submission]
  })
  db().update('researchTasks', (prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'Submitted' } : t)))
  void userId
  return submission
}

export async function acceptSubmission(userId: string, submissionId: string, addToLibrary: boolean): Promise<ResearchSubmission> {
  await sleep()
  assertRole(userId, 'Partner', 'Admin')
  let updated: ResearchSubmission | undefined
  db().update('researchSubmissions', (prev) => prev.map((s) => (s.id === submissionId ? (updated = { ...s, status: 'Accepted' }) : s)))
  const submission = updated!
  db().update('researchTasks', (prev) => prev.map((t) => (t.id === submission.researchTaskId ? { ...t, status: 'Accepted' } : t)))
  if (addToLibrary) {
    const task = db().researchTasks.find((t) => t.id === submission.researchTaskId)
    const entry: ResearchLibraryEntry = {
      id: nextId('lib'), title: submission.issue, issue: submission.issue, shortAnswer: submission.shortAnswer, authorities: submission.authorities,
      clearedByUserId: userId, clearedAt: new Date().toISOString(), source: 'ResearchTask', linkedMatterIds: task?.matterId ? [task.matterId] : [],
    }
    db().update('researchLibrary', (prev) => [entry, ...prev])
  }
  appendAudit({ action: 'research.accept', objectType: 'ResearchSubmission', objectId: submissionId, actorUserId: userId })
  return submission
}

export async function returnSubmission(userId: string, submissionId: string, comments: string): Promise<ResearchSubmission> {
  await sleep()
  assertRole(userId, 'Partner', 'Admin')
  let updated: ResearchSubmission | undefined
  db().update('researchSubmissions', (prev) => prev.map((s) => (s.id === submissionId ? (updated = { ...s, status: 'ReturnedWithComments', reviewComments: comments }) : s)))
  return updated!
}

export async function listResearchLibrary(userId: string): Promise<ResearchLibraryEntry[]> {
  await sleep()
  const visible = visibleMatterIds(userId)
  return db().researchLibrary.filter((e) => e.linkedMatterIds.length === 0 || e.linkedMatterIds.some((m) => visible.has(m)))
}
