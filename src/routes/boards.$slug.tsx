import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { TrackerCard } from '../components/TrackerCard'
import { EventFeed } from '../components/EventFeed'
import { AddTrackerForm } from '../components/AddTrackerForm'
import { PresenceBar } from '../components/PresenceBar'

export const Route = createFileRoute('/boards/$slug')({ component: BoardPage })

function BoardPage() {
  const { slug } = Route.useParams()
  const board = useQuery(api.boards.getBySlug, { slug })
  const trackers = useQuery(
    api.trackers.listByBoard,
    board ? { boardId: board._id } : 'skip',
  )
  const events = useQuery(
    api.events.listByBoard,
    board ? { boardId: board._id, limit: 50 } : 'skip',
  )
  const remove = useMutation(api.trackers.remove)

  if (board === undefined) {
    return (
      <Shell>
        <p className="py-24 text-center text-slate-500">Loading board...</p>
      </Shell>
    )
  }
  if (board === null) {
    return (
      <Shell>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold text-slate-200">
            Board not found
          </h1>
          <p className="mt-2 text-slate-500">
            This board does not exist yet.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-950"
          >
            Back home
          </Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {board.name}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            {board.description}
          </p>
        </div>
        <PresenceBar boardId={board._id} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {trackers === undefined && (
            <p className="text-sm text-slate-500">Loading trackers...</p>
          )}
          {trackers?.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
              Nothing watched yet. Add the first page on the right.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {trackers?.map((t) => (
              <TrackerCard
                key={t._id}
                tracker={t}
                onRemove={(id) => void remove({ trackerId: id as Id<'trackers'> })}
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <AddTrackerForm boardId={board._id} trackerCount={trackers?.length ?? 0} />
          <EventFeed events={events ?? []} />
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Deadline Radar
          </span>
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">{children}</main>
    </div>
  )
}
