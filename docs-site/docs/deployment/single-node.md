---
sidebar_position: 1
title: Single Node
---

# Single Node Deployment

The local development topology runs all three Statelet services on one machine:

- `statelet-metadata` (`metadata_service`) — metadata Raft plane
- `statelet-datanode` (`raft_engine`) — data node / ShardEngine
- `statelet-gateway` (`gateway`) — client gRPC, Redis RESP2, REST management API, and WebUI

The names in parentheses are the crate binary names used when running from a
source checkout; the packages install them under the `statelet-` prefix.

## Install

```bash
brew install stateletlab/statelet/statelet
```

Or `pip install statelet`, or an `apt` / `dnf` package — see
[Installation](/getting-started/installation) for every channel.

## Run

The launcher starts all three services and waits for each port to answer:

```bash
statelet-cluster start --nodes 1
statelet-cluster status
statelet-cluster stop
```

To control the services individually, run each in its own terminal:

```bash
statelet-metadata
```

```bash
statelet-datanode /tmp/statelet 127.0.0.1:7379
```

```bash
statelet-gateway
```

From a source checkout, the equivalents are:

```bash
cargo run --bin metadata_service
cargo run --features data-node --bin raft_engine -- /tmp/statelet 127.0.0.1:7379
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

Run individually as above, the data node files land in `/tmp/statelet`.
`statelet-cluster` instead keeps everything under `~/.statelet/cluster`, which
`STATELET_DATA_DIR` overrides.

## Running as a Background Service

The install channel decides how the services are supervised:

| Installed via | Supervisor | Commands |
|---|---|---|
| Homebrew | `brew services` | `brew services start\|stop statelet` |
| `.deb` / `.rpm` | systemd (enabled on install) | `systemctl status\|restart statelet`, `journalctl -u statelet -f` |
| pip / tarball | none — use `statelet-cluster` | `statelet-cluster start\|status\|stop` |

Homebrew logs to `$(brew --prefix)/var/log/statelet/cluster.log` and keeps data
under `$(brew --prefix)/var/statelet`. The `.deb` and `.rpm` packages install the
binaries to `/usr/bin`, the admin UI to `/usr/share/statelet/ui`, and data to
`/var/lib/statelet`.

:::caution
Single-machine deployment is intended for development and testing. Use Kubernetes or a multi-node deployment for production fault tolerance.
:::
