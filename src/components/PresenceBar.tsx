import { useEffect, useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const ANIMALS = [
  'Falcon', 'Otter', 'Lynx', 'Heron', 'Badger', 'Fox', 'Owl', 'Wolf',
  'Crane', 'Raven', 'Viper', 'Puma',
]
const COLORS = [
  '#f59e0b', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#f87171',
  '#fbbf24', '#2dd4bf',
]

function getSession() {
  if (typeof window === 'undefined')
    return { sessionId: 'ssr', name: 'Watcher', color: COLORS[0] }
  let raw = window.localStorage.getItem('dr-session')
  if (!raw) {
    const s = {
      sessionId: Math.random().toString(36).slice(2, 12),
      name: `${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}-${Math.floor(Math.random() * 90 + 10)}`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }
    raw = JSON.stringify(s)
    window.localStorage.setItem('dr-session', raw)
  }
  return JSON.parse(raw) as { sessionId: string; name: string; color: string }
}

export function PresenceBar({ boardId }: { boardId: Id<'boards'> }) {
  const session = useMemo(getSession, [])
  const watchers = useQuery(api.presence.watchers, { boardId })
  const heartbeat = useMutation(api.presence.heartbeat)
  const leave = useMutation(api.presence.leave)

  useEffect(() => {
    void heartbeat({ boardId, ...session })
    const t = setInterval(() => void heartbeat({ boardId, ...session }), 10_000)
    const onUnload = () => void leave({ boardId, sessionId: session.sessionId })
    window.addEventListener('beforeunload', onUnload)
    return () => {
      clearInterval(t)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [boardId, heartbeat, leave, session])

  const count = watchers?.length ?? 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {(watchers ?? []).slice(0, 6).map((w) => (
          <span
            key={w._id}
            title={w.name}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-950 text-[10px] font-bold text-slate-950"
            style={{ backgroundColor: w.color }}
          >
            {w.name.slice(0, 2).toUpperCase()}
          </span>
        ))}
      </div>
      <span className="text-xs text-slate-400">
        <span className="font-semibold text-emerald-400">{count}</span>{' '}
        watching now
      </span>
    </div>
  )
}
