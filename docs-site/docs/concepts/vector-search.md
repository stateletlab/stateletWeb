---
sidebar_position: 4
title: Vector Search
---

# Vector Search

Statelet includes a built-in **HNSW** (Hierarchical Navigable Small World) vector index for similarity search. Attach vector embeddings to reasoning steps, then find similar past reasoning chains across your agent's history.

## Distance Metrics

| Metric | Use Case |
|--------|----------|
| **L2** (Euclidean) | General-purpose distance |
| **Cosine** | Normalized text/sentence embeddings |
| **Inner Product** | Recommendation, dot-product similarity |

## Indexing

### Attach Embeddings to Steps

```python
step = db.add_step(
    agent_id="agent-1",
    step_type="Think",
    content="Momentum reversal detected in tech sector",
    embedding=[0.12, -0.34, 0.56, 0.78, ...]  # float vector
)
```

### Standalone Vector Insert

```python
db.vector_put(
    key="pattern-001",
    embedding=[0.12, -0.34, 0.56, ...],
    metadata={"symbol": "AAPL", "date": "2025-03-15"}
)
```

## Querying

### Find Similar Reasoning Chains

The key primitive for agent memory — find past reasoning chains similar to the current context:

```python
chains = db.find_similar_chains(
    embedding=current_vector,
    k=5,              # Return top 5 matches
    max_depth=10       # BFS depth for chain assembly
)

for chain in chains:
    print(f"Similarity: {chain.score}")
    for step in chain.steps:
        print(f"  [{step.step_type}] {step.content}")
```

This works in two phases:
1. **KNN Search** — Find the K nearest reasoning steps by vector similarity
2. **Chain Assembly** — BFS from each anchor step to reconstruct the full reasoning chain

### Basic KNN Search

```python
results = db.vector_search(
    embedding=query_vector,
    k=10,
    metric="cosine"
)

for result in results:
    print(f"Key: {result.key}, Distance: {result.distance}")
```

## Query DSL

Retrieval is fully expressible in the read-only openCypher subset the gateway
accepts on `GraphQuery`. `add_step` and `vector_put` are writes and stay
SDK-only, but every search below has a query form.

### kNN

`db.vectorSearch(<vector>, k [, ef])` yields `(node, score)` rows. `ef` is the
query-time beam width — omit it to use `hnsw_ef_search` from the config:

```cypher
CALL db.vectorSearch([0.12, -0.34, 0.56], 10) YIELD node, score
RETURN node, score
ORDER BY score DESC
```

:::caution Inline the vector
A named parameter (`db.vectorSearch($q, 10)`) parses, but the gateway cannot
resolve it yet and answers `query parameter '$q' is not supported yet on
GraphQuery`. Build the literal into the query text — from Python, that means
formatting the embedding into the string:

```python
vec = ", ".join(f"{x:.6f}" for x in query_vector)
result = db.graph_query(
    f"CALL db.vectorSearch([{vec}], 10) YIELD node, score "
    f"RETURN node, score ORDER BY score DESC"
)
```
:::

### Similar reasoning chains — seed, then expand

The yielded `node` variable seeds a following `MATCH`, which is exactly the
two-phase `find_similar_chains` shape: KNN anchors, then BFS chain assembly:

```cypher
CALL db.vectorSearch([0.12, -0.34, 0.56], 5) YIELD node, score
MATCH (node)-[:Triggers*1..3]->(step)
RETURN node, score, step.step_type, step.content
ORDER BY score DESC
LIMIT 50
```

### Filtering anchors before expanding

A bare `MATCH (node)` binds the anchors so `WHERE` can filter them on hydrated
properties:

```cypher
CALL db.vectorSearch([0.12, -0.34, 0.56], 20) YIELD node, score
MATCH (node)
WHERE node.agent_id = 'agent-1'
RETURN node, score
```

### Hybrid search

`db.hybridSearch` fuses dense and sparse retrieval with RRF and returns the
merged ranking:

```cypher
CALL db.hybridSearch([0.12, -0.34, 0.56], 10, 128) YIELD node, score
RETURN node, score
```

### Graph-RAG in one call

`db.graphRag(<vector>, k, ef, depth)` does the vector-seed → graph-expand round
trip server-side; `depth = 0` returns anchors only:

```cypher
CALL db.graphRag([0.12, -0.34, 0.56], 5, 0, 2) YIELD node, score
RETURN node, score
ORDER BY score DESC
```

### Re-scoring with `similarity()`

`similarity(var, <vector>)` is a scalar function over a bound node's vector,
usable in `RETURN` and `ORDER BY`:

```cypher
CALL db.vectorSearch([0.12, -0.34, 0.56], 20) YIELD node, score
MATCH (node)-[:Informs]->(b)
WHERE b.agent_id = 'agent-1'
RETURN b, similarity(b, [0.12, -0.34, 0.56]) AS sim
ORDER BY sim DESC
LIMIT 5
```

## Quantization

For large-scale deployments, Statelet supports quantization to reduce memory usage:

### Product Quantization (PQ)

Splits vectors into subvectors and quantizes each independently:

```toml
[vector.quantization]
type = "pq"
pq_subvectors = 8
pq_bits = 8           # 256 centroids per subvector
```

### Scalar Quantization (SQ8)

Maps each float dimension to an 8-bit integer:

```toml
[vector.quantization]
type = "sq"
```

### IVF Variants

Inverted file index combined with quantization for billion-scale search:

- **IVF-PQ** — Partitioned search with product quantization
- **IVF-SQ** — Partitioned search with scalar quantization

## Distributed Search

In a multi-node cluster, vector search fans out to all data nodes and merges results:

```
Client → Gateway → [Node 1, Node 2, Node 3]
                         ↓
                    K-way merge for global top-k
```

Each node runs local HNSW search, then results are merged at the gateway level to produce globally correct top-k results.

## Configuration

```toml
[vector]
distance_metric = "cosine"
hnsw_m = 16                  # Connections per layer (higher = better recall, more memory)
hnsw_ef_construction = 200   # Build-time beam width (higher = better index quality)
hnsw_ef_search = 50          # Query-time beam width (higher = better recall, slower)
```

### Tuning Guidelines

| Parameter | Low Value | High Value |
|-----------|-----------|------------|
| `hnsw_m` | Less memory, lower recall | More memory, higher recall |
| `hnsw_ef_construction` | Faster build, lower quality | Slower build, higher quality |
| `hnsw_ef_search` | Faster query, lower recall | Slower query, higher recall |
