import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireRole } from './components/layout/RequireRole'
import { RequireDesktopClient } from './components/layout/RequireDesktopClient'
import Login from './pages/auth/Login'
import PlaceholderRoute from './pages/Placeholder'
import More from './pages/More'
import MyDay from './pages/today/MyDay'
import Dashboard from './pages/dashboard/Dashboard'
import AllMatters from './pages/matters/AllMatters'
import Board from './pages/matters/Board'
import MatterOverview from './pages/matters/MatterOverview'
import Intake from './pages/matters/Intake'
import Deadlines from './pages/matters/Deadlines'
import RuleExplainer from './pages/matters/RuleExplainer'
import Override from './pages/matters/Override'
import Docket from './pages/matters/Docket'
import MatterDocuments from './pages/matters/MatterDocuments'
import Checklist from './pages/matters/Checklist'
import ClientRecord from './pages/matters/ClientRecord'
import OrdersAndHearings from './pages/matters/OrdersAndHearings'
import CauseLists from './pages/court/CauseLists'
import OrderInbox from './pages/court/OrderInbox'
import OrderReview from './pages/court/OrderReview'
import ManualUpload from './pages/court/ManualUpload'
import CourtDataHealth from './pages/court/CourtDataHealth'
import AllocateWork from './pages/work/AllocateWork'
import MyWorklist from './pages/work/MyWorklist'
import TaskCreate from './pages/work/TaskCreate'
import TaskExecution from './pages/work/TaskExecution'
import ReviewQueue from './pages/work/ReviewQueue'
import TeamWorkload from './pages/work/TeamWorkload'
import DocumentManager from './pages/documents/DocumentManager'
import DocumentUpload from './pages/documents/DocumentUpload'
import DocumentViewer from './pages/documents/DocumentViewer'
import NotificationCentre from './pages/notifications/NotificationCentre'
import NotificationPreferences from './pages/notifications/NotificationPreferences'
import UsersAndRoles from './pages/admin/UsersAndRoles'
import AuditLog from './pages/admin/AuditLog'
import RulePacks from './pages/admin/RulePacks'
import AtRiskReport from './pages/reports/AtRiskReport'
import Reports from './pages/reports/Reports'
import NamingRules from './pages/documents/NamingRules'
import MyDrafts from './pages/documents/MyDrafts'
import DraftWorkspace from './pages/documents/DraftWorkspace'
import ForumIndex from './pages/forum/ForumIndex'
import AskQuestion from './pages/forum/AskQuestion'
import QuestionDetail from './pages/forum/QuestionDetail'
import MyResearch from './pages/forum/MyResearch'
import ResearchTaskDetail from './pages/forum/ResearchTaskDetail'
import ClearanceQueue from './pages/forum/ClearanceQueue'
import ResearchLibrary from './pages/forum/ResearchLibrary'
import LibraryEntryDetail from './pages/forum/LibraryEntryDetail'
import CaseAccess from './pages/admin/CaseAccess'
import EscalationRules from './pages/admin/EscalationRules'
import HolidayCalendars from './pages/admin/HolidayCalendars'
import FirmSettings from './pages/admin/FirmSettings'
import SopTemplateEditor from './pages/admin/SopTemplateEditor'
import DataRetention from './pages/admin/DataRetention'
import FirmSetup from './pages/onboarding/FirmSetup'
import Invite from './pages/onboarding/Invite'
import DeviceRegistration from './pages/onboarding/DeviceRegistration'
import CaseBundles from './pages/offline/CaseBundles'
import CourtMode from './pages/offline/CourtMode'
import SyncConflicts from './pages/offline/SyncConflicts'
import StorageSettings from './pages/offline/StorageSettings'
import OfflineUnavailable from './pages/offline/OfflineUnavailable'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<MyDay />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/more" element={<More />} />

        <Route path="/matters" element={<AllMatters />} />
        <Route path="/matters/board" element={<Board />} />
        <Route path="/matters/new" element={<Intake />} />
        <Route path="/matters/:matterId" element={<MatterOverview />} />
        <Route path="/matters/:matterId/deadlines" element={<Deadlines />} />
        <Route path="/matters/:matterId/deadlines/:deadlineId/why" element={<RuleExplainer />} />
        <Route path="/matters/:matterId/deadlines/:deadlineId/override" element={<Override />} />
        <Route path="/matters/:matterId/docket" element={<Docket />} />
        <Route path="/matters/:matterId/orders" element={<OrdersAndHearings />} />
        <Route path="/matters/:matterId/documents" element={<MatterDocuments />} />
        <Route path="/matters/:matterId/checklist" element={<Checklist />} />
        <Route path="/clients/:clientId" element={<ClientRecord />} />

        <Route path="/work/allocate" element={<RequireRole roles={['Admin', 'Partner']}><AllocateWork /></RequireRole>} />
        <Route path="/work/my-worklist" element={<MyWorklist />} />
        <Route path="/work/tasks/new" element={<TaskCreate />} />
        <Route path="/work/tasks/:taskId" element={<TaskExecution />} />
        <Route path="/work/review-queue" element={<ReviewQueue />} />
        <Route path="/work/team-workload" element={<RequireRole roles={['Admin', 'Partner']}><TeamWorkload /></RequireRole>} />

        <Route path="/court/cause-lists" element={<CauseLists />} />
        <Route path="/court/order-inbox" element={<OrderInbox />} />
        <Route path="/court/order-inbox/:orderId" element={<OrderReview />} />
        <Route path="/court/upload" element={<ManualUpload />} />
        <Route path="/court/data-health" element={<CourtDataHealth />} />

        <Route path="/documents" element={<DocumentManager />} />
        <Route path="/documents/:documentId" element={<DocumentViewer />} />
        <Route path="/documents/upload" element={<DocumentUpload />} />
        <Route path="/documents/naming-rules" element={<RequireRole roles={['Admin']}><NamingRules /></RequireRole>} />
        <Route path="/drafts" element={<MyDrafts />} />
        <Route path="/drafts/:draftId" element={<DraftWorkspace />} />

        <Route path="/offline/bundles" element={<RequireDesktopClient><CaseBundles /></RequireDesktopClient>} />
        <Route path="/offline/court-mode/:forumId" element={<RequireDesktopClient><CourtMode /></RequireDesktopClient>} />
        <Route path="/offline/sync-conflicts" element={<RequireDesktopClient><SyncConflicts /></RequireDesktopClient>} />
        <Route path="/offline/storage-settings" element={<RequireDesktopClient><StorageSettings /></RequireDesktopClient>} />
        <Route path="/offline-unavailable" element={<OfflineUnavailable />} />

        <Route path="/forum" element={<ForumIndex />} />
        <Route path="/forum/ask" element={<AskQuestion />} />
        <Route path="/forum/questions/:questionId" element={<QuestionDetail />} />
        <Route path="/forum/my-research" element={<MyResearch />} />
        <Route path="/forum/research/:taskId" element={<ResearchTaskDetail />} />
        <Route path="/forum/clearance-queue" element={<RequireRole roles={['Admin', 'Partner']}><ClearanceQueue /></RequireRole>} />
        <Route path="/forum/library" element={<ResearchLibrary />} />
        <Route path="/forum/library/:entryId" element={<LibraryEntryDetail />} />

        <Route path="/notifications" element={<NotificationCentre />} />
        <Route path="/settings/notifications" element={<NotificationPreferences />} />

        <Route path="/reports" element={<RequireRole roles={['Admin', 'Partner']}><Reports /></RequireRole>} />
        <Route path="/reports/at-risk" element={<RequireRole roles={['Admin', 'Partner']}><AtRiskReport /></RequireRole>} />

        <Route path="/admin/users" element={<RequireRole roles={['Admin']}><UsersAndRoles /></RequireRole>} />
        <Route path="/admin/case-access" element={<RequireRole roles={['Admin', 'Partner']}><CaseAccess /></RequireRole>} />
        <Route path="/admin/audit-log" element={<RequireRole roles={['Admin']}><AuditLog /></RequireRole>} />
        <Route path="/admin/rule-packs" element={<RequireRole roles={['Admin']}><RulePacks /></RequireRole>} />
        <Route path="/admin/holiday-calendars" element={<RequireRole roles={['Admin']}><HolidayCalendars /></RequireRole>} />
        <Route path="/admin/escalation-rules" element={<RequireRole roles={['Admin']}><EscalationRules /></RequireRole>} />
        <Route path="/admin/data-retention" element={<RequireRole roles={['Admin']}><DataRetention /></RequireRole>} />
        <Route path="/admin/firm-settings" element={<RequireRole roles={['Admin']}><FirmSettings /></RequireRole>} />
        <Route path="/admin/sop-templates/:templateId" element={<RequireRole roles={['Admin']}><SopTemplateEditor /></RequireRole>} />

        <Route path="/onboarding/firm-setup" element={<RequireRole roles={['Admin']}><FirmSetup /></RequireRole>} />
        <Route path="/onboarding/invite" element={<RequireRole roles={['Admin']}><Invite /></RequireRole>} />
        <Route path="/onboarding/device-registration" element={<DeviceRegistration />} />

        <Route path="*" element={<PlaceholderRoute />} />
      </Route>
    </Routes>
  )
}
