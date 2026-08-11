---
sidebar_position: 1
title: Installation
---

# Installation

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Statelet ships as two separate things:

| | Package | What you get |
|---|---|---|
| **Server** | `statelet` | The three service binaries, `statelet-cli`, the `statelet-cluster` launcher, and the admin UI |
| **Client** | `statelet-sdk` | The client library for your language — no server binaries |

Current release: **server 0.1.3**, **SDKs 0.1.3**.

## Install the Server

Every channel installs the same binaries: `statelet-metadata`, `statelet-datanode`,
`statelet-gateway`, `statelet-cli`, and (except on Windows) the `statelet-cluster`
launcher.

<Tabs groupId="server-install">
  <TabItem value="brew" label="Homebrew" default>

```bash
brew install stateletlab/statelet/statelet
```

macOS and Linux, Intel and ARM. Start it as a background service:

```bash
brew services start statelet
```

  </TabItem>
  <TabItem value="pip" label="pip">

```bash
pip install statelet
```

The wheel carries the server binaries and pulls in `statelet-sdk` as a
dependency, so this is the one command that gives you both the server and the
Python client. Wheels are published for macOS (arm64, x86_64), manylinux2014
(x86_64, aarch64), and Windows (x86_64). Requires Python 3.9+.

  </TabItem>
  <TabItem value="apt" label="apt (Debian/Ubuntu)">

```bash
echo "deb [trusted=yes] https://raw.githubusercontent.com/stateletlab/statelet-longmemeval/packages/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/statelet.list
sudo apt-get update
sudo apt-get install statelet
```

amd64 and arm64. The repository metadata is unsigned, which is why
`[trusted=yes]` is required. Installing enables and starts `statelet.service`.

  </TabItem>
  <TabItem value="yum" label="dnf / yum (RHEL family)">

```bash
sudo tee /etc/yum.repos.d/statelet.repo <<'EOF'
[statelet]
name=Statelet
baseurl=https://raw.githubusercontent.com/stateletlab/statelet-longmemeval/packages/yum/$basearch
enabled=1
gpgcheck=0
EOF
sudo dnf install statelet
```

x86_64 and aarch64. Installing enables and starts `statelet.service`.

  </TabItem>
  <TabItem value="archive" label="Tarball / MSI">

