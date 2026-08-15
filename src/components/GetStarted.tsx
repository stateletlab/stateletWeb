import { motion } from 'framer-motion'
import { Terminal, Cloud, Monitor } from 'lucide-react'

const deployOptions = [
  {
    icon: Terminal,
    title: 'pip',
    edition: 'Lite',
    description: 'Single binary — dev, testing & edge',
    code: `pip install statelet-lite
statelet-cluster start
statelet-cluster status`,
  },
  {
    icon: Monitor,
    title: 'Homebrew / apt / dnf',
    edition: 'Lite',
    description: 'Single binary as a managed service',
    code: `brew install stateletlab/statelet/statelet
brew services start statelet
# or: apt-get install statelet
#     systemctl status statelet`,
  },
  {
    icon: Cloud,
    title: 'Kubernetes',
    edition: 'Enterprise',
    description: '3+ node distributed cluster',
    code: `kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/metadata.yaml
kubectl apply -f k8s/raft-engine.yaml
kubectl apply -f k8s/gateway.yaml`,
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
          <p className="text-text-muted text-lg max-w-[560px] mx-auto leading-relaxed">
            Start with the Lite single binary from pip, Homebrew, apt, or dnf — or deploy the
            Enterprise distributed cluster on Kubernetes. Same engine, same data format.
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text text-sm">{opt.title}</h3>
                      <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md ${
                        opt.edition === 'Lite' ? 'text-accent bg-accent/10' : 'text-purple bg-purple/10'
                      }`}>
                        {opt.edition}
                      </span>
                    </div>
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
