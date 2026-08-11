---
sidebar_position: 1
title: Python
---

# Python SDK

Official Python client for Statelet. Requires Python 3.9+.

## Installation

Install directly via pip — no extra build tools or protobuf compilation needed:

```bash
pip install statelet-sdk
```

`statelet-sdk` is the client on its own; the import package is `statelet`.

```bash
pip install statelet
```

`statelet` is the **server** distribution — it ships the service binaries and
the admin UI, and declares `statelet-sdk` as a dependency. Install it instead if
you also want to run a node locally. Either way, `import statelet` gives you the
same client.

## Quick Start

```python
from statelet import StateletClient

# Connect
client = StateletClient("127.0.0.1:7379")

# Basic KV
client.put(b"key", b"value")
value = client.get(b"key")

# Agent memory (high-level API)
from statelet import AgentMemory

memory = AgentMemory("127.0.0.1:9379", agent_id="agent-1")
obs_id = memory.observe("Analyzing data...")
results = memory.recall("data analysis", k=5)
```

## Connection

```python
from statelet import StateletClient

# Single node
client = StateletClient("127.0.0.1:7379")

# With column family
client = StateletClient("127.0.0.1:7379", cf=1)

# Context manager
with StateletClient("127.0.0.1:7379") as client:
    client.put(b"key", b"value")
```

## Key-Value Operations

```python
# Put / Get / Delete
client.put(b"user:1", b'{"name": "Alice"}')
value = client.get(b"user:1")      # bytes or None
client.delete(b"user:1")

# Merge
client.merge(b"counter", b"1")

# Batch write
client.batch_write([
    {"op": "put", "key": b"key1", "value": b"value1"},
    {"op": "put", "key": b"key2", "value": b"value2"},
    {"op": "delete", "key": b"key3"},
])

# Scan by prefix
entries, next_cursor = client.scan(b"user:", limit=100)

# Delete by prefix
deleted = client.delete_by_prefix(b"temp:")
```

## Vector Operations

```python
from statelet import VectorIndexConfig

# Create index
client.create_vector_index("embeddings", VectorIndexConfig(
    dim=384,
    metric="cosine",       # "l2", "cosine", or "inner_product"
    m=16,
    ef_construction=200,
    ef_search=64,
))

# Insert vectors
client.vector_put("embeddings", vector_id=1, vector=[0.1, 0.2, 0.3, ...])

# Search
results = client.vector_search("embeddings", query=[0.1, 0.2, 0.3, ...], k=10)
for r in results:
    print(f"ID: {r.id}, Distance: {r.distance}")

# Get / Delete
vec = client.vector_get("embeddings", vector_id=1)
client.vector_delete("embeddings", vector_id=1)

# Drop index
client.drop_vector_index("embeddings")
```

## Graph Operations

```python
# Create graph index (with optional HNSW for vector search on nodes)
client.create_graph_index("knowledge", dim=384, metric="cosine")

# Add nodes
client.graph_add_node("knowledge", node_id=1, properties=b'{"type": "observation"}')
client.graph_add_node("knowledge", node_id=2, properties=b'{"type": "action"}',
                      vector=[0.1, 0.2, 0.3, ...])

# Add temporal edges
import time
now = int(time.time())
client.graph_add_edge(
    "knowledge", src=1, dst=2, edge_type="caused",
    valid_from=now, valid_to=now + 3600,
    properties=b'{"weight": 0.9}',
)

# Vector search on graph nodes
results = client.graph_search("knowledge", query=[0.1, 0.2, 0.3, ...], k=5)
for r in results:
    print(f"Node: {r.node_id}, Distance: {r.distance}")

# Query edges from a node
edges = client.graph_query_edges("knowledge", node_id=1, edge_type="caused")
for e in edges:
    print(f"{e.src} -> {e.dst} [{e.edge_type}]")

# Reverse traversal (incoming edges)
incoming = client.graph_query_edges("knowledge", node_id=2, reverse=True)
```

## Agent Memory (High-Level API)

The `AgentMemory` class provides a simplified interface for agent memory use cases, combining KV, vector, and graph operations.

```python
from statelet import AgentMemory

# Without embeddings (KV-only fallback)
memory = AgentMemory("127.0.0.1:9379", agent_id="agent-1")

# With embeddings (enables vector search)
memory = AgentMemory(
    "127.0.0.1:9379",
    agent_id="agent-1",
    embed_fn=my_embed_function,  # (text) -> List[float]
    dim=384,
)

# Store observations
obs1 = memory.observe("User prefers dark mode", metadata={"source": "settings"})
obs2 = memory.observe("User is located in SF", metadata={"source": "profile"})

# Link observations causally
memory.link(obs1, obs2, relation="context")

# Recall similar memories
results = memory.recall("what does the user prefer?", k=5)
for entry in results:
    print(f"[{entry.id}] {entry.text} (distance: {entry.distance})")

# Traverse causal edges
edges = memory.get_edges(obs1)

# Context manager
with AgentMemory("127.0.0.1:9379", agent_id="agent-1") as memory:
    memory.observe("hello world")
```
