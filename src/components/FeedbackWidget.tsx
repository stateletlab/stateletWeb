import { useState } from 'react'
import { MessageSquare, X, Send, Check } from 'lucide-react'

const FEEDBACK_API = 'https://statelet-counter.albericliu8.workers.dev/feedback'
const FEEDBACK_RECIPIENT = 'stateletlab@gmail.com'

const types = [
  { value: 'bug', label: 'Bug', emoji: '🐛' },
  { value: 'feature', label: 'Feature', emoji: '💡' },
  { value: 'general', label: 'General', emoji: '💬' },
]

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')

  function archiveFeedback(trimmedMessage: string) {
    fetch(FEEDBACK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        message: trimmedMessage,
        email: email.trim(),
        recipient: FEEDBACK_RECIPIENT,
        page: window.location.hash || '/',
      }),
    }).catch(() => {})
  }

  function buildEmailUrl(trimmedMessage: string) {
    const page = window.location.href
    const subject = `[Statelet feedback] ${type}`
    const body = [
      `Type: ${type}`,
      email.trim() ? `From: ${email.trim()}` : '',
      `Page: ${page}`,
      '',
      trimmedMessage,
    ].filter(Boolean).join('\n')

    return `mailto:${FEEDBACK_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    archiveFeedback(trimmedMessage)
    window.location.href = buildEmailUrl(trimmedMessage)
    setStatus('sent')
    setTimeout(() => {
      setOpen(false)
      setStatus('idle')
      setMessage('')
      setEmail('')
      setType('general')
    }, 2500)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>

      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] rounded-xl bg-surface-card border border-border-light overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text">Send Feedback</h3>
            <p className="text-xs text-text-light mt-0.5">Help us improve Statelet</p>
          </div>

          {status === 'sent' ? (
            <div className="px-5 py-10 text-center">
              <Check className="w-10 h-10 text-accent mx-auto mb-3" />
              <p className="text-sm font-medium text-text">Thank you!</p>
              <p className="text-xs text-text-muted mt-1">Your email draft has been opened.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                {types.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      type === t.value
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-surface-light text-text-muted border border-transparent hover:text-text'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                required
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-border-light bg-surface text-sm text-text placeholder:text-text-light/60 resize-none focus:outline-none focus:border-primary/40 transition-colors"
              />

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (optional, for follow-up)"
                className="w-full px-3 py-2.5 rounded-xl border border-border-light bg-surface text-sm text-text placeholder:text-text-light/60 focus:outline-none focus:border-primary/40 transition-colors"
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={!message.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Send Feedback
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
