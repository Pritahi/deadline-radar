import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function AddTrackerForm({ boardId }: { boardId: Id<'boards'> }) {
  const add = useMutation(api.trackers.add)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!url.trim()) {
      setError('A URL is required')
      return
    }
    setBusy(true)
    try {
      await add({
        boardId,
        url: url.trim(),
        title: title.trim(),
        deadlineAt: deadline ? new Date(deadline).getTime() : null,
      })
      setUrl('')
      setTitle('')
      setDeadline('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add tracker')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Watch a new page
      </h2>
      <div className="mt-3 space-y-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/contest"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Label (optional, e.g. TanStack Hackathon)"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500"
        />
        <label className="block text-xs text-slate-500">
          Deadline (optional)
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
          />
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {busy ? 'Adding...' : 'Start watching'}
        </button>
        <p className="text-[11px] leading-relaxed text-slate-600">
          The page is scraped with Firecrawl and re-checked every 10 minutes.
          Any change appears in the live feed instantly.
        </p>
      </div>
    </form>
  )
}
