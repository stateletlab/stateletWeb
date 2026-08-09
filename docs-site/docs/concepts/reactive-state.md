---
sidebar_position: 5
title: Reactive State
---

# Reactive State

Statelet provides **compare-and-swap (CAS)** operations for optimistic concurrency control and **watch** subscriptions for real-time state change notifications.

:::note No query-DSL form
Neither primitive has a [Query DSL](/concepts/causal-graph#query-dsl) equivalent.
CAS is a conditional write, and `GraphQuery` is read-only; watch is a
server-streaming subscription, while `GraphQuery` returns a single finite row
set. Both stay SDK/gRPC-only.
:::

## Compare-and-Swap

CAS writes enable safe concurrent updates without locks. A write succeeds only if the key's current sequence number matches the expected value.

```python
# Read current state
value, seq = db.get_with_seq("agent-1:state")

# Modify and write back (only succeeds if no one else wrote)
success = db.cas_put(
    key="agent-1:state",
    value=new_state,
    expected_seq=seq
)

if not success:
    # Another writer updated the key — re-read and retry
    value, seq = db.get_with_seq("agent-1:state")
    # ... retry logic
```

### When to Use CAS

- Multiple agents sharing state
- Counters or accumulators
- Distributed locks
- Any scenario requiring atomicity without global locks

## Watch

Subscribe to key prefix changes via server-streaming gRPC. When any key matching the prefix is updated, you receive a notification immediately.

```python
# Watch all keys for agent-1
stream = db.watch_prefix("agent-1:")

for event in stream:
    print(f"Key changed: {event.key}")
    print(f"New value: {event.value}")
    print(f"Sequence: {event.seq}")
```

### Watch with Handler

```python
def on_state_change(event):
    if event.key == "agent-1:status":
        print(f"Agent status changed to: {event.value}")

db.watch_prefix("agent-1:", callback=on_state_change)
```

## Example: Multi-Agent Coordination

```python
# Agent 1: Claim a task with CAS
task_value, seq = db.get_with_seq("tasks:pending:task-42")
success = db.cas_put(
    key="tasks:pending:task-42",
    value='{"assignee": "agent-1", "status": "in_progress"}',
    expected_seq=seq
)

# Agent 2: Watch for task completions
stream = db.watch_prefix("tasks:completed:")
for event in stream:
    task = json.loads(event.value)
    print(f"Task {event.key} completed by {task['assignee']}")
```

## Sequence Numbers

Every key in Statelet has a monotonically increasing sequence number. Each write increments the sequence. This enables:

- **Optimistic concurrency** via CAS
- **Change detection** by comparing sequence numbers
- **Ordering guarantees** for event streams
