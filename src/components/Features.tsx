import { motion } from 'framer-motion'
import {
  Database, Search, GitBranch, Zap, Shield, Globe,
  Layers, BarChart3, Terminal, Clock, Server, KeyRound, Radio, FileText, BrainCircuit
} from 'lucide-react'

const features = [
  {
    icon: BrainCircuit,
    title: 'Agent Runtime State',
    description: 'Persist runs, context versions, tool outputs, memory refs, and state snapshots so agents can resume without replaying everything.',
  },
  {
    icon: FileText,
    title: 'Memory Query Language',
    description: 'SQL-like declarative memory recall with openCypher-style syntax, vector search, graph expansion, and AS OF time travel.',
  },
  {
    icon: Search,
    title: 'Semantic Memory Recall',
    description: 'Dense, sparse, and graph-RAG retrieval with local ONNX embeddings, DiskHNSW/SPFresh indexes, and exact temporal filters.',
  },
  {
    icon: Layers,
    title: 'Context Lineage',
    description: 'Track what an agent knew, when it changed, and which memory superseded which prior belief.',
  },
  {
    icon: GitBranch,
    title: 'Transactional Agent Writes',
    description: 'Commit memory facts, embeddings, graph edges, and runtime state together instead of stitching separate systems after the fact.',
  },
  {
    icon: Clock,
    title: 'Time-Travel Recall',
    description: 'AS OF queries and validity windows let agents ask what was true at a specific point in the conversation or workflow.',
  },
  {
    icon: Shield,
    title: 'Per-Agent Isolation',
    description: 'Namespace and database scoping physically isolates every agent, tenant, user, index, and graph.',
  },
  {
    icon: Zap,
    title: 'Agent Memory Engine',
    description: 'Server-side fact extraction, conflict resolution, temporal supersedes chains, and 91.6% LongMemEval-S accuracy.',
  },
  {
    icon: Radio,
    title: 'Run Event Stream',
    description: 'Durable CDC keyed on Raft log offsets lets coordinators, evaluators, and dashboards live-tail agent state changes.',
  },
  {
    icon: Server,
    title: 'Unified Runtime Store',
    description: 'Memory, context, state snapshots, vector recall, temporal graph, and triple-store rows share one Rust engine.',
  },
  {
    icon: Database,
    title: 'Production Storage',
    description: 'LSM-tree storage with MVCC, prefix-compressed SST files, bloom filters, and sharded block cache.',
  },
  {
    icon: Globe,
    title: 'Agent SDKs',
    description: 'gRPC clients for Python, Java, Rust, Go, and C++, plus an npm memory plugin for coding agents.',
  },
  {
    icon: KeyRound,
    title: 'RBAC & Auth',
    description: 'Gateway management APIs, JWT auth, users, roles, and audit-friendly controls for shared deployments.',
  },
  {
    icon: BarChart3,
    title: 'Runtime Console',
    description: 'React admin console for namespaces, databases, graph queries, memory operations, users, and Prometheus metrics.',
  },
  {
    icon: Terminal,
    title: 'Redis-Compatible Edge',
    description: 'RESP2-compatible TCP server for simple operational integration with existing Redis clients.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Features() {
  return (
    <section id="features" aria-label="Statelet Features - Vector Search, Causal Graph, Temporal Graph, Raft Consensus" className="pt-12 md:pt-16 pb-24 md:pb-32 bg-surface">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-20">
          <p className="eyebrow mb-4">Features</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            Everything an agent
            <br />needs to <span className="italic text-primary">remember.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-[500px] mx-auto leading-relaxed">
            Durable memory, context, state snapshots, SQL-like memory queries, semantic recall, lineage, isolation, and event streams for production AI agents.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={item} className="text-center">
              <div className="w-11 h-11 rounded-lg bg-surface-card border border-border-light flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-5 h-5 text-primary" strokeWidth={1.6} />
              </div>
              <h3 className="text-[19px] font-medium text-text mb-2">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
