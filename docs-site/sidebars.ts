import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quickstart',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'concepts/causal-graph',
        'concepts/temporal-graph',
        'concepts/state-branching',
        'concepts/vector-search',
        'concepts/reactive-state',
        'concepts/lsm-tree',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/gateway',
        'architecture/metadata-plane',
        'architecture/data-plane',
        'architecture/raft-consensus',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/agent-state-service',
        'api/kv-operations',
        'api/redis-protocol',
      ],
    },
    {
      type: 'category',
      label: 'SDKs',
      items: [
        'sdks/python',
        'sdks/rust',
        'sdks/go',
        'sdks/java',
        'sdks/cpp',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/single-node',
        'deployment/docker',
        'deployment/kubernetes',
      ],
    },
    'benchmarks',
  ],
};

export default sidebars;
