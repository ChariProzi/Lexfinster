import { rel, relDateOnly } from '../lib/dates'
import type * as T from './types'

// ---------------------------------------------------------------------------
// Fixed IDs so every module can cross-reference without lookups by name.
// ---------------------------------------------------------------------------
export const FIRM_ID = 'firm-kapoor'

export const USER = {
  meera: 'u-meera',
  vikram: 'u-vikram',
  rohan: 'u-rohan',
  priya: 'u-priya',
  sunita: 'u-sunita',
  kiran: 'u-kiran',
  aditi: 'u-aditi',
}

export const FORUM = {
  delhiHC: 'forum-delhi-hc',
  nclt: 'forum-nclt-nd',
  nclat: 'forum-nclat',
  tisHazari: 'forum-tis-hazari',
  itat: 'forum-itat',
  drt: 'forum-drt-2',
}

export const MATTER = {
  sharma: 'm-sharma-sbi',
  shakti: 'm-shakti-cirp',
  ganpati: 'm-ganpati-kohli',
  nexa: 'm-nexa-bhatia',
  ashoka: 'm-ashoka-state',
  kavita: 'm-kavita-ito',
  vertex: 'm-vertex-unionbank',
  meridian: 'm-meridian-om',
}

export const RULEPACK = {
  cpc: 'rp-cpc-commercial',
  limitation: 'rp-limitation',
  ni: 'rp-ni-act',
  ibc: 'rp-ibc',
  it: 'rp-it-act',
}

function buildUsers(): T.User[] {
  return [
    { id: USER.meera, firmId: FIRM_ID, name: 'Meera Kapoor', initials: 'MK', email: 'meera.kapoor@kapoorassociates.in', role: 'Admin', status: 'Active', lastActiveAt: rel(0, -1) },
    { id: USER.vikram, firmId: FIRM_ID, name: 'Vikram Desai', initials: 'VD', email: 'vikram.desai@kapoorassociates.in', role: 'Partner', status: 'Active', lastActiveAt: rel(0, -3) },
    { id: USER.rohan, firmId: FIRM_ID, name: 'Rohan Iyer', initials: 'RI', email: 'rohan.iyer@kapoorassociates.in', role: 'Associate', status: 'Active', lastActiveAt: rel(0, -2) },
    { id: USER.priya, firmId: FIRM_ID, name: 'Priya Nair', initials: 'PN', email: 'priya.nair@kapoorassociates.in', role: 'Associate', status: 'Active', lastActiveAt: rel(0, -4) },
    { id: USER.sunita, firmId: FIRM_ID, name: 'Sunita Kamble', initials: 'SK', email: 'sunita.kamble@kapoorassociates.in', role: 'Paralegal', status: 'Active', lastActiveAt: rel(0, -1) },
    { id: USER.kiran, firmId: FIRM_ID, name: 'Kiran Mehta', initials: 'KM', email: 'kiran.mehta@kapoorassociates.in', role: 'BillingStaff', status: 'Active', lastActiveAt: rel(-1) },
    { id: USER.aditi, firmId: FIRM_ID, name: 'Aditi Shah', initials: 'AS', email: 'aditi.shah@kapoorassociates.in', role: 'Intern', status: 'Active', lastActiveAt: rel(0, -5) },
  ]
}

function buildFirm(): T.Firm {
  return {
    id: FIRM_ID,
    name: 'Kapoor & Associates',
    registeredAddress: '4th Floor, Aggarwal Chambers, Bhagwan Das Road, New Delhi 110001',
    subscriptionPlan: 'Growth',
    seatsPurchased: 10,
    courtDataVendor: 'Licensed court-data API (vendor TBD — see Court Data Health)',
    breachNotificationContactUserId: USER.meera,
  }
}

function buildForums(): T.Forum[] {
  return [
    { id: FORUM.delhiHC, name: 'Delhi High Court (Commercial Division)', type: 'HighCourt', courtDataSyncStatus: 'Healthy', lastSyncedAt: rel(0, -2), matterCount: 2 },
    { id: FORUM.nclt, name: 'NCLT New Delhi, Bench III', type: 'NCLT', courtDataSyncStatus: 'Healthy', lastSyncedAt: rel(0, -1), matterCount: 1 },
    { id: FORUM.nclat, name: 'NCLAT New Delhi', type: 'NCLAT', courtDataSyncStatus: 'Failing', lastSyncedAt: rel(-6), matterCount: 0 },
    { id: FORUM.tisHazari, name: 'Tis Hazari District Court, Delhi', type: 'DistrictCourt', courtDataSyncStatus: 'Healthy', lastSyncedAt: rel(0, -0.5), matterCount: 3 },
    { id: FORUM.itat, name: 'ITAT Delhi Bench', type: 'ITAT', courtDataSyncStatus: 'Delayed', lastSyncedAt: rel(-2), matterCount: 1 },
    { id: FORUM.drt, name: 'DRT-II Delhi', type: 'DRT_DRAT', courtDataSyncStatus: 'ManualOnly', lastSyncedAt: undefined, matterCount: 1 },
  ]
}

