// Core domain types — mirrors DATA_MODEL.md. Adapted to a client-side mock store.

export type Role = 'Admin' | 'Partner' | 'Associate' | 'Paralegal' | 'BillingStaff' | 'Intern'
export type CaseAccessLevel = 'CaseAdmin' | 'CaseContributor' | 'CaseViewer' | 'NoAccess'

export interface Firm {
  id: string
  name: string
  registeredAddress: string
  subscriptionPlan: 'Trial' | 'Growth' | 'Scale'
  seatsPurchased: number
  courtDataVendor: string
  breachNotificationContactUserId: string
}

export interface User {
  id: string
  firmId: string
  name: string
  initials: string
  email: string
  role: Role
  status: 'Active' | 'Suspended' | 'Invited'
  lastActiveAt: string
}

export type DevicePlatform = 'iOS' | 'Android' | 'DesktopClient' | 'Web'
export interface Device {
  id: string
  userId: string
  label: string
  platform: DevicePlatform
  registeredAt: string
  offlineConsentAt: string | null
  encryptionKeyRef: string
}

export interface CaseAccessGrant {
  id: string
  matterId: string
  userId: string
  level: Exclude<CaseAccessLevel, 'NoAccess'>
  grantedByUserId: string
  grantedAt: string
}

export type ClientType = 'Individual' | 'Company' | 'Government'
export type ConflictStatus = 'Clear' | 'Flagged' | 'UnderReview'
export interface Client {
  id: string
  firmId: string
  name: string
  type: ClientType
  tags: string[]
  conflictStatus: ConflictStatus
  contact?: string
  feeArrangement?: string
}

export type PartyRole = 'Appellant' | 'Respondent' | 'Applicant' | 'Accused' | 'Other' | 'Plaintiff' | 'Defendant'
export interface Party {
  id: string
  matterId: string
  clientOrEntityRef?: string
  name: string
  role: PartyRole
  weActFor: boolean
  isOpposingInOtherMatter: boolean
}

export type ConflictResult = 'Clear' | 'PotentialConflict' | 'Blocked'
export interface ConflictCheck {
  id: string
  matterId?: string
  partyName: string
  result: ConflictResult
  checkedAt: string
  detail?: string
  matterRef?: string
  closedYear?: number
  decision?: { outcome: 'NotAConflict' | 'Decline' | 'SeekWaiver'; reason: string; byUserId: string; at: string }
}

export type MatterStage =
  | 'Intake'
  | 'PreInstitution'
  | 'Pleadings'
  | 'Evidence'
  | 'Arguments'
  | 'Reserved'
  | 'Closed'
export type ImportanceTier = 'Crucial' | 'Medium' | 'Low'
export type IntakeType = 'FreshCase' | 'AppealRevision' | 'ReplyRequired' | 'ExistingMidStream'

export interface Matter {
  id: string
  firmId: string
  caseNumber: string
  title: string
  forumId: string
  bench?: string
  stage: MatterStage
  importanceTier: ImportanceTier
  practiceArea: string
  governingStatutes: string[]
  isCommercialDispute: boolean
  responsiblePartnerId: string
  assignedAssociateIds: string[]
  paralegalId?: string
  intakeType: IntakeType
  vakalatnamaStatus: 'NotRequired' | 'Pending' | 'Signed' | 'Filed'
  engagementLetterStatus: 'Sent' | 'Signed'
  createdAt: string
  lastActivityAt: string
  nextHearingDate?: string
  courtRoom?: string
}

export type ForumType = 'DistrictCourt' | 'HighCourt' | 'NCLT' | 'NCLAT' | 'DRT_DRAT' | 'ITAT'
export type SyncStatus = 'Healthy' | 'Delayed' | 'Failing' | 'ManualOnly'
export interface Forum {
  id: string
  name: string
  type: ForumType
  courtDataSyncStatus: SyncStatus
  lastSyncedAt?: string
  matterCount: number
}

export interface HolidayCalendar {
  id: string
  forumId: string
  year: number
  holidays: string[]
  vacationPeriods: { start: string; end: string }[]
  source: string
  lastUpdatedAt: string
}

export interface RulePack {
  id: string
  name: string
  statuteCoverage: string[]
  version: string
  status: 'Active' | 'UpdateAvailable' | 'Disabled'
  publishedAt: string
  applicableForums: string[]
  pendingUpdate?: { changelog: string; affectedMatterIds: string[] }
}

export interface Rule {
  id: string
  rulePackId: string
  name: string
  triggerEvent: string
  durationDays: number
  calendarOrWorkingDays: 'Calendar' | 'Working'
  extendable: boolean
  extensionDays?: number
  outerLimitDays?: number
  consequence: string
  governingProvision: string
  discretionaryDoNotAutoCompute: boolean
  notes?: string
}

