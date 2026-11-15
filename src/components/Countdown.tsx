import { useEffect, useState } from 'react'
import { formatCountdown, pad } from '../lib/time'

export function Countdown({ deadlineAt }: { deadlineAt: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const { past, days, hours, minutes, seconds } = formatCountdown(
    deadlineAt,
    now,
  )
  if (past) {
    return (
      <span className="font-mono text-sm font-semibold text-red-400">
        PASSED
      </span>
    )
  }
  return (
    <span className="font-mono text-lg font-semibold tabular-nums text-amber-300">
      {days > 0 && <span>{days}d </span>}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}