function buildMatters(): T.Matter[] {
  return [
    {
      id: MATTER.sharma, firmId: FIRM_ID, caseNumber: 'CS(COMM) 412/2025', title: 'Sharma Industries Pvt Ltd v. State Bank of India',
      forumId: FORUM.delhiHC, bench: 'Court 8', stage: 'Pleadings', importanceTier: 'Crucial', practiceArea: 'Commercial Litigation',
      governingStatutes: ['CPC', 'Commercial Courts Act'], isCommercialDispute: true, responsiblePartnerId: USER.meera,
      assignedAssociateIds: [USER.rohan], paralegalId: USER.sunita, intakeType: 'FreshCase', vakalatnamaStatus: 'Filed',
      engagementLetterStatus: 'Signed', createdAt: rel(-210), lastActivityAt: rel(-1), nextHearingDate: relDateOnly(2), courtRoom: 'Court 8',
    },
    {
      id: MATTER.shakti, firmId: FIRM_ID, caseNumber: 'CP (IB) 340/ND/2025', title: 'Shakti Fabrics Ltd — CIRP (Sec. 7 application)',
      forumId: FORUM.nclt, bench: 'Bench III', stage: 'Reserved', importanceTier: 'Low', practiceArea: 'Insolvency (IBC)',
      governingStatutes: ['IBC'], isCommercialDispute: false, responsiblePartnerId: USER.vikram,
      assignedAssociateIds: [USER.priya], intakeType: 'FreshCase', vakalatnamaStatus: 'Filed',
      engagementLetterStatus: 'Signed', createdAt: rel(-160), lastActivityAt: rel(-9), nextHearingDate: relDateOnly(21),
    },
    {
      id: MATTER.ganpati, firmId: FIRM_ID, caseNumber: 'CC 1184/2026', title: 'M/s Ganpati Traders v. Rakesh Kohli',
      forumId: FORUM.tisHazari, bench: 'JMFC Court 22', stage: 'Evidence', importanceTier: 'Medium', practiceArea: 'Commercial Litigation',
      governingStatutes: ['CPC'], isCommercialDispute: false, responsiblePartnerId: USER.meera,
      assignedAssociateIds: [], paralegalId: USER.sunita, intakeType: 'FreshCase', vakalatnamaStatus: 'Filed',
      engagementLetterStatus: 'Signed', createdAt: rel(-95), lastActivityAt: rel(-3), nextHearingDate: relDateOnly(11),
    },
    {
      id: MATTER.nexa, firmId: FIRM_ID, caseNumber: 'FAO 88/2026', title: 'Nexa Infra Ltd v. Bhatia Steels Pvt Ltd',
      forumId: FORUM.delhiHC, bench: 'Court 3', stage: 'Pleadings', importanceTier: 'Medium', practiceArea: 'Commercial Litigation (Appeal)',
      governingStatutes: ['CPC', 'Limitation Act'], isCommercialDispute: true, responsiblePartnerId: USER.vikram,
      assignedAssociateIds: [USER.rohan], intakeType: 'AppealRevision', vakalatnamaStatus: 'Signed',
      engagementLetterStatus: 'Signed', createdAt: rel(-40), lastActivityAt: rel(-2), nextHearingDate: relDateOnly(30),
    },
    {
      id: MATTER.ashoka, firmId: FIRM_ID, caseNumber: 'CC 902/2024', title: 'Ashoka Weavers Pvt Ltd v. State (NCT of Delhi)',
      forumId: FORUM.tisHazari, bench: 'MM Court 4', stage: 'Pleadings', importanceTier: 'Medium', practiceArea: 'Cheque Bounce (NI Act)',
      governingStatutes: ['NI Act'], isCommercialDispute: false, responsiblePartnerId: USER.meera,
      assignedAssociateIds: [USER.priya], intakeType: 'FreshCase', vakalatnamaStatus: 'Filed',
      engagementLetterStatus: 'Signed', createdAt: rel(-380), lastActivityAt: rel(-30), nextHearingDate: relDateOnly(46),
    },
    {
      id: MATTER.kavita, firmId: FIRM_ID, caseNumber: 'ITA 210/2026', title: 'Kavita Rane v. Income Tax Officer, Ward 42(3)',
      forumId: FORUM.itat, bench: 'Delhi Bench "C"', stage: 'PreInstitution', importanceTier: 'Low', practiceArea: 'Direct Tax',
      governingStatutes: ['Income Tax Act'], isCommercialDispute: false, responsiblePartnerId: USER.vikram,
      assignedAssociateIds: [USER.rohan], intakeType: 'AppealRevision', vakalatnamaStatus: 'Signed',
      engagementLetterStatus: 'Signed', createdAt: rel(-14), lastActivityAt: rel(-1), nextHearingDate: relDateOnly(60),
    },
    {
      id: MATTER.vertex, firmId: FIRM_ID, caseNumber: 'OA 41/2025', title: 'Vertex Logistics Ltd v. Union Bank of India',
      forumId: FORUM.drt, bench: 'Presiding Officer', stage: 'Evidence', importanceTier: 'Medium', practiceArea: 'Debt Recovery',
      governingStatutes: ['RDDBFI Act'], isCommercialDispute: false, responsiblePartnerId: USER.vikram,
      assignedAssociateIds: [USER.priya], paralegalId: USER.sunita, intakeType: 'ExistingMidStream', vakalatnamaStatus: 'Filed',
      engagementLetterStatus: 'Signed', createdAt: rel(-300), lastActivityAt: rel(-28), nextHearingDate: relDateOnly(-27),
    },
    {
      id: MATTER.meridian, firmId: FIRM_ID, caseNumber: 'CS 88/2024', title: 'Meridian Textiles v. Om Traders',
      forumId: FORUM.tisHazari, bench: 'Court 12', stage: 'Closed', importanceTier: 'Low', practiceArea: 'Commercial Litigation',
      governingStatutes: ['CPC'], isCommercialDispute: false, responsiblePartnerId: USER.meera,
      assignedAssociateIds: [], intakeType: 'FreshCase', vakalatnamaStatus: 'Filed',
      engagementLetterStatus: 'Signed', createdAt: rel(-500), lastActivityAt: rel(-22),
    },
  ]
}

function buildClients(): T.Client[] {
  return [
    { id: 'c-sharma', firmId: FIRM_ID, name: 'Sharma Industries Pvt Ltd', type: 'Company', tags: ['manufacturing', 'we act for'], conflictStatus: 'Clear', contact: 'Anil Sharma, Director · +91 98100 00001', feeArrangement: 'Retainer + per-appearance' },
    { id: 'c-sbi', firmId: FIRM_ID, name: 'State Bank of India', type: 'Company', tags: ['bank', 'opposing'], conflictStatus: 'Clear', contact: 'Legal Cell, Zonal Office' },
    { id: 'c-shakti', firmId: FIRM_ID, name: 'Shakti Fabrics Ltd', type: 'Company', tags: ['textiles', 'CIRP'], conflictStatus: 'Clear', contact: 'RP office' },
    { id: 'c-ganpati', firmId: FIRM_ID, name: 'M/s Ganpati Traders', type: 'Company', tags: ['trading', 'we act for'], conflictStatus: 'Clear', contact: 'Suresh Agarwal, Partner · +91 98100 00002' },
    { id: 'c-kohli', firmId: FIRM_ID, name: 'Rakesh Kohli', type: 'Individual', tags: ['possible conflict'], conflictStatus: 'Flagged', contact: 'via counsel' },
    { id: 'c-nexa', firmId: FIRM_ID, name: 'Nexa Infra Ltd', type: 'Company', tags: ['infrastructure', 'we act for'], conflictStatus: 'Clear', feeArrangement: 'Fixed fee per stage · gated, Billing Staff only' },
    { id: 'c-bhatia', firmId: FIRM_ID, name: 'Bhatia Steels Pvt Ltd', type: 'Company', tags: ['steel', 'opposing'], conflictStatus: 'Clear' },
    { id: 'c-ashoka', firmId: FIRM_ID, name: 'Ashoka Weavers Pvt Ltd', type: 'Company', tags: ['weaving', 'we act for'], conflictStatus: 'Clear', feeArrangement: 'Fixed fee · gated, Billing Staff only' },
    { id: 'c-kavita', firmId: FIRM_ID, name: 'Kavita Rane', type: 'Individual', tags: ['we act for'], conflictStatus: 'Clear' },
    { id: 'c-vertex', firmId: FIRM_ID, name: 'Vertex Logistics Ltd', type: 'Company', tags: ['logistics', 'we act for'], conflictStatus: 'Clear' },
    { id: 'c-unionbank', firmId: FIRM_ID, name: 'Union Bank of India', type: 'Company', tags: ['bank', 'opposing'], conflictStatus: 'Clear' },
    { id: 'c-meridian', firmId: FIRM_ID, name: 'Meridian Textiles', type: 'Company', tags: ['textiles', 'we act for', 'closed'], conflictStatus: 'Clear' },
  ]
}

function buildParties(): T.Party[] {
  return [
    { id: 'p1', matterId: MATTER.sharma, clientOrEntityRef: 'c-sharma', name: 'Sharma Industries Pvt Ltd', role: 'Plaintiff', weActFor: true, isOpposingInOtherMatter: false },
    { id: 'p2', matterId: MATTER.sharma, clientOrEntityRef: 'c-sbi', name: 'State Bank of India', role: 'Defendant', weActFor: false, isOpposingInOtherMatter: false },
    { id: 'p3', matterId: MATTER.ganpati, clientOrEntityRef: 'c-ganpati', name: 'M/s Ganpati Traders', role: 'Applicant', weActFor: true, isOpposingInOtherMatter: false },
    { id: 'p4', matterId: MATTER.ganpati, clientOrEntityRef: 'c-kohli', name: 'Rakesh Kohli', role: 'Respondent', weActFor: false, isOpposingInOtherMatter: true },
    { id: 'p5', matterId: MATTER.nexa, clientOrEntityRef: 'c-nexa', name: 'Nexa Infra Ltd', role: 'Appellant', weActFor: true, isOpposingInOtherMatter: false },
    { id: 'p6', matterId: MATTER.nexa, clientOrEntityRef: 'c-bhatia', name: 'Bhatia Steels Pvt Ltd', role: 'Respondent', weActFor: false, isOpposingInOtherMatter: false },
    { id: 'p7', matterId: MATTER.ashoka, clientOrEntityRef: 'c-ashoka', name: 'Ashoka Weavers Pvt Ltd', role: 'Applicant', weActFor: true, isOpposingInOtherMatter: false },
    { id: 'p8', matterId: MATTER.ashoka, name: 'State (NCT of Delhi)', role: 'Accused', weActFor: false, isOpposingInOtherMatter: false },
  ]
}

