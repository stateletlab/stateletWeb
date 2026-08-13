import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

const REPO = 'stateletlab/statelet-longmemeval'
const GOAL = 1000

export default function StarPledge({ className = '' }: { className?: string }) {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.github.com/repos/${REPO}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d && typeof d.stargazers_count === 'number') setStars(d.stargazers_count)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const pct = stars === null ? 0 : Math.min(100, Math.round((stars / GOAL) * 100))

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full max-w-[420px] mx-auto rounded-xl border border-border bg-surface-light px-5 py-4 text-left hover:border-primary transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text">
          <Star className="w-4 h-4 text-primary" />
          {stars !== null ? stars.toLocaleString() : '—'} / {GOAL.toLocaleString()} stars
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
          Open-source pledge
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-border-light overflow-hidden mb-2"
        role="progressbar"
        aria-label="Progress toward 1,000 GitHub stars"
        aria-valuenow={stars ?? 0}
        aria-valuemin={0}
        aria-valuemax={GOAL}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[13px] text-text-muted leading-relaxed">
        At 1,000 GitHub stars, we open-source the entire Statelet codebase. Star the repo to unlock it.
      </p>
    </a>
  )
}
