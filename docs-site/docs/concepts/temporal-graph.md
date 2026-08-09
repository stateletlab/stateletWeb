---
sidebar_position: 2
title: Temporal Graph
---

# Temporal Graph

The Temporal Graph extends the [Causal Graph](/concepts/causal-graph) with **time-aware edges**. Every edge carries a validity interval `[valid_from, valid_to]`, enabling point-in-time queries, time-window traversals, and full edge version history.

## Concepts

### Validity Intervals

Each edge is valid during a specific time range:

```
[valid_from, valid_to]
```

- `valid_from` — When the relationship became active
- `valid_to` — When the relationship expired (or `None` if still active)

### Edge Versioning

When you update a temporal edge, Statelet keeps the full history. Each version has its own validity interval, forming an immutable audit trail.

## API

### Add a Temporal Edge

```python
from datetime import datetime, timedelta

t0 = datetime.now()
t1 = t0 + timedelta(hours=1)

db.add_temporal_edge(
    src=step_1,
    dst=step_2,
    edge_type="Informs",
    valid_from=t0,
    valid_to=t1
)
```

### Point-in-Time Traversal

Query the graph as it existed at a specific moment:

```python
# What was the reasoning state at this exact time?
steps = db.traverse_at(
    start=step_1,
    ts=datetime(2025, 3, 15, 10, 30),
    direction="Forward",
    max_depth=5
)
```

Only edges where `valid_from <= ts < valid_to` are followed.

### Time-Window Traversal

Traverse only edges active within a time range:

```python
# What happened during the trading session?
steps = db.traverse_in_window(
    start=step_1,
    window_start=session_open,
    window_end=session_close,
    direction="Forward",
    max_depth=10
)
```

### Expire an Edge

Soft-expire an edge without deleting it:

```python
db.expire_edge(
    src=step_1,
    dst=step_2,
    edge_type="Informs",
    expire_at=datetime.now()
)
```

The edge remains in history but is no longer traversed for queries after the expiry time.

### Edge History

Retrieve the full version history of an edge:

```python
history = db.edge_history(
    src=step_1,
    dst=step_2,
    edge_type="Informs"
)

for version in history:
    print(f"  {version.valid_from} → {version.valid_to}")
```

## Query DSL

The read paths above — point-in-time traversal and belief queries — are also
available declaratively on the `GraphQuery` RPC. `add_temporal_edge` and
`expire_edge` are writes and stay SDK-only; `edge_history` has no query-surface
equivalent either, since the DSL projects nodes rather than edge versions.

:::caution Under `AS OF`, project ids — not properties
Node properties are not yet bitemporal, so the gateway **rejects any temporal
query that reads them**. Once a query carries an `as_of` or `tx_as_of` (from the
`AS OF` clause, an `as_of()` predicate, or the out-of-band request fields), the
projection is limited to `<var>.id`, `count(...)`, `collect(<var>.id)`, and the
yielded `score`, and `WHERE` may not compare properties at all. `RETURN b` and
`RETURN b.content` both fail with:

```
AS OF graph queries that read node properties are rejected until node
properties are bitemporal; return only node ids or query the current view
```

Hydrate the returned ids with `graph_get_node` when you need the content.
:::

### Point-in-time traversal

An `AS OF <valid_ms>` clause sits after the pattern and before `WHERE`. Only
edges whose validity interval covers that instant are followed:

```cypher
MATCH (a {id: 1})-[:Informs]->(b) AS OF 1742035800000
RETURN b.id
```

This is the DSL form of `db.traverse_at(start=step_1, ts=...)`. From an SDK:

```python
result = db.graph_query(
    "MATCH (a {id: 1})-[:Informs]->(b) AS OF 1742035800000 RETURN b.id"
)
step_ids = [row[0] for row in result.rows]
```

Equivalently, leave the clause out and pass the instant out of band — the clause
wins when both are present:

