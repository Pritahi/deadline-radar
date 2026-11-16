import { useEffect, useRef, useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const FREE_TRACKER_LIMIT = 3
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
  | string
  | undefined

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; theme?: string; callback?: (t: string) => void },
      ) => string
      reset: (id?: string) => void
    }
  }
}

function useVisitorId() {
  const [id] = useState(() => {
    const k = 'dr-visitor-id'
    let v = localStorage.getItem(k)
    if (!v) {
      v = `visitor-${crypto.randomUUID()}`
      localStorage.setItem(k, v)
    }
    return v
  })
  return id
}

export function AddTrackerForm({
  boardId,
  trackerCount,
}: {
  boardId: Id<'boards'>
  trackerCount: number
}) {
  const visitorId = useVisitorId()
  const addTracker = useAction(api.turnstile.verifyAndAddTracker)
  const checkAllowance = useAction(api.autumn.checkTrackerAllowance)
  const attachPro = useAction(api.autumn.attachPro)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [upgrade, setUpgrade] = useState(false)

  const turnstileRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  // Cloudflare Turnstile widget (only when a site key is configured).
  // The container can be replaced by React after hydration/query updates, so
  // poll: whenever the live container is empty, (re)render the widget into it.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    const ensure = () => {
      const el = turnstileRef.current
      if (window.turnstile && el && el.childElementCount === 0) {
        widgetId.current = window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (t) => setTurnstileToken(t),
        })
      }
    }
    if (!window.turnstile && !document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.dataset.turnstile = '1'
      document.head.appendChild(s)
    }
    const t = setInterval(ensure, 500)
    ensure()
    return () => clearInterval(t)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUpgrade(false)
    if (!url.trim()) {
      setError('A URL is required')
      return
    }
    setBusy(true)
    try {
      // Autumn feature gate: free tier is FREE_TRACKER_LIMIT trackers per board.
      const allowance = await checkAllowance({
        customerId: visitorId,
        currentCount: trackerCount,
      })
      if (!allowance.allowed) {
        setUpgrade(true)
        return
      }
      await addTracker({
        boardId,
        url: url.trim(),
        title: title.trim(),
        deadlineAt: deadline ? new Date(deadline).getTime() : null,
        turnstileToken,
      })
      setUrl('')
      setTitle('')
      setDeadline('')
      setTurnstileToken(null)
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add tracker')
    } finally {
      setBusy(false)
    }
  }

  async function upgradeToPro() {
    setBusy(true)
    setError('')
    try {
      const res = await attachPro({ customerId: visitorId })
      if (res.checkoutUrl) {
        window.open(res.checkoutUrl, '_blank', 'noopener')
      } else {
        setError('Checkout is unavailable right now - try again soon.')
      }
    } catch {
      setError('Checkout is unavailable right now - try again soon.')
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
        {TURNSTILE_SITE_KEY && (
          <div ref={turnstileRef} className="min-h-[65px]" />
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {upgrade ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-300">
              Free plan: {FREE_TRACKER_LIMIT} trackers per board
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Go Pro for unlimited trackers and priority checks. Billing and
              entitlements are powered by Autumn.
            </p>
            <button
              type="button"
              onClick={upgradeToPro}
              disabled={busy}
              className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {busy ? 'Opening checkout...' : 'Upgrade to Pro'}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {busy ? 'Adding...' : 'Start watching'}
          </button>
        )}
        <p className="text-[11px] leading-relaxed text-slate-600">
          The page is scraped with Firecrawl and re-checked every 10 minutes.
          Any change appears in the live feed instantly. Free plan includes{' '}
          {FREE_TRACKER_LIMIT} trackers per board; Pro billing by Autumn, bot
          protection by Cloudflare Turnstile.
        </p>
      </div>
    </form>
  )
}
