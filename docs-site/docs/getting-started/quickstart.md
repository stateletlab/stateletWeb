---
sidebar_position: 2
title: Quick Start
---

# Quick Start

This guide starts a local Statelet deployment and writes a key through the Python SDK.

## 1. Start Statelet

Run the three services in separate terminals:

```bash
cargo run --bin metadata_service
```

```bash
cargo run --features data-node --bin raft_engine -- /tmp/statelet 127.0.0.1:7379
```

```bash
cargo run --bin gateway
```

The gateway exposes gRPC on `:9379`, Redis RESP2 on `:6379`, and the management UI / REST API on `:9380`.

## 2. Install the Python SDK

```bash
cd sdk/python
pip install -e .
```

## 3. Write and Read Data

```python
from statelet import StateletClient

with StateletClient("127.0.0.1:7379") as client:
    client.put(b"hello", b"world")
    print(client.get(b"hello"))
    client.delete(b"hello")
```

## 4. Try Redis Compatibility

```bash
redis-cli -h 127.0.0.1 -p 6379
```

```text
127.0.0.1:6379> SET hello world
OK
127.0.0.1:6379> GET hello
"world"
```

## 5. Open the Admin UI

Open `http://127.0.0.1:9380` to inspect cluster state, namespaces, databases, KV data, graph queries, users, and metrics.

## What's Next?

- [Installation](/getting-started/installation) — build from source or install macOS services
- [Vector Search](/concepts/vector-search) — DiskHNSW, SPFresh, and hybrid retrieval
- [Redis Protocol](/api/redis-protocol) — RESP2 compatibility
- [Benchmarks](/benchmarks) — temporal graph and memory evaluation results