```python
result = db.graph_query(
    "MATCH (a {id: 1})-[:Informs]->(b) RETURN b.id",
    as_of=1742035800000,
)
```

### Bitemporal — valid time and transaction time

A second argument pins the transaction-time axis, i.e. *what the system believed
at that moment* about what was true at `valid`:

```cypher
MATCH (a {id: 1})-[:Informs]->(b) AS OF 1742035800000, 1742122200000
RETURN DISTINCT b.id
```

Both axes default to "current" when omitted.

### `as_of()` as a WHERE predicate

The valid-time instant can equivalently be pushed down as a `WHERE` leaf:

```cypher
MATCH (a {id: 1})-[:Informs*1..5]->(b)
WHERE as_of(1742035800000)
RETURN DISTINCT b.id
```

`as_of()` must sit on the top-level `AND` spine — it is a traversal-time
pushdown, so it cannot be nested under `OR` or `NOT`. Supplying both a clause and
a conflicting `as_of()` leaf is a compile error. Note that it cannot be combined
with a property predicate (`AND b.agent_id = 'trader'`) for the reason above.

### Counting instead of listing

Aggregates over ids are allowed, which makes "how much of the graph was reachable
then?" a single query:

```cypher
MATCH (a {id: 1})-[:Informs*1..5]->(b) AS OF 1742035800000
RETURN count(*) AS reached
```

### Belief traversal

`db.belief` runs the bitemporal traversal as a procedure and yields each reached
step with its ordering instant:

```cypher
CALL db.belief(1, 'forward', 5) YIELD node, score AS OF 1742035800000, 1742122200000
RETURN node.id, score
ORDER BY score DESC
LIMIT 50
```

Direction is `'forward'`, `'backward'`, or `'both'` (the default). Without an
`AS OF` clause the procedure runs against the current view and `RETURN node,
score` may project whole nodes.

:::note
A `MATCH` expansion after `CALL db.belief` / `db.provenance` is rejected — those
procedures carry no query vector to seed a graph expansion. Use the yielded rows
directly.
:::

### Time windows

There is no window clause in the subset. Run the point-in-time query at each
boundary and diff the id sets, or keep using `db.traverse_in_window` from the
SDK:

```cypher
MATCH (a {id: 1})-[:Informs*1..10]->(b) AS OF 1742044800000
RETURN DISTINCT b.id
```

## Example: Time-Aware Agent Memory

```python
# Morning: agent observes market open
open_step = db.add_step(
    agent_id="trader",
    step_type="Observe",
    content="Market opened +0.5%"
)

# Morning analysis
morning_think = db.add_step(
    agent_id="trader",
    step_type="Think",
    content="Bullish opening, maintain positions"
)

db.add_temporal_edge(
    src=open_step,
    dst=morning_think,
    edge_type="Informs",
    valid_from=market_open,
    valid_to=noon
)

# Afternoon: new data invalidates morning analysis
afternoon_think = db.add_step(
    agent_id="trader",
    step_type="Think",
    content="Reversal detected, cut positions"
)

db.add_temporal_edge(
    src=open_step,
    dst=afternoon_think,
    edge_type="Informs",
    valid_from=noon,
    valid_to=market_close
)

# Query: what was the agent thinking at 10am?
state_10am = db.traverse_at(
    start=open_step,
    ts=datetime(2025, 3, 15, 10, 0),
    direction="Forward",
    max_depth=5
)
# → Returns morning_think (bullish)

# Query: what was the agent thinking at 2pm?
state_2pm = db.traverse_at(
    start=open_step,
    ts=datetime(2025, 3, 15, 14, 0),
    direction="Forward",
    max_depth=5
)
# → Returns afternoon_think (cut positions)
```

## Use Cases

- **Regulatory Compliance** — Reconstruct decision state at any historical point
- **Backtesting** — Replay agent reasoning with historical time constraints
- **Debugging** — Understand which relationships were active during a failure
- **Knowledge Decay** — Automatically expire stale relationships
