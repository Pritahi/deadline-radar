import { Countdown } from './Countdown'
import { fullDate, relativeTime } from '../lib/time'

type Tracker = {
  _id: string
  url: string
  title: string
  deadlineAt: number | null
  lastCheckedAt: number | null
  lastChangedAt: number | null
  status: 'ok' | 'error' | 'pending'
  errorMsg: string | null
  checkCount: number
}

const statusDot: Record<Tracker['status'], string> = {
  ok: 'bg-emerald-400',
  error: 'bg-red-400',
  pending: 'bg-amber-400 animate-pulse',
}

export function TrackerCard({
  tracker,
  onRemove,
}: {
  tracker: Tracker
  onRemove: (id: string) => void
}) {
  const host = safeHost(tracker.url)
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur transition hover:border-amber-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDot[tracker.status]}`}
              title={tracker.status}
            />
            <h3 className="truncate font-semibold text-slate-100">
              {tracker.title}
            </h3>
          </div>
          <a
            href={tracker.url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block truncate text-sm text-slate-400 hover:text-amber-300"
          >
            {host}
          </a>
        </div>
        <button
          onClick={() => onRemove(tracker._id)}
          className="rounded-md px-2 py-1 text-xs text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-slate-800 hover:text-red-300"
          title="Stop watching"
        >
          Remove
        </button>
      </div>

      <div className="mt-4">
        {tracker.deadlineAt ? (
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Deadline · {fullDate(tracker.deadlineAt)}
            </div>
            <div className="mt-1">
              <Countdown deadlineAt={tracker.deadlineAt} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Watching for changes, no deadline set
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>
          {tracker.status === 'error'
            ? `Error: ${tracker.errorMsg ?? 'check failed'}`
            : tracker.lastCheckedAt
              ? `Checked ${relativeTime(tracker.lastCheckedAt)} · ${tracker.checkCount} checks`
              : 'First check queued'}
        </span>
        {tracker.lastChangedAt && (
          <span className="text-amber-400/90">
            changed {relativeTime(tracker.lastChangedAt)}
          </span>
        )}
      </div>
    </div>
  )
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname + new URL(url).pathname.slice(0, 40)
  } catch {
    return url
  }
}
