---
sidebar_position: 2
title: Rust
---

# Rust SDK

Official Rust client for Statelet. Requires Rust 1.70+.

## Installation

```toml
[dependencies]
statelet-sdk = "0.1"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

Or `cargo add statelet-sdk tokio --features tokio/rt-multi-thread,tokio/macros`.
The crate is published on [crates.io](https://crates.io/crates/statelet-sdk);
the current release is 0.1.4.

:::note Renamed
The crate was `statelet-client` while the SDKs lived under `sdk/` in the engine
repository. The import root is now `statelet_sdk`, not `statelet_client`.
:::

## Scope

The Rust client covers the KV, vector and committed-feed (CDC) surface served by
a **data node** (default `127.0.0.1:7379`).

The agent-state surface — causal graph, branches, reactive state, coordination
leases — is served by the gateway and is not yet exposed by this client. Use the
[Python](./python.md), [Go](./go.md), [Java](./java.md) or [C++](./cpp.md) SDK
for those.

Every method takes `&mut self` and returns `Result<_, tonic::Status>`.

## Quick Start

```rust
use statelet_sdk::StateletClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = StateletClient::connect("http://127.0.0.1:7379").await?;

    println!("{}", client.ping().await?); // PONG

    client.put(b"key", b"value", None).await?;
    let value = client.get(b"key", None).await?;
    println!("{value:?}");

    Ok(())
}
```

## Key-Value Operations

Keys and values are byte slices. The trailing `cf` argument selects a column
family; pass `None` to use the client default.

```rust
client.put(b"user:1", br#"{"name": "Alice"}"#, None).await?;
let value: Option<Vec<u8>> = client.get(b"user:1", None).await?;
client.delete(b"user:1", None).await?;
client.merge(b"counter", b"1", None).await?;

// Change the default column family for subsequent calls.
client.set_default_cf(1);
```

### Batch write

`WriteOp` is an enum; each variant carries its own column family.

```rust
use statelet_sdk::WriteOp;

client.batch_write(vec![
    WriteOp::Put    { cf: 0, key: b"key1".to_vec(), value: b"value1".to_vec() },
    WriteOp::Put    { cf: 0, key: b"key2".to_vec(), value: b"value2".to_vec() },
    WriteOp::Delete { cf: 0, key: b"key3".to_vec() },
]).await?;
```

### Scan

`scan` is cursor-paged. Pass `None` as the cursor for the first page; the
returned cursor is `None` once there are no more results.

```rust
let (entries, cursor) = client.scan(b"user:", None, 100, None).await?;
for (key, value) in entries {
    println!("{} = {}", String::from_utf8_lossy(&key), String::from_utf8_lossy(&value));
}

client.delete_by_prefix(b"session:", None).await?;
```

## Vector Search

```rust
use statelet_sdk::VectorIndexConfig;

let config = VectorIndexConfig {
    dim: 768,
    metric: 1, // 0 = L2, 1 = Cosine, 2 = InnerProduct
    ..Default::default()
};
client.create_vector_index("docs", config).await?;

client.vector_put("docs", 1, embedding).await?;

let hits = client.vector_search("docs", query, 10, Some(64)).await?;
for hit in hits {
    println!("id={} distance={}", hit.id, hit.distance);
}
```

`vector_search_reranked` and `vector_search_grouped` add a second-stage reranker
and field-collapse grouping respectively; `vector_get`, `vector_delete` and
`drop_vector_index` round out the surface.

## Committed Feed (CDC)

Subscribe to the committed change feed. The handler returns `Ok(true)` to keep
consuming and `Ok(false)` to stop.

```rust
use statelet_sdk::{FileCheckpointStore, SubscribeCommittedOptions};

let store = FileCheckpointStore::open("/var/lib/myapp/cdc.ckpt")?;
let opts = SubscribeCommittedOptions {
    checkpoint: Some(&store),
    key_prefix: b"agent-1:".to_vec(),
    include_values: true,
    ..Default::default()
};

client.subscribe_committed(opts, |change| {
    println!("{:?}", change);
    Ok::<bool, std::convert::Infallible>(true)
}).await?;
```
