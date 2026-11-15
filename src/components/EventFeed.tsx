import { relativeTime } from '../lib/time'

type Event = {
  _id: string
  type: 'added' | 'change' | 'error' | 'removed'
  message: string
  createdAt: number
}

const icon: Record<Event['type'], string> = {
  added: 'text-emerald-400',
  change: 'text-amber-400',
  error: 'text-red-400',
  removed: 'text-slate-500',
}

const label: Record<Event['type'], string> = {
  added: 'WATCH',
  change: 'CHANGE',
  error: 'ERROR',
  removed: 'STOP',
}

export function EventFeed({ events }: { events: Event[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Live activity
      </h2>
      <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {events.length === 0 && (
          <p className="text-sm text-slate-500">
            Nothing yet. Activity appears here in real time.
          </p>
        )}
        {events.map((e) => (
          <div key={e._id} className="flex gap-3 text-sm">
            <span
              className={`mt-0.5 font-mono text-[10px] font-bold ${icon[e.type]}`}
            >
              {label[e.type]}
            </span>
            <div className="min-w-0">
              <p className="break-words text-slate-300">{e.message}</p>
              <p className="text-xs text-slate-600">
                {relativeTime(e.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
