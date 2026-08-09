---
sidebar_position: 1
title: AgentStateService
---

# AgentStateService API

The `AgentStateService` is Statelet's core API for agent memory management. It provides unified access to causal graphs, temporal edges, state branching, reactive watches, and vector similarity search.

## Causal Graph

### `add_step`

Add a reasoning step to the causal graph.

```python
step_id = db.add_step(
    agent_id: str,          # Agent identifier
    step_type: str,         # "Observe" | "Think" | "Act" | "Tool" | "Result"
    content: str,           # Step content (JSON or text)
    embedding: list[float]  # Optional: vector embedding
) -> str                    # Returns step ID
```

### `add_edge`

Create a causal relationship between two steps.

```python
db.add_edge(
    src: str,               # Source step ID
    dst: str,               # Destination step ID
    edge_type: str          # "Triggers" | "Informs" | "Branches" | "Merges"
)
```

### `traverse`

Walk the causal graph via BFS.

```python
steps = db.traverse(
    start: str,             # Starting step ID
    direction: str,         # "Forward" | "Backward" | "Both"
    max_depth: int          # Maximum BFS depth
) -> list[Step]
```

## Temporal Graph

### `add_temporal_edge`

Create an edge with a validity interval.

```python
db.add_temporal_edge(
    src: str,               # Source step ID
    dst: str,               # Destination step ID
    edge_type: str,         # Edge type
    valid_from: datetime,   # Start of validity
    valid_to: datetime      # End of validity (None = forever)
)
```

### `traverse_at`

Point-in-time traversal — only follows edges valid at the given timestamp.

```python
steps = db.traverse_at(
    start: str,             # Starting step ID
    ts: datetime,           # Point in time
    direction: str,         # "Forward" | "Backward" | "Both"
    max_depth: int          # Maximum BFS depth
) -> list[Step]
```

### `traverse_in_window`

Traverse only edges active within a time window.

```python
steps = db.traverse_in_window(
    start: str,
    window_start: datetime,
    window_end: datetime,
    direction: str,
    max_depth: int
) -> list[Step]
```

### `expire_edge`

Soft-expire an edge at a given time.

```python
db.expire_edge(
    src: str,
    dst: str,
    edge_type: str,
    expire_at: datetime
)
```

### `edge_history`

Retrieve the full version history of an edge.

```python
history = db.edge_history(
    src: str,
    dst: str,
    edge_type: str
) -> list[EdgeVersion]
```

Each `EdgeVersion` contains `valid_from`, `valid_to`, and `created_at`.

## State Branching

### `fork`

Create a new branch from a parent timeline.

```python
branch_id = db.fork(
    parent_id: str,         # Parent branch (e.g., "main")
    snapshot_from: str       # Optional: step ID to snapshot from
) -> str
```

### `merge_branch`

Atomically merge a branch back to its parent.

```python
db.merge_branch(branch_id: str)
```

### `discard_branch`

Drop a branch without merging.

```python
db.discard_branch(branch_id: str)
```

### `branch_put` / `branch_get`

Read and write data on a specific branch.

```python
db.branch_put(branch_id: str, key: str, value: bytes)
value = db.branch_get(branch_id: str, key: str) -> bytes
```

## Reactive State

### `cas_put`

Compare-and-swap write.

```python
success = db.cas_put(
    key: str,
    value: bytes,
    expected_seq: int       # Expected current sequence number
) -> bool
```

### `get_with_seq`

Read a value along with its sequence number.

```python
value, seq = db.get_with_seq(key: str) -> tuple[bytes, int]
```

### `watch_prefix`

Subscribe to changes for all keys matching a prefix.

```python
stream = db.watch_prefix(
    prefix: str             # Key prefix to watch
) -> Iterator[WatchEvent]
```

Each `WatchEvent` contains `key`, `value`, and `seq`.

## Vector Similarity Search

### `find_similar_chains`

Find reasoning chains similar to a query vector.

```python
chains = db.find_similar_chains(
    embedding: list[float],  # Query vector
    k: int,                  # Number of results
    max_depth: int           # BFS depth for chain assembly
) -> list[ChainResult]
```

Each `ChainResult` contains `score` and `steps` (the full reasoning chain).

### `vector_search`

Basic KNN search without chain assembly.

```python
results = db.vector_search(
    embedding: list[float],
    k: int,
    metric: str              # "l2" | "cosine" | "inner_product"
) -> list[VectorResult]
```
