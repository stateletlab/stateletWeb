import { useState } from 'react'
import { Menu, X, Database, Github } from 'lucide-react'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#performance', label: 'Performance' },
  { href: '#agent', label: 'Agent Memory' },
  { href: '#runtime', label: 'Runtime State' },
  { href: '#sdks', label: 'SDKs' },
  { href: '/docs/', label: 'Docs' },
]

/** If on a sub-page (#/admin/feedback), go home first then scroll to anchor */
function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith('/')) return // external like /docs/
  const isSubPage = window.location.hash.startsWith('#/')
  if (isSubPage) {
    e.preventDefault()
    window.location.hash = ''
    // After React re-renders the home page, scroll to the anchor
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const id = href.replace('#', '')
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    })
  }
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/95 supports-[backdrop-filter]:bg-surface/80 backdrop-blur-sm border-b border-border-light">
      <div className="max-w-[980px] mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-text font-serif font-medium text-[15px]">
          <Database className="w-[18px] h-[18px] text-primary" />
          Statelet
        </a>

        <div className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <a key={l.href} href={l.href}
              onClick={(e) => handleAnchorClick(e, l.href)}
              className="text-[13px] text-text-muted hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
          <a href="https://github.com/stateletlab/statelet-longmemeval" target="_blank" rel="noopener noreferrer"
            aria-label="Statelet on GitHub"
            className="text-text-muted hover:text-primary transition-colors">
            <Github className="w-4 h-4" />
          </a>
        </div>

        <button className="md:hidden text-text-muted" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border-light bg-surface px-6 py-5 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href}
              onClick={(e) => { handleAnchorClick(e, l.href); setOpen(false) }}
              className="text-sm text-text-muted hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
          <a href="https://github.com/stateletlab/statelet-longmemeval" target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2">
            <Github className="w-4 h-4" /> GitHub
          </a>
        </div>
      )}
    </nav>
  )
}
