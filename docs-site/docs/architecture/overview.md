---
sidebar_position: 1
title: Overview
---

# Architecture Overview

Statelet uses a **three-tier distributed architecture** designed for horizontal scalability and fault tolerance.

```
┌─────────────────────────────────────────────────┐
│                  Client SDKs                     │
│         Python  Rust  Go  Java  C++              │
│                  Redis CLI                        │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                   Gateway                        │
│   gRPC :9379  │  HTTP :9380  │  Redis :6379      │
│   Stateless routing, shard-map cache, leader retry│
└──────┬─────────────────────────────────┬────────┘
       │                                 │
┌──────▼──────────┐        ┌─────────────▼────────┐
│  Metadata Plane │        │      Data Plane       │
│  (Raft Group)   │        │  (ShardEngine/node)   │
│                 │        │                       │
│  • Shard Map    │        │  • LSM-Tree per Shard │
│  • Column       │        │  • HNSW Vector Index  │
│    Families     │        │  • Agent State CFs    │
│  • Node Registry│        │  • Per-Shard Raft     │
│  • Leader       │        │                       │
│    Election     │        │                       │
└─────────────────┘        └───────────────────────┘
```

## Tiers

### 1. Gateway

The gateway is a **stateless** routing layer. Multiple gateway instances can run behind a load balancer for high availability.

- Routes requests to the correct data node using cached shard map
- Retries on leader changes automatically
- Exposes three protocols: gRPC, HTTP REST, and Redis RESP2
- See [Gateway](/architecture/gateway) for details

### 2. Metadata Plane

A dedicated **Raft group** that manages cluster-wide state:

- Shard map and key range assignments
- Column family definitions
- Node registry and health tracking
- Leader election coordination
- See [Metadata Plane](/architecture/metadata-plane) for details

### 3. Data Plane

Each data node runs a **ShardEngine** that manages its assigned shards:

- LSM-Tree storage engine per shard
- HNSW vector index per shard
- Agent state column families (causal graph, temporal edges, branches)
- Per-shard Raft replication for fault tolerance
- See [Data Plane](/architecture/data-plane) for details

## Data Flow

### Write Path

```
Client → Gateway → Shard Leader (Data Node)
                         │
                    Raft Replicate
                         │
                   ┌─────┼─────┐
                   ▼     ▼     ▼
                Node 1 Node 2 Node 3
                   │
              WAL → MemTable → SST (background flush)
```

### Read Path

```
Client → Gateway → Shard Leader (or follower for stale reads)
                         │
              MemTable → Block Cache → SST Files
```

## Scaling

- **Horizontal** — Add data nodes, rebalance shards
- **Vertical** — Increase block cache, add more write buffers
- **Gateway** — Stateless, scale independently behind a load balancer
