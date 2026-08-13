import { ArrowRight, Star, Heart } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 md:py-32 bg-surface">
      <div className="max-w-[680px] mx-auto px-6 text-center">
        <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-6">
          Give your agents
          <br />
          <span className="text-primary italic">
            durable state.
          </span>
        </h2>
        <p className="text-text-muted text-lg max-w-[440px] mx-auto mb-10 leading-relaxed">
          Self-hosted. Apache 2.0 licensed. Built for production AI memory.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://github.com/stateletlab/statelet-longmemeval" target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors">
              View on GitHub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="/docs"
              className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline">
              Read the Docs
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/stateletlab/statelet-longmemeval"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light text-sm font-medium text-text hover:border-primary hover:text-primary transition-colors"
            >
              <Star className="w-4 h-4" />
              Star
            </a>
            <a
              href="https://github.com/stateletlab/statelet-longmemeval"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light text-sm font-medium text-text hover:border-primary hover:text-primary transition-colors"
            >
              <Heart className="w-4 h-4" />
              Sponsor
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
