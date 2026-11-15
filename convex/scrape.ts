import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'

// Firecrawl scrape + change detection, runs inside Convex.
export const scrapeTracker = internalAction({
  args: { trackerId: v.id('trackers') },
  handler: async (ctx, args): Promise<void> => {
    const tracker = await ctx.runQuery(internal.scrape.getTracker, {
      trackerId: args.trackerId,
    })
    if (!tracker) return

    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      await ctx.runMutation(internal.scrape.recordError, {
        trackerId: args.trackerId,
        message: 'Firecrawl API key not configured',
      })
      return
    }

    try {
      const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: tracker.url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 200)}`)
      }
      const json = await res.json()
      const markdown: string = json?.data?.markdown ?? ''
      if (!markdown) throw new Error('Empty scrape result')

      // stable content: strip volatile whitespace
      const normalized = markdown.replace(/\s+/g, ' ').trim()
      const hash = await sha256(normalized)
      const excerpt = normalized.slice(0, 2000)

      await ctx.runMutation(internal.scrape.recordResult, {
        trackerId: args.trackerId,
        hash,
        excerpt,
      })
    } catch (e) {
      await ctx.runMutation(internal.scrape.recordError, {
        trackerId: args.trackerId,
        message: e instanceof Error ? e.message : String(e),
      })
    }
  },
})

export const checkDue = internalAction({
  args: {},
  handler: async (ctx): Promise<number> => {
    const due = (await ctx.runMutation(internal.trackers.listDue, {
      olderThanMs: 10 * 60 * 1000,
    })) as Array<Id<'trackers'>>
    for (const trackerId of due) {
      await ctx.runAction(internal.scrape.scrapeTracker, { trackerId })
    }
    return due.length
  },
})

export const getTracker = internalQuery({
  args: { trackerId: v.id('trackers') },
  handler: async (ctx, args) => await ctx.db.get(args.trackerId),
})

export const recordResult = internalMutation({
  args: {
    trackerId: v.id('trackers'),
    hash: v.string(),
    excerpt: v.string(),
  },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.trackerId)
    if (!t) return
    const now = Date.now()
    const changed = t.lastHash !== null && t.lastHash !== args.hash
    if (changed) {
      await ctx.db.insert('snapshots', {
        trackerId: args.trackerId,
        hash: args.hash,
        excerpt: args.excerpt,
        createdAt: now,
      })
      await ctx.db.insert('events', {
        boardId: t.boardId,
        trackerId: args.trackerId,
        type: 'change',
        message: `Change detected on ${t.title}`,
        createdAt: now,
      })
    } else if (t.lastHash === null) {
      // first successful scrape: baseline snapshot
      await ctx.db.insert('snapshots', {
        trackerId: args.trackerId,
        hash: args.hash,
        excerpt: args.excerpt,
        createdAt: now,
      })
    }
    await ctx.db.patch(args.trackerId, {
      lastHash: args.hash,
      lastCheckedAt: now,
      lastChangedAt: changed ? now : t.lastChangedAt,
      status: 'ok',
      errorMsg: null,
      checkCount: t.checkCount + 1,
    })
  },
})

export const recordError = internalMutation({
  args: { trackerId: v.id('trackers'), message: v.string() },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.trackerId)
    if (!t) return
    const now = Date.now()
    await ctx.db.patch(args.trackerId, {
      lastCheckedAt: now,
      status: 'error',
      errorMsg: args.message.slice(0, 300),
      checkCount: t.checkCount + 1,
    })
    await ctx.db.insert('events', {
      boardId: t.boardId,
      trackerId: args.trackerId,
      type: 'error',
      message: `Check failed for ${t.title}: ${args.message.slice(0, 120)}`,
      createdAt: now,
    })
  },
})

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
