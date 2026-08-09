---
sidebar_position: 3
title: Go
---

# Go SDK

Official Go client for Statelet. Requires Go 1.21+.

## Installation

The generated protobuf stubs are not checked in, so build them once from the
repository:

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

cd sdk/go && make proto
```

The module path is `github.com/stateletlab/statelet-longmemeval/sdk/go`.

## Endpoints

The KV and vector surface is served by a **data node** (default `127.0.0.1:7379`).
The agent-state surface — causal graph, branches, reactive state, coordination
leases, temporal edges and the prefix watch — is served by the **gateway**
(default `127.0.0.1:9379`).

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/stateletlab/statelet-longmemeval/sdk/go/statelet"
)

func main() {
    client, err := statelet.NewClient("127.0.0.1:7379")
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    ctx := context.Background()

    msg, _ := client.Ping(ctx)
    fmt.Println(msg) // PONG

    client.Put(ctx, []byte("key"), []byte("value"))
    value, _ := client.Get(ctx, []byte("key"))
    fmt.Println(string(value))
}
```

## Key-Value Operations

Keys and values are `[]byte`. Each operation has a `…CF` variant that takes an
explicit column family.

```go
client.Put(ctx, []byte("user:1"), []byte(`{"name": "Alice"}`))
value, err := client.Get(ctx, []byte("user:1"))
client.Delete(ctx, []byte("user:1"))
client.Merge(ctx, []byte("counter"), []byte("1"))

// Explicit column family
client.PutCF(ctx, 1, []byte("user:1"), []byte("..."))
```

### Batch write

```go
import pb "github.com/stateletlab/statelet-longmemeval/sdk/go/statelet/proto"

client.BatchWrite(ctx, []statelet.WriteOp{
    {Op: pb.WriteOp_PUT, Key: []byte("key1"), Value: []byte("value1")},
    {Op: pb.WriteOp_PUT, Key: []byte("key2"), Value: []byte("value2")},
    {Op: pb.WriteOp_DELETE, Key: []byte("key3")},
})
```

### Scan

`Scan` is cursor-paged. Pass a `nil` cursor for the first page; the returned
cursor is `nil` once there are no more results.

```go
entries, cursor, err := client.Scan(ctx, []byte("user:"), nil, 100, nil)
for _, e := range entries {
    fmt.Printf("%s = %s\n", e.Key, e.Value)
}
```

## Causal Graph

These call the gateway, so connect to `:9379`.

```go
db, _ := statelet.NewClient("127.0.0.1:9379")
defer db.Close()

// Add steps. opts may be nil.
observed, _ := db.AddStep(ctx, "agent-1", statelet.StepObserve, &statelet.AddStepOptions{
    Content:    []byte("Market data received"),
    Scope:      statelet.ScopeTeam, // world (default) | team | private
    ScopeOwner: "team-a",
})
thought, _ := db.AddStep(ctx, "agent-1", statelet.StepThink, nil)

// Link them.
db.AddEdge(ctx, observed, thought, statelet.EdgeTriggers, nil)

// Traverse.
result, _ := db.Traverse(ctx, observed, statelet.Forward, 10)
for _, step := range result.Steps {
    content, _ := db.GetContent(ctx, step.ID)
    fmt.Printf("[%s] %s\n", step.Type, content)
}
```

Step types are `StepObserve`, `StepThink`, `StepAct`, `StepTool`, `StepResult`.
Edge types are `EdgeTriggers`, `EdgeInforms`, `EdgeBranches`, `EdgeMerges`,
`EdgeSupersedes`, `EdgeDerivedFrom`, `EdgeContradicts`. Directions are
`Forward`, `Backward` and `Both` — `Both` is accepted by `Traverse` only,
`GetEdges` rejects it.

## Vector Search

```go
chains, _ := db.FindSimilarChains(ctx, embedding, 5, 10, 64)
for _, chain := range chains {
    fmt.Printf("Distance: %f\n", chain.Distance)
    for _, step := range chain.Steps {
        fmt.Printf("  [%s] %d\n", step.Type, step.ID)
    }
}
```

The KV-side vector surface lives on the data node connection:

```go
client.CreateVectorIndex(ctx, "docs", statelet.VectorIndexConfig{
    Dim:            768,
    Metric:         pb.VectorDistanceMetric_VECTOR_COSINE,
    M:              16,
    EfConstruction: 200,
    EfSearch:       64,
})
client.VectorPut(ctx, "docs", 1, embedding)
hits, _ := client.VectorSearch(ctx, "docs", query, 10, 64)
```

## State Branching

```go
branch, _ := db.Fork(ctx, "experiment", 0) // 0 = fork from the main timeline

db.BranchPut(ctx, branch, 0, []byte("strategy"), []byte("conservative"))
value, _ := db.BranchGet(ctx, branch, 0, []byte("strategy"))

db.MergeBranch(ctx, branch)
// or db.DiscardBranch(ctx, branch)
```

## Reactive State

```go
// Compare-and-swap
res, _ := db.CasPut(ctx, 0, []byte("state"), expectedSeq, []byte("new_value"))
if res.Success {
    fmt.Println("new seq:", res.NewSeq)
} else {
    fmt.Println("conflict, current seq:", res.ActualSeq)
}

// Watch — the callback runs per event; return an error to stop watching.
db.WatchPrefix(ctx, "agent-1", 0, []byte("agent-1:"), func(ev statelet.WatchEvent) error {
    fmt.Printf("%s changed\n", ev.Key)
    return nil
})
```

## Coordination Leases

```go
lease, _ := db.Lease(ctx, []byte("job:1"), "agent-1", 30_000)
db.Renew(ctx, []byte("job:1"), "agent-1", lease.Fence, 30_000)
db.Release(ctx, []byte("job:1"), lease.Fence)
```
