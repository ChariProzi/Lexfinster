# Build Progress — Litigation Practice Management MVP

Last updated: 2026-08-24 (Phase 1 checkpoint)

## What this is

This is the actual working React application implementing the Figma wireframes and specs in this project (README.md, DATA_MODEL.md, USER_STORIES.md, API_DESIGN.md, MVP_PHASING.md, ARCHITECTURE.md, CONFLICTS_AND_ASSUMPTIONS.md, schemas.json), not more wireframes. It runs entirely client-side against a mock data/API layer that simulates a real backend (latency, RBAC errors, audit logging), seeded with a seven-user demo firm ("Kapoor & Associates") and a realistic spread of matters across District Courts, High Courts, NCLT, NCLAT, DRT/DRAT, and ITAT.

Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS v4, React Router v7, TanStack Query v5, Zustand v5 (persisted to localStorage). The production build compiles to a single self-contained `dist/index.html` (~570 KB) with no external runtime dependencies (no CDN, no fonts fetched at runtime) — safe to open from a file:// URL or host anywhere.

Delivered this checkpoint: the built app as a live Artifact link, the same build as a downloadable `index.html`, and a zip of the full source tree.

## Repository layout

Working tree: `litigation-app/` — standard Vite/React layout under `src/`, split into `api/` (mock backend, one module per domain), `data/` (Zustand store, seed data, TypeScript types), `pages/` (one folder per feature area, matching the route map), `components/` (layout shell, shared widgets, UI primitives), and `lib/` (session, RBAC helpers, date engine, toast).

Git history is checkpointed by phase so the work is auditable and revertible:
- `a020bcb` — scaffold: Vite/React/TS/Tailwind, mock data layer, RBAC, deadline engine, shared components, routing skeleton
- `de79e0e` — Today/Dashboard/Matters screens, full Intake wizard, Client Record
- `7e768bb` — Court Data + Work modules
- `954fc18` — Documents, Notifications, Admin, and At-Risk Report

## What's built and working (Phase 1 — core loop)