function buildConflictChecks(): T.ConflictCheck[] {
  return [
    { id: 'cc1', matterId: MATTER.ganpati, partyName: 'Rakesh Kohli', result: 'PotentialConflict', checkedAt: rel(-95), detail: 'Direct — we act for R. Kohli\'s opponent in CC 902/2024', matterRef: 'CC 902/2024' },
    { id: 'cc2', matterId: MATTER.ganpati, partyName: 'Rakesh Kohli', result: 'Clear', checkedAt: rel(-95), detail: 'Name similarity — "Rakesh Kohli" 82% match, may be a different person', closedYear: 2023,
      decision: { outcome: 'NotAConflict', reason: 'Confirmed different individual — DOB and address do not match; verified telephonically with client.', byUserId: USER.meera, at: rel(-94) } },
    { id: 'cc3', partyName: 'Bhatia Steels Pvt Ltd', result: 'Clear', checkedAt: rel(-40) },
  ]
}

function buildHolidayCalendars(): T.HolidayCalendar[] {
  const yr = new Date().getFullYear()
  return [
    { id: 'hc1', forumId: FORUM.delhiHC, year: yr, holidays: [`${yr}-01-26`, `${yr}-08-15`, `${yr}-10-02`], vacationPeriods: [{ start: `${yr}-05-25`, end: `${yr}-06-30` }, { start: `${yr}-12-22`, end: `${yr}-01-01`.replace(String(yr), String(yr + 1)) }], source: 'Delhi HC Registrar circular', lastUpdatedAt: rel(-60) },
    { id: 'hc2', forumId: FORUM.tisHazari, year: yr, holidays: [`${yr}-01-26`, `${yr}-08-15`, `${yr}-10-02`], vacationPeriods: [], source: 'District Courts of Delhi calendar', lastUpdatedAt: rel(-60) },
    { id: 'hc3', forumId: FORUM.nclt, year: yr, holidays: [`${yr}-01-26`, `${yr}-08-15`], vacationPeriods: [], source: 'NCLT New Delhi notice', lastUpdatedAt: rel(-90) },
  ]
}

function buildRulePacks(): T.RulePack[] {
  return [
    { id: RULEPACK.cpc, name: 'CPC + Commercial Courts', statuteCoverage: ['Code of Civil Procedure 1908', 'Commercial Courts Act 2015'], version: 'v2026.03', status: 'UpdateAvailable', publishedAt: rel(-160), applicableForums: [FORUM.delhiHC, FORUM.tisHazari],
      pendingUpdate: { changelog: '3 rules amended, 1 added — SC clarification on O.VIII R.1 outer limit computation for commercial suits.', affectedMatterIds: [MATTER.sharma, MATTER.ganpati] } },
    { id: RULEPACK.limitation, name: 'Limitation Act, 1963', statuteCoverage: ['Limitation Act 1963'], version: 'v2026.01', status: 'Active', publishedAt: rel(-200), applicableForums: Object.values(FORUM) },
    { id: RULEPACK.ni, name: 'Negotiable Instruments Act §138', statuteCoverage: ['NI Act 1881 (§138-142)'], version: 'v2025.11', status: 'Active', publishedAt: rel(-260), applicableForums: [FORUM.tisHazari] },
    { id: RULEPACK.ibc, name: 'Insolvency & Bankruptcy Code', statuteCoverage: ['IBC 2016'], version: 'v2026.02', status: 'Active', publishedAt: rel(-120), applicableForums: [FORUM.nclt, FORUM.nclat] },
    { id: RULEPACK.it, name: 'Income Tax Act — Appeals', statuteCoverage: ['Income Tax Act 1961 §246A, §253'], version: 'v2025.09', status: 'Active', publishedAt: rel(-300), applicableForums: [FORUM.itat] },
  ]
}

function buildRules(): T.Rule[] {
  return [
    { id: 'r-ws', rulePackId: RULEPACK.cpc, name: 'Written Statement', triggerEvent: 'Service of summons', durationDays: 30, calendarOrWorkingDays: 'Calendar', extendable: true, extensionDays: 90, outerLimitDays: 120, consequence: 'Right to file forfeited (commercial suit — strict outer limit)', governingProvision: 'O.VIII R.1, CPC (Commercial Courts Act proviso)', discretionaryDoNotAutoCompute: false },
    { id: 'r-appeal-116', rulePackId: RULEPACK.limitation, name: 'Appeal / revision limitation', triggerEvent: 'Date of impugned order', durationDays: 90, calendarOrWorkingDays: 'Calendar', extendable: true, consequence: 'Appeal time-barred absent condonation under §5', governingProvision: 'Art. 116, Limitation Act 1963', discretionaryDoNotAutoCompute: false, notes: 'Time between certified-copy application and receipt is excluded under §12 — added to the computed date separately.' },
    { id: 'r-reply-notice', rulePackId: RULEPACK.limitation, name: 'Reply / response window', triggerEvent: 'Date of service', durationDays: 30, calendarOrWorkingDays: 'Calendar', extendable: false, consequence: 'Right to respond may be treated as waived', governingProvision: 'As per the notice / summons served', discretionaryDoNotAutoCompute: false },
    { id: 'r-ibc-appeal', rulePackId: RULEPACK.ibc, name: 'Appeal to NCLAT', triggerEvent: 'Date of order', durationDays: 30, calendarOrWorkingDays: 'Calendar', extendable: true, extensionDays: 15, outerLimitDays: 45, consequence: 'Appeal time-barred absent sufficient cause', governingProvision: '§61, IBC 2016', discretionaryDoNotAutoCompute: false },
    { id: 'r-condonation', rulePackId: RULEPACK.limitation, name: 'Condonation of delay', triggerEvent: 'Discretionary — sufficient cause shown', durationDays: 0, calendarOrWorkingDays: 'Calendar', extendable: false, consequence: 'Court discretion — no automatic computation', governingProvision: '§5, Limitation Act 1963', discretionaryDoNotAutoCompute: true, notes: 'Never auto-computed — assess and set manually.' },
    { id: 'r-cita', rulePackId: RULEPACK.it, name: 'Appeal to CIT(A)', triggerEvent: 'Date of service of order/notice of demand', durationDays: 30, calendarOrWorkingDays: 'Calendar', extendable: true, outerLimitDays: 30, consequence: 'Appeal barred absent condonation', governingProvision: '§246A, Income Tax Act 1961', discretionaryDoNotAutoCompute: false },
    { id: 'r-ni138', rulePackId: RULEPACK.ni, name: 'Reply to statutory notice', triggerEvent: 'Receipt of demand notice', durationDays: 15, calendarOrWorkingDays: 'Calendar', extendable: false, consequence: 'Cause of action for §138 complaint accrues', governingProvision: '§138(c), NI Act 1881', discretionaryDoNotAutoCompute: false },
    { id: 'r-evidence-crpc', rulePackId: RULEPACK.cpc, name: 'Local forum practice direction', triggerEvent: 'Case management order', durationDays: 21, calendarOrWorkingDays: 'Working', extendable: true, consequence: 'Adjournment cost likely', governingProvision: 'Tis Hazari standing order (local rule)', discretionaryDoNotAutoCompute: false, notes: 'Local rule not encoded in the rule pack — verify against the standing order before relying on this date.' },
  ]
}

