import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/')({ component: Home })

const INTEGRATIONS = [
  'TanStack Start',
  'Convex',
  'Firecrawl',
  'Netlify',
  'Sentry',
  'Cloudflare',
  'Autumn',
  'CodeRabbit',
]

const FEATURES = [
  {
    title: 'Realtime change detection',
    body: 'Pages are scraped with Firecrawl and hashed in a Convex action. The moment a page changes, every open board updates live - no refresh, no polling from the client.',
  },
  {
    title: 'Live countdowns',
    body: 'Deadlines tick down to the second on every card, streamed over a Convex realtime query. When a deadline passes, the board flips it to PASSED for everyone at once.',
  },
  {
    title: 'Collaborative boards',
    body: 'Boards are shared by link. Presence heartsbeats show who is watching right now, and a live activity feed narrates every add, change and error.',
  },
  {
    title: 'Server-side everything',
    body: 'Built on TanStack Start server functions and SSR, with a Convex backend, Sentry tracing, Netlify edge deploys and a Cloudflare cron fallback.',
  },
]

function Home() {
  const boards = useQuery(api.boards.listPublic)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Deadline Radar
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-slate-400">
          <Link to="/boards/$slug" params={{ slug: 'ai-hackathons' }} className="hover:text-amber-300">
            Live board
          </Link>
          <a href="#how" className="hover:text-amber-300">
            How it works
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-400">
              Realtime page monitor
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Watch any page.
              <br />
              Never miss a <span className="text-amber-400">deadline</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-400">
              Deadline Radar tracks contest pages, launches and docs. When a
              rule changes or a countdown gets close, your whole board sees it
              at the same second.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/boards/$slug"
                params={{ slug: 'ai-hackathons' }}
                className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Open the live board
              </Link>
              <a
                href="#how"
                className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:border-amber-500/50 hover:text-amber-300"
              >
                How it works
              </a>
            </div>
          </div>
          <RadarVisual />
        </section>

        <section className="border-t border-slate-800 py-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Live public boards
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {boards === undefined && (
              <p className="text-sm text-slate-500">Loading boards...</p>
            )}
            {boards?.length === 0 && (
              <p className="text-sm text-slate-500">
                No public boards yet - the first one is being set up.
              </p>
            )}
            {boards?.map((b) => (
              <Link
                key={b._id}
                to="/boards/$slug"
                params={{ slug: b.slug }}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-amber-500/40"
              >
                <h3 className="font-semibold text-slate-100">{b.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                  {b.description}
                </p>
                <p className="mt-3 text-xs text-amber-400/90">
                  {b.trackerCount} pages watched
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section id="how" className="border-t border-slate-800 py-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            How it works
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <h3 className="font-semibold text-amber-300">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-800 py-10">
          <p className="text-center text-xs uppercase tracking-widest text-slate-600">
            Built with
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {INTEGRATIONS.map((name) => (
              <span
                key={name}
                className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-sm text-slate-300"
              >
                {name}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-600">
        Deadline Radar - a TanStack Start Hackathon entry. Watch pages, beat
        deadlines.
      </footer>
    </div>
  )
}

function RadarVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div className="absolute inset-0 rounded-full border border-slate-800" />
      <div className="absolute inset-[15%] rounded-full border border-slate-800" />
      <div className="absolute inset-[30%] rounded-full border border-slate-800" />
      <div className="absolute inset-[45%] rounded-full border border-slate-800" />
      <div
        className="absolute inset-0 animate-[spin_4s_linear_infinite] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(245,158,11,0.5), transparent 60deg)',
        }}
      />
      <span className="absolute left-[62%] top-[30%] h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
      <span className="absolute left-[38%] top-[58%] h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
      <span className="absolute left-[55%] top-[70%] h-2 w-2 animate-pulse rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.9)]" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-slate-800 bg-slate-950/80 px-4 py-1 font-mono text-xs text-amber-300">
        3 signals tracked
      </div>
    </div>
  )
}
