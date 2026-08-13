import { useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Layers } from 'lucide-react'

// Same shape as the AgentMemory primitives: `dsl` is the read-only
// openCypher subset — only lineage carries one, runtime state is
// writes and scans, which the query surface rejects by design.
const pillars = [
  {
    icon: BrainCircuit,
    title: 'Agent Runtime State',
    subtitle: 'Resume instead of replay.',
    description: 'Persist runs, context versions, tool outputs, and memory refs as durable state. One atomic batch commits everything a step produced, a fork checkpoints the timeline before risky steps, and a crashed agent picks up exactly where it stopped — no replaying the whole run.',
    code: `# Everything a step produced, committed atomically
db.batch_write([
  ("put", "run:42:status",      b"in_progress"),
  ("put", "run:42:context_v7",  context_blob),
  ("put", "run:42:tool:search", tool_output),
])

# Checkpoint the timeline before a risky step
checkpoint = db.fork("main", snapshot_from=step_9)

# After a crash: resume, don't replay
state = db.scan_prefix("run:42:")`,
  },
  {
    icon: Layers,
    title: 'Context Lineage',
    subtitle: 'Know what the agent knew.',
    description: 'Beliefs supersede each other instead of overwriting. Expired edges stay queryable, edge history keeps every version, and AS OF queries reconstruct exactly what the agent knew — and which memory replaced which prior belief — at any point in the run.',
    code: `# A new belief supersedes the old — expire,
# don't delete
db.expire_edge(fact_old, ctx, "Informs", now)
db.add_temporal_edge(
  fact_new, ctx, "Informs",
  valid_from=now, valid_to=None,
)

# What did the agent know at step 9?
beliefs = db.traverse_at(
  ctx, ts=t_step_9,
  direction="backward", max_depth=3,
)

# Every version of one belief
history = db.edge_history(fact_old, ctx, "Informs")`,
    dsl: `// The context as it stood mid-run
MATCH (ctx {id:7})<-[:Informs]-(fact) AS OF 1717000, 1720000
RETURN DISTINCT fact.id

// Rank what the agent believed at that instant
CALL db.belief(7, 'backward', 3) YIELD node, score
RETURN node, score
ORDER BY score DESC`,
  },
]

function CodePanel({ code, dsl, title }: { code: string; dsl?: string; title: string }) {
  const [tab, setTab] = useState<'sdk' | 'dsl'>('sdk')
  const active = tab === 'dsl' && dsl ? dsl : code

  return (
    <div className="rounded-xl bg-surface-dark overflow-hidden shadow-sm">
      {dsl && (
        <div role="tablist" aria-label={`${title} code format`} className="flex gap-1 px-3 pt-3">
          {(['sdk', 'dsl'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                tab === t
                  ? 'bg-[#3a342f] text-[#ede6dc]'
                  : 'text-[#b3a89e] hover:text-[#ede6dc]'
              }`}
            >
              {t === 'sdk' ? 'Python' : 'Cypher'}
            </button>
          ))}
        </div>
      )}
      <pre className="p-5 text-[13px] font-mono text-[#ede6dc] leading-[1.65] overflow-x-auto">
        <code>{active}</code>
      </pre>
    </div>
  )
}

export default function RuntimeState() {
  return (
    <section id="runtime" aria-label="Agent Runtime State and Context Lineage - Durable Runs, Snapshots, Supersedes Chains, Time Travel" className="py-24 md:py-32 bg-surface">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-20">
          <p className="eyebrow mb-4">Runtime State</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            Runs that resume.
            <br />Context that explains itself.
          </h2>
          <p className="text-text-muted text-lg max-w-[540px] mx-auto leading-relaxed">
            Runtime state and context lineage share one engine — runs, context versions, and tool outputs persist durably, while temporal supersedes chains record what the agent knew, when it changed, and why.
          </p>
        </div>

        <div className="space-y-16">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
            >
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                    <p.icon className="w-5 h-5 text-text" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text">{p.title}</h3>
                  </div>
                </div>
                <p className="text-primary text-sm font-medium mb-3">{p.subtitle}</p>
                <p className="text-text-muted leading-relaxed text-[15px]">{p.description}</p>
              </div>

              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <CodePanel code={p.code} dsl={p.dsl} title={p.title} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
