import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, ShieldCheck } from 'lucide-react'
import { useDb } from '../../data/db'
import { useSession } from '../../lib/session'
import { login } from '../../api/auth'
import { Button } from '../../components/ui/primitives'
import { Field, Input } from '../../components/ui/form'
import { Avatar } from '../../components/ui/primitives'
import { ROLE_LABEL, displayTitle } from '../../lib/rbac'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Login() {
  const navigate = useNavigate()
  const users = useDb((s) => s.users)
  const sessionLogin = useSession((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doLogin(loginEmail: string) {
    setLoading(true)
    setError(null)
    try {
      const { userId, deviceId } = await login(loginEmail, password || 'demo')
      sessionLogin(userId, deviceId)
      toastSuccess('Signed in.')
      navigate('/today')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.')
      toastError('Sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-ink-200 bg-paper shadow-pop lg:grid lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-ink-900 p-10 text-white lg:flex">
          <div className="flex items-center gap-2 text-lg font-semibold"><Scale className="h-5 w-5" /> Kapoor &amp; Associates</div>
          <div>
            <div className="text-2xl font-semibold leading-snug">Practice Manager</div>
            <p className="mt-3 max-w-xs text-sm text-ink-300">
              Deadline computation from statute, court-data ingestion with a human-gated review step, and a research forum with intern safeguards — built for District Courts, High Courts, NCLT, NCLAT, DRT/DRAT and ITAT practice.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <ShieldCheck className="h-4 w-4" /> Device-aware sign-in · every login is written to the audit log
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h1 className="text-lg font-semibold text-ink-900">Sign in</h1>
          <p className="mt-1 text-sm text-ink-500">Use your firm email. This device will be registered to your account.</p>

          <form
            onSubmit={(e) => { e.preventDefault(); doLogin(email) }}
            className="mt-5 flex flex-col gap-3.5"
          >
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kapoorassociates.in" />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Any password works in this preview" />
            </Field>
            {error && <div className="rounded-md border border-risk-critical-border bg-risk-critical-bg px-3 py-2 text-xs text-risk-critical">{error}</div>}
            <Button type="submit" variant="primary" loading={loading} className="mt-1 justify-center">Sign in</Button>
          </form>

          <div className="mt-7">
            <div className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Demo accounts — one per role</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  disabled={loading}
                  onClick={() => doLogin(u.email)}
                  className="flex items-center gap-2 rounded-md border border-ink-200 px-2.5 py-2 text-left hover:border-ink-900 hover:bg-ink-50 disabled:opacity-50"
                >
                  <Avatar initials={u.initials} size={26} />
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-ink-900">{u.name}</div>
                    <div className="truncate text-[11px] text-ink-500">{displayTitle(u)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-ink-400">Role reference: {Object.values(ROLE_LABEL).join(' · ')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
