import { useEffect, useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

const API = 'https://statelet-counter.albericliu8.workers.dev/feedback'
const PER_PAGE = 10

interface FeedbackItem {
  id: string
  type: string
  message: string
  email: string
  page: string
  created: string
}

const typeColors: Record<string, string> = {
  bug: 'text-[#a63d2e] bg-[#a63d2e]/10',
  feature: 'text-primary bg-primary/10',
  general: 'text-text-muted bg-surface-light',
}

const typeEmoji: Record<string, string> = {
  bug: '🐛',
  feature: '💡',
  general: '💬',
}

export default function FeedbackAdmin() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  function fetchAll() {
    setLoading(true)
    fetch(API)
      .then(r => r.json())
      .then(d => {
        const sorted = (d.feedback || []).sort(
          (a: FeedbackItem, b: FeedbackItem) => new Date(b.created).getTime() - new Date(a.created).getTime()
        )
        setItems(sorted)
        setCurrentPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = window.setTimeout(fetchAll, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function handleDelete(id: string) {
    if (!confirm('Delete this feedback?')) return
    fetch(`${API}/${id}`, { method: 'DELETE' })
      .then(() => setItems(prev => prev.filter(i => i.id !== id)))
      .catch(() => {})
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const pageItems = items.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  return (
    <div className="min-h-screen bg-surface pt-20 pb-16">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text">Feedback</h1>
            <p className="text-sm text-text-muted mt-1">{items.length} total</p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light text-sm text-text-muted hover:text-text transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && items.length === 0 ? (
          <div className="text-center py-20 text-text-muted text-sm">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-text-muted text-sm">No feedback yet</div>
        ) : (
          <>
            <div className="space-y-3">
              {pageItems.map(item => (
                <div key={item.id} className="rounded-xl border border-border-light bg-surface-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeColors[item.type] || typeColors.general}`}>
                          {typeEmoji[item.type] || '💬'} {item.type}
                        </span>
                        <span className="text-[11px] text-text-light">
                          {new Date(item.created).toLocaleString()}
                        </span>
                        {item.page && (
                          <span className="text-[11px] text-text-light font-mono">
                            {item.page}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{item.message}</p>
                      {item.email && (
                        <p className="text-xs text-text-muted mt-2">
                          📧 {item.email}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-text-light hover:text-[#a63d2e] transition-colors shrink-0 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <span className="text-sm text-text-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