export type DeadlineStatus = 'Upcoming' | 'Met' | 'Missed' | 'Overridden' | 'NeedsJudgement'
export interface Deadline {
  id: string
  matterId: string
  ruleId?: string
  name: string
  computedDate: string | null
  originalComputedDate?: string | null
  status: DeadlineStatus
  overrideReason?: string
  overriddenByUserId?: string
  countersignedByUserId?: string
  lastRecomputedAt: string
  ruleVersionAtComputation?: string
  provision?: string
  provisionDual?: string
  ruleNotEncoded?: boolean
}

export type CauseListStatus = 'Published' | 'NotYetPublished' | 'PublicationFailed' | 'Unexpected' | 'ExpectedButNotListed'
export interface CauseListEntry {
  id: string
  forumId: string
  date: string
  itemNumber?: string
  courtOrBench: string
  matterId?: string
  purposeOfListing: string
  opposingCounsel?: string
  publishedAt?: string
  status: CauseListStatus
}

export type ExtractionConfidence = 'High' | 'Medium' | 'Low'
export type OrderReviewStatus = 'NeedsReview' | 'AwaitingInfo' | 'Confirmed'
export interface Order {
  id: string
  matterId: string
  forumId: string
  documentId?: string
  orderDate: string
  detectionSource: 'CourtPortalAutomatic' | 'ManualUpload'
  detectedAt: string
  extractionConfidence: ExtractionConfidence
  reviewStatus: OrderReviewStatus
  extractedFields: {
    orderType?: string
    nextHearing?: string
    timeLimitText?: string
    costs?: string
    complianceBy?: string
    summary?: string
  }
  proposedItems?: { kind: 'task' | 'deadline'; label: string; date?: string }[]
  confirmedByUserId?: string
  confirmedAt?: string
}

export type TaskType = 'Drafting' | 'Filing' | 'Research' | 'CourtAppearance' | 'ClientCommunication' | 'Compliance' | 'Administrative'
export type TaskStatus = 'ToDo' | 'InProgress' | 'Blocked' | 'InReview' | 'Returned' | 'Done'
export interface ChecklistItemInstance {
  id: string
  taskId: string
  order: number
  label: string
  checked: boolean
  naReason?: string
  guidance?: string
  requiredAttachment?: boolean
  attachmentDocumentId?: string
}
export interface Task {
  id: string
  matterId: string
  title: string
  type: TaskType
  description: string
  assigneeId?: string
  reviewerId?: string
  dueDate: string
  linkedDeadlineId?: string
  leadTimeDays?: number
  priority: 'Low' | 'Medium' | 'High'
  sopTemplateId?: string
  status: TaskStatus
  blockedReason?: string
  visibility: 'MatterTeam' | 'AssigneeAndReviewerOnly'
  sourceType: 'RuleEngine' | 'ConfirmedOrder' | 'IntakeChecklist' | 'Manual'
  estimatedHours?: number
  provision?: string
}

export interface SopTemplate {
  id: string
  name: string
  appliesToIntakeType?: IntakeType
  appliesToForum?: string
  appliesToStatute?: string
  dueOffsetDays: number
  steps: { order: number; label: string; guidance: string; requiredAttachment: boolean; defaultAssigneeRole: Role }[]
}

export type DocType = 'Order' | 'Pleading' | 'Notice' | 'CertifiedCopy' | 'Evidence' | 'Correspondence' | 'Draft'
export type DocSource = 'CourtPortal' | 'Uploaded' | 'Drafted' | 'Scanned'
export interface Document {
  id: string
  matterId?: string
  name: string
  type: DocType
  source: DocSource
  documentDate: string
  uploadedByUserId?: string
  sizeBytes: number
  ocrStatus: 'Extracted' | 'Failed' | 'Pending'
  privileged: boolean
  version: number
  offlineState?: 'OnDevice' | 'Downloading' | 'CloudOnly' | 'Evicted'
  annotationCount?: number
}

export type AnnotationVisibility = 'Private' | 'MatterTeam' | 'CaseAdminsOnly'
export interface Annotation {
  id: string
  documentId: string
  authorUserId: string
  page: number
  type: 'Highlight' | 'Underline' | 'Strike' | 'Freehand' | 'StickyNote' | 'TextBox'
  content?: string
  visibility: AnnotationVisibility
  createdAt: string
  deviceId?: string
}

export type DraftStatus = 'Private' | 'SharedNotPublished' | 'Published' | 'ReturnedFromReview'
export interface DraftDocument {
  id: string
  matterId?: string
  authorUserId: string
  title: string
  content: string
  status: DraftStatus
  sharedWithUserIds: string[]
  linkedTaskId?: string
  publishedAt?: string
  publishedVersion?: number
  templateUsed?: string
  lastSavedAt: string
}

export interface NamingRule {
  id: string
  firmId: string
  tokenPattern: string
  separator: string
  caseStyle: 'TitleCase' | 'lower' | 'UPPER'
  perDocTypeOverrides?: Record<string, string>
}

export type BundleDownloadState = 'OnDevice' | 'Downloading' | 'Queued' | 'CloudOnly' | 'Evicted' | 'Failed'
export interface Bundle {
  id: string
  matterId: string
  deviceId: string
  downloadState: BundleDownloadState
  downloadProgress: number
  sizeBytes: number
  downloadedAt?: string
  hearingDate: string
  autoDeleteAt: string
  annotationCount: number
}

