---
sidebar_position: 3
title: State Branching
---

# State Branching

Statelet provides lightweight **fork/merge primitives** with copy-on-write overlays. Agents can create branches to explore alternative reasoning paths without duplicating data or affecting the main timeline.

## How It Works

### Copy-on-Write Overlays

When you fork a branch:

1. No data is copied — the branch starts as a thin overlay
2. Reads walk the parent chain transparently
3. Writes go to the branch overlay only
4. The parent timeline is completely unaffected

```
main:  ──[A]──[B]──[C]──[D]──[E]──
                     │
branch-1:            └──[C']──[D']
```

In this diagram, `branch-1` was forked from step `C`. It can read `A`, `B`, `C` from `main`, but `C'` and `D'` only exist on the branch.

:::note No query-DSL form
Branching has no equivalent in the [Query DSL](/concepts/causal-graph#query-dsl).
`fork` / `branch_put` / `merge_branch` are writes, which `GraphQuery` rejects at
parse time, and `GraphQueryRequest` carries no branch selector — reads always
resolve against the main timeline. Use the SDK calls below.
:::

## API

### Fork

Create a new branch from a specific point:

```python
branch = db.fork(
    parent_id="main",
    snapshot_from=step_42
)
```

### Write to a Branch

```python
# Write only affects the branch
db.branch_put(branch, "strategy", conservative_params)

# Add steps on the branch
db.add_step(
    agent_id="agent-1",
    step_type="Think",
    branch_id=branch,
    content="Testing conservative approach..."
)
```

### Read from a Branch

Reads transparently walk the parent chain:

```python
# Returns branch value if it exists, otherwise walks up to parent
value = db.branch_get(branch, "strategy")
```

### Merge

Atomically merge a branch back to the main timeline:

```python
db.merge_branch(branch)
```

### Discard

Drop a branch without merging:

```python
db.discard_branch(branch)
```

## Example: Strategy Exploration

```python
# Main timeline: current trading strategy
main_step = db.add_step(
    agent_id="trader",
    step_type="Think",
    content="Current strategy: momentum-based"
)

# Fork to test an alternative
alt_branch = db.fork(parent_id="main", snapshot_from=main_step)

# Test alternative strategy on the branch
db.add_step(
    agent_id="trader",
    step_type="Think",
    branch_id=alt_branch,
    content="Testing mean-reversion strategy"
)

alt_result = db.add_step(
    agent_id="trader",
    step_type="Result",
    branch_id=alt_branch,
    content="Mean-reversion: +3.2% backtest return"
)

# Compare results
main_return = evaluate("momentum")
alt_return = evaluate("mean-reversion")

if alt_return > main_return:
    # Alternative wins — merge it back
    db.merge_branch(alt_branch)
else:
    # Keep current strategy
    db.discard_branch(alt_branch)
```

## Nested Branches

Branches can be forked from other branches:

```python
branch_a = db.fork(parent_id="main", snapshot_from=step_1)
branch_b = db.fork(parent_id=branch_a, snapshot_from=step_2)
```

Reads on `branch_b` walk: `branch_b` → `branch_a` → `main`.

## Use Cases

- **What-If Analysis** — Test alternative parameters without affecting production
- **A/B Testing** — Run competing strategies in parallel
- **Rollback** — Discard a bad branch, main timeline is untouched
- **Multi-Agent Coordination** — Each agent works on its own branch, merge results
