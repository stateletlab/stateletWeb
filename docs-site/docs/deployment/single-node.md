---
sidebar_position: 1
title: Single Node
---

# Single Node Deployment

The local development topology runs all three Statelet services on one machine:

- `metadata_service` — metadata Raft plane
- `raft_engine` — data node / ShardEngine
- `gateway` — client gRPC, Redis RESP2, REST management API, and WebUI

## Build

```bash
git clone https://github.com/stateletlab/statelet-longmemeval.git
cd statelet
cargo build --release --features data-node
```

## Run

Start each service in a separate terminal:

```bash
cargo run --bin metadata_service
```

```bash
cargo run --features data-node --bin raft_engine -- /tmp/statelet 127.0.0.1:7379
```

```bash
cargo run --bin gateway
```

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 7379 | gRPC | Data node internal API |
| 9379 | gRPC | Gateway client API |
| 9380 | HTTP | REST API and management console |
| 6379 | Redis | RESP2-compatible endpoint |

## Verify

```bash
redis-cli -p 6379 PING
redis-cli -p 6379 SET hello "world"
redis-cli -p 6379 GET hello
```

```bash
python3 -c "
from statelet import Client
db = Client('127.0.0.1:9379')
db.put('test', b'hello')
print(db.get('test'))
"
```

## Data Directories

The example above stores the data node files under `/tmp/statelet`. For persistent local services, use the launchd installer from the Statelet repository:

```bash
cargo build --release --features data-node
sudo bash scripts/launchd-install.sh
launchctl list | grep statelet
```

The installer creates service binaries under `/usr/local/bin/statelet-{metadata,datanode,gateway}` and data/log directories under `/usr/local/var/statelet` and `/usr/local/var/log/statelet`.

:::caution
Single-machine deployment is intended for development and testing. Use Kubernetes or a multi-node deployment for production fault tolerance.
:::
