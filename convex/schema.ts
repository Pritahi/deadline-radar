import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  boards: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
    createdAt: v.number(),
  }).index('by_slug', ['slug']),

  trackers: defineTable({
    boardId: v.id('boards'),
    url: v.string(),
    title: v.string(),
    deadlineAt: v.union(v.number(), v.null()),
    lastHash: v.union(v.string(), v.null()),
    lastCheckedAt: v.union(v.number(), v.null()),
    lastChangedAt: v.union(v.number(), v.null()),
    status: v.union(v.literal('ok'), v.literal('error'), v.literal('pending')),
    errorMsg: v.union(v.string(), v.null()),
    checkCount: v.number(),
    createdAt: v.number(),
  }).index('by_board', ['boardId']),

  snapshots: defineTable({
    trackerId: v.id('trackers'),
    hash: v.string(),
    excerpt: v.string(),
    createdAt: v.number(),
  }).index('by_tracker', ['trackerId', 'createdAt']),

  events: defineTable({
    boardId: v.id('boards'),
    trackerId: v.union(v.id('trackers'), v.null()),
    type: v.union(
      v.literal('added'),
      v.literal('change'),
      v.literal('error'),
      v.literal('removed'),
    ),
    message: v.string(),
    createdAt: v.number(),
  }).index('by_board', ['boardId', 'createdAt']),

  presence: defineTable({
    boardId: v.id('boards'),
    sessionId: v.string(),
    name: v.string(),
    color: v.string(),
    lastSeen: v.number(),
  })
    .index('by_board', ['boardId', 'lastSeen'])
    .index('by_session', ['sessionId', 'boardId']),
})
