---
sidebar_position: 5
title: Raft Consensus
---

# Raft Consensus

Statelet uses the **Raft consensus protocol** for both metadata and data replication. The implementation uses a single-threaded event loop design for simplicity and correctness.

## Two Raft Planes

Statelet separates consensus into two independent planes:

| Plane | Purpose | Typical Size |
|-------|---------|--------------|
| **Metadata Raft** | Cluster state (shard map, node registry) | 3 or 5 nodes |
| **Data Raft** | Per-shard data replication | Replication factor (default 3) |

This separation ensures that metadata operations (shard rebalancing, leader election) don't contend with data operations (reads, writes).

## How Raft Works

### Leader Election

1. Nodes start as **followers** with randomized election timeouts
2. If a follower doesn't hear from a leader before timeout, it becomes a **candidate**
3. Candidate requests votes from other nodes
4. Node with majority vote becomes the **leader**
5. Leader sends periodic heartbeats to maintain authority

### Log Replication

1. Client writes go to the leader
2. Leader appends to its log and sends to followers
3. When a **quorum** (majority) acknowledges, the entry is committed
4. Committed entries are applied to the state machine

### Quorum

For a group of N nodes, quorum requires `⌊N/2⌋ + 1` acknowledgments:

| Nodes | Quorum | Fault Tolerance |
|-------|--------|-----------------|
| 3 | 2 | 1 node failure |
| 5 | 3 | 2 node failures |
| 7 | 4 | 3 node failures |

## Unified WAL

A key Statelet optimization: the **Raft log serves as the WAL**. Traditional databases write to both a Raft log and a separate WAL, doubling write I/O. Statelet eliminates this redundancy:

```
Traditional:  Client → Raft Log → WAL → MemTable  (2 disk writes)
Statelet:      Client → Raft Log (= WAL) → MemTable  (1 disk write)
```

This unified design is a key contributor to Statelet's 6.4x write speed advantage over RocksDB.

## Snapshots

To prevent the Raft log from growing unbounded:

1. Periodically, the state machine is snapshotted
2. Log entries before the snapshot are truncated
3. New nodes joining the cluster receive the snapshot + recent log entries

```toml
[raft]
snapshot_interval = 10000     # Snapshot every 10,000 log entries
```

## Configuration

```toml
[raft]
heartbeat_interval = "150ms"
election_timeout_min = "300ms"
election_timeout_max = "500ms"
snapshot_interval = 10000
max_log_entries = 100000
```

### Tuning

- **Lower heartbeat interval** → Faster failure detection, more network traffic
- **Higher election timeout** → Fewer unnecessary elections, slower failover
- **Smaller snapshot interval** → Less log to replay on recovery, more snapshot I/O
