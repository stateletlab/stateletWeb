---
slug: /
sidebar_position: 1
title: Introduction
---

# Statelet

**The agent runtime data layer for production AI systems.**

Statelet is a Fair Source distributed database built from scratch in Rust. The engine ships under the Functional Source License (FSL-1.1-ALv2): free to use, modify and self-host, with each release automatically converting to Apache-2.0 two years after it ships; the source release is coming soon. The client SDKs are Apache-2.0. It gives AI agents durable memory, runtime state, declarative memory queries, DiskHNSW / SPFresh vector recall, temporal graph traversal, a triple store, CDC, Raft consensus, Redis RESP2 compatibility, REST management APIs, and a React admin UI in one engine.

## Why Statelet?

- **Unified engine** — memory, runtime state, vector recall, temporal graph, and triple-store rows share one transaction model. No separate vector DB, graph DB, and relational store to stitch together.
- **Agent memory that scores** — server-side fact extraction, conflict resolution, and temporal `supersedes` chains reach **91.6% on LongMemEval-S** end-to-end, with **99.0% hit@5** retrieval recall.
- **Temporal graph recall** — valid-time edges, `AS OF` queries, supersedes chains, and graph-RAG traversal help agents recover what was true when a memory was written or updated.
- **Enterprise isolation** — namespace / database scoping physically isolates keys, vector indexes, and graphs for every tenant, agent, or end user.
- **Sync-friendly** — `SubscribeCommitted` provides a durable, ordered CDC feed keyed on Raft log offsets, with catch-up and live-tail modes.
- **Production topology** — stateless gateways, a metadata Raft plane, per-shard Raft groups, Redis compatibility, RBAC, and management APIs.

## Core Capabilities

| Area | What Statelet provides |
|---|---|
| Storage | LSM-tree with MVCC, leveled compaction, bloom filters, and sharded block cache |
| Vector | DiskHNSW / SPFresh, product quantization, sparse hybrid search, distributed fan-out |
| Graph | Temporal causal graph, GraphSST, openCypher-style `AS OF` time travel, graph-RAG retrieval |
| Memory | Fact extraction, conflict resolution, temporal supersedes chains, local ONNX embeddings for search |
| CDC | Durable `SubscribeCommitted` stream with offset catch-up, live-tail, CF, and key-prefix filters |
| Interfaces | gRPC, Redis RESP2, REST management API, React admin console, language SDKs |

## Quick Example

```bash
pip install statelet     # server binaries + Python client
statelet-cluster start
```

```python
from statelet import Client

db = Client("127.0.0.1:9379")
db.put("agent:pref:editor", b"vim")
print(db.get("agent:pref:editor"))
db.delete("agent:pref:editor")
```

## Next Steps

- [Installation](/getting-started/installation) — Homebrew, apt, dnf, pip, archives, or source
- [Quick Start](/getting-started/quickstart) — start Statelet locally and write your first key
- [Benchmarks](/benchmarks) — temporal graph and LongMemEval-S results
- [SDKs](/sdks/python) — Python, Rust, Go, Java, C++, and Node.js clients