function buildDeadlines(): T.Deadline[] {
  return [
    { id: 'd1', matterId: MATTER.sharma, ruleId: 'r-ws', name: 'Written statement', computedDate: relDateOnly(2), status: 'Upcoming', lastRecomputedAt: rel(-1), ruleVersionAtComputation: 'v2026.02', provision: 'O.VIII R.1 CPC' },
    { id: 'd2', matterId: MATTER.sharma, name: 'Case management hearing', computedDate: relDateOnly(19), status: 'Upcoming', lastRecomputedAt: rel(-1), provision: 'CMS, Commercial Courts Act' },
    { id: 'd3', matterId: MATTER.shakti, ruleId: 'r-ibc-appeal', name: 'Appeal to NCLAT', computedDate: relDateOnly(11), status: 'Upcoming', lastRecomputedAt: rel(-2), ruleVersionAtComputation: 'v2026.02', provision: '§61 IBC (30+15)' },
    { id: 'd4', matterId: MATTER.ganpati, ruleId: 'r-condonation', name: 'Condonation of delay', computedDate: null, status: 'NeedsJudgement', lastRecomputedAt: rel(-5), provision: '§5 Limitation Act' },
    { id: 'd5', matterId: MATTER.ganpati, ruleId: 'r-evidence-crpc', name: 'Evidence affidavit filing', computedDate: relDateOnly(9), status: 'Upcoming', lastRecomputedAt: rel(-1), provision: 'Tis Hazari local rule', ruleNotEncoded: true },
    { id: 'd6', matterId: MATTER.kavita, ruleId: 'r-cita', name: 'Appeal to CIT(A)', computedDate: relDateOnly(-7), status: 'Missed', lastRecomputedAt: rel(-8), provision: '§246A IT Act' },
    { id: 'd7', matterId: MATTER.ashoka, ruleId: 'r-ni138', name: 'Reply to statutory notice', computedDate: relDateOnly(-27), originalComputedDate: relDateOnly(-27), status: 'Overridden', overrideReason: 'Client received notice 3 days later than portal date — corrected on physical postal receipt.', overriddenByUserId: USER.meera, countersignedByUserId: USER.meera, lastRecomputedAt: rel(-25), provision: '§138(c) NI Act' },
    { id: 'd8', matterId: MATTER.nexa, name: 'Certified copy — apply', computedDate: relDateOnly(-33), status: 'Met', lastRecomputedAt: rel(-33), provision: 'O.XLI CPC' },
    { id: 'd9', matterId: MATTER.nexa, name: 'Memorandum of appeal — file', computedDate: relDateOnly(4), status: 'Upcoming', lastRecomputedAt: rel(-1), provision: 'Art. 116 Limitation Act' },
    { id: 'd10', matterId: MATTER.vertex, name: 'Rejoinder to OA', computedDate: relDateOnly(-1), status: 'Upcoming', lastRecomputedAt: rel(-1), provision: 'RDDBFI Act Rules' },
    { id: 'd11', matterId: MATTER.sharma, name: 'Interim application — reply', computedDate: relDateOnly(-2), status: 'Missed', lastRecomputedAt: rel(-2), provision: 'O.XXXIX CPC' },
  ]
}

function buildCauseList(): T.CauseListEntry[] {
  return [
    { id: 'cl1', forumId: FORUM.delhiHC, date: relDateOnly(1), itemNumber: '14', courtOrBench: 'Court 8', matterId: MATTER.sharma, purposeOfListing: 'Case management', opposingCounsel: 'Adv. R. Bhatnagar for SBI', publishedAt: rel(0, -3), status: 'Published' },
    { id: 'cl2', forumId: FORUM.tisHazari, date: relDateOnly(1), itemNumber: '—', courtOrBench: 'JMFC Court 22', matterId: MATTER.ganpati, purposeOfListing: 'Evidence — PW-2 cross', publishedAt: undefined, status: 'NotYetPublished' },
    { id: 'cl3', forumId: FORUM.nclt, date: relDateOnly(1), itemNumber: '7', courtOrBench: 'Bench III', matterId: MATTER.shakti, purposeOfListing: 'Orders', publishedAt: rel(0, -5), status: 'Published' },
    { id: 'cl4', forumId: FORUM.drt, date: relDateOnly(1), courtOrBench: 'Presiding Officer', matterId: MATTER.vertex, purposeOfListing: 'Evidence continuation', status: 'ExpectedButNotListed' },
    { id: 'cl5', forumId: FORUM.delhiHC, date: relDateOnly(1), itemNumber: '3', courtOrBench: 'Court 3', matterId: undefined, purposeOfListing: 'Admission — unrelated matter', status: 'Unexpected' },
  ]
}

function buildOrders(): T.Order[] {
  return [
    {
      id: 'o1', matterId: MATTER.shakti, forumId: FORUM.nclt, orderDate: relDateOnly(-2), detectionSource: 'CourtPortalAutomatic', detectedAt: rel(-1, -6),
      extractionConfidence: 'Medium', reviewStatus: 'NeedsReview',
      extractedFields: { orderType: 'Order on IA', nextHearing: relDateOnly(21), timeLimitText: 'File additional affidavit within 2 weeks', complianceBy: relDateOnly(14), summary: 'Bench directed the RP to file additional affidavit on the resolution plan within 2 weeks; matter listed next on the date above.' },
      proposedItems: [
        { kind: 'task', label: 'File additional affidavit — resolution plan', date: relDateOnly(13) },
        { kind: 'deadline', label: 'Compliance — additional affidavit', date: relDateOnly(14) },
      ],
    },
    {
      id: 'o2', matterId: MATTER.sharma, forumId: FORUM.delhiHC, orderDate: relDateOnly(-6), detectionSource: 'CourtPortalAutomatic', detectedAt: rel(-5, -3),
      extractionConfidence: 'High', reviewStatus: 'Confirmed',
      extractedFields: { orderType: 'Interim injunction (continued)', nextHearing: relDateOnly(2), summary: 'Ad-interim injunction continued till next date; defendant granted 4 weeks to file written statement.' },
      proposedItems: [{ kind: 'task', label: 'Diarise continued injunction — review before next date', date: relDateOnly(1) }],
      confirmedByUserId: USER.rohan, confirmedAt: rel(-4),
    },
    {
      id: 'o3', matterId: MATTER.ganpati, forumId: FORUM.tisHazari, orderDate: relDateOnly(-1), detectionSource: 'CourtPortalAutomatic', detectedAt: rel(0, -8),
      extractionConfidence: 'Low', reviewStatus: 'AwaitingInfo',
      extractedFields: { orderType: 'Scanned order — Hindi/English mixed', summary: 'OCR could not confidently extract the operative portion. Manual review required.' },
      proposedItems: [],
    },
    {
      id: 'o4', matterId: MATTER.vertex, forumId: FORUM.drt, orderDate: relDateOnly(-30), detectionSource: 'ManualUpload', detectedAt: rel(-29),
      extractionConfidence: 'High', reviewStatus: 'Confirmed',
      extractedFields: { orderType: 'Evidence direction', nextHearing: relDateOnly(-27), summary: 'DW-1 examination-in-chief directed by affidavit.' },
      confirmedByUserId: USER.priya, confirmedAt: rel(-28),
    },
  ]
}

function buildSopTemplates(): T.SopTemplate[] {
  return [
    {
      id: 'sop-ws', name: 'Written Statement — Commercial Suit', appliesToIntakeType: 'FreshCase', appliesToStatute: 'CPC', dueOffsetDays: 5,
      steps: [
        { order: 1, label: 'Collect instructions from client', guidance: 'Meet/call client, record instructions on the plaint allegations.', requiredAttachment: false, defaultAssigneeRole: 'Associate' },
        { order: 2, label: 'Draft written statement', guidance: 'Para-wise reply; specific denials per O.VIII R.5.', requiredAttachment: true, defaultAssigneeRole: 'Associate' },
        { order: 3, label: 'Partner review', guidance: 'Circulate draft for partner comments at least 3 days before filing.', requiredAttachment: false, defaultAssigneeRole: 'Partner' },
        { order: 4, label: 'Affidavit + verification', guidance: 'Client to sign affidavit; notarise.', requiredAttachment: true, defaultAssigneeRole: 'Paralegal' },
        { order: 5, label: 'e-file + physical filing', guidance: 'File on portal, obtain acknowledgment, physical copy to registry if required.', requiredAttachment: true, defaultAssigneeRole: 'Paralegal' },
      ],
    },
    {
      id: 'sop-ibc-appeal', name: 'NCLAT Appeal — Memo Drafting', appliesToStatute: 'IBC', dueOffsetDays: 7,
      steps: [
        { order: 1, label: 'Certified copy of order', guidance: 'Apply and collect certified copy; note the application/receipt dates for limitation.', requiredAttachment: true, defaultAssigneeRole: 'Paralegal' },
        { order: 2, label: 'Draft memorandum of appeal', guidance: 'Grounds of appeal, relief sought.', requiredAttachment: true, defaultAssigneeRole: 'Associate' },
        { order: 3, label: 'Partner settle', guidance: '', requiredAttachment: false, defaultAssigneeRole: 'Partner' },
        { order: 4, label: 'e-filing on NCLAT portal', guidance: '', requiredAttachment: true, defaultAssigneeRole: 'Paralegal' },
      ],
    },
  ]
}

