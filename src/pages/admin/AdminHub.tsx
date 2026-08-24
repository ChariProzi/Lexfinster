import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import {
  Users2, ShieldCheck, ScrollText, Gavel, CalendarDays, Bell, Settings2, FileEdit, ClipboardList, UserPlus, Laptop, ListChecks,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../../components/ui/primitives'
import { Input } from '../../components/ui/form'
import { Section } from '../../components/shared/Layout'

interface SettingsEntry {
  label: string
  description: string
  href: string
  icon: LucideIcon
  keywords: string[]
}

const ENTRIES: SettingsEntry[] = [
  { label: 'Users & Roles', description: 'Invite staff, change a role, suspend or reactivate an account, force sign-out.', href: '/admin/users', icon: Users2, keywords: ['staff', 'role', 'permission', 'invite', 'suspend', 'deactivate', 'account', 'sign out', 'password'] },
  { label: 'Case Access', description: 'Grant, change, or revoke per-matter access for anyone below Partner.', href: '/admin/case-access', icon: ShieldCheck, keywords: ['access', 'grant', 'permission', 'matter', 'case', 'viewer', 'contributor', 'confidential'] },
  { label: 'Audit Log', description: 'Full, insert-only history of every sensitive action in the firm.', href: '/admin/audit-log', icon: ScrollText, keywords: ['audit', 'log', 'history', 'trail', 'who did', 'activity'] },
  { label: 'Rule Packs', description: 'Limitation and deadline computation rules — apply statute updates.', href: '/admin/rule-packs', icon: Gavel, keywords: ['rule', 'limitation', 'deadline', 'statute', 'cpc', 'update', 'version'] },
  { label: 'Holiday Calendars', description: 'Court holidays and vacation periods used in deadline computation.', href: '/admin/holiday-calendars', icon: CalendarDays, keywords: ['holiday', 'vacation', 'court closed', 'calendar', 'working day'] },
  { label: 'Escalation Rules', description: 'Who gets notified, on which channel, and how urgently, per risk tier.', href: '/admin/escalation-rules', icon: Bell, keywords: ['escalation', 'notification', 'sla', 'reminder', 'channel', 'sms', 'email', 'urgent'] },
  { label: 'Data & Retention', description: 'Respond to data-principal (privacy) requests — access, correction, erasure.', href: '/admin/data-retention', icon: ShieldCheck, keywords: ['privacy', 'dpr', 'data principal', 'erasure', 'gdpr', 'dpdp', 'retention', 'delete data'] },
  { label: 'Firm Settings', description: 'Firm profile, contact details, and the SOP template library.', href: '/admin/firm-settings', icon: Settings2, keywords: ['firm', 'profile', 'letterhead', 'sop', 'template', 'checklist template', 'contact'] },
  { label: 'Document Naming Rules', description: 'The token pattern used to auto-name saved documents.', href: '/documents/naming-rules', icon: FileEdit, keywords: ['naming', 'file name', 'document name', 'convention', 'token'] },
  { label: 'All Allocated Work', description: 'Every task the firm has allocated, firm-wide — reassign in one place.', href: '/work/all-allocated', icon: ListChecks, keywords: ['work', 'task', 'allocate', 'assign', 'reassign', 'workload', 'who has what'] },
  { label: 'Bulk Invite', description: 'Invite several new team members at once.', href: '/onboarding/invite', icon: UserPlus, keywords: ['invite', 'onboard', 'new hire', 'staff', 'bulk'] },
  { label: 'Firm Setup', description: 'Re-run the firm profile & forums-tracked setup wizard.', href: '/onboarding/firm-setup', icon: ClipboardList, keywords: ['setup', 'onboarding', 'firm profile', 'forums'] },
  { label: 'Device & Offline Consent', description: 'Register a device and manage offline-mode consent.', href: '/onboarding/device-registration', icon: Laptop, keywords: ['device', 'offline', 'consent', 'desktop client', 'register'] },
]

export default function AdminHub() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return ENTRIES
    return ENTRIES.filter((e) => e.label.toLowerCase().includes(needle) || e.description.toLowerCase().includes(needle) || e.keywords.some((k) => k.includes(needle)))
  }, [q])

  return (
    <div>
      <PageHeader title="Admin" description="Everything you manage for the firm, in one place." />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <Input autoFocus className="w-full pl-9" placeholder="Search settings by keyword — e.g. “holiday”, “role”, “retention”…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Section title={q.trim() ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}` : 'All settings'}>
        {filtered.length === 0 ? (
          <div className="px-3.5 py-6 text-center text-sm text-ink-500">No settings match “{q}”. Try a different word.</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {filtered.map((e) => (
              <button key={e.href} onClick={() => navigate(e.href)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-ink-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-ink-200 bg-surface"><e.icon className="h-4 w-4 text-ink-600" /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink-900">{e.label}</div>
                  <div className="truncate text-xs text-ink-500">{e.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-300" />
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
