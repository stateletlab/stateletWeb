---
sidebar_position: 6
title: Node.js
---

# Node.js SDK

Official TypeScript-first Node.js client for Statelet. Published on npm as
`statelet-sdk`; the current release is 0.1.3.

## Installation

```bash
npm install statelet-sdk
```

Type declarations are bundled — no `@types` package to add. The proto is loaded
at runtime from inside the package, so nothing needs `protoc` at install time.

## Endpoints

The KV and vector surface is served by a **data node** (default
`127.0.0.1:7379`). The agent-state and graph-query surface is served by the
**gateway** (default `127.0.0.1:9379`).

## Quick Start

```ts
import {
  StateletClient,
  WriteEntryBuilder,
  VectorIndexConfigBuilder,
  VectorDistanceMetric,
} from "statelet-sdk";

const client = new StateletClient("127.0.0.1", 7379);
await client.waitForReady();

console.log(await client.ping()); // "PONG"

await client.put("hello", "world");
const value = await client.get("hello");
console.log(value?.toString("utf8"));

client.close();
```

Keys and values accept `Buffer`, `Uint8Array`, or a UTF-8 `string`.

### Constructor forms

```ts
new StateletClient("127.0.0.1", 7379);
new StateletClient("127.0.0.1:7379");
new StateletClient("127.0.0.1:7379", { defaultCf: 2 });
```

For an authenticated gateway, pass default gRPC metadata:

```ts
const db = new StateletClient("127.0.0.1:9379", {
  metadata: { authorization: "Bearer <jwt>" },
});
```

## Key-Value Operations

```ts
await client.batchWrite([
  WriteEntryBuilder.put("k1", "v1"),
  WriteEntryBuilder.put("k2", "v2"),
  WriteEntryBuilder.delete("k3"),
]);
```

`scan` and `deleteByPrefix` round out the KV surface.

## Vector Search

```ts
const config = new VectorIndexConfigBuilder(128)
  .metric(VectorDistanceMetric.VECTOR_COSINE)
  .efSearch(96);

await client.createVectorIndex("embeddings", config);
await client.vectorPut("embeddings", 1n, new Array(128).fill(0.1));

const results = await client.vectorSearch(
  "embeddings",
  new Array(128).fill(0.15),
  5
);

for (const result of results) {
  console.log(`id=${result.id} distance=${result.distance}`);
}

await client.dropVectorIndex("embeddings");
```

Vector IDs are `bigint`, so `uint64` precision is never lost. `vectorBatchPut`,
`vectorBatchDelete`, `vectorTrain`, `vectorSample`, and `getNodeStats` are also
available.

### Reranking

An optional second stage over an over-fetched candidate window:

```ts
// Cross-encoder: hydrate passage text via the template, then rescore.
let hits = await client.vectorSearch(
  "embeddings",
  new Array(128).fill(0.15),
  5,
  0,
  undefined,
  {
    model: "cross-encoder",
    passageField: "doc:{index}:{id}:text",
    queryText: "capital of France",
  }
);

// Score fusion: blend in the exact full-precision distance.
hits = await client.vectorSearch(
  "embeddings",
  new Array(128).fill(0.15),
  5,
  0,
  undefined,
  { model: "score-fusion", signalBlend: 0.7 }
);
```

`rerankValidate` dry-runs a spec without executing a search.

## Declarative Graph Query

Read-only openCypher-subset pattern matching, served by the gateway's
`GraphQuery` RPC. `CREATE` / `MERGE` are rejected.

```ts
import { StateletClient, graphRowsToObjects } from "statelet-sdk";

const res = await db.graphQuery(
  "MATCH (m {id: 42})-[:supersedes]->(old) RETURN m, old LIMIT 10",
  { graphName: "my_graph" }
);

console.log(res.columns); // ["m", "old"]
for (const row of graphRowsToObjects(res)) {
  console.log(row.m);
}
console.log(res.warnings); // non-empty ⇒ the result may be incomplete
```

Bitemporal time travel and vector-seeded expansion:

```ts
await db.graphQuery(
  "CALL db.vectorSearch([0.1, 0.2, 0.3], 5) YIELD node, score RETURN node, score",
  { graphName: "my_graph", asOf: 1737000000000n }
);
```

Each cell is a `GraphValue` — switch on `kind`, or call `graphValueToJs(value)`
for the natural JS value.

## Managed Local Server

For integration tests, the SDK can start and stop a standalone data node for
you. This spawns a separate process — it is not an embedded engine.

```ts
import { StateletServer } from "statelet-sdk";

const server = await StateletServer.startStandalone({
  repoRoot: "/path/to/statelet",
  dbPath: "/tmp/statelet-node-demo",
  grpcAddr: "127.0.0.1:7379",
  env: { METRICS_ADDR: "127.0.0.1:19091" },
});

const client = server.createClient();
await client.put("hello", "world");
client.close();

await server.stop();
```

It expects a `raft_engine` binary built from an engine checkout
(`cargo build --features data-node --bin raft_engine`). Give each concurrent
server its own `METRICS_ADDR`. For anything other than tests, install the server
properly — see [Installation](/getting-started/installation).
