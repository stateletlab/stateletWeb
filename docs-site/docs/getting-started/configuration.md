---
sidebar_position: 3
title: Configuration
---

# Configuration

Statelet is configured through positional command-line arguments and environment
variables. There is no configuration file.

A deployment has three processes:

| Binary | Role | Default port |
|--------|------|--------------|
| `raft_engine` | Data node — KV, vector and storage engine | `7379` (gRPC), `7380` (Raft) |
| `metadata_service` | Metadata plane — shard map, CF registry, rebalancing | `8379` |
| `gateway` | Client entry point — agent state, auth, Redis protocol | `9379` (gRPC), `9380` (HTTP), `6379` (Redis) |

## Data Node (`raft_engine`)

```bash
raft_engine [db_path] [listen_addr]
```

| Argument | Description | Default |
|----------|-------------|---------|
| `argv[1]` | Database path | `STATELET_DATA_DIR`, else `$HOME/.statelet/data`, falling back to `/tmp/statelet` |
| `argv[2]` | gRPC listen address | `0.0.0.0:7379` |

### Standalone mode

```bash
raft_engine /tmp/statelet 0.0.0.0:7379
```

### Cluster mode (Raft group of 3 or 5)

```bash
RAFT_NODE_ID=1 \
RAFT_PEERS="1@127.0.0.1:7379,2@127.0.0.1:7380,3@127.0.0.1:7381" \
  raft_engine /tmp/node1 0.0.0.0:7379
```

### Shard-engine mode

Connects to a standalone `metadata_service`.

```bash
META_SERVER=http://127.0.0.1:8379 \
DATA_NODE_ID=1 \
DATA_ADDR=0.0.0.0:7379 \
RAFT_ADDR=0.0.0.0:7380 \
  raft_engine /tmp/node1
```

| Variable | Default | Description |
|----------|---------|-------------|
| `STATELET_DATA_DIR` | `$HOME/.statelet/data` | Database path when `argv[1]` is absent |
| `RAFT_NODE_ID` | — | This node's id in cluster mode |
| `RAFT_PEERS` | — | Comma-separated `id@host:port` list |
| `RAFT_ADDR` | — | Raft listen address in shard-engine mode |
| `DATA_NODE_ID` | `1` | This node's id in shard-engine mode |
| `DATA_ADDR` | `argv[2]` | Client-facing gRPC listen address |
| `META_SERVER` | *(required in shard-engine mode)* | gRPC URL of the metadata service |
| `STATELET_RAFT_SNAPSHOT_THRESHOLD` | `2000` | Log entries between snapshots |
| `STATELET_RAFT_SNAPSHOT_TRAILING` | `64` | Entries retained after a snapshot |
| `STATELET_SHUTDOWN_TIMEOUT_SECS` | `60` | Graceful shutdown budget |

## Metadata Service (`metadata_service`)

Runs a dedicated Raft group for cluster metadata. It carries no storage-engine
dependency — metadata lives in memory, replicated via Raft.

```bash
# Single node (development)
metadata_service

# Three-node cluster
META_NODE_ID=1 META_PEERS="1@host1:8379,2@host2:8379,3@host3:8379" \
  META_ADDR=0.0.0.0:8379 metadata_service
```

| Variable | Default | Description |
|----------|---------|-------------|
| `META_NODE_ID` | `1` | This node's id |
| `META_ADDR` | `0.0.0.0:8379` | Listen address |
| `META_PEERS` | `<node_id>@<listen_addr>` | Comma-separated `id@host:port` list |
| `META_DATA_DIR` | — | Persistent directory for the metadata Raft log |

## Gateway (`gateway`)

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_ADDR` | `0.0.0.0:9379` | gRPC listen address |
| `GATEWAY_META` | `http://127.0.0.1:8379` | Metadata service URL |
| `GATEWAY_MGMT_ADDR` | `0.0.0.0:9380` | Management HTTP listen address |
| `GATEWAY_REDIS_ADDR` | `0.0.0.0:6379` | Redis-compatible TCP listen address |
| `GATEWAY_JWT_SECRET` | *(unset — auth disabled)* | HMAC secret for JWT signing |
| `GATEWAY_USERS` | `admin:admin:admin` | Comma-separated `user:pass:role` |
| `GATEWAY_UI_DIR` | `ui/dist` | Directory served by the management UI |
| `GATEWAY_NO_AUTH` | — | Set to `1` to disable authentication (same as the `--no-auth` flag) |

### Authentication

When `GATEWAY_JWT_SECRET` is unset, authentication is disabled. Once set, write
RPCs (`put`, `delete`, `merge`, `batch_write`) require an
`Authorization: Bearer <token>` gRPC metadata header. Tokens are issued by
`POST /api/v1/auth/login` on the management API. The `ping` RPC is always
unauthenticated so it can serve as a health check.

## Models

| Variable | Description |
|----------|-------------|
| `STATELET_EMBEDDING_MODEL` | Path to the ONNX embedding model |
| `STATELET_RERANKER_MODEL` | Path to the cross-encoder reranker model |

## Vector Index

Index parameters are set per index at creation time through the SDK, not
globally. See `VectorIndexConfig` in the SDK reference — `dim`, `metric`
(L2, Cosine, InnerProduct), `m`, `m_max0`, `ef_construction` and `ef_search`.
