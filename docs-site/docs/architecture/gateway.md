---
sidebar_position: 2
title: Gateway
---

# Gateway

The Gateway is Statelet's **stateless routing layer**. It accepts client connections and routes requests to the correct data node based on the shard map.

## Protocols

The Gateway exposes three protocols simultaneously:

| Protocol | Port | Use Case |
|----------|------|----------|
| **gRPC** | 9379 | Primary API for SDKs |
| **HTTP** | 9380 | REST API, management console |
| **Redis RESP2** | 6379 | Drop-in Redis compatibility |

## Routing

1. Client sends a request with a key
2. Gateway hashes the key to determine the shard
3. Gateway looks up the shard's leader node from the cached shard map
4. Request is forwarded to the leader

```
Key "agent-1:state"
    → hash → shard 7
    → shard map lookup → Node 2 is leader
    → forward to Node 2
```

## Shard Map Cache

The Gateway caches the shard map locally for fast routing. The cache is refreshed:

- Periodically on a timer
- On demand when a request fails with "not leader" error
- When the Metadata Plane notifies of shard rebalancing

## Leader Retry

When a data node is no longer the leader for a shard (e.g., after a failover), the Gateway:

1. Receives a "not leader" response with a hint for the new leader
2. Updates the local shard map cache
3. Retries the request to the new leader
4. This is transparent to the client

## Stateless Design

Gateways hold no persistent state. This means:

- Any Gateway instance can handle any request
- Gateways can be scaled horizontally behind a load balancer
- A Gateway crash loses no data
- Rolling restarts have zero downtime

## Configuration

```toml
[gateway]
grpc_port = 9379
http_port = 9380
redis_port = 6379
max_connections = 10000
metadata_endpoints = ["10.0.0.1:7380", "10.0.0.2:7380", "10.0.0.3:7380"]
shard_map_refresh_interval = "5s"
```
