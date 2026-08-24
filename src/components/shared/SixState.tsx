import type { ReactNode } from 'react'
import { Lock, WifiOff, AlertTriangle, RotateCw } from 'lucide-react'
import { Button, Spinner, EmptyState } from '../ui/primitives'
import { PermissionError } from '../../lib/rbac'
import { NetworkOfflineError } from '../../api/client'
import { useNavigate } from 'react-router-dom'

interface QueryLike {
  status: 'pending' | 'error' | 'success'
  error?: unknown
  isFetching?: boolean
}

/**
 * The one generic states wrapper used by every [SR] screen (Populated / Empty /
 * Loading / Error / Offline / Permission-denied). Screens supply their own copy
 * for the empty case; permission-denied and offline render the Group-M pattern
 * automatically from a thrown PermissionError / NetworkOfflineError.
 */
export function SixState({
  query,
  isEmpty,
  emptyState,
  loadingRows = 4,
  onRetry,
  children,
}: {
  query: QueryLike
  isEmpty?: boolean
  emptyState?: ReactNode
  loadingRows?: number
  onRetry?: () => void
  children: ReactNode
}) {
  const navigate = useNavigate()

  if (query.status === 'pending') {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-ink-200 bg-ink-50" />
        ))}
      </div>
    )
  }

  if (query.status === 'error') {
    const err = query.error
    if (err instanceof PermissionError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-300">
            <Lock className="h-4.5 w-4.5 text-ink-600" />
          </div>
          <div className="text-[15px] font-semibold text-ink-900">
            {err.matterExists ? 'You do not have access to this matter' : 'Not found'}
          </div>
          <div className="max-w-md text-sm text-ink-500">
            {err.matterExists
              ? 'The matter exists. Case-level access is granted per matter by its Case Admin. Nothing about the parties, documents or deadlines is shown here.'
              : 'This item does not exist, or has been removed.'}
          </div>
          {err.whoToAsk && (
            <div className="mt-1 w-full rounded-md border border-ink-200 bg-surface px-3 py-2.5 text-left text-[13px]">
              Responsible partner: <b>{err.whoToAsk.name}</b>
              <div className="text-ink-500">Case Admin · request access and state a reason</div>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button variant="primary" onClick={() => navigate(-1)}>Request access</Button>
            <Button variant="secondary" onClick={() => navigate('/matters')}>Back to my matters</Button>
          </div>
          <div className="mt-1 text-xs text-ink-400">This visit is recorded in the audit log.</div>
        </div>
      )
    }
    if (err instanceof NetworkOfflineError) {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-ink-200 bg-paper px-8 py-14 text-center">
          <WifiOff className="h-8 w-8 text-ink-500" />
          <div className="text-[15px] font-semibold text-ink-900">This needs a connection</div>
          <div className="max-w-md text-sm text-ink-500">{err.message} Downloaded data on this device stays available.</div>
          {onRetry && <Button variant="primary" onClick={onRetry}>Try again</Button>}
        </div>
      )
    }
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-risk-critical-border bg-risk-critical-bg px-8 py-12 text-center">
        <AlertTriangle className="h-7 w-7 text-risk-critical" />
        <div className="text-[15px] font-semibold text-ink-900">Something went wrong</div>
        <div className="max-w-md text-sm text-ink-600">{err instanceof Error ? err.message : 'Please try again.'}</div>
        {onRetry && <Button variant="primary" onClick={onRetry}><RotateCw className="h-3.5 w-3.5" />Retry</Button>}
      </div>
    )
  }

  if (isEmpty) {
    return <>{emptyState ?? <EmptyState title="Nothing here yet" description="Once there is data, it will show up here." />}</>
  }

  return <>{children}</>
}