function buildTasks(): T.Task[] {
  return [
    { id: 't1', matterId: MATTER.shakti, title: 'Draft memo of appeal', type: 'Drafting', description: 'Memo of appeal against NCLT order dated ' + relDateOnly(-2), assigneeId: USER.rohan, reviewerId: USER.vikram, dueDate: relDateOnly(3), linkedDeadlineId: 'd3', leadTimeDays: 8, priority: 'High', sopTemplateId: 'sop-ibc-appeal', status: 'InProgress', visibility: 'MatterTeam', sourceType: 'RuleEngine', provision: '§61 IBC' },
    { id: 't2', matterId: MATTER.sharma, title: 'Court fee computation & challan', type: 'Filing', description: 'Compute ad-valorem court fee for the counter-claim and prepare challan.', assigneeId: USER.sunita, dueDate: relDateOnly(6), priority: 'Medium', status: 'ToDo', visibility: 'MatterTeam', sourceType: 'Manual' },
    { id: 't3', matterId: MATTER.sharma, title: 'Draft written statement', type: 'Drafting', description: 'Para-wise written statement, specific denials.', assigneeId: USER.rohan, reviewerId: USER.meera, dueDate: relDateOnly(-1), linkedDeadlineId: 'd1', leadTimeDays: 3, priority: 'High', sopTemplateId: 'sop-ws', status: 'InReview', visibility: 'MatterTeam', sourceType: 'RuleEngine', provision: 'O.VIII R.1 CPC' },
    { id: 't4', matterId: MATTER.ganpati, title: 'Prepare PW-2 cross-examination notes', type: 'Research', description: 'Prior deposition inconsistencies to raise in cross.', assigneeId: USER.aditi, reviewerId: USER.meera, dueDate: relDateOnly(0), priority: 'Medium', status: 'ToDo', visibility: 'MatterTeam', sourceType: 'Manual' },
    { id: 't5', matterId: MATTER.nexa, title: 'File memorandum of appeal', type: 'Filing', description: 'File FAO memo with certified copy annexed.', assigneeId: USER.rohan, reviewerId: USER.vikram, dueDate: relDateOnly(4), linkedDeadlineId: 'd9', leadTimeDays: 0, priority: 'High', status: 'ToDo', visibility: 'MatterTeam', sourceType: 'RuleEngine', provision: 'Art. 116 Limitation Act' },
    { id: 't6', matterId: MATTER.ashoka, title: 'Client communication — hearing outcome', type: 'ClientCommunication', description: 'Update client on last hearing and next steps.', assigneeId: USER.priya, dueDate: relDateOnly(-3), priority: 'Low', status: 'Blocked', blockedReason: 'Awaiting certified copy of order from registry.', visibility: 'MatterTeam', sourceType: 'Manual' },
    { id: 't7', matterId: MATTER.shakti, title: 'File additional affidavit — resolution plan', type: 'Filing', description: 'Per NCLT order dated ' + relDateOnly(-2) + '.', assigneeId: USER.priya, reviewerId: USER.vikram, dueDate: relDateOnly(13), linkedDeadlineId: undefined, priority: 'High', status: 'ToDo', visibility: 'MatterTeam', sourceType: 'Manual' },
    { id: 't8', matterId: MATTER.vertex, title: 'DW-1 affidavit of evidence', type: 'Drafting', description: 'Draft examination-in-chief affidavit.', assigneeId: USER.priya, reviewerId: USER.vikram, dueDate: relDateOnly(-1), linkedDeadlineId: 'd10', priority: 'High', status: 'Done', visibility: 'MatterTeam', sourceType: 'ConfirmedOrder' },
    { id: 't9', matterId: MATTER.sharma, title: 'Vakalatnama — client signature follow-up', type: 'Administrative', description: '', assigneeId: USER.sunita, dueDate: relDateOnly(20), priority: 'Low', status: 'ToDo', visibility: 'MatterTeam', sourceType: 'IntakeChecklist' },
  ]
}

function buildChecklistInstances(): T.ChecklistItemInstance[] {
  return [
    { id: 'ci1', taskId: 't3', order: 1, label: 'Collect instructions from client', checked: true },
    { id: 'ci2', taskId: 't3', order: 2, label: 'Draft written statement', checked: true },
    { id: 'ci3', taskId: 't3', order: 3, label: 'Partner review', checked: false, guidance: 'Circulate at least 3 days before filing.' },
    { id: 'ci4', taskId: 't3', order: 4, label: 'Affidavit + verification', checked: false, requiredAttachment: true },
    { id: 'ci5', taskId: 't3', order: 5, label: 'e-file + physical filing', checked: false, requiredAttachment: true },
    { id: 'ci6', taskId: 't1', order: 1, label: 'Certified copy of order', checked: true, requiredAttachment: true, attachmentDocumentId: 'doc-cc-shakti' },
    { id: 'ci7', taskId: 't1', order: 2, label: 'Draft memorandum of appeal', checked: false },
    { id: 'ci8', taskId: 't1', order: 3, label: 'Partner settle', checked: false },
    { id: 'ci9', taskId: 't1', order: 4, label: 'e-filing on NCLAT portal', checked: false, requiredAttachment: true },
  ]
}

function buildDocuments(): T.Document[] {
  return [
    { id: 'doc1', matterId: MATTER.sharma, name: `${relDateOnly(-165).slice(0, 10)}_CS-COMM-412-2025_DelhiHC_Order_Interim-Injunction.pdf`, type: 'Order', source: 'CourtPortal', documentDate: relDateOnly(-165), uploadedByUserId: undefined, sizeBytes: 1_468_006, ocrStatus: 'Extracted', privileged: true, version: 1, offlineState: 'OnDevice', annotationCount: 14 },
    { id: 'doc2', matterId: MATTER.sharma, name: `${relDateOnly(-140).slice(0, 10)}_CS-COMM-412-2025_DelhiHC_Summons_Service-Affidavit.pdf`, type: 'Notice', source: 'Uploaded', documentDate: relDateOnly(-140), uploadedByUserId: USER.sunita, sizeBytes: 655_360, ocrStatus: 'Extracted', privileged: false, version: 1, offlineState: 'Downloading', annotationCount: 0 },
    { id: 'doc-cc-shakti', matterId: MATTER.shakti, name: `${relDateOnly(-3).slice(0, 10)}_CP-IB-340-ND-2025_NCLT_Order_Scanned.pdf`, type: 'Order', source: 'CourtPortal', documentDate: relDateOnly(-2), uploadedByUserId: undefined, sizeBytes: 8_493_465, ocrStatus: 'Failed', privileged: true, version: 1, offlineState: 'CloudOnly', annotationCount: 0 },
    { id: 'doc4', matterId: MATTER.ashoka, name: `${relDateOnly(-300).slice(0, 10)}_CC-902-2024_TisHazari_Notice_Demand-138.pdf`, type: 'Notice', source: 'Drafted', documentDate: relDateOnly(-300), uploadedByUserId: USER.priya, sizeBytes: 215_040, ocrStatus: 'Extracted', privileged: true, version: 2, offlineState: 'OnDevice', annotationCount: 3 },
    { id: 'doc5', matterId: MATTER.sharma, name: `${relDateOnly(-190).slice(0, 10)}_CS-COMM-412-2025_Evidence_Bank-Statements-Vol-II.pdf`, type: 'Evidence', source: 'Scanned', documentDate: relDateOnly(-190), uploadedByUserId: USER.sunita, sizeBytes: 65_011_712, ocrStatus: 'Pending', privileged: true, version: 1, offlineState: 'Evicted', annotationCount: 0 },
    { id: 'doc6', matterId: MATTER.nexa, name: `${relDateOnly(-33).slice(0, 10)}_FAO-88-2026_DelhiHC_CertifiedCopy_Impugned-Order.pdf`, type: 'CertifiedCopy', source: 'Uploaded', documentDate: relDateOnly(-33), uploadedByUserId: USER.sunita, sizeBytes: 990_112, ocrStatus: 'Extracted', privileged: true, version: 1, offlineState: 'OnDevice', annotationCount: 2 },
    { id: 'doc7', matterId: MATTER.vertex, name: `${relDateOnly(-30).slice(0, 10)}_OA-41-2025_DRT2_Order_Evidence-Direction.pdf`, type: 'Order', source: 'Uploaded', documentDate: relDateOnly(-30), uploadedByUserId: USER.priya, sizeBytes: 340_221, ocrStatus: 'Extracted', privileged: true, version: 1, offlineState: 'OnDevice', annotationCount: 1 },
    { id: 'doc8', matterId: MATTER.ganpati, name: `${relDateOnly(-1).slice(0, 10)}_CC-1184-2026_TisHazari_Order_Scanned-Mixed.pdf`, type: 'Order', source: 'CourtPortal', documentDate: relDateOnly(-1), sizeBytes: 2_113_400, ocrStatus: 'Failed', privileged: false, version: 1, offlineState: 'CloudOnly', annotationCount: 0 },
  ]
}