export interface SyncConflict {
  id: string
  entityType: 'Deadline' | 'Annotation' | 'Task'
  entityId: string
  entityLabel: string
  deviceVersion: Record<string, unknown>
  serverVersion: Record<string, unknown>
  deviceUserId: string
  deviceTimestamp: string
  serverTimestamp: string
  resolution?: 'KeepMine' | 'KeepTheirs' | 'KeepBoth' | 'MergeManually'
  defaultAppliedReason?: string
}

export type NotificationCategory = 'NeedsAction' | 'DeadlinesHearings' | 'CourtUpdates' | 'AssignmentsReviews' | 'Forum' | 'System'
export interface Notification {
  id: string
  userId: string
  category: NotificationCategory
  title: string
  body?: string
  matterId?: string
  channelsSent: ('InApp' | 'Email' | 'SMS' | 'Push')[]
  sentAt: string[]
  escalatedToUserId?: string
  escalatedAt?: string
  readAt?: string
  inlineAction?: string
  actionHref?: string
}

export interface NotificationPreference {
  id: string
  userId: string
  eventType: string
  channels: ('InApp' | 'Email' | 'SMS' | 'Push')[]
  quietHoursStart: string
  quietHoursEnd: string
  overrideQuietHoursForCritical: boolean
  perMatterMutes: string[]
}

export interface EscalationRule {
  id: string
  firmId: string
  importanceTier: ImportanceTier
  conditionDescription: string
  steps: { notifyRole: string; afterHours: number }[]
  channels: ('SMS' | 'Push' | 'Email' | 'InApp')[]
}

export type ForumAudience = 'WholeFirm' | 'PartnersOnly' | 'OpenToInterns'
export type ForumClearanceState = 'Open' | 'Answered' | 'PartnerCleared' | 'Closed'
export interface ForumQuestion {
  id: string
  firmId: string
  askerUserId: string
  title: string
  body: string
  matterId?: string
  autoRedactClientNames: boolean
  practiceArea: string
  neededByDate?: string
  audience: ForumAudience
  clearanceState: ForumClearanceState
  createdAt: string
}

export type CitationWeight = 'Binding' | 'Persuasive' | 'Distinguishable'
export interface Citation {
  case: string
  citation: string
  court: string
  year: number
  ratio: string
  weight: CitationWeight
}
export interface ForumAnswer {
  id: string
  questionId: string
  authorUserId: string
  body: string
  citations: Citation[]
  partnerClearedByUserId?: string
  partnerClearedAt?: string
  clearedVerbatimFromAnswerId?: string
  createdAt: string
}

export type ResearchTaskStatus = 'NotStarted' | 'InProgress' | 'Submitted' | 'Returned' | 'Accepted'
export interface ResearchTask {
  id: string
  requestedByUserId: string
  assignedToUserId: string
  matterId?: string
  question: string
  scope: string
  neededByDate: string
  status: ResearchTaskStatus
}

export type ResearchConfidence = 'Settled' | 'Arguable' | 'Unsettled'
export interface ResearchSubmission {
  id: string
  researchTaskId: string
  issue: string
  shortAnswer: string
  applicableProvisions: string[]
  authorities: Citation[]
  analysis: string
  contraryAuthority: string
  recommendation: string
  confidence: ResearchConfidence
  status: 'Draft' | 'Submitted' | 'ReturnedWithComments' | 'Accepted'
  reviewComments?: string
}

export interface ResearchLibraryEntry {
  id: string
  title: string
  issue: string
  shortAnswer: string
  authorities: Citation[]
  clearedByUserId: string
  clearedAt: string
  source: 'Forum' | 'ResearchTask' | 'MatterNote'
  linkedMatterIds: string[]
  stillGoodLawReviewDate?: string
}

/** A discrepancy an Intern (or anyone view-limited) raises against a calendar event instead of editing it directly. */
export type CalendarFlagStatus = 'Open' | 'Resolved'
export interface CalendarFlag {
  id: string
  matterId: string
  eventKind: 'hearing' | 'deadline'
  eventLabel: string
  eventDate: string
  note: string
  raisedByUserId: string
  raisedAt: string
  status: CalendarFlagStatus
  resolvedByUserId?: string
  resolvedAt?: string
  resolutionNote?: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  actorUserId?: string
  actorName?: string
  action: string
  objectType: string
  objectId?: string
  matterId?: string
  deviceId?: string
  ipAddress: string
  beforeState?: Record<string, unknown>
  afterState?: Record<string, unknown>
}

export type DprType = 'Access' | 'Correction' | 'Erasure'
export interface DataPrincipalRequest {
  id: string
  requesterName: string
  type: DprType
  receivedAt: string
  respondByDate: string
  status: 'Pending' | 'InProgress' | 'Completed'
  handledByUserId?: string
  detail?: string
}
