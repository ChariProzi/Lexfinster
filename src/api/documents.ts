import { db, nextId } from '../data/db'
import { sleep } from './client'
import { assertCaseAccess, assertRole, visibleMatterIds, PermissionError, isRole } from '../lib/rbac'
import { appendAudit } from '../lib/audit'
import type { Document, Annotation, DraftDocument, NamingRule } from '../data/types'

function assertNotBilling(userId: string) {
  if (isRole(userId, 'BillingStaff')) throw new PermissionError('Billing Staff do not have access to documents', true, null)
}

export async function listDocuments(userId: string, q?: string): Promise<{ results: Document[]; totalCount: number; excludedNotExtracted: number }> {
  await sleep()
  assertNotBilling(userId)
  const visible = visibleMatterIds(userId)
  const all = db().documents.filter((d) => !d.matterId || visible.has(d.matterId))
  const notExtracted = all.filter((d) => d.ocrStatus !== 'Extracted').length
  let results = all
  if (q && q.trim()) {
    const query = q.toLowerCase()
    results = all.filter((d) => d.ocrStatus === 'Extracted' && d.name.toLowerCase().includes(query))
  }
  return { results, totalCount: all.length, excludedNotExtracted: notExtracted }
}

export async function listMatterDocuments(userId: string, matterId: string): Promise<Document[]> {
  await sleep()
  assertNotBilling(userId)
  assertCaseAccess(userId, matterId)
  return db().documents.filter((d) => d.matterId === matterId)
}

export async function getDocument(userId: string, documentId: string): Promise<{ document: Document; annotations: Annotation[] }> {
  await sleep()
  assertNotBilling(userId)
  const document = db().documents.find((d) => d.id === documentId)
  if (!document) throw new Error('Document not found')
  if (document.matterId) assertCaseAccess(userId, document.matterId)
  const annotations = db().annotations.filter((a) => a.documentId === documentId)
  return { document, annotations }
}

export async function retryOcr(userId: string, documentId: string): Promise<Document> {
  await sleep(700)
  let updated: Document | undefined
  db().update('documents', (prev) => prev.map((d) => (d.id === documentId ? (updated = { ...d, ocrStatus: Math.random() > 0.4 ? 'Extracted' : 'Failed' }) : d)))
  appendAudit({ action: 'document.retry_ocr', objectType: 'Document', objectId: documentId, actorUserId: userId })
  return updated!
}

export async function addAnnotation(userId: string, documentId: string, input: Pick<Annotation, 'page' | 'type' | 'content' | 'visibility'>): Promise<Annotation> {
  await sleep(150)
  assertNotBilling(userId)
  const ann: Annotation = { id: nextId('an'), documentId, authorUserId: userId, createdAt: new Date().toISOString(), ...input }
  db().update('annotations', (prev) => [...prev, ann])
  db().update('documents', (prev) => prev.map((d) => (d.id === documentId ? { ...d, annotationCount: (d.annotationCount ?? 0) + 1 } : d)))
  return ann
}

export async function updateAnnotationVisibility(userId: string, annotationId: string, visibility: Annotation['visibility']): Promise<Annotation> {
  await sleep(120)
  let updated: Annotation | undefined
  db().update('annotations', (prev) => prev.map((a) => (a.id === annotationId ? (updated = { ...a, visibility }) : a)))
  void userId
  return updated!
}

export interface UploadResult { document: Document; extracted: { field: string; value: string }[] }
export async function uploadDocument(userId: string, matterId: string | undefined, fileName: string, sizeBytes: number): Promise<UploadResult> {
  await sleep(800)
  if (matterId) assertCaseAccess(userId, matterId, 'CaseContributor')
  const nr = db().namingRule
  const renamed = applyNamingRule(nr, fileName, matterId)
  const document: Document = {
    id: nextId('doc'), matterId, name: renamed, type: 'Pleading', source: 'Uploaded', documentDate: new Date().toISOString().slice(0, 10),
    uploadedByUserId: userId, sizeBytes, ocrStatus: Math.random() > 0.15 ? 'Extracted' : 'Failed', privileged: true, version: 1, offlineState: 'OnDevice',
  }
  db().update('documents', (prev) => [document, ...prev])
  appendAudit({ action: 'document.upload', objectType: 'Document', objectId: document.id, matterId, actorUserId: userId })
  const extracted = document.ocrStatus === 'Extracted'
    ? [
        { field: 'Document date', value: document.documentDate },
        { field: 'Document type (guessed)', value: 'Order' },
        { field: 'Case number (matched)', value: matterId ? db().matters.find((m) => m.id === matterId)?.caseNumber ?? '—' : '—' },
      ]
    : []
  return { document, extracted }
}

