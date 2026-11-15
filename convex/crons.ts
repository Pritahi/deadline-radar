import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Re-check every tracked page roughly every 10 minutes.
crons.interval('check-due-trackers', { minutes: 10 }, internal.scrape.checkDue)

export default crons