function buildAnnotations(): T.Annotation[] {
  return [
    { id: 'an1', documentId: 'doc1', authorUserId: USER.rohan, page: 2, type: 'Highlight', content: 'Operative portion — injunction continued', visibility: 'Private', createdAt: rel(-4) },
    { id: 'an2', documentId: 'doc1', authorUserId: USER.meera, page: 1, type: 'StickyNote', content: 'Cite this paragraph in the CMS submissions.', visibility: 'MatterTeam', createdAt: rel(-3) },
    { id: 'an3', documentId: 'doc4', authorUserId: USER.priya, page: 1, type: 'Underline', visibility: 'Private', createdAt: rel(-2) },
  ]
}

function buildDrafts(): T.DraftDocument[] {
  return [
    { id: 'dr1', matterId: MATTER.shakti, authorUserId: USER.rohan, title: 'Memo of appeal — Shakti Fabrics (v3 draft)', content: 'IN THE NATIONAL COMPANY LAW APPELLATE TRIBUNAL...\n\n[Grounds of Appeal]\n1. That the Adjudicating Authority erred in...\n', status: 'Private', sharedWithUserIds: [], linkedTaskId: 't1', lastSavedAt: rel(0, -1) },
    { id: 'dr2', matterId: MATTER.sharma, authorUserId: USER.rohan, title: 'Written Statement — Sharma Industries v. SBI', content: 'IN THE HIGH COURT OF DELHI AT NEW DELHI\nCS(COMM) 412/2025\n\nWRITTEN STATEMENT ON BEHALF OF DEFENDANT...\n', status: 'SharedNotPublished', sharedWithUserIds: [USER.meera], linkedTaskId: 't3', lastSavedAt: rel(0, -3) },
    { id: 'dr3', matterId: undefined, authorUserId: USER.aditi, title: 'Research note — condonation of delay, recent trend', content: 'Summary of recent Delhi HC decisions on §5 Limitation Act condonation in commercial matters...', status: 'Private', sharedWithUserIds: [], lastSavedAt: rel(-1) },
    { id: 'dr4', matterId: MATTER.ganpati, authorUserId: USER.meera, title: 'Cross-examination note — PW-2', content: 'Key inconsistencies to raise...', status: 'Published', sharedWithUserIds: [], publishedAt: rel(-2), publishedVersion: 1, lastSavedAt: rel(-2) },
  ]
}

function buildCaseAccessGrants(matters: T.Matter[]): T.CaseAccessGrant[] {
  const grants: T.CaseAccessGrant[] = []
  let n = 0
  for (const m of matters) {
    grants.push({ id: `cag-${++n}`, matterId: m.id, userId: m.responsiblePartnerId, level: 'CaseAdmin', grantedByUserId: m.responsiblePartnerId, grantedAt: m.createdAt })
    for (const a of m.assignedAssociateIds) {
      grants.push({ id: `cag-${++n}`, matterId: m.id, userId: a, level: 'CaseContributor', grantedByUserId: m.responsiblePartnerId, grantedAt: m.createdAt })
    }
    if (m.paralegalId) {
      grants.push({ id: `cag-${++n}`, matterId: m.id, userId: m.paralegalId, level: 'CaseContributor', grantedByUserId: m.responsiblePartnerId, grantedAt: m.createdAt })
    }
  }
  // Aditi (Intern) — explicit narrow read-only access, per the brief's "shared matters" pattern.
  grants.push({ id: `cag-${++n}`, matterId: MATTER.sharma, userId: USER.aditi, level: 'CaseViewer', grantedByUserId: USER.meera, grantedAt: rel(-20) })
  grants.push({ id: `cag-${++n}`, matterId: MATTER.ganpati, userId: USER.aditi, level: 'CaseViewer', grantedByUserId: USER.meera, grantedAt: rel(-15) })
  return grants
}

function buildNamingRule(): T.NamingRule {
  return { id: 'nr1', firmId: FIRM_ID, tokenPattern: '{date}_{case_no}_{forum}_{doc_type}', separator: '_', caseStyle: 'TitleCase', perDocTypeOverrides: { Order: '{date}_{case_no}_{forum}_Order_{order_type}', Evidence: '{date}_{case_no}_Evidence_{description}' } }
}

function buildBundles(): T.Bundle[] {
  return [
    { id: 'b1', matterId: MATTER.sharma, deviceId: 'dev-rohan-mac', downloadState: 'OnDevice', downloadProgress: 1, sizeBytes: 3_100_000_000, downloadedAt: rel(-1), hearingDate: relDateOnly(2), autoDeleteAt: rel(4), annotationCount: 14 },
    { id: 'b2', matterId: MATTER.ganpati, deviceId: 'dev-rohan-mac', downloadState: 'Downloading', downloadProgress: 0.62, sizeBytes: 640_000_000, hearingDate: relDateOnly(11), autoDeleteAt: rel(13), annotationCount: 0 },
    { id: 'b3', matterId: MATTER.shakti, deviceId: 'dev-rohan-mac', downloadState: 'Queued', downloadProgress: 0, sizeBytes: 1_100_000_000, hearingDate: relDateOnly(21), autoDeleteAt: rel(23), annotationCount: 0 },
    { id: 'b4', matterId: MATTER.meridian, deviceId: 'dev-rohan-mac', downloadState: 'Evicted', downloadProgress: 0, sizeBytes: 3_100_000_000, hearingDate: relDateOnly(-22), autoDeleteAt: rel(-20), annotationCount: 2 },
    { id: 'b5', matterId: MATTER.vertex, deviceId: 'dev-rohan-mac', downloadState: 'OnDevice', downloadProgress: 1, sizeBytes: 2_200_000_000, downloadedAt: rel(-29), hearingDate: relDateOnly(-27), autoDeleteAt: rel(-25), annotationCount: 6 },
  ]
}

function buildSyncConflicts(): T.SyncConflict[] {
  return [
    {
      id: 'sc1', entityType: 'Deadline', entityId: 'd9', entityLabel: 'Memorandum of appeal — file (Nexa Infra v. Bhatia Steels)',
      deviceVersion: { computedDate: relDateOnly(4), note: 'Recorded in court: bench granted 2 extra days' },
      serverVersion: { computedDate: relDateOnly(2), note: 'Court portal shows original date' },
      deviceUserId: USER.rohan, deviceTimestamp: rel(-1, -2), serverTimestamp: rel(-1, -1),
      defaultAppliedReason: 'Advocate was in court — in-court entry kept by default',
    },
  ]
}

