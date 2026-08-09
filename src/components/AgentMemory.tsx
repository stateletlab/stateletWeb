import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Network, Eye, Merge, Clock, Terminal } from 'lucide-react'

// `dsl` is the read-only openCypher subset the gateway accepts on GraphQuery.
// Only the read-shaped primitives carry one — fork/merge and CAS/watch are
// writes and streams, which the query surface rejects by design.
const primitives = [
  {
    icon: Terminal,
    title: 'Memory Query DSL',
    subtitle: 'Recall memory declaratively.',
    description: 'One read-only openCypher subset over every memory primitive — MATCH, WHERE, RETURN, ORDER BY, LIMIT, aggregation, and CALL db.* procedures. Writes are rejected at parse time, and EXPLAIN returns the planner\'s leaf ordering without executing.',
    code: `result = db.graph_query("""
  MATCH (observe {id: 1})-[:Triggers*1..10]->(effect)
  RETURN DISTINCT effect
  LIMIT 100
""")

print(result.columns)       # ['effect']
for row in result.dicts():  # decoded node props
  print(row["effect"])

# Non-empty when the result may be incomplete
for w in result.warnings:
  print("warning:", w)`,
    dsl: `// Filter, aggregate, and sort a subgraph
MATCH (a {id:1})-[:Informs]->(b)
WHERE b.agent_id = 'agent-1'
  AND b.step_type IN ['Think', 'Act']
RETURN b.step_type, count(*) AS steps
ORDER BY steps DESC
LIMIT 20

// Inspect the plan without running the query
EXPLAIN MATCH (a {id:1})-[:Triggers*1..3]->(b)
RETURN b`,
    // The DSL is the subject here — open on Cypher, not the SDK call that runs it.
    dslFirst: true,
  },
  {
    icon: Network,
    title: 'Causal Graph',
    subtitle: 'Track every reasoning step.',
    description: 'Record agent actions as nodes in a DAG with five step types: Observe, Think, Act, Tool, Result. Link them with semantic edges — Triggers, Informs, Branches, Merges. Full BFS traversal for complete explainability.',
    code: `step_1 = db.add_step(
  "agent-1", "Think",
  content=b"Analyzing signals...",
)
db.add_edge(step_1, step_2, "Triggers")

result = db.traverse(
  step_1, direction="forward", max_depth=3,
)`,
    dsl: `// Steps reachable from step 1 over Triggers,
// up to 3 hops
MATCH (a {id:1})-[:Triggers*1..3]->(b)
RETURN DISTINCT b
LIMIT 50

// Narrow it with a property predicate
MATCH (a {id:1})-[:Informs]->(b)
WHERE b.agent_id = 'agent-1'
RETURN b.step_type, b.timestamp
ORDER BY b.timestamp DESC`,
  },
  {
    icon: Clock,
    title: 'Temporal Graph',
    subtitle: 'Time-aware reasoning.',
    description: 'Edges carry validity intervals [valid_from, valid_to]. Query the edges active at a point in time or inside a window, expire edges without deletion, and retrieve full edge history across versions.',
    code: `# Validity interval lives on the edge
db.add_edge(
  step_1, step_2, "Informs",
  valid_from=t0, valid_to=t1,
)

# Edges active at a point in time
edges = db.get_edges(
  step_1, at_timestamp=now,
  direction="forward",
)

# Expire without deleting, then read history
db.expire_edge(step_1, step_2, "Informs", now)
history = db.edge_history(step_1, step_2, "Informs")`,
    dsl: `// Bitemporal point-in-time: AS OF <valid>, <tx>
// Node props aren't bitemporal yet, so project ids
MATCH (a {id:1})-[:Informs]->(b) AS OF 1717000, 1720000
RETURN DISTINCT b.id

// Belief traversal at that same instant
CALL db.belief(1, 'forward', 3) YIELD node, score
RETURN node, score
ORDER BY score DESC`,
  },
  {
    icon: GitBranch,
    title: 'Fork & Branch',
    subtitle: 'Explore alternate paths.',
    description: 'Create lightweight state branches with copy-on-write overlays. Zero data duplication. Agents explore alternative reasoning paths. Merge winning branches back atomically.',
    code: `# parent_branch_id=0 forks the main timeline
branch = db.fork("strategy-b", parent_branch_id=0)

db.branch_put(branch, "strategy", b"aggressive")
value = db.branch_get(branch, "strategy")

# Merge back if successful
db.merge_branch(branch)`,
  },
  {
    icon: Eye,
    title: 'Reactive Watches',
    subtitle: 'Real-time state changes.',
    description: 'Compare-and-swap for optimistic concurrency. Watch key prefixes for instant notifications via server-streaming gRPC.',
    code: `# Optimistic locking
result = db.cas_put(
  "state", expected_seq=42, new_value=new_val,
)

# Server-streaming watch on a key prefix
for event in db.watch_prefix("agent-1", "state:"):
  print(event.key, event.value)`,
  },
  {
    icon: Merge,
    title: 'Similarity Search',
    subtitle: 'Learn from history.',
    description: 'Attach vector embeddings to reasoning steps. Find similar past chains via KNN search, then BFS to assemble full reasoning contexts. Agents learn from their own experience.',
    code: `# Find similar reasoning chains
chains = db.find_similar_chains(
  current_vector,
  k=5,          # chains to return
  chain_depth=3,  # BFS depth per anchor
)`,
    dsl: `// kNN over the graph's vector index,
// then expand the winners
CALL db.vectorSearch([0.12, 0.44, 0.07], 5)
  YIELD node, score
MATCH (node)-[:Triggers*1..3]->(b)
RETURN node, score, b
ORDER BY score DESC

// Or one-shot vector-seed + graph-expand
CALL db.graphRag([0.12, 0.44, 0.07], 5, 0, 2)
  YIELD node, score
RETURN node, score`,
  },
]

function CodePanel({ code, dsl, title, dslFirst }: { code: string; dsl?: string; title: string; dslFirst?: boolean }) {
  const [tab, setTab] = useState<'sdk' | 'dsl'>(dslFirst && dsl ? 'dsl' : 'sdk')
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

export default function AgentMemory() {
  return (
    <section id="agent" aria-label="Agent Memory Primitives - Memory Query DSL, Causal Graph, Temporal Graph, Fork, Reactive State" className="py-24 md:py-32 bg-surface-light">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-20">
          <p className="eyebrow mb-4">Agent Memory</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            Memory primitives
            <br />built for agents.
          </h2>
          <p className="text-text-muted text-lg max-w-[540px] mx-auto leading-relaxed">
            A declarative memory query language over causal graphs, temporal edges, branching, reactive state, and similarity search — purpose-built for AI agent memory.
          </p>
        </div>

        <div className="space-y-16">
          {primitives.map((p, i) => (
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
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
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
                <CodePanel code={p.code} dsl={p.dsl} title={p.title} dslFirst={p.dslFirst} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
