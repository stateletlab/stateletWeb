---
sidebar_position: 2
title: Quick Start
---

# Quick Start

This guide installs Statelet, starts a local cluster, and writes a key through
the Python SDK.

## 1. Install

```bash
pip install statelet
```

One command: the server binaries plus the Python client. Prefer a native
package manager? See [Installation](/getting-started/installation) for Homebrew,
apt, dnf, and the release archives — the rest of this guide is identical either
way.

## 2. Start Statelet

```bash
statelet-cluster start
```

This starts the metadata service, three data nodes, and the gateway, keeping
state under `~/.statelet/cluster`. Check on it with `statelet-cluster status`,
and shut it down with `statelet-cluster stop`.

The gateway exposes gRPC on `:9379`, Redis RESP2 on `:6379`, and the management
UI / REST API on `:9380`.

:::tip
Installed from a `.deb` or `.rpm`? The package already enabled and started
`statelet.service`, so there is nothing to launch — `systemctl status statelet`
confirms it.
:::

## 3. Write and Read Data

The high-level `Client` talks to the gateway on `:9379`, which is what you want
for anything beyond plain KV:

```python
from statelet import Client

db = Client("127.0.0.1:9379")
db.put("hello", b"world")
print(db.get("hello"))   # b"world"
db.delete("hello")
```

For direct KV and vector access to a data node, `StateletClient` connects to
`:7379` and skips the gateway:

```python
from statelet import StateletClient

with StateletClient("127.0.0.1:7379") as client:
    client.put(b"hello", b"world")
    print(client.get(b"hello"))
    client.delete(b"hello")
```

## 4. Try Redis Compatibility

```bash
redis-cli -h 127.0.0.1 -p 6379
```

```text
127.0.0.1:6379> SET hello world
OK
127.0.0.1:6379> GET hello
"world"
```

## 5. Open the Admin UI

Open `http://127.0.0.1:9380` to inspect cluster state, namespaces, databases,
KV data, graph queries, users, and metrics.

## What's Next?

- [Installation](/getting-started/installation) — every install channel, and building from source
- [Vector Search](/concepts/vector-search) — DiskHNSW, SPFresh, and hybrid retrieval
- [Redis Protocol](/api/redis-protocol) — RESP2 compatibility
- [Benchmarks](/benchmarks) — temporal graph and memory evaluation results
