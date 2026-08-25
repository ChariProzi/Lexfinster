# Build Progress — Litigation Practice Management MVP

Status: **COMPLETE** — all documented screens built and QA-verified, plus Phase 5 (user-requested additions) and a Phase 6 rebrand on top of the original spec.
Last updated: 2026-08-25 (Phase 6 — rebrand)

## What this is

This is the actual working React application implementing the Figma wireframes and specs in this project (README.md, DATA_MODEL.md, USER_STORIES.md, API_DESIGN.md, MVP_PHASING.md, ARCHITECTURE.md, CONFLICTS_AND_ASSUMPTIONS.md, schemas.json) — not more wireframes. It runs entirely client-side against a mock data/API layer that simulates a real backend (latency, RBAC errors, audit logging), seeded with a seven-user demo firm ("Lexfinster") and a realistic spread of matters across District Courts, High Courts, NCLT, NCLAT, DRT/DRAT, and ITAT.

Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS v4, React Router v7, TanStack Query v5, Zustand v5 (persisted to localStorage). The production build compiles to a single self-contained `dist/index.html` (~688 KB) with no external runtime dependencies (no CDN, no fonts fetched at runtime) — safe to open from a file:// URL or host anywhere.

Live version: https://claude.ai/code/artifact/aa1d6a85-0bed-4056-a8eb-51968991d684 (updated to the final build).

## Repository layout

Working tree: `litigation-app/` — standard Vite/React layout under `src/`, split into `api/` (mock backend, one module per domain), `data/` (Zustand store, seed data, TypeScript types), `pages/` (one folder per feature area, matching the route map), `components/` (layout shell, shared widgets, UI primitives), and `lib/` (session, RBAC helpers, date engine, toast).

Git history is checkpointed by phase so the work is auditable and revertible:
- `a020bcb` — scaffold: Vite/React/TS/Tailwind, mock data layer, RBAC, deadline engine, shared components, routing skeleton
- `de79e0e` — Today/Dashboard/Matters screens, full Intake wizard, Client Record
- `7e768bb` — Court Data + Work modules
- `954fc18` — Documents, Notifications, Admin, and At-Risk Report
- `8a51222` — Phase 2: Drafts, Forum & Interns, and remaining Admin screens
- `0258a4a` — Phase 3: Offline & Court Mode, plus the three never-wireframed onboarding screens
- `0b730ec` — Phase 4: Reports & Dashboards index — all 63+3 documented screens now wired
- `6833729` — Final QA + delivery: fixed a test-script timing bug, verified all screens across all 7 roles with zero console errors
- `dd776ed` — Phase 5: Calendar, Intern flag-only access, Admin settings search, All Allocated Work, firm-wide Partner matter access
- `836892d` — Phase 6: rebrand from "Kapoor & Associates" to "Lexfinster"

## Phase 5 — five gaps the user flagged after reviewing the finished build

Not in the original spec docs — these came from direct user feedback once the base build was live, and are now built, wired, and QA-verified the same way as everything else:

