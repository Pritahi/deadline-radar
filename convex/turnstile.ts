import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

// Cloudflare Turnstile - bot protection on the add-tracker form.
// The widget token is verified server-side against Cloudflare's siteverify API
// before the tracker is written.

export const verifyAndAddTracker = action({
  args: {
    boardId: v.id('boards'),
    url: v.string(),
    title: v.string(),
    deadlineAt: v.union(v.number(), v.null()),
    turnstileToken: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const secret = process.env.TURNSTILE_SECRET_KEY
    if (secret) {
      if (!args.turnstileToken) throw new Error('Bot check missing - please retry.')
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: args.turnstileToken }),
      })
      const data = (await res.json()) as { success?: boolean }
      if (!data.success) throw new Error('Bot check failed - please retry.')
    }
    return await ctx.runMutation(api.trackers.add, {
      boardId: args.boardId,
      url: args.url,
      title: args.title,
      deadlineAt: args.deadlineAt,
    })
  },
})