function buildNotifications(): T.Notification[] {
  return [
    { id: 'n1', userId: USER.rohan, category: 'NeedsAction', title: 'Order Inbox: 1 order needs review — Shakti Fabrics CIRP', matterId: MATTER.shakti, channelsSent: ['InApp', 'Push'], sentAt: [rel(-1, -6)], actionHref: '/court/order-inbox' },
    { id: 'n2', userId: USER.rohan, category: 'DeadlinesHearings', title: 'Written statement due in 2 days — Sharma Industries v. SBI', matterId: MATTER.sharma, channelsSent: ['InApp', 'Email', 'SMS'], sentAt: [rel(-7), rel(-3), rel(-1)], escalatedToUserId: USER.meera, escalatedAt: rel(0, -4), readAt: undefined, actionHref: `/matters/${MATTER.sharma}/deadlines` },
    { id: 'n3', userId: USER.rohan, category: 'AssignmentsReviews', title: 'Task returned: Draft written statement — see reviewer comments', matterId: MATTER.sharma, channelsSent: ['InApp'], sentAt: [rel(-1, -1)], readAt: rel(-1) },
    { id: 'n4', userId: USER.meera, category: 'CourtUpdates', title: 'New order detected — NCLT New Delhi (Shakti Fabrics)', matterId: MATTER.shakti, channelsSent: ['InApp', 'Email'], sentAt: [rel(-1, -6)] },
    { id: 'n5', userId: USER.meera, category: 'System', title: 'Rule pack update available — CPC + Commercial Courts v2026.03', channelsSent: ['InApp'], sentAt: [rel(-2)], actionHref: '/admin/rule-packs' },
    { id: 'n6', userId: USER.aditi, category: 'Forum', title: 'Your answer was cleared by Adv. Meera Kapoor', channelsSent: ['InApp'], sentAt: [rel(-1)], readAt: rel(-1) },
    { id: 'n7', userId: USER.priya, category: 'DeadlinesHearings', title: 'Rejoinder to OA overdue by 1 day — Vertex Logistics v. Union Bank', matterId: MATTER.vertex, channelsSent: ['InApp', 'SMS'], sentAt: [rel(-2), rel(-1)] },
  ]
}

function buildNotificationPreferences(): T.NotificationPreference[] {
  return [
    { id: 'np1', userId: USER.rohan, eventType: 'Deadline approaching (Crucial)', channels: ['InApp', 'Email', 'SMS', 'Push'], quietHoursStart: '22:00', quietHoursEnd: '07:00', overrideQuietHoursForCritical: true, perMatterMutes: [] },
    { id: 'np2', userId: USER.rohan, eventType: 'New order detected', channels: ['InApp', 'Push'], quietHoursStart: '22:00', quietHoursEnd: '07:00', overrideQuietHoursForCritical: false, perMatterMutes: [] },
    { id: 'np3', userId: USER.rohan, eventType: 'Forum answer to my question', channels: ['InApp'], quietHoursStart: '22:00', quietHoursEnd: '07:00', overrideQuietHoursForCritical: false, perMatterMutes: [] },
  ]
}

function buildEscalationRules(): T.EscalationRule[] {
  return [
    { id: 'er1', firmId: FIRM_ID, importanceTier: 'Crucial', conditionDescription: 'Deadline within 24h AND no task marked complete', steps: [{ notifyRole: 'Assignee', afterHours: 0 }, { notifyRole: 'Assignee', afterHours: 72 }, { notifyRole: 'Responsible Partner', afterHours: 4 }], channels: ['SMS', 'Push', 'Email', 'InApp'] },
    { id: 'er2', firmId: FIRM_ID, importanceTier: 'Medium', conditionDescription: 'Deadline within 72h AND no task marked complete', steps: [{ notifyRole: 'Assignee', afterHours: 0 }, { notifyRole: 'Responsible Partner', afterHours: 24 }], channels: ['Email', 'InApp', 'Push'] },
    { id: 'er3', firmId: FIRM_ID, importanceTier: 'Low', conditionDescription: 'Deadline within 7 days AND no task marked complete', steps: [{ notifyRole: 'Assignee', afterHours: 0 }], channels: ['InApp'] },
  ]
}

function buildForumQuestions(): T.ForumQuestion[] {
  return [
    { id: 'fq1', firmId: FIRM_ID, askerUserId: USER.aditi, title: 'Limitation for condonation application when certified copy was delayed by the registry itself?', body: 'Client received the certified copy 40 days after applying, registry delay documented. Does the delay period get excluded under §12(2) or do we need a separate condonation application?', matterId: MATTER.nexa, autoRedactClientNames: true, practiceArea: 'Limitation', audience: 'WholeFirm', clearanceState: 'PartnerCleared', createdAt: rel(-6) },
    { id: 'fq2', firmId: FIRM_ID, askerUserId: USER.priya, title: 'Best practice: reply to §138 NI Act demand notice when part-payment was already made?', body: 'Part payment made after cheque presentation but before notice. Structuring the reply.', matterId: MATTER.ashoka, autoRedactClientNames: false, practiceArea: 'NI Act', audience: 'WholeFirm', clearanceState: 'Answered', createdAt: rel(-2) },
    { id: 'fq3', firmId: FIRM_ID, askerUserId: USER.rohan, title: 'NCLAT appeal — is a certified copy mandatory if the order was received electronically via the e-portal?', body: '', matterId: MATTER.shakti, autoRedactClientNames: true, practiceArea: 'IBC', audience: 'OpenToInterns', clearanceState: 'Open', createdAt: rel(-1) },
    { id: 'fq4', firmId: FIRM_ID, askerUserId: USER.sunita, title: 'General — court fee computation method for counter-claims exceeding original suit value', body: '', autoRedactClientNames: false, practiceArea: 'Procedure', audience: 'WholeFirm', clearanceState: 'Closed', createdAt: rel(-40) },
  ]
}

function buildForumAnswers(): T.ForumAnswer[] {
  return [
    { id: 'fa1', questionId: 'fq1', authorUserId: USER.aditi, body: 'Under §12(2) of the Limitation Act, the time for obtaining a certified copy is excluded when computing the limitation period — this should cover the registry\'s own delay, provided the delay is attributable to the court and not the applicant. Delhi HC has taken this view in a few recent orders (need Partner to confirm the citations below before relying).', citations: [{ case: 'Illustrative HC decision (intern-sourced, unverified)', citation: 'see analysis', court: 'Delhi HC', year: 2024, ratio: 'Registry delay in issuing certified copy excluded from limitation computation', weight: 'Persuasive' }], createdAt: rel(-5) },
    { id: 'fa2', questionId: 'fq1', authorUserId: USER.meera, body: 'Confirmed — §12(2) exclusion applies. Draft the condonation application defensively regardless (belt and braces) given the outer-limit risk on appeal timelines.', citations: [], partnerClearedByUserId: USER.meera, partnerClearedAt: rel(-4), clearedVerbatimFromAnswerId: 'fa1', createdAt: rel(-4) },
    { id: 'fa3', questionId: 'fq2', authorUserId: USER.priya, body: 'Structure the reply to acknowledge part payment while denying full discharge — the cheque was for the full amount and dishonour occurred before the part payment; cause of action under §138 survives for the balance if properly pleaded in the complaint.', citations: [{ case: 'Illustrative SC precedent', citation: 'see analysis', court: 'Supreme Court', year: 2019, ratio: 'Part payment after dishonour does not extinguish liability under §138', weight: 'Binding' }], createdAt: rel(-1) },
  ]
}

function buildResearchTasks(): T.ResearchTask[] {
  return [
    { id: 'rt1', requestedByUserId: USER.meera, assignedToUserId: USER.aditi, matterId: MATTER.sharma, question: 'Is a counter-claim maintainable in a commercial suit after the written statement period has expired but before framing of issues?', scope: 'Delhi HC and Supreme Court precedent, last 5 years.', neededByDate: relDateOnly(5), status: 'InProgress' },
    { id: 'rt2', requestedByUserId: USER.vikram, assignedToUserId: USER.rohan, matterId: MATTER.shakti, question: 'Threshold for NCLAT to condone delay beyond the statutory 15-day extension under §61(2) IBC proviso.', scope: 'NCLAT and Supreme Court precedent.', neededByDate: relDateOnly(2), status: 'Submitted' },
    { id: 'rt3', requestedByUserId: USER.meera, assignedToUserId: USER.aditi, matterId: undefined, question: 'General note: recent amendments to court-fee valuation rules, Delhi.', scope: 'Delhi Court Fees Act amendments 2024-2026.', neededByDate: relDateOnly(10), status: 'NotStarted' },
  ]
}

