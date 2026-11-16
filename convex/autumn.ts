import { action } from './_generated/server'
import { v } from 'convex/values'

// Autumn (useautumn.com) - billing partner integration.
// Powers the Pro plan: feature gating (tracker limits) + checkout attach.
// Free tier: up to 3 trackers per board. Pro: unlimited trackers + priority checks.

const AUTUMN_API = 'https://api.useautumn.com/v1'

export const FREE_TRACKER_LIMIT = 3

async function autumnPost(path: string, body: Record<string, unknown>) {
  const key = process.env.AUTUMN_SECRET_KEY
  if (!key) return { ok: false as const, status: 0, data: { error: 'autumn_not_configured' } }
  const res = await fetch(`${AUTUMN_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

// Check whether a customer can add another tracker (feature_id: "trackers").
export const checkTrackerAllowance = action({
  args: { customerId: v.string(), currentCount: v.number() },
  handler: async (_ctx, args) => {
    // Local free-tier gate first - no network call needed under the limit.
    if (args.currentCount < FREE_TRACKER_LIMIT) {
      return { allowed: true, pro: false, remaining: FREE_TRACKER_LIMIT - args.currentCount }
    }
    const res = await autumnPost('/check', {
      customer_id: args.customerId,
      feature_id: 'trackers',
    })
    if (!res.ok) {
      // If Autumn is unreachable or not configured, stay on free limits.
      return { allowed: false, pro: false, remaining: 0, autumnStatus: res.status }
    }
    const d = res.data as { allowed?: boolean; balance?: number; unlimited?: boolean }
    return {
      allowed: d.allowed ?? false,
      pro: true,
      remaining: d.unlimited ? null : (d.balance ?? null),
    }
  },
})

// Start a Pro checkout. Returns Autumn's hosted checkout URL (Stripe sandbox in test mode).
export const attachPro = action({
  args: { customerId: v.string() },
  handler: async (_ctx, args) => {
    const res = await autumnPost('/attach', {
      customer_id: args.customerId,
      product_id: 'pro',
    })
    if (!res.ok) return { checkoutUrl: null, error: JSON.stringify(res.data) }
    const d = res.data as { checkout_url?: string }
    return { checkoutUrl: d.checkout_url ?? null }
  },
})

// Record a successful checkout return (called from the /pro/success route).
export const getProStatus = action({
  args: { customerId: v.string() },
  handler: async (_ctx, args) => {
    const res = await autumnPost('/check', {
      customer_id: args.customerId,
      feature_id: 'trackers',
    })
    if (!res.ok) return { pro: false }
    const d = res.data as { allowed?: boolean }
    return { pro: d.allowed ?? false }
  },
})
