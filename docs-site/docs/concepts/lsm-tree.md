---
sidebar_position: 6
title: LSM-Tree Storage
---

# LSM-Tree Storage Engine

Statelet's storage engine is built on a **Log-Structured Merge-Tree (LSM-Tree)** architecture, optimized for high write throughput with competitive read performance.

## Architecture

```
Write Path:
  Client → WAL → MemTable (skip-list) → Immutable MemTable → SST Flush

Read Path:
  Client → MemTable → Immutable MemTables → Block Cache → SST Files
```

## Components

### Write-Ahead Log (WAL)

Every write is first appended to the WAL before being applied to the MemTable. Each entry is protected with a CRC32 checksum for crash recovery.

- **Durability** — `fsync` mode ensures writes survive power loss
- **Recovery** — On startup, WAL is replayed to restore MemTable state
- **Unified WAL** — Statelet uses a unified Raft WAL, eliminating double-write overhead

### MemTable

The active MemTable is a **concurrent skip-list** supporting lock-free reads and writes:

- **MVCC** — Multiple versions per key with sequence numbers
- **Concurrent Access** — Lock-free skip-list for multi-threaded writes
- **Flush Threshold** — Configurable write buffer size (default 4MB)

When the MemTable reaches its size threshold, it becomes immutable and a new MemTable is created. The immutable MemTable is flushed to an SST file in the background.

### SST Files (Sorted String Tables)

Flushed data is stored in immutable SST files:

- **Prefix Compression** — Shared key prefixes are stored once
- **Bloom Filters** — Per-SST bloom filter for fast negative lookups
- **Compression** — Zstd, Snappy, or LZ4 block compression
- **Index Blocks** — Binary-searchable index for fast point lookups

### Block Cache

A **sharded LRU cache** stores frequently accessed SST blocks in memory:

- **Sharding** — Multiple shards reduce lock contention
- **Configurable** — Default 256MB, tunable per workload
- **Automatic Eviction** — LRU eviction when capacity is reached

### Compaction

**Leveled compaction** with k-way merge keeps read amplification low:

- **Level 0** — Flushed SST files (may overlap)
- **Level 1+** — Non-overlapping key ranges
- **K-way Merge** — Efficient multi-file merge during compaction
- **Tombstone Cleanup** — Deleted keys are physically removed during compaction

## Write Group Batching

Statelet batches concurrent writes into **write groups**. When multiple threads write simultaneously, one thread becomes the leader and writes the entire batch in a single WAL append + MemTable insert. This is a key factor in Statelet's 6.4x write speedup over RocksDB.

```
Thread 1 ──┐
Thread 2 ──┤──→ Write Group ──→ Single WAL Append ──→ Single MemTable Batch
Thread 3 ──┘
```

## Performance Characteristics

| Operation | Complexity |
|-----------|-----------|
| Point Write | O(log N) MemTable insert |
| Point Read | O(log N) MemTable + O(1) bloom filter per SST |
| Range Scan | O(log N + M) where M = result size |
| Compaction | O(N) merge per level |

See [Benchmarks](/benchmarks) for real-world performance numbers.
