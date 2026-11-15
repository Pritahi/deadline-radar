import { internalMutation, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

export const listByBoard = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const trackers = await ctx.db
      .query('trackers')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .collect()
    return trackers.sort((a, b) => {
      const da = a.deadlineAt ?? Number.POSITIVE_INFINITY
      const db = b.deadlineAt ?? Number.POSITIVE_INFINITY
      return da - db
    })
  },
})

export const add = mutation({
  args: {
    boardId: v.id('boards'),
    url: v.string(),
    title: v.string(),
    deadlineAt: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    let url = args.url.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    const id = await ctx.db.insert('trackers', {
      boardId: args.boardId,
      url,
      title: args.title.trim() || new URL(url).hostname,
      deadlineAt: args.deadlineAt,
      lastHash: null,
      lastCheckedAt: null,
      lastChangedAt: null,
      status: 'pending',
      errorMsg: null,
      checkCount: 0,
      createdAt: Date.now(),
    })
    await ctx.db.insert('events', {
      boardId: args.boardId,
      trackerId: id,
      type: 'added',
      message: `Now watching ${args.title.trim() || url}`,
      createdAt: Date.now(),
    })
    await ctx.scheduler.runAfter(0, internal.scrape.scrapeTracker, {
      trackerId: id,
    })
    return id
  },
})

export const remove = mutation({
  args: { trackerId: v.id('trackers') },
  handler: async (ctx, args) => {
    const t = await ctx.db.get(args.trackerId)
    if (!t) return
    const snapshots = await ctx.db
      .query('snapshots')
      .withIndex('by_tracker', (q) => q.eq('trackerId', args.trackerId))
      .collect()
    for (const s of snapshots) await ctx.db.delete(s._id)
    await ctx.db.insert('events', {
      boardId: t.boardId,
      trackerId: args.trackerId,
      type: 'removed',
      message: `Stopped watching ${t.title}`,
      createdAt: Date.now(),
    })
    await ctx.db.delete(args.trackerId)
  },
})

export const listDue = internalMutation({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('trackers').collect()
    const cutoff = Date.now() - args.olderThanMs
    return all
      .filter((t) => t.lastCheckedAt === null || t.lastCheckedAt < cutoff)
      .map((t) => t._id)
  },
})
