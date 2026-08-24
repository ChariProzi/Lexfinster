import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequireRole } from './components/layout/RequireRole'
import Login from './pages/auth/Login'
import PlaceholderRoute from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<PlaceholderRoute />} />
        <Route path="/dashboard" element={<PlaceholderRoute />} />
        <Route path="/more" element={<PlaceholderRoute />} />

        <Route path="/matters" element={<PlaceholderRoute />} />
        <Route path="/matters/board" element={<PlaceholderRoute />} />
        <Route path="/matters/new" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/deadlines" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/deadlines/:deadlineId/why" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/deadlines/:deadlineId/override" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/docket" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/orders" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/documents" element={<PlaceholderRoute />} />
        <Route path="/matters/:matterId/checklist" element={<PlaceholderRoute />} />
        <Route path="/clients/:clientId" element={<PlaceholderRoute />} />

        <Route path="/work/allocate" element={<RequireRole roles={['Admin', 'Partner']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/work/my-worklist" element={<PlaceholderRoute />} />
        <Route path="/work/tasks/new" element={<PlaceholderRoute />} />
        <Route path="/work/tasks/:taskId" element={<PlaceholderRoute />} />
        <Route path="/work/review-queue" element={<PlaceholderRoute />} />
        <Route path="/work/team-workload" element={<RequireRole roles={['Admin', 'Partner']}><PlaceholderRoute /></RequireRole>} />

        <Route path="/court/cause-lists" element={<PlaceholderRoute />} />
        <Route path="/court/order-inbox" element={<PlaceholderRoute />} />
        <Route path="/court/order-inbox/:orderId" element={<PlaceholderRoute />} />
        <Route path="/court/upload" element={<PlaceholderRoute />} />
        <Route path="/court/data-health" element={<PlaceholderRoute />} />

        <Route path="/documents" element={<PlaceholderRoute />} />
        <Route path="/documents/:documentId" element={<PlaceholderRoute />} />
        <Route path="/documents/upload" element={<PlaceholderRoute />} />
        <Route path="/documents/naming-rules" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/drafts" element={<PlaceholderRoute />} />
        <Route path="/drafts/:draftId" element={<PlaceholderRoute />} />

        <Route path="/offline/bundles" element={<PlaceholderRoute />} />
        <Route path="/offline/court-mode/:forumId" element={<PlaceholderRoute />} />
        <Route path="/offline/sync-conflicts" element={<PlaceholderRoute />} />
        <Route path="/offline/storage-settings" element={<PlaceholderRoute />} />
        <Route path="/offline-unavailable" element={<PlaceholderRoute />} />

        <Route path="/forum" element={<PlaceholderRoute />} />
        <Route path="/forum/ask" element={<PlaceholderRoute />} />
        <Route path="/forum/questions/:questionId" element={<PlaceholderRoute />} />
        <Route path="/forum/my-research" element={<PlaceholderRoute />} />
        <Route path="/forum/research/:taskId" element={<PlaceholderRoute />} />
        <Route path="/forum/clearance-queue" element={<RequireRole roles={['Admin', 'Partner']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/forum/library" element={<PlaceholderRoute />} />
        <Route path="/forum/library/:entryId" element={<PlaceholderRoute />} />

        <Route path="/notifications" element={<PlaceholderRoute />} />
        <Route path="/settings/notifications" element={<PlaceholderRoute />} />

        <Route path="/reports" element={<RequireRole roles={['Admin', 'Partner']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/reports/at-risk" element={<RequireRole roles={['Admin', 'Partner']}><PlaceholderRoute /></RequireRole>} />

        <Route path="/admin/users" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/case-access" element={<RequireRole roles={['Admin', 'Partner']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/audit-log" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/rule-packs" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/holiday-calendars" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/escalation-rules" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/data-retention" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/firm-settings" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />
        <Route path="/admin/sop-templates/:templateId" element={<RequireRole roles={['Admin']}><PlaceholderRoute /></RequireRole>} />

        <Route path="/onboarding/firm-setup" element={<PlaceholderRoute />} />
        <Route path="/onboarding/invite" element={<PlaceholderRoute />} />
        <Route path="/onboarding/device-registration" element={<PlaceholderRoute />} />

        <Route path="*" element={<PlaceholderRoute />} />
      </Route>
    </Routes>
  )
}
