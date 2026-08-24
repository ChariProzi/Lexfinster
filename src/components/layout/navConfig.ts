import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Sun, FolderKanban, Kanban, CalendarDays, Gavel, ScrollText, ListChecks,
  ClipboardList, Users2, FolderOpen, FileEdit, WifiOff, MessageSquareText, Library, Bell,
  BarChart3, ShieldCheck, Settings2,
} from 'lucide-react'
import type { Role } from '../../data/types'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: 'orderInbox' | 'openQuestions'
  moduleKey: string
  roles?: Role[] // when set, only these roles see the item (in addition to module visibility)
}

export interface NavGroup {
  label: string
  moduleKey: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Home', moduleKey: 'home',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, moduleKey: 'home' },
      { label: 'My Day', href: '/today', icon: Sun, moduleKey: 'home' },
    ],
  },
  {
    label: 'Matters', moduleKey: 'matters',
    items: [
      { label: 'All Matters', href: '/matters', icon: FolderKanban, moduleKey: 'matters' },
      { label: 'Board', href: '/matters/board', icon: Kanban, moduleKey: 'matters' },
      { label: 'New Intake', href: '/matters/new', icon: ClipboardList, moduleKey: 'matters', roles: ['Admin', 'Partner', 'Associate'] },
    ],
  },
  {
    label: 'Court', moduleKey: 'court',
    items: [
      { label: 'Cause Lists', href: '/court/cause-lists', icon: CalendarDays, moduleKey: 'court' },
      { label: 'Order Inbox', href: '/court/order-inbox', icon: Gavel, moduleKey: 'court', badgeKey: 'orderInbox' },
      { label: 'Court Data Health', href: '/court/data-health', icon: ScrollText, moduleKey: 'court' },
    ],
  },
  {
    label: 'Work', moduleKey: 'work',
    items: [
      { label: 'Allocate Work', href: '/work/allocate', icon: ListChecks, moduleKey: 'work', roles: ['Admin', 'Partner'] },
      { label: 'My Worklist', href: '/work/my-worklist', icon: ListChecks, moduleKey: 'work' },
      { label: 'Review Queue', href: '/work/review-queue', icon: ShieldCheck, moduleKey: 'work' },
      { label: 'Team Workload', href: '/work/team-workload', icon: Users2, moduleKey: 'work', roles: ['Admin', 'Partner'] },
    ],
  },
  {
    label: 'Documents', moduleKey: 'documents',
    items: [
      { label: 'Document Manager', href: '/documents', icon: FolderOpen, moduleKey: 'documents' },
      { label: 'My Drafts', href: '/drafts', icon: FileEdit, moduleKey: 'documents' },
    ],
  },
  {
    label: 'Offline (desktop)', moduleKey: 'offline',
    items: [
      { label: 'Case Bundles', href: '/offline/bundles', icon: WifiOff, moduleKey: 'offline' },
      { label: 'Court Mode', href: '/offline/court-mode/current', icon: Gavel, moduleKey: 'offline' },
    ],
  },
  {
    label: 'Forum', moduleKey: 'forum',
    items: [
      { label: 'Open Questions', href: '/forum', icon: MessageSquareText, moduleKey: 'forum', badgeKey: 'openQuestions' },
      { label: 'My Research', href: '/forum/my-research', icon: ClipboardList, moduleKey: 'forum' },
      { label: 'Research Library', href: '/forum/library', icon: Library, moduleKey: 'forum' },
    ],
  },
  {
    label: 'Reports', moduleKey: 'reports',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3, moduleKey: 'reports', roles: ['Admin', 'Partner'] },
    ],
  },
  {
    label: 'Admin', moduleKey: 'admin',
    items: [
      { label: 'Users & Roles', href: '/admin/users', icon: Users2, moduleKey: 'admin' },
      { label: 'Case Access', href: '/admin/case-access', icon: ShieldCheck, moduleKey: 'admin' },
      { label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText, moduleKey: 'admin' },
      { label: 'Rule Packs', href: '/admin/rule-packs', icon: Gavel, moduleKey: 'admin' },
      { label: 'Holiday Calendars', href: '/admin/holiday-calendars', icon: CalendarDays, moduleKey: 'admin' },
      { label: 'Escalation Rules', href: '/admin/escalation-rules', icon: Bell, moduleKey: 'admin' },
      { label: 'Data & Retention', href: '/admin/data-retention', icon: ShieldCheck, moduleKey: 'admin' },
      { label: 'Firm Settings', href: '/admin/firm-settings', icon: Settings2, moduleKey: 'admin' },
    ],
  },
]

export const MOBILE_TABS = [
  { key: 'today', label: 'Today', href: '/today', icon: Sun },
  { key: 'matters', label: 'Matters', href: '/matters', icon: FolderKanban },
  { key: 'work', label: 'Work', href: '/work/my-worklist', icon: ListChecks },
  { key: 'more', label: 'More', href: '/more', icon: Settings2 },
]