Every screen below is real, wired to the mock API, and RBAC-gated where the spec calls for it (route-level `RequireRole` plus in-component gating for actions like recording a conflict decision or changing someone's role).

**Orientation:** Login (role switcher for demo purposes), My Day, Dashboard.

**Matters:** All Matters list, Kanban Board, Matter Overview, Deadlines tab (with the "why" rule explainer and the override flow with countersign policy), Docket, Orders & Hearings, Matter Documents, Checklist, Client Record (with the "client is also an opposing party elsewhere" conflict warning).

**Intake (the differentiator flow):** the full three-step wizard — intake type selection (Fresh Case / Appeal-Revision / Reply Required / Existing Mid-Stream), the dynamic form (forum & case identity, client & parties with live per-party conflict checking, limitation-critical dates that change shape per intake type, importance & allocation), and the conflict-resolution gate. The system never auto-blocks a conflict: any non-clear result requires a Partner/Admin to record a reasoned decision (Not a conflict / Decline / Seek waiver) before the matter can be created, and a Decline terminates intake with nothing created. A live "proposed deadline chain" preview computes and shows real dates (via the same date engine used everywhere else) as the user fills in dates, including the §12 Limitation Act certified-copy exclusion for appeals.

**Court Data:** Court Data Health (per-forum sync status), Cause Lists, Order Inbox, Order Review (confidence banner, extracted fields, confirm / needs-more-info with a required reason), Manual Upload.

**Work:** Allocate Work (with live assignment-clash checking), My Worklist, Task Create (with linked-deadline and SOP-template selection), Task Execution (full lifecycle: block/resume, submit for review, approve, return with comments, mark complete, with the two-step confirmation for tasks tied to a limitation deadline), Review Queue, Team Workload.

**Documents:** Document Manager (firm-wide, searchable), Document Upload (with post-upload extraction review), Document Viewer (annotation toolbar, privacy selector, retry-OCR on failure).

**Notifications:** Notification Centre (category tabs, mark-read, mark-all-read, escalation chain showing who it escalated to).

**Admin:** Users & Roles (invite, per-row role change with the "reassign Case Admin first" guard, suspend/reactivate/force sign-out), Audit Log (insert-only, filterable), Rule Packs (update-available badge, impact preview, apply-update vs. keep-current-dates).

**Reports:** At-Risk Matters (the one report built so far; ranked by open risk-flag count).

## Two real bugs found and fixed (not cosmetic)

Both were caught by driving the actual built app with Playwright against a production preview server, not just by `tsc`/`vite build` succeeding.

1. **Infinite render loop (React error #185) on Docket, Checklist, and Manual Upload.** Cause: a Zustand selector shaped like `useDb((s) => s.someArray.filter(...))` returns a brand-new array reference on every call. React 19's `useSyncExternalStore` (which Zustand's hook is built on) treats that as "the snapshot keeps changing" and re-renders forever, which crashes the page. Fix: wrap every such selector in `useShallow` from `zustand/react/shallow`. This is now a hard rule for all new code in this codebase: never write `useDb((s) => s.array.filter(...))` or `.map(...)` without `useShallow`. (`.find(...)` and `.filter(...).length` are safe as-is — they return a stable reference or a primitive.)
2. **Deadlines silently never seeded for Fresh Case intakes.** Cause: the intake code looked for a rule named `'Written statement'` (lowercase "s") while the seed data's actual rule name is `'Written Statement'`. Fixed, and generalized into a `rulesForIntakeType()` helper shared by the live preview and the real seeding logic so the two can't drift apart again.

A third, smaller bug: the conflict-decision step in Intake labelled every non-clear match "Name similarity" because it checked for a `'Blocked'` result the matching engine never actually produces. Fixed to also recognize a "Direct" match in the detail text.

## Key assumptions and decisions carried from the spec docs

- Meera is modeled as both Partner and (for the demo) the firm's sole Admin, per the seed data.
- Countersign policy: an Associate's deadline override requires Partner/Admin countersign; a Partner/Admin override is immediate.
- Conflict checks are advisory-only by design — the system computes a result but a human always makes the call, with a mandatory reason recorded to the audit log.
- Per-matter access is a separate, explicit grant from firm-level role — per CONFLICTS_AND_ASSUMPTIONS #10, even an Admin needs an explicit `CaseAccessGrant` to open a specific matter.
- The conflict-scanning engine is a fuzzy name matcher that returns `Clear` or `PotentialConflict`; `Blocked` exists as a type-level value in the schema but is not something the current matcher produces (nothing in the spec required a stricter matcher yet).

## Not yet built (remaining phases)

**Phase 2 — Drafts & Forum/Interns/Admin extras:** Draft Workspace + My Drafts, Naming Rules admin, Forum & Interns (ask/answer, research tasking, clearance queue, research library), Case Access Management, Escalation Rules builder, Notification Preferences, Holiday Calendars, Firm Settings, SOP Template Editor.

**Phase 3 — Offline/Court Mode:** Case Bundles, Court Mode, offline stub, Sync Conflict Resolution, Retention Prompt, Local Storage Settings, Device Registration, Data & Retention admin. (The mock API layer for these already exists in `offline.ts` from an earlier session; the screens themselves are not built.)

**Phase 4 — Reports & Dashboards:** the other four reports (`deadlineComplianceReport`, `matterPipelineReport`, `workloadThroughputReport`, `courtDataReliabilityReport`, `hearingScheduleReport` — API functions already exist in `reports.ts`, no screens yet) and the Research Library "still good law" flagging placeholder.

**Final QA:** a full click-through pass per role, final build, and final delivery.

All of the above are still `PlaceholderRoute` stubs in `App.tsx` today: `/documents/naming-rules`, `/drafts`, `/drafts/:draftId`, everything under `/offline/*` and `/offline-unavailable`, everything under `/forum/*`, `/settings/notifications`, `/reports` (the index — only `/reports/at-risk` is real), `/admin/case-access`, `/admin/holiday-calendars`, `/admin/escalation-rules`, `/admin/data-retention`, `/admin/firm-settings`, `/admin/sop-templates/:templateId`, and everything under `/onboarding/*`.

## Next step

Continuing autonomously into Phase 2 (Drafts, Forum/Interns, and the remaining Admin screens), then Phase 3 (Offline/Court Mode) and Phase 4 (the remaining four reports), checkpointing here again after each phase the same way this one was checkpointed.
