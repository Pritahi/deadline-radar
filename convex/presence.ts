import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const STALE_MS = 30_000

export const heartbeat = mutation({
  args: {
    boardId: v.id('boards'),
    sessionId: v.string(),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    // clean stale presence rows for this board
    const stale = await ctx.db
      .query('presence')
      .withIndex('by_board', (q) =>
        q.eq('boardId', args.boardId).lt('lastSeen', now - STALE_MS),
      )
      .collect()
    for (const p of stale) await ctx.db.delete(p._id)

    const mine = await ctx.db
      .query('presence')
      .withIndex('by_session', (q) =>
        q.eq('sessionId', args.sessionId).eq('boardId', args.boardId),
      )
      .unique()
    if (mine) {
      await ctx.db.patch(mine._id, { lastSeen: now })
    } else {
      await ctx.db.insert('presence', { ...args, lastSeen: now })
    }
  },
})

export const leave = mutation({
  args: { boardId: v.id('boards'), sessionId: v.string() },
  handler: async (ctx, args) => {
    const mine = await ctx.db
      .query('presence')
      .withIndex('by_session', (q) =>
        q.eq('sessionId', args.sessionId).eq('boardId', args.boardId),
      )
      .unique()
    if (mine) await ctx.db.delete(mine._id)
  },
})

export const watchers = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - STALE_MS
    return await ctx.db
      .query('presence')
      .withIndex('by_board', (q) =>
        q.eq('boardId', args.boardId).gt('lastSeen', cutoff),
      )
      .collect()
  },
})
