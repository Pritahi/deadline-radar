import { query } from './_generated/server'
import { v } from 'convex/values'

export const listByBoard = query({
  args: { boardId: v.id('boards'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_board', (q) => q.eq('boardId', args.boardId))
      .order('desc')
      .take(args.limit ?? 50)
    return events
  },
})
