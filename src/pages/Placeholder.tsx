import { Construction } from 'lucide-react'
import { PageHeader } from '../components/ui/primitives'

export function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink-300 bg-paper px-8 py-16 text-center">
        <Construction className="h-6 w-6 text-ink-400" />
        <div className="text-sm text-ink-500">This screen is on the build list and isn't wired up yet in this preview.</div>
      </div>
    </div>
  )
}

export default function PlaceholderRoute() {
  return <Placeholder title="Coming soon" />
}
