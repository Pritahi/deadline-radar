# Deadline Radar

Watch any page. Never miss a deadline.

Deadline Radar is a realtime, collaborative page monitor built for the
**TanStack Start Hackathon**. Add any URL to a shared board - a contest page,
a launch page, a docs changelog - and Deadline Radar re-checks it every 10
minutes. When the page changes, every open board updates in the same second.
Deadlines tick down live, and presence shows who is watching with you.

**Live app:** https://deadline-radar.netlify.app
**Demo board:** https://deadline-radar.netlify.app/boards/ai-hackathons

## What it does

- **Realtime change detection** - pages are scraped with Firecrawl and hashed
  inside a Convex action. A changed hash writes a new snapshot and a live
  event; clients see it instantly over Convex's reactive queries.
- **Live countdowns** - every tracker can carry a deadline. Countdowns tick
  to the second on every connected client and flip to PASSED together.
- **Collaborative boards** - boards are shared by link. Presence heartbeats
  (a Convex mutation every 10s) show who is watching right now, and a live
  activity feed narrates every add, change and error.
- **Add anything** - paste a URL, an optional label and an optional deadline.
  The first scrape runs seconds later.

## How it is built

| Layer | Tech |
| --- | --- |
| Framework | TanStack Start (React, file-based routing, SSR, server functions) |
| Backend | Convex (schema, queries, mutations, actions, scheduler, crons) |
| Scraping | Firecrawl `/v2/scrape` (markdown, main content only) |
| Hosting | Netlify (SSR via Netlify Functions, edge CDN) |
| Monitoring | Sentry (`@sentry/tanstackstart-react`, server + client tracing, verified live) |
| Bot protection | Cloudflare Turnstile (widget on the add form, token verified server-side via siteverify before any write) |
| Billing (demo) | Autumn (free plan limited to 3 trackers/board; Pro upgrade via Autumn feature checks + hosted Stripe checkout) |

### Architecture

1. `trackers.add` (Convex mutation) inserts a tracker and schedules
   `scrape.scrapeTracker` immediately.
2. `scrape.scrapeTracker` (Convex action) calls Firecrawl, normalizes the
   markdown, SHA-256 hashes it, and compares against the stored hash.
3. On change it writes a `snapshots` row and an `events` row; the board's
   `useQuery` subscriptions push both to every open client in realtime.
4. A Convex cron (`crons.interval`, 10 minutes) fans out re-checks for every
   tracker due.
5. Presence is a heartbeat mutation + a query over rows seen in the last 30
   seconds; stale rows are reaped on every heartbeat.

## Run it locally

```bash
npm install
# .env.local needs:
#   VITE_CONVEX_URL=<your convex deployment url>
npx convex deploy --url <your convex deployment url> --admin-key <key> --yes
npx convex env set FIRECRAWL_API_KEY <your firecrawl key> --url <url> --admin-key <key>
npm run dev
```

Deploy to Netlify with `netlify deploy --build --prod` (build command
`vite build`, publish `dist/client`).

## Hackathon notes

- New app, started November 15, 2026 (after the October 29 start date).
- Uses TanStack Start + Convex plus cohost/partner integrations: Firecrawl
  (core scraping), Netlify (hosting), Sentry (error monitoring, verified
  end-to-end), Autumn (Pro plan feature gating + checkout, verified against a
  live Stripe sandbox session), Cloudflare Turnstile (bot protection, verified
  server-side).
- Free plan allows 3 trackers per board; hitting the limit surfaces the
  Autumn-powered Pro upgrade card ($9/month, test-mode checkout).
- Video demo: linked in the submission.
