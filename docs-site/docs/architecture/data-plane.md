---
sidebar_position: 4
title: Data Plane
---

# Data Plane

Each data node in the cluster runs a **ShardEngine** that manages its assigned shards. The data plane handles all read/write operations for key-value data, vector indexes, and agent state.

## ShardEngine

Each data node has one ShardEngine instance that manages multiple shards:

```
ShardEngine
├── Shard 0
│   ├── LSM-Tree (WAL + MemTable + SST)
│   ├── HNSW Vector Index
│   ├── Agent State Column Families
│   └── Raft State Machine
├── Shard 1
│   └── ...
└── Shard N
    └── ...
```

## Per-Shard Components

### LSM-Tree

Each shard has an independent LSM-Tree instance with its own:

- Write-Ahead Log
- Active and immutable MemTables
- SST file hierarchy (L0–L6)
- Bloom filters
- Block cache share

See [LSM-Tree Storage](/concepts/lsm-tree) for details.

### HNSW Vector Index

Each shard maintains its own HNSW index for the vectors it owns. During a distributed vector search:

1. Each shard runs local KNN search
2. Results are returned to the Gateway
3. Gateway performs k-way merge for global top-k

### Agent State Column Families

Agent-specific data is stored in dedicated column families:

| Column Family | Data |
|--------------|------|
| `causal_steps` | Reasoning step nodes (id, type, content, embedding) |
| `causal_edges` | DAG edges (src, dst, edge_type) |
| `temporal_edges` | Time-aware edges with validity intervals |
| `branches` | Fork/merge metadata and overlay data |
| `watches` | Active watch subscriptions |

### Per-Shard Raft

Each shard has its own Raft group for replication:

- Separate from the metadata Raft group
- Replication factor is configurable (default 3)
- Reads can be served from followers for stale-tolerant workloads

## Write Path

```
1. Gateway forwards write to shard leader
2. Leader appends to Raft log
3. Raft replicates to followers
4. On quorum ack:
   a. Apply to WAL
   b. Insert into MemTable
   c. Return success to client
5. Background: MemTable → SST flush when threshold reached
```

## Read Path

```
1. Gateway forwards read to shard leader (or follower)
2. Check MemTable (active + immutable)
3. If not found, check block cache
4. If not cached, read from SST files (bloom filter → index → data block)
5. Cache the block for future reads
6. Return to client
```

## Configuration

```toml
[data_node]
node_id = 1
bind_address = "0.0.0.0:7379"
data_dir = "/var/lib/statelet/data"
metadata_endpoints = ["10.0.0.1:7380", "10.0.0.2:7380"]
```