1. **Calendar** (`/calendar`) — a month-grid view of every upcoming hearing and deadline across the matters a user can see, built from the same visibility rule as everywhere else in the app. Entry points: a "Calendar" button on My Day (the homepage) and a "Calendar" item in the sidebar's Home group, for every role.
2. **Intern calendar access, view-only** — Interns previously had no nav path into their granted matters at all. They now get the Calendar item, scoped to only the matters explicitly shared with them. Clicking an event opens a read-only detail plus a "Flag a discrepancy" form (not navigation into the matter, which Interns still have no module access to) — the flag notifies the matter's responsible partner and lands in a resolvable "Discrepancy flags raised" queue shown to Admin/Partner directly on the Calendar page. New `CalendarFlag` entity (`src/data/types.ts`), seed data, and `src/api/calendar.ts`.
3. **Admin settings search** (`/admin`) — a new Admin hub page with a keyword search across every settings screen (Users & Roles, Case Access, Audit Log, Rule Packs, Holiday Calendars, Escalation Rules, Data & Retention, Firm Settings, Document Naming Rules, All Allocated Work, and the three onboarding screens), each entry tagged with search keywords beyond its literal label (e.g. "holiday" also matches on "court closed", "vacation"). Linked as the first item in the Admin nav group.
4. **All Allocated Work** (`/work/all-allocated`, Admin/Partner) — a filterable, searchable table of every task the firm has allocated (or left unallocated) firm-wide, with an inline reassign control per row. This was a real gap: Team Workload only showed aggregate counts per person with no way to see or act on individual tasks, and Allocate Work only handled tasks with no assignee yet — nothing let an Admin see and manage work that was already allocated. Linked from both of those screens.
5. **Firm-wide Partner/Admin matter access** — `rbac.ts`'s `caseAccessLevel()`/`visibleMatterIds()` now give Partner and Admin implicit, unrestricted (`CaseAdmin`-level) access to every matter in the firm with no `CaseAccessGrant` required. This is a deliberate reversal of the original spec's "even an Admin needs an explicit grant" rule (CONFLICTS_AND_ASSUMPTIONS #10), made at the user's explicit request. Everyone below Partner — Associate, Paralegal, Billing Staff, Intern — is unaffected and still needs an explicit grant per matter. The Case Access admin screen's copy was updated to describe the new rule.

Verification for this phase: the full existing regression suite (the 61-route sweep as Admin/Partner plus every other role's complete nav click-through) was re-run against the changed RBAC logic with zero regressions, plus a new phase-5 suite that checks actual outcomes rather than just the absence of console errors — exact matter-count assertions (Partner sees all 8 seeded matters, an Associate sees exactly her 3 assigned ones), a toast/state check that a reassignment in All Allocated Work actually changes the displayed assignee, and a check that resolving a discrepancy flag actually flips its badge and byline.

## Phase 6 — rebrand to "Lexfinster"

The firm's displayed name/logo changed from "Kapoor & Associates" to "Lexfinster" per user request. Three of the four visible brand locations (Sidebar logo, Login screen, Dashboard subtitle) now read live from `firm.name` in the store instead of a hardcoded string — a Firm Settings edit will propagate to all three automatically from here on. The fourth, the page `<title>` and favicon in `index.html`, is a static HTML file and was edited directly. `SEED_VERSION` bumped 8 → 9 so existing browser localStorage reseeds with the new name.

Deliberately left unchanged: the seeded demo person name "Meera Kapoor" and seed email addresses like `meera.kapoor@kapoorassociates.in`. These are internal demo flavor data (a person's surname, an email domain), not the firm's displayed brand — changing them wasn't part of "the logo name" and would have meant inventing a new domain/surname with no basis in the request.

Live artifact republished at the same URL: https://claude.ai/code/artifact/aa1d6a85-0bed-4056-a8eb-51968991d684

## GitHub repository — blocked in this environment

The user asked for a GitHub repo to be created for this project. The sandboxed cloud environment this build runs in has placeholder `GH_TOKEN`/`GITHUB_TOKEN` values that do not authenticate (`gh auth status` reports the token invalid; a raw authenticated API call returns a 502 "builtin injection failed" error), and no GitHub MCP connector is available to fall back on. Repository creation could not be completed automatically from here.

The working tree is a clean, fully-checkpointed git repo (see commit history above) — it just needs a remote and a push. The source was delivered to the user as a zip that includes the `.git` folder so the full history transfers intact; instructions for pushing it themselves were included in the delivery message. Three test-script bugs (not app bugs) were found and fixed along the way: a locator that matched the sidebar's own hint text instead of the modal it was meant to detect, a day-grid iteration that skipped the first calendar week, and a fixed wait that was shorter than the mutation's simulated latency plus its follow-up refetch.

## Everything built and working

Every screen below is real, wired to the mock API, and RBAC-gated where the spec calls for it (route-level `RequireRole`/`RequireDesktopClient` plus in-component gating for actions like recording a conflict decision or changing someone's role). Permission failures render an inline "not permitted" state, never a crash or a silent redirect, per the spec's Group-M pattern.

**Orientation:** Login (role switcher for demo purposes), My Day, Dashboard, Calendar (month view of every upcoming hearing/deadline, view-only + flag-a-discrepancy for Interns), mobile "More" hub.

**Matters:** All Matters list, Kanban Board, Matter Overview, Deadlines tab (with the "why" rule explainer and the override flow with countersign policy), Docket, Orders & Hearings, Matter Documents, Checklist, Client Record (with the "client is also an opposing party elsewhere" conflict warning).

**Intake:** the full three-step wizard — intake type selection (Fresh Case / Appeal-Revision / Reply Required / Existing Mid-Stream), the dynamic form (forum & case identity, client & parties with live per-party conflict checking, limitation-critical dates that change shape per intake type, importance & allocation), and the conflict-resolution gate (any non-clear match requires a Partner/Admin to record a reasoned decision before the matter can be created; a Decline terminates intake with nothing created). A live "proposed deadline chain" preview computes real dates via the shared date engine, including the §12 Limitation Act certified-copy exclusion for appeals.

**Court Data:** Court Data Health (per-forum sync status), Cause Lists, Order Inbox, Order Review (confidence banner, extracted fields, confirm / needs-more-info with a required reason), Manual Upload.

**Work:** Allocate Work (with live assignment-clash checking), My Worklist, Task Create (with linked-deadline and SOP-template selection), Task Execution (full lifecycle: block/resume, submit for review, approve, return with comments, mark complete, two-step confirmation for limitation-linked tasks), Review Queue, Team Workload, All Allocated Work (firm-wide, filterable, reassignable table of every allocated task).

**Documents:** Document Manager, Document Upload (with post-upload extraction review), Document Viewer (annotation toolbar, privacy selector, retry-OCR), Naming Rules admin (token pattern, separator, case style, per-doc-type overrides with live preview), My Drafts, Draft Workspace (draft/share/publish with per-user sharing).

**Forum & Interns:** Forum Index, Ask a Question, Question Detail (answer, Partner-clear, convert-to-research-task), My Research, Research Task Detail (full submission with repeatable citation authorities, accept/return), Clearance Queue, Research Library, Library Entry Detail (with still-good-law review-due flagging).

**Notifications:** Notification Centre (category tabs, mark-read, mark-all-read, escalation chain), Notification Preferences (per-event channel/quiet-hours/override).

**Admin:** Admin Hub (keyword search across every settings screen), Users & Roles (invite, per-row role change with the "reassign Case Admin first" guard, suspend/reactivate/force sign-out, bulk-invite link), Audit Log, Rule Packs, Case Access Management (grant/change/revoke for anyone below Partner), Escalation Rules (per-tier steps and channels), Holiday Calendars, Firm Settings (profile + SOP Templates list + re-run-firm-setup link), SOP Template Editor, Data Retention (DPR request handling).

**Reports & Dashboards:** tabbed index covering all five reports — Deadline Compliance, Matter Pipeline, Workload & Throughput, Court Data Reliability, Hearing Schedule (each row/chip links through to the relevant matter) — plus the standalone At-Risk Matters report.

**Onboarding (the 2-4 screens the brief flagged as never wireframed — designed directly from DATA_MODEL.md/API_DESIGN.md):** Firm Setup (profile wizard + read-only forums-tracked summary), Invite (bulk multi-row invite with live roster), Device Registration (offline-consent flow with the three consent-point explainer).

**Offline & Court Mode (desktop-client only, per spec; gated by `RequireDesktopClient`, honest inline stub otherwise):** Case Bundles (download/keep-longer/remove, with the S-42 Retention Prompt auto-firing when a bundle goes past its auto-delete date and offering keep-annotations/share-annotations/discard-all, or an extend-with-reason override), Court Mode (today's cause-list capture flow — next-date/what-happened/new-direction/flag — with a visible local queue and Sync Now), Sync Conflicts (device-vs-server diff with four resolution actions), Storage Settings (usage display + purge).

## Bugs found and fixed during the build (not cosmetic)

All caught by driving the actual built app with Playwright against a production preview server, never by `tsc`/`vite build` succeeding alone.

1. **Infinite render loop (React error #185) on Docket, Checklist, and Manual Upload.** Cause: a Zustand selector shaped like `useDb((s) => s.someArray.filter(...))` returns a brand-new array reference every call, which React 19's `useSyncExternalStore` treats as "the snapshot keeps changing," crashing the page. Fix: wrap every such selector in `useShallow` from `zustand/react/shallow`. Enforced as a hard rule for the rest of the build — every new file was grepped for this pattern before each phase's checkpoint, with zero reintroductions.
2. **Deadlines silently never seeded for Fresh Case intakes.** Cause: a rule-name case mismatch (`'Written statement'` vs. the seed's `'Written Statement'`). Fixed and generalized into a shared `rulesForIntakeType()` helper so live preview and real seeding can't drift apart again.
3. A smaller bug where the conflict-decision step in Intake mislabelled every non-clear match "Name similarity" because it checked for a `'Blocked'` result the matching engine never produces — fixed to also recognize a "Direct" match in the detail text.
4. **TypeScript**: an improperly-typed `Map` in Case Access (fixed by importing the real `CaseAccessGrant` type), a null-narrowing miss in Court Mode's capture-panel condition (fixed with an explicit `&&` guard), and an awkward duplicated-render pattern in the SOP Template Editor (restructured so the loading/not-found state and the real form are clean siblings rather than overlapping).
5. **Favicon-404 false alarm**: the browser's automatic favicon probe was firing a console error on the very first page load, which a test script's stale error-tracking then misattributed to an unrelated later click. Fixed at the root (added a real inline SVG favicon) rather than just patching the test.

## Key assumptions and decisions carried from the spec docs

- Meera is modeled as both Partner and (for the demo) the firm's sole Admin, per the seed data.
- Countersign policy: an Associate's deadline override requires Partner/Admin countersign; a Partner/Admin override is immediate.
- Conflict checks are advisory-only by design — the system computes a result but a human always makes the call, with a mandatory reason recorded to the audit log.
- Per-matter access for anyone below Partner (Associate, Paralegal, Billing Staff, Intern) is a separate, explicit `CaseAccessGrant` from firm-level role. **Updated in Phase 5**: Partner and Admin now have implicit, firm-wide access to every matter with no grant needed — this reverses the original spec's CONFLICTS_AND_ASSUMPTIONS #10 ("even an Admin needs an explicit grant"), per the user's explicit request once they saw the finished build.
- The conflict-scanning engine is a fuzzy name matcher that returns `Clear` or `PotentialConflict`; `Blocked` exists as a type-level value in the schema but nothing in the spec required a stricter matcher.
- Three onboarding screens (Firm Setup, Invite, Device Registration) were never wireframed in the source docs (confirmed via README.md, CONFLICTS_AND_ASSUMPTIONS.md #8, and schemas.json's `notWireframed` list) — these were designed from `DATA_MODEL.md`'s Firm/User/Device shapes and `API_DESIGN.md`'s auth/firm/users endpoints, matching the "2-4 screens left to create" note in the original instructions.
- A few admin/offline screens are honestly simplified where no matching mutating API exists rather than inventing unsupported functionality: Holiday Calendars only edits existing calendars (no add-new-calendar endpoint); Firm Setup's forums step is read-only (no forums-CRUD endpoint); Storage Settings only displays usage and purges (no update-settings endpoint).

## Final QA (this checkpoint)

A two-pass Playwright script (`final-qa.mjs`) verified the whole app with zero console/page errors:

- **Pass 1** — logged in as Meera (Admin & Partner) and visited 61 routes covering every module: Matters (incl. a specific matter's every tab, the rule explainer, and the override screen), Client Record, Work, Court Data, Documents (incl. a document, upload, naming rules), Drafts (incl. an open draft), Forum (incl. a question, a research task, a library entry), Notifications, Reports (incl. At-Risk), every Admin screen, every onboarding screen, the offline-unavailable stub, and a deliberately-invalid URL to confirm 404 handling — all OK.
- **Pass 2** — logged in as each of the other six seeded users (Vikram/Partner, Rohan & Priya/Associate, Sunita/Paralegal, Kiran/BillingStaff, Aditi/Intern) and clicked through every single sidebar nav item their role actually renders (19 for Partner down to 4 for Intern and BillingStaff), confirming each one loads without error, plus an explicit check that `/admin/users` (all non-Admin roles) and `/documents` (BillingStaff) render a graceful permission-denied state rather than crashing.

One test-script bug was found and fixed during this pass (not an app bug): the per-role login helper queried the sidebar immediately after the URL changed, before React had settled, so it saw 0 nav links; adding a brief settle wait after login fixed the test, and a follow-up manual check confirmed the sidebar was rendering correctly (19 links) the whole time.

## What's left

Nothing from the documented spec. Every screen in the route map — all 63 canonical screens plus the 3 onboarding screens the brief flagged as missing — is built, wired to the mock API, RBAC-gated, and QA-verified end-to-end for every seeded role. The only remaining `PlaceholderRoute` is the generic catch-all 404 route, which is deliberate.

If this continues into a future session, the natural next increments would be: a real backend to replace the mock API layer (per `API_DESIGN.md`/`ARCHITECTURE.md`), native mobile/desktop wrappers for the offline features (currently gated behind a "desktop client" toggle for demo purposes), and expanding the conflict-matching engine beyond fuzzy name matching if the firm's real usage calls for it.