function buildResearchSubmissions(): T.ResearchSubmission[] {
  return [
    {
      id: 'rs1', researchTaskId: 'rt2', issue: 'Whether NCLAT can condone delay beyond the 15-day statutory extension under the §61(2) proviso to IBC.',
      shortAnswer: 'No — the Supreme Court has held the 45-day outer limit (30+15) under §61(2) is mandatory and NCLAT has no residual power to condone delay beyond it.',
      applicableProvisions: ['§61(2) IBC', '§5 Limitation Act (inapplicable beyond outer limit)'],
      authorities: [{ case: 'Illustrative SC decision on IBC limitation', citation: 'see analysis note', court: 'Supreme Court', year: 2021, ratio: 'Outer limit under §61(2) proviso is mandatory; NCLAT cannot condone delay beyond 45 days', weight: 'Binding' }],
      analysis: 'The proviso to §61(2) caps condonable delay at 15 days beyond the 30-day period, i.e. an absolute 45-day outer limit. Filing must therefore happen within 45 days of the order; ensure the appeal is filed with margin.',
      contraryAuthority: 'No contrary binding authority found; some NCLAT benches have shown sympathy to the "communication of order" argument to shift the start date, which is a separate (not a condonation) argument and should be explored if the 45-day window is at risk.',
      recommendation: 'File well within 45 days; do not rely on condonation as a fallback.', confidence: 'Settled', status: 'Submitted',
    },
  ]
}

function buildResearchLibrary(): T.ResearchLibraryEntry[] {
  return [
    { id: 'lib1', title: 'NCLAT limitation — 45-day outer limit is mandatory', issue: 'Condonation of delay beyond §61(2) IBC proviso', shortAnswer: 'NCLAT cannot condone delay beyond the 45-day outer limit under §61(2).', authorities: [{ case: 'Illustrative SC decision on IBC limitation', citation: 'see analysis note', court: 'Supreme Court', year: 2021, ratio: 'Outer limit mandatory', weight: 'Binding' }], clearedByUserId: USER.vikram, clearedAt: rel(-1), source: 'ResearchTask', linkedMatterIds: [MATTER.shakti], stillGoodLawReviewDate: relDateOnly(300) },
    { id: 'lib2', title: 'Registry delay in certified copy excluded from limitation (§12(2))', issue: 'Limitation computation where certified-copy delay is attributable to the registry', shortAnswer: 'Time taken by the registry to issue a certified copy is excluded under §12(2) Limitation Act.', authorities: [{ case: 'Illustrative HC decision', citation: 'see analysis', court: 'Delhi HC', year: 2024, ratio: 'Registry delay excluded', weight: 'Persuasive' }], clearedByUserId: USER.meera, clearedAt: rel(-4), source: 'Forum', linkedMatterIds: [MATTER.nexa], stillGoodLawReviewDate: relDateOnly(330) },
  ]
}

function buildAuditLog(): T.AuditLogEntry[] {
  return [
    { id: 'al1', timestamp: rel(-25), actorUserId: USER.meera, actorName: 'Meera Kapoor', action: 'deadline.override', objectType: 'Deadline', objectId: 'd7', matterId: MATTER.ashoka, ipAddress: '103.21.244.11', beforeState: { computedDate: relDateOnly(-27) }, afterState: { computedDate: relDateOnly(-27), overrideReason: 'Client received notice 3 days later than portal date' } },
    { id: 'al2', timestamp: rel(-4), actorUserId: USER.rohan, actorName: 'Rohan Iyer', action: 'order.confirm', objectType: 'Order', objectId: 'o2', matterId: MATTER.sharma, ipAddress: '103.21.244.19', afterState: { reviewStatus: 'Confirmed' } },
    { id: 'al3', timestamp: rel(-2), actorUserId: USER.meera, actorName: 'Meera Kapoor', action: 'access.grant', objectType: 'CaseAccessGrant', objectId: 'cag-new', matterId: MATTER.sharma, ipAddress: '103.21.244.11', afterState: { userId: USER.aditi, level: 'CaseViewer' } },
    { id: 'al4', timestamp: rel(-1), actorUserId: undefined, actorName: undefined, action: 'auth.login_failed', objectType: 'Session', ipAddress: '49.36.88.4' },
    { id: 'al5', timestamp: rel(0, -2), actorUserId: USER.sunita, actorName: 'Sunita Kamble', action: 'document.download', objectType: 'Document', objectId: 'doc1', matterId: MATTER.sharma, ipAddress: '103.21.244.30' },
    { id: 'al6', timestamp: rel(-9), actorUserId: USER.vikram, actorName: 'Vikram Desai', action: 'bundle.create', objectType: 'Bundle', objectId: 'b3', matterId: MATTER.shakti, deviceId: 'dev-rohan-mac', ipAddress: '103.21.244.11' },
  ]
}

function buildDprRequests(): T.DataPrincipalRequest[] {
  return [
    { id: 'dpr1', requesterName: 'Kavita Rane', type: 'Erasure', receivedAt: rel(-19), respondByDate: relDateOnly(11), status: 'InProgress', handledByUserId: USER.meera, detail: 'Subject appears in 1 live matter (ITA 210/2026) — retention required for the professional engagement; audit-log entries retained 180 days minimum (CERT-In).' },
    { id: 'dpr2', requesterName: 'Rakesh Kohli', type: 'Access', receivedAt: rel(-60), respondByDate: relDateOnly(-30), status: 'Completed', handledByUserId: USER.meera },
  ]
}

export function buildSeed() {
  const matters = buildMatters()
  return {
    firm: buildFirm(),
    users: buildUsers(),
    forums: buildForums(),
    matters,
    clients: buildClients(),
    parties: buildParties(),
    conflictChecks: buildConflictChecks(),
    holidayCalendars: buildHolidayCalendars(),
    rulePacks: buildRulePacks(),
    rules: buildRules(),
    deadlines: buildDeadlines(),
    causeList: buildCauseList(),
    orders: buildOrders(),
    sopTemplates: buildSopTemplates(),
    tasks: buildTasks(),
    checklistInstances: buildChecklistInstances(),
    documents: buildDocuments(),
    annotations: buildAnnotations(),
    drafts: buildDrafts(),
    namingRule: buildNamingRule(),
    bundles: buildBundles(),
    syncConflicts: buildSyncConflicts(),
    notifications: buildNotifications(),
    notificationPreferences: buildNotificationPreferences(),
    escalationRules: buildEscalationRules(),
    forumQuestions: buildForumQuestions(),
    forumAnswers: buildForumAnswers(),
    researchTasks: buildResearchTasks(),
    researchSubmissions: buildResearchSubmissions(),
    researchLibrary: buildResearchLibrary(),
    auditLog: buildAuditLog(),
    dprRequests: buildDprRequests(),
    caseAccessGrants: buildCaseAccessGrants(matters),
    devices: [
      { id: 'dev-rohan-mac', userId: USER.rohan, label: "ROHAN-MBP-01", platform: 'DesktopClient' as const, registeredAt: rel(-200), offlineConsentAt: rel(-200), encryptionKeyRef: 'keychain-ref-1' },
      { id: 'dev-meera-ipad', userId: USER.meera, label: 'Meera — iPad', platform: 'iOS' as const, registeredAt: rel(-180), offlineConsentAt: rel(-180), encryptionKeyRef: 'keychain-ref-2' },
    ] as T.Device[],
  }
}

export type Seed = ReturnType<typeof buildSeed>
