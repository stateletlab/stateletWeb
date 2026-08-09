---
sidebar_position: 3
title: Redis Protocol
---

# Redis Protocol Compatibility

Statelet natively supports the **Redis RESP2 protocol** on port 6379. Any existing Redis client can connect directly to Statelet without modification.

## Connecting

```bash
# redis-cli
redis-cli -p 6379

# Python
import redis
r = redis.Redis(host='localhost', port=6379)

# Node.js (ioredis)
const Redis = require('ioredis');
const r = new Redis(6379);
```

## Supported Commands

### String Commands

| Command | Example |
|---------|---------|
| `SET` | `SET mykey "hello"` |
| `GET` | `GET mykey` |
| `DEL` | `DEL mykey` |
| `EXISTS` | `EXISTS mykey` |
| `INCR` | `INCR counter` |
| `DECR` | `DECR counter` |
| `INCRBY` | `INCRBY counter 5` |
| `MSET` | `MSET key1 "v1" key2 "v2"` |
| `MGET` | `MGET key1 key2` |
| `APPEND` | `APPEND mykey " world"` |
| `STRLEN` | `STRLEN mykey` |

### Key Commands

| Command | Example |
|---------|---------|
| `TTL` | `TTL mykey` |
| `EXPIRE` | `EXPIRE mykey 60` |
| `PEXPIRE` | `PEXPIRE mykey 60000` |
| `PERSIST` | `PERSIST mykey` |
| `KEYS` | `KEYS agent-*` |
| `SCAN` | `SCAN 0 MATCH agent-* COUNT 100` |
| `TYPE` | `TYPE mykey` |
| `RENAME` | `RENAME oldkey newkey` |

### Server Commands

| Command | Example |
|---------|---------|
| `PING` | `PING` → `PONG` |
| `INFO` | `INFO` |
| `DBSIZE` | `DBSIZE` |
| `FLUSHDB` | `FLUSHDB` |

## Example: Using Statelet as a Redis Drop-in

```bash
$ redis-cli -p 6379

127.0.0.1:6379> SET agent:1:state "exploring"
OK

127.0.0.1:6379> GET agent:1:state
"exploring"

127.0.0.1:6379> SET session:abc "data" EX 3600
OK

127.0.0.1:6379> TTL session:abc
(integer) 3600

127.0.0.1:6379> INCR agent:1:steps
(integer) 1

127.0.0.1:6379> MSET agent:1:name "trader" agent:1:status "active"
OK

127.0.0.1:6379> MGET agent:1:name agent:1:status
1) "trader"
2) "active"
```

## Python Example

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Store agent state
r.set("agent:1:state", "thinking")
r.set("agent:1:step_count", 0)

# Increment step counter
r.incr("agent:1:step_count")

# Set with TTL (session data)
r.setex("session:token:abc", 3600, "user_data")

# Scan for all agent keys
for key in r.scan_iter("agent:1:*"):
    print(f"{key} = {r.get(key)}")
```

## Limitations

Statelet implements the core Redis string and key commands. The following Redis features are **not supported**:

- Lists, Sets, Sorted Sets, Hashes (use KV with JSON values instead)
- Pub/Sub (use Statelet's native `watch_prefix` instead)
- Lua scripting
- Redis Cluster protocol (Statelet has its own clustering)
- Transactions (`MULTI`/`EXEC`)

:::tip
For agent memory operations (causal graph, temporal edges, vector search, branching), use the gRPC API via the official SDKs. The Redis protocol is best for simple KV operations and quick integration with existing tools.
:::
