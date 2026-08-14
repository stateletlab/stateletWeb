import { useState } from 'react'
import { motion } from 'framer-motion'

const editions = {
  enterprise: {
    label: 'Enterprise',
    sublabel: 'Distributed cluster',
    heading: 'Distributed by design.',
    description:
      'Stateless gateways route to a sharded Rust data plane while metadata Raft tracks tenants, shards, and node state.',
  },
  lite: {
    label: 'Lite',
    sublabel: 'Single binary',
    heading: 'One binary. Zero dependencies.',
    description:
      'The same Rust engine compiled into a single process — gateway, storage, and query engine together. No cluster to operate.',
  },
} as const

type Edition = keyof typeof editions

export default function Architecture() {
  const [edition, setEdition] = useState<Edition>('enterprise')

  return (
    <section id="architecture" aria-label="Statelet Architecture - Enterprise Distributed Cluster and Lite Single Binary" className="py-24 md:py-32 bg-surface-light">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">Architecture</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            {editions[edition].heading}
          </h2>
          <p className="text-text-muted text-lg max-w-[500px] mx-auto leading-relaxed">
            {editions[edition].description}
          </p>
        </div>

        {/* Edition toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-full border border-border-light bg-surface-card p-1">
            {(Object.keys(editions) as Edition[]).map(key => (
              <button
                key={key}
                onClick={() => setEdition(key)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  edition === key
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {editions[key].label}
                <span className={`ml-2 text-[11px] font-normal ${edition === key ? 'text-white/70' : 'text-text-light'}`}>
                  {editions[key].sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={edition}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-[720px] mx-auto"
        >
          <div className="rounded-xl bg-surface-card p-8 md:p-12 border border-border-light">
            {edition === 'enterprise' ? (
              <div className="space-y-10">
                {/* Clients */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                    {['Python', 'Node.js', 'Rust', 'Go', 'Java', 'C++', 'Redis CLI'].map(sdk => (
                      <span key={sdk} className="px-3 py-1.5 rounded-full bg-surface-light text-text-muted text-xs font-medium">
                        {sdk}
                      </span>
                    ))}
                  </div>
                  <p className="text-text-light text-xs mt-3 tracking-wide uppercase">Client SDKs</p>
                </div>

                <div className="flex justify-center">
                  <div className="w-px h-10 bg-border" />
                </div>

                {/* Gateway */}
                <div className="rounded-xl bg-surface-light p-6 text-center">
                  <h4 className="font-semibold text-text text-sm mb-1">Gateway</h4>
                  <p className="text-text-light text-xs mb-4">gRPC routing, REST management API, Redis bridge, WebUI</p>
                  <div className="flex justify-center gap-2">
                    {['gRPC :9379', 'HTTP :9380', 'Redis :6379'].map(port => (
                      <span key={port} className="text-[11px] px-2.5 py-1 rounded-full bg-surface-card text-text-muted font-mono border border-border-light">
                        {port}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-40">
                  <div className="w-px h-10 bg-border" />
                  <div className="w-px h-10 bg-border" />
                </div>

                {/* Meta + Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-xl bg-surface-card p-6 border border-border-light">
                    <h4 className="font-semibold text-text text-sm mb-1">Metadata Plane</h4>
                    <p className="text-text-light text-xs mb-4">Raft group for cluster state</p>
                    <div className="space-y-2.5">
                      {['Namespace / Database Registry', 'Shard Map & Key Ranges', 'Column Families', 'Node Registry'].map(item => (
                        <div key={item} className="text-xs text-text-muted flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-card p-6 border border-border-light">
                    <h4 className="font-semibold text-text text-sm mb-1">Data Plane</h4>
                    <p className="text-text-light text-xs mb-4">ShardEngine per node</p>
                    <div className="space-y-2.5">
                      {['LSM-Tree per Shard', 'DiskHNSW / SPFresh ANN', 'Temporal GraphSST', 'Per-Shard Raft'].map(item => (
                        <div key={item} className="text-xs text-text-muted flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div className="rounded-xl bg-surface-light p-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    {[
                      { label: 'WAL', sub: 'CRC32' },
                      { label: 'MemTable', sub: 'Skip-list' },
                      { label: 'SST Files', sub: 'Bloom filter' },
                      { label: 'Block Cache', sub: 'Sharded LRU' },
                      { label: 'Compaction', sub: 'K-way merge' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="text-xs font-semibold text-text">{s.label}</div>
                        <div className="text-[10px] text-text-light mt-0.5">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Clients */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                    {['Python', 'Node.js', 'Rust', 'Go', 'Java', 'C++', 'Redis CLI'].map(sdk => (
                      <span key={sdk} className="px-3 py-1.5 rounded-full bg-surface-light text-text-muted text-xs font-medium">
                        {sdk}
                      </span>
                    ))}
                  </div>
                  <p className="text-text-light text-xs mt-3 tracking-wide uppercase">Client SDKs</p>
                </div>

                <div className="flex justify-center">
                  <div className="w-px h-10 bg-border" />
                </div>

                {/* Single binary */}
                <div className="rounded-xl bg-surface-light p-6 md:p-8">
                  <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 rounded-full bg-surface-card border border-border-light font-mono text-xs text-text font-semibold">
                      statelet
                    </span>
                    <p className="text-text-light text-xs mt-2">One process — gateway, engine, and storage embedded</p>
                    <div className="flex justify-center gap-2 mt-4">
                      {['gRPC :9379', 'HTTP :9380', 'Redis :6379'].map(port => (
                        <span key={port} className="text-[11px] px-2.5 py-1 rounded-full bg-surface-card text-text-muted font-mono border border-border-light">
                          {port}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-xl bg-surface-card p-6 border border-border-light">
                      <h4 className="font-semibold text-text text-sm mb-1">Embedded Gateway</h4>
                      <p className="text-text-light text-xs mb-4">Same APIs, in-process</p>
                      <div className="space-y-2.5">
                        {['gRPC & REST APIs', 'Redis RESP2 Bridge', 'Management WebUI', 'Memory Query Language'].map(item => (
                          <div key={item} className="text-xs text-text-muted flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-surface-card p-6 border border-border-light">
                      <h4 className="font-semibold text-text text-sm mb-1">Embedded Engine</h4>
                      <p className="text-text-light text-xs mb-4">Full ShardEngine, local disk</p>
                      <div className="space-y-2.5">
                        {['LSM-Tree Storage', 'DiskHNSW / SPFresh ANN', 'Temporal GraphSST', 'Runtime Snapshots'].map(item => (
                          <div key={item} className="text-xs text-text-muted flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div className="rounded-xl bg-surface-light p-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    {[
                      { label: 'WAL', sub: 'CRC32' },
                      { label: 'MemTable', sub: 'Skip-list' },
                      { label: 'SST Files', sub: 'Bloom filter' },
                      { label: 'Block Cache', sub: 'Sharded LRU' },
                      { label: 'Compaction', sub: 'K-way merge' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="text-xs font-semibold text-text">{s.label}</div>
                        <div className="text-[10px] text-text-light mt-0.5">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-center text-xs text-text-light">
                  Same data format as Enterprise — start Lite, migrate to a cluster when you need to scale.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