function applyNamingRule(rule: NamingRule, original: string, matterId?: string): string {
  const m = matterId ? db().matters.find((mm) => mm.id === matterId) : undefined
  const date = new Date().toISOString().slice(0, 10)
  const caseNo = m ? m.caseNumber.replace(/[^a-zA-Z0-9]+/g, '-') : 'unfiled'
  const forum = m ? (db().forums.find((f) => f.id === m.forumId)?.name ?? '').split(' ')[0] : ''
  const ext = original.includes('.') ? original.slice(original.lastIndexOf('.')) : '.pdf'
  return [date, caseNo, forum, 'Document'].filter(Boolean).join(rule.separator) + ext
}

export async function getNamingRule(): Promise<NamingRule> {
  await sleep()
  return db().namingRule
}

export async function saveNamingRule(userId: string, rule: NamingRule): Promise<NamingRule> {
  await sleep()
  assertRole(userId, 'Admin')
  db().set('namingRule', rule)
  appendAudit({ action: 'naming_rule.update', objectType: 'NamingRule', actorUserId: userId })
  return rule
}

// ---------------------------------------------------------------------------
// Drafts (S-38 / S-38b)
// ---------------------------------------------------------------------------
export async function listMyDrafts(userId: string): Promise<DraftDocument[]> {
  await sleep()
  return db().drafts.filter((d) => d.authorUserId === userId || d.sharedWithUserIds.includes(userId))
}

export async function getDraft(userId: string, draftId: string): Promise<DraftDocument> {
  await sleep()
  const draft = db().drafts.find((d) => d.id === draftId)
  if (!draft) throw new Error('Draft not found')
  if (draft.authorUserId !== userId && !draft.sharedWithUserIds.includes(userId) && draft.status !== 'Published') {
    throw new PermissionError('This draft is private to its author', true, null)
  }
  return draft
}

export async function createDraft(userId: string, input: { title: string; matterId?: string; linkedTaskId?: string }): Promise<DraftDocument> {
  await sleep()
  const draft: DraftDocument = { id: nextId('dr'), authorUserId: userId, title: input.title, matterId: input.matterId, linkedTaskId: input.linkedTaskId, content: '', status: 'Private', sharedWithUserIds: [], lastSavedAt: new Date().toISOString() }
  db().update('drafts', (prev) => [draft, ...prev])
  return draft
}

export async function saveDraft(userId: string, draftId: string, content: string): Promise<DraftDocument> {
  await sleep(200)
  let updated: DraftDocument | undefined
  db().update('drafts', (prev) => prev.map((d) => (d.id === draftId ? (updated = { ...d, content, lastSavedAt: new Date().toISOString() }) : d)))
  void userId
  return updated!
}

export async function shareDraft(userId: string, draftId: string, withUserIds: string[]): Promise<DraftDocument> {
  await sleep()
  let updated: DraftDocument | undefined
  db().update('drafts', (prev) => prev.map((d) => (d.id === draftId ? (updated = { ...d, status: 'SharedNotPublished', sharedWithUserIds: withUserIds }) : d)))
  appendAudit({ action: 'draft.share', objectType: 'DraftDocument', objectId: draftId, actorUserId: userId, afterState: { withUserIds } })
  return updated!
}

export async function publishDraft(userId: string, draftId: string): Promise<{ draft: DraftDocument; document: Document }> {
  await sleep(300)
  let updated: DraftDocument | undefined
  db().update('drafts', (prev) => prev.map((d) => (d.id === draftId ? (updated = { ...d, status: 'Published', publishedAt: new Date().toISOString(), publishedVersion: (d.publishedVersion ?? 0) + 1 }) : d)))
  const draft = updated!
  const document: Document = { id: nextId('doc'), matterId: draft.matterId, name: `${draft.title}.pdf`, type: 'Draft', source: 'Drafted', documentDate: new Date().toISOString().slice(0, 10), uploadedByUserId: userId, sizeBytes: draft.content.length * 8, ocrStatus: 'Extracted', privileged: true, version: draft.publishedVersion ?? 1 }
  db().update('documents', (prev) => [document, ...prev])
  appendAudit({ action: 'draft.publish', objectType: 'DraftDocument', objectId: draftId, matterId: draft.matterId, actorUserId: userId })
  return { draft, document }
}
