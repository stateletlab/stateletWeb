---
sidebar_position: 3
title: Metadata Plane
---

# Metadata Plane

The Metadata Plane is a dedicated **Raft consensus group** that manages all cluster-wide state. It is separate from the data plane to avoid metadata operations contending with data operations.

## Responsibilities

### Shard Map

The shard map defines which data node owns which key ranges:

```
Shard 0: [0x0000, 0x4000) → Node 1 (leader), Node 2, Node 3
Shard 1: [0x4000, 0x8000) → Node 2 (leader), Node 3, Node 1
Shard 2: [0x8000, 0xC000) → Node 3 (leader), Node 1, Node 2
Shard 3: [0xC000, 0xFFFF] → Node 1 (leader), Node 3, Node 2
```

### Column Families

Manages schema definitions for logical column groups:

- Default KV column family
- Agent state column families (causal graph, temporal edges, branches)
- Vector index column families

### Node Registry

Tracks all nodes in the cluster:

- Node ID, address, and status (active/draining/dead)
- Heartbeat monitoring
- Automatic dead node detection

### Leader Election

Coordinates Raft leader elections for the metadata group. Uses randomized election timeouts to avoid split votes.

## Deployment

The Metadata Plane typically runs as a 3 or 5 node Raft group:

- **3 nodes** — Tolerates 1 failure
- **5 nodes** — Tolerates 2 failures

```bash
PEERS="1@10.0.0.1:8379,2@10.0.0.2:8379,3@10.0.0.3:8379"

# Node 1
META_NODE_ID=1 META_PEERS="$PEERS" META_ADDR=0.0.0.0:8379 \
  cargo run --bin metadata_service

# Node 2
META_NODE_ID=2 META_PEERS="$PEERS" META_ADDR=0.0.0.0:8379 \
  cargo run --bin metadata_service

# Node 3
META_NODE_ID=3 META_PEERS="$PEERS" META_ADDR=0.0.0.0:8379 \
  cargo run --bin metadata_service
```

## Shard Rebalancing

When data nodes are added or removed, the Metadata Plane coordinates shard rebalancing:

1. New shard map is proposed
2. Raft consensus ensures all metadata nodes agree
3. Data migration begins in the background
4. Shard map is atomically updated once migration completes
5. Gateways refresh their cached shard maps
