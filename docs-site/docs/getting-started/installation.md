---
sidebar_position: 1
title: Installation
---

# Installation

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Python (recommended)

Install the Python SDK directly via pip:

```bash
pip install statelet
```

That's it. The package includes the gRPC client and all dependencies. You're ready to connect:

```python
from statelet import Client

client = Client("127.0.0.1:9379")
client.put(b"hello", b"world")
print(client.get(b"hello"))  # b"world"
```

> **Requires Python 3.9+.** See the [Python SDK](/sdks/python) page for the full API.

---

## Server Installation

To run Statelet itself, build from source and start the metadata service, data node, and gateway.

### Build from Source

**Prerequisites:** Rust 1.85+ (`rustup update stable`). `protoc` is **not required** — a prebuilt binary is bundled.

```bash
# Clone the repository
git clone https://github.com/stateletlab/statelet-longmemeval.git
cd statelet

# Build all binaries (metadata, data node, gateway)
cargo build --release --features data-node
```

### Start Local Services

Run each command in a separate terminal:

```bash
cargo run --bin metadata_service
cargo run --features data-node --bin raft_engine -- /tmp/statelet 127.0.0.1:7379
cargo run --bin gateway
```

---

## Other Client SDKs

<Tabs>
  <TabItem value="rust" label="Rust" default>

```bash
statelet-client = "0.1"
```

  </TabItem>
  <TabItem value="go" label="Go">

```bash
cd sdk/go && make proto
```

  </TabItem>
  <TabItem value="java" label="Java">

```xml
<dependency>
    <groupId>ai.statelet</groupId>
    <artifactId>statelet-client</artifactId>
    <version>0.1.0</version>
</dependency>
```

  </TabItem>
  <TabItem value="cpp" label="C++">

```bash
cd sdk/cpp && cmake
```

  </TabItem>
</Tabs>

## Verify Installation

```bash
# Start the three local services
cargo run --bin metadata_service
cargo run --features data-node --bin raft_engine -- /tmp/statelet 127.0.0.1:7379
cargo run --bin gateway

# Test with Python SDK
python3 -c "
from statelet import Client
client = Client('127.0.0.1:9379')
client.put('hello', b'world')
print(client.get('hello'))
"

# Or test with redis-cli
redis-cli -p 6379 PING
# → PONG

redis-cli -p 6379 SET hello "world"
# → OK

redis-cli -p 6379 GET hello
# → "world"
```

## Next Steps

- [Quick Start](/getting-started/quickstart) — Build your first agent memory
- [Configuration](/getting-started/configuration) — Tune Statelet for your workload
