import { Database } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border-light py-8 bg-surface-light">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-text-light" />
            <span className="text-sm font-medium text-text-muted">Statelet</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-text-light">
            <a href="https://github.com/stateletlab/statelet-longmemeval" target="_blank" rel="noopener noreferrer"
              className="hover:text-text transition-colors">GitHub</a>
            <a href="/docs" className="hover:text-text transition-colors">Documentation</a>
            <a href="mailto:stateletlab@gmail.com" className="hover:text-text transition-colors">Contact</a>
          </div>

          <div className="text-xs text-text-light">
            Apache 2.0 License
          </div>
        </div>
      </div>
    </footer>
  )
}
