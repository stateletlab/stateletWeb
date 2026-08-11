---
sidebar_position: 5
title: C++
---

# C++ SDK

Official C++ client for Statelet. Requires C++17 or later.

## Prerequisites

- CMake 3.20+
- A C++17 compiler
- gRPC and Protobuf installed (e.g. `brew install grpc protobuf`, or vcpkg)

## Installation

There is no C++ package registry to install from, so the CMake project is
consumed as source. The easiest route is `FetchContent`:

```cmake
include(FetchContent)
FetchContent_Declare(statelet_sdk
  GIT_REPOSITORY https://github.com/stateletlab/statelet-sdk.git
  GIT_TAG        cpp-v0.1.3
  SOURCE_SUBDIR  cpp)
FetchContent_MakeAvailable(statelet_sdk)

target_link_libraries(my_app PRIVATE statelet_sdk)
```

Self-contained source tarballs, with a `.sha256` beside each, are attached to
the [`cpp-v*` releases](https://github.com/stateletlab/statelet-sdk/releases).

## Build standalone

```bash
git clone https://github.com/stateletlab/statelet-sdk.git
cd statelet-sdk/cpp
cmake -B build
cmake --build build
ctest --test-dir build
```

The build produces the `statelet_sdk` library; link it and add `cpp/include` to
your include path.

:::note Renamed
The CMake project and library target were `statelet-client` / `statelet_client`
while the tree lived at `sdk/cpp` in the engine repository.
:::

## Endpoints

The KV and vector surface is served by a **data node** (default `127.0.0.1:7379`).
The agent-state surface — causal graph, branches, reactive state, coordination
leases, temporal edges and the prefix watch — is served by the **gateway**
(default `127.0.0.1:9379`).

Most calls return a `grpc::Status`; results come back through an out-parameter.
Readers that can legitimately find nothing return `std::optional`.

## Quick Start

```cpp
#include "statelet/client.h"
#include <iostream>

int main() {
    statelet::Client client("127.0.0.1:7379");

    std::cout << client.ping() << std::endl;  // PONG

    client.put("key", "value");
    auto value = client.get("key");
    std::cout << value.value_or("not found") << std::endl;

    return 0;
}
```

## Key-Value Operations

Every operation has an overload taking an explicit column family as the first
argument.

```cpp
client.put("user:1", R"({"name": "Alice"})");
auto value = client.get("user:1");   // std::optional<std::string>
client.del("user:1");
client.merge("counter", "1");

// Explicit column family
client.put(1, "user:1", "...");
```

### Batch write

```cpp
client.batch_write({
    {statelet::WriteOpType::Put,    0, "key1", "value1"},
    {statelet::WriteOpType::Put,    0, "key2", "value2"},
    {statelet::WriteOpType::Delete, 0, "key3", ""},
});
```

## Causal Graph

These call the gateway, so connect to `:9379`.

```cpp
#include "statelet/agent_types.h"

statelet::Client db("127.0.0.1:9379");

// Add steps. The step id comes back through an out-parameter.
statelet::AddStepOptions opts;
opts.content = "Market data received";
opts.scope = statelet::MemoryScope::Team;   // World (default) | Team | Private
opts.scope_owner = "team-a";

uint64_t observed = 0;
db.add_step("agent-1", statelet::StepType::Observe, opts, &observed);

uint64_t acted = 0;
db.add_step("agent-1", statelet::StepType::Act, &acted);   // no-options overload

// Link them.
db.add_edge(observed, acted, statelet::EdgeType::Triggers);

// Traverse — returns by value.
auto walked = db.traverse(observed, statelet::Direction::Forward, 3);
for (const auto& step : walked.steps) {
    auto content = db.get_content(step.id);
    std::cout << "[" << step.step_type << "] "
              << content.value_or("") << std::endl;
}
```

`StepType` is `Observe`, `Think`, `Act`, `Tool`, `Result`. `EdgeType` is
`Triggers`, `Informs`, `Branches`, `Merges`, `Supersedes`, `DerivedFrom`,
`Contradicts`. `Direction` is `Forward`, `Backward`, `Both` — `Both` is accepted
by `traverse()` only, `get_edges()` rejects it.

Note that `Step::step_type` is a `std::string`, not the `StepType` enum.

### Querying edges

```cpp
statelet::GetEdgesOptions edge_opts;
edge_opts.direction = statelet::Direction::Backward;
edge_opts.edge_type = statelet::EdgeType::Informs;
auto edges = db.get_edges(acted, edge_opts);
```

## Vector Search

```cpp
std::vector<float> embedding = {0.1f, 0.2f, 0.3f};

auto chains = db.find_similar_chains(embedding, 5, 3, 0);  // k, chain_depth, ef
for (const auto& chain : chains) {
    std::cout << "Distance: " << chain.distance << std::endl;
    for (const auto& step : chain.steps) {
        std::cout << "  [" << step.step_type << "] " << step.id << std::endl;
    }
}
```

The KV-side vector surface lives on the data node connection:

```cpp
statelet::VectorIndexConfig cfg;
cfg.dim = 768;
client.create_vector_index("docs", cfg);
client.vector_put("docs", 1, embedding);
auto hits = client.vector_search("docs", query, 10);
```

## State Branching

```cpp
uint64_t branch = 0;
db.fork("experiment", 0, &branch);   // 0 = fork from the main timeline

db.branch_put(branch, 0, "strategy", "conservative");
auto value = db.branch_get(branch, 0, "strategy");

db.merge_branch(branch);
// or db.discard_branch(branch);
```

## Reactive State

```cpp
// Compare-and-swap. A losing CAS is not an error: it returns OK with
// success == false and the current actual_seq.
statelet::CasPutResult result;
db.cas_put(0, "state", expected_seq, "new_value", &result);
if (result.success) {
    std::cout << "new seq: " << result.new_seq << std::endl;
} else {
    std::cout << "conflict, current seq: " << result.actual_seq << std::endl;
}

// Watch — return false from the callback to stop watching.
db.watch_prefix("agent-1", 0, "agent-1:",
                [](const statelet::WatchEvent& event) {
                    std::cout << event.key << " " << event.event_type << std::endl;
                    return true;
                });
```

## Coordination Leases

```cpp
statelet::LeaseResult lease;
db.lease("job:1", "agent-1", 30000, &lease);
db.renew("job:1", "agent-1", lease.fence, 30000, &lease);

bool released = false;
db.release("job:1", lease.fence, &released);
```
