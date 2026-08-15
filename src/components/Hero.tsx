import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Heart } from 'lucide-react'

const editions = {
  lite: {
    badge: 'Lite · Single Binary',
    badgeClass: 'text-accent bg-accent/10',
    install: 'pip install statelet-lite',
    code: `from statelet_lite import AgentMemory

mem = AgentMemory("127.0.0.1:9379", agent_id="agent-1")

obs = mem.observe("User prefers vim keybindings")
act = mem.observe("Switched editor config to vim mode")
mem.link(obs, act, "caused")

for m in mem.recall("editor preferences"):
    print(m.text)`,
  },
  enterprise: {
    badge: 'Enterprise · Distributed',
    badgeClass: 'text-purple bg-purple/10',
    install: 'pip install statelet',
    code: `from statelet import AgentMemory

mem = AgentMemory("statelet-gateway:9379", agent_id="agent-1")

obs = mem.observe("User prefers vim keybindings")
act = mem.observe("Switched editor config to vim mode")
mem.link(obs, act, "caused")

for m in mem.recall("editor preferences"):
    print(m.text)`,
  },
} as const

type EditionKey = keyof typeof editions

export default function Hero() {
  const [edition, setEdition] = useState<EditionKey>('lite')

  return (
    <section aria-label="Statelet - Agent Runtime Data Layer" className="relative pt-28 md:pt-32 pb-10 md:pb-12 bg-surface">
      <div className="relative max-w-[980px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="inline-block mb-7 rounded-full border border-border bg-surface-light px-3.5 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Fair Source (FSL) · Written in Rust
          </span>

          <h1 className="text-[42px] md:text-[68px] font-medium text-text leading-[1.08] mb-6">
            The Agent Runtime
            <span className="block text-primary italic">Data Layer.</span>
          </h1>

          <p className="text-lg md:text-[19px] text-text-muted max-w-[620px] mx-auto mb-8 leading-[1.6] font-normal">
            Give production AI agents durable state, memory, and context without sending
            data to third-party clouds. Query memory declaratively with an openCypher-style
            memory query language, backed by vector recall, temporal graphs, runtime snapshots,
            CDC, and Raft replication.
          </p>

          {/* SEO-rich hidden content for crawlers */}
          <div className="sr-only">
            <h2>Statelet: Agent Runtime Data Layer</h2>
            <p>
              Statelet is a Fair Source distributed database written in Rust — free to use, modify and self-host under the FSL, with each release converting to Apache-2.0 after two years. Source release coming soon.
              It gives AI agents durable memory, context versions, runtime state snapshots,
              an openCypher-style memory query language, vector recall, temporal graph traversal,
              causal memory chains, multi-tenant namespace/database isolation, CDC, Raft consensus,
              Redis RESP2 compatibility, and a management UI. Statelet's server-side memory engine
              scores 91.6% on LongMemEval-S and runs search locally with ONNX embeddings.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://github.com/stateletlab/statelet-longmemeval" target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors">
                View on GitHub
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#features"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:border-primary hover:text-primary transition-colors">
                Learn more
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://github.com/stateletlab/statelet-longmemeval"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-text-muted hover:text-primary transition-colors"
              >
                <Star className="w-4 h-4" />
                Star
              </a>
              <span className="w-px h-4 bg-border" aria-hidden="true" />
              <a
                href="https://github.com/stateletlab/statelet-longmemeval"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-text-muted hover:text-primary transition-colors"
              >
                <Heart className="w-4 h-4" />
                Sponsor
              </a>
            </div>
          </div>
        </motion.div>

        {/* Code preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8 max-w-[640px] mx-auto"
        >
          {/* Deploy in minutes */}
          <div className="mb-5 text-center">
            <p className="text-sm text-text-muted mb-2">Deploy in minutes</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {(Object.keys(editions) as EditionKey[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEdition(key)}
                  aria-pressed={edition === key}
                  className={`flex flex-col items-center gap-1.5 rounded-lg p-1.5 -m-1.5 transition-opacity ${
                    edition === key ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md ${editions[key].badgeClass}`}>
                    {editions[key].badge}
                  </span>
                  <code className={`whitespace-nowrap px-2 py-1 rounded-md bg-surface-light border text-primary font-mono text-[13px] font-medium ${
                    edition === key ? 'border-primary' : 'border-border-light'
                  }`}>
                    {editions[key].install}
                  </code>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-surface-dark overflow-hidden border border-surface-dark">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#9a9089]">agent_memory.py</span>
            </div>
            <pre className="p-6 text-left text-[13px] font-mono leading-[1.7] overflow-x-auto text-[#ede6dc]">
              <code>{editions[edition].code}</code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