Download from the
[latest release](https://github.com/stateletlab/statelet-longmemeval/releases/latest):

```bash
VERSION=0.1.3
PLATFORM=darwin-arm64   # or darwin-amd64, linux-amd64, linux-arm64
curl -LO "https://github.com/stateletlab/statelet-longmemeval/releases/download/v${VERSION}/statelet-${VERSION}-${PLATFORM}.tar.gz"
tar xzf "statelet-${VERSION}-${PLATFORM}.tar.gz"
./statelet-cluster start
```

On Windows, use `statelet-0.1.3-windows-amd64.msi` or the matching `.zip`.
`.deb` and `.rpm` files are attached to the release too, if you would rather
install one directly than add the repository.

  </TabItem>
</Tabs>

:::note Linux glibc floor
The Linux binaries are built inside manylinux2014 containers and run on any
glibc ≥ 2.17 system. musl distributions (Alpine) and Windows on ARM are not
covered by any published package — build from source there.
:::

## Start the Server

<Tabs groupId="server-start">
  <TabItem value="cluster" label="statelet-cluster" default>

One command brings up the metadata service, the data nodes, and the gateway:

```bash
statelet-cluster start            # 3 data nodes
statelet-cluster start --nodes 1  # single data node
statelet-cluster status
statelet-cluster stop             # --clean also deletes the data directory
```

State lives under `~/.statelet/cluster`; override with `STATELET_DATA_DIR`.

  </TabItem>
  <TabItem value="systemd" label="systemd">

The `.deb` and `.rpm` packages install a unit and enable it on install:

```bash
sudo systemctl status statelet
sudo systemctl restart statelet
journalctl -u statelet -f
```

  </TabItem>
  <TabItem value="brew-services" label="brew services">

```bash
brew services start statelet
brew services list | grep statelet
tail -f "$(brew --prefix)/var/log/statelet/cluster.log"
```

  </TabItem>
  <TabItem value="manual" label="Manually">

Run each service in its own terminal — useful when you want to see the logs or
change a port:

```bash
statelet-metadata
statelet-datanode ~/.statelet/data 127.0.0.1:7379
statelet-gateway
```

See [Configuration](/getting-started/configuration) for every argument and
environment variable.

  </TabItem>
</Tabs>

Once it is up, the gateway serves gRPC on `:9379`, Redis RESP2 on `:6379`, and
the REST API plus admin UI on `:9380`.

## Install a Client SDK

<Tabs groupId="sdk-install">
  <TabItem value="python" label="Python" default>

```bash
pip install statelet-sdk
```

Requires Python 3.9+. `pip install statelet` gets you the same library plus the
server binaries. See the [Python SDK](/sdks/python).

  </TabItem>
  <TabItem value="nodejs" label="Node.js">

```bash
npm install statelet-sdk
```

TypeScript types are bundled. See the [Node.js SDK](/sdks/nodejs).

  </TabItem>
  <TabItem value="go" label="Go">

```bash
go get github.com/stateletlab/statelet-sdk/go@latest
```

Requires Go 1.21+. Generated stubs are committed, so you do not need `protoc`.
See the [Go SDK](/sdks/go).

  </TabItem>
  <TabItem value="rust" label="Rust">

```toml
[dependencies]
statelet-sdk = "0.1"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

Requires Rust 1.70+. See the [Rust SDK](/sdks/rust).

  </TabItem>
  <TabItem value="java" label="Java">

```xml
<dependency>
    <groupId>ai.statelet</groupId>
    <artifactId>statelet-sdk</artifactId>
    <version>0.1.3</version>
</dependency>
```

Or with Gradle:

```groovy
implementation 'ai.statelet:statelet-sdk:0.1.3'
```

Requires Java 17+. See the [Java SDK](/sdks/java).

  </TabItem>
  <TabItem value="cpp" label="C++">

There is no C++ package registry to install from, so the CMake project is
consumed as source:

```cmake
include(FetchContent)
FetchContent_Declare(statelet_sdk
  GIT_REPOSITORY https://github.com/stateletlab/statelet-sdk.git
  GIT_TAG        cpp-v0.1.3
  SOURCE_SUBDIR  cpp)
FetchContent_MakeAvailable(statelet_sdk)
target_link_libraries(my_app PRIVATE statelet_sdk)
```

Requires CMake 3.20+, a C++17 compiler, and gRPC and Protobuf
(`brew install grpc protobuf`, or vcpkg). Self-contained source tarballs are
also attached to the
[`cpp-v*` releases](https://github.com/stateletlab/statelet-sdk/releases).
See the [C++ SDK](/sdks/cpp).

  </TabItem>
</Tabs>

## Verify

```bash
statelet-cli --version
```

```bash
redis-cli -p 6379 PING
# → PONG

redis-cli -p 6379 SET hello "world"
# → OK

redis-cli -p 6379 GET hello
# → "world"
```

```bash
python3 -c "
from statelet import Client
db = Client('127.0.0.1:9379')
db.put('hello', b'world')
print(db.get('hello'))
"
```

Then open `http://127.0.0.1:9380` for the admin UI.

## Build from Source

The engine lives in [stateletlab/statelet](https://github.com/stateletlab/statelet);
building it requires access to that repository.

**Prerequisites:** Rust 1.85+ (`rustup update stable`). `protoc` is **not
required** — a prebuilt binary is bundled.

```bash
git clone https://github.com/stateletlab/statelet.git
cd statelet
cargo build --release --features data-node
```

The source binaries keep their crate names — `metadata_service`, `raft_engine`,
and `gateway` — which the packages rename to `statelet-metadata`,
`statelet-datanode`, and `statelet-gateway`. Run them from a checkout with:

```bash
cargo run --bin metadata_service
cargo run --features data-node --bin raft_engine -- /tmp/statelet 127.0.0.1:7379
cargo run --bin gateway
```

## Next Steps

- [Quick Start](/getting-started/quickstart) — Build your first agent memory
- [Configuration](/getting-started/configuration) — Tune Statelet for your workload
