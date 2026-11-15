import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db
      .query('boards')
      .filter((q) => q.eq(q.field('isPublic'), true))
      .collect()
    const withCounts = await Promise.all(
      boards.map(async (b) => {
        const trackers = await ctx.db
          .query('trackers')
          .withIndex('by_board', (q) => q.eq('boardId', b._id))
          .collect()
        return { ...b, trackerCount: trackers.length }
      }),
    )
    return withCounts.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('boards')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('boards')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert('boards', { ...args, createdAt: Date.now() })
  },
})
