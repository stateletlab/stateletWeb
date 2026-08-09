---
sidebar_position: 1
title: Causal Graph
---

# Causal Graph

The Causal Graph is Statelet's core primitive for recording AI agent reasoning. It models decision-making as a **directed acyclic graph (DAG)** where each node is a reasoning step and each edge captures a causal relationship.

## Step Types

Every node in the graph has one of five types:

| Step Type | Purpose | Example |
|-----------|---------|---------|
| **Observe** | External data ingestion | "Market volatility increased 15%" |
| **Think** | Internal reasoning | "High volatility suggests reducing positions" |
| **Act** | Action taken | "Reduce all positions by 30%" |
| **Tool** | Tool invocation | "Called risk_calculator(portfolio)" |
| **Result** | Outcome recorded | "P&L: -2.3% drawdown avoided" |

## Edge Types

Edges between steps are semantically typed:

| Edge Type | Meaning |
|-----------|---------|
| **Triggers** | Step A directly caused Step B |
| **Informs** | Step A provided context for Step B |
| **Branches** | Step A led to a fork in reasoning |
| **Merges** | Step A is a merge point from multiple branches |

## Creating Steps and Edges

```python
from statelet import Client

db = Client("localhost:9379")

# Create steps
observe = db.add_step(
    agent_id="agent-1",
    step_type="Observe",
    content="Received earnings report for AAPL"
)

think = db.add_step(
    agent_id="agent-1",
    step_type="Think",
    content="Earnings beat estimates by 12%, bullish signal"
)

act = db.add_step(
    agent_id="agent-1",
    step_type="Act",
    content="Buy 100 shares AAPL at market"
)

# Create causal edges
db.add_edge(src=observe, dst=think, edge_type="Triggers")
db.add_edge(src=think, dst=act, edge_type="Triggers")
```

This creates the graph:

```
[Observe] Earnings report
    │ Triggers
    ▼
[Think] Bullish signal
    │ Triggers
    ▼
[Act] Buy AAPL
```

## Traversal

Walk the graph in any direction with BFS:

```python
# Forward traversal: follow effects
effects = db.traverse(
    start=observe,
    direction="Forward",
    max_depth=10
)

# Backward traversal: find root causes
causes = db.traverse(
    start=act,
    direction="Backward",
    max_depth=10
)

# Both directions: full connected subgraph
context = db.traverse(
    start=think,
    direction="Both",
    max_depth=5
)
```

## Query DSL

Everything above that only *reads* the graph can also be expressed declaratively.
The gateway exposes a read-only openCypher subset on the `GraphQuery` RPC —
`MATCH` / `WHERE` / `RETURN` / `ORDER BY` / `SKIP` / `LIMIT`, plus `CALL db.*`
procedures. Writes (`CREATE`, `MERGE`, `SET`, `DELETE`) are rejected at parse
time, so `add_step` / `add_edge` stay SDK-only.

An inline `{id: <n>}` map pins the traversal start node, and the `*min..max`
quantifier on a relationship bounds the BFS depth.

### Running a query

Every SDK exposes the RPC directly — `graph_query` in Python, Rust, and C++,
`GraphQuery` in Go, `graphQuery` in Java:

```python
result = db.graph_query("""
    MATCH (observe {id: 1})-[:Triggers*1..10]->(effect)
    RETURN DISTINCT effect
    LIMIT 100
""")

print(result.columns)          # ['effect']
for row in result.dicts():     # [{'effect': {...node props...}}, ...]
    print(row["effect"])

for w in result.warnings:      # non-empty when the result may be incomplete
    print("warning:", w)
```

Optional arguments: `graph_name` (empty = the gateway's default graph),
`max_rows` (a hard cap applied on top of any `LIMIT`), and `as_of` / `tx_as_of`
to supply the bitemporal instant out of band. Values come back decoded — `None`
for NULL, `int` / `float` / `str` / `bool` for scalars, and the parsed
node-property object for a whole node.

The rest of this page shows the query text only.

### Forward traversal — follow effects

```cypher
MATCH (observe {id: 1})-[:Triggers*1..10]->(effect)
RETURN DISTINCT effect
LIMIT 100
```

### Backward traversal — find root causes

Flip the arrow to walk incoming edges:

```cypher
MATCH (act {id: 3})<-[:Triggers*1..10]-(cause)
RETURN DISTINCT cause
```

### Both directions, any edge type

Omit the arrowhead for an undirected walk, and omit `:Type` to follow every edge
type:

```cypher
MATCH (think {id: 2})-[*1..5]-(ctx)
RETURN DISTINCT ctx
```

### Filtering by step properties

`WHERE` runs over the hydrated node properties and supports `AND` / `OR` / `NOT`,
comparisons, `IN` lists, and `CONTAINS` / `STARTS WITH` / `ENDS WITH`:

```cypher
MATCH (a {id: 1})-[:Informs]->(b)
WHERE b.agent_id = 'agent-1' AND b.step_type IN ['Think', 'Act']
RETURN b.step_type, b.content, b.timestamp
ORDER BY b.timestamp DESC
LIMIT 20
```

:::note
`ORDER BY` resolves against the `RETURN` projection, so a sort key must be
projected first — `RETURN b.step_type ... ORDER BY b.timestamp` is a compile
error.
:::

### Aggregating a subgraph

`count` / `sum` / `avg` / `min` / `max` / `collect` are supported; the
non-aggregate items become the group keys:

```cypher
MATCH (a {id: 1})-[:Triggers*1..3]->(b)
RETURN b.step_type, count(*) AS steps
ORDER BY steps DESC
```

### Shortest path between two steps

```cypher
MATCH shortestPath((a {id: 1})-[:Triggers]-(b {id: 42}))
RETURN b.step_type, b.content
```

:::caution
`shortestPath` currently takes a fixed-length relationship and cannot bind a path
variable (`p = shortestPath(...)`). Return an endpoint node instead.
:::

### Provenance audit records

```cypher
CALL db.provenance(42, 20) YIELD node, score
RETURN node, score
ORDER BY score DESC
```

### Inspecting the plan

Prefix any query with `EXPLAIN` to get the planner's leaf ordering back in
`GraphQueryResponse.warnings` without executing it:

```cypher
EXPLAIN MATCH (a {id: 1})-[:Triggers*1..3]->(b)
RETURN b
```

## Attaching Embeddings

Steps can carry vector embeddings for similarity search:

```python
step = db.add_step(
    agent_id="agent-1",
    step_type="Think",
    content="Momentum reversal detected",
    embedding=[0.12, -0.34, 0.56, ...]  # float vector
)
```

See [Vector Search](/concepts/vector-search) for finding similar reasoning chains.

## Use Cases

- **Audit Trails** — Trace any action back to its root observations
- **Explainability** — Show why an agent made a specific decision
- **Debugging** — Find where reasoning went wrong by walking the graph
- **Learning** — Compare successful vs. failed reasoning patterns
