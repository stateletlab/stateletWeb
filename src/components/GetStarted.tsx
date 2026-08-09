import { motion } from 'framer-motion'
import { Terminal, Cloud, Monitor } from 'lucide-react'

const deployOptions = [
  {
    icon: Terminal,
    title: 'Single Node',
    description: 'Development & testing',
    code: `cargo run --bin metadata_service
cargo run --features data-node --bin raft_engine -- \\
  /tmp/statelet 127.0.0.1:7379
cargo run --bin gateway`,
  },
  {
    icon: Cloud,
    title: 'Kubernetes',
    description: '3+ node production cluster',
    code: `kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/metadata-service.yaml
kubectl apply -f k8s/raft-engine.yaml
kubectl apply -f k8s/gateway.yaml`,
  },
  {
    icon: Monitor,
    title: 'macOS launchd',
    description: 'Background services',
    code: `cargo build --release --features data-node
sudo bash scripts/launchd-install.sh
launchctl list | grep statelet`,
  },
]

export default function GetStarted() {
  return (
    <section id="get-started" className="py-24 md:py-32 bg-surface-light">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-20">
          <p className="eyebrow mb-4">Get Started</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            Deploy in minutes.
          </h2>
          <p className="text-text-muted text-lg max-w-[500px] mx-auto leading-relaxed">
            Start the metadata service, data node, and gateway locally, or install managed services for production.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {deployOptions.map(opt => (
            <div key={opt.title} className="rounded-xl bg-surface-card border border-border-light overflow-hidden">
              <div className="p-6 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center">
                    <opt.icon className="w-5 h-5 text-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text text-sm">{opt.title}</h3>
                    <p className="text-xs text-text-light">{opt.description}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-dark">
                <pre className="p-5 text-[12px] font-mono text-[#ede6dc] leading-[1.7] overflow-x-auto">
                  <code>{opt.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
