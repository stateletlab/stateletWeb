import { motion } from 'framer-motion'

export default function Architecture() {
  return (
    <section id="architecture" aria-label="Statelet Distributed Architecture - Gateway, Metadata Plane, Data Plane" className="py-24 md:py-32 bg-surface-light">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-20">
          <p className="eyebrow mb-4">Architecture</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            Distributed by design.
          </h2>
          <p className="text-text-muted text-lg max-w-[500px] mx-auto leading-relaxed">
            Stateless gateways route to a sharded Rust data plane while metadata Raft tracks tenants, shards, and node state.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-[720px] mx-auto"
        >
          <div className="rounded-xl bg-surface-card p-8 md:p-12 border border-border-light">
            <div className="space-y-10">
              {/* Clients */}
              <div className="text-center">
                <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                  {['Python', 'Rust', 'Go', 'Java', 'C++', 'Redis CLI'].map(sdk => (
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}
