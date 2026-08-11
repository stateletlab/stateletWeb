---
sidebar_position: 2
title: Docker
---

# Docker Deployment

Run Statelet as a multi-container cluster with Docker Compose.

:::info No official image yet
There is no published `statelet/statelet` image on Docker Hub. Build one locally
first — the compose file below uses that local tag. If you only want a cluster on
your machine, `statelet-cluster start` after any install from
[Installation](/getting-started/installation) is simpler than Docker.
:::

## Build the Image

```dockerfile
# Multi-stage build
FROM rust:1.85 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release --features data-node

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/metadata_service /usr/local/bin/
COPY --from=builder /app/target/release/raft_engine      /usr/local/bin/
COPY --from=builder /app/target/release/gateway          /usr/local/bin/
# The gateway resolves the admin UI from GATEWAY_UI_DIR.
COPY --from=builder /app/ui/dist /usr/local/share/statelet/ui
EXPOSE 7379 7380 8379 9379 9380 6379
CMD ["raft_engine", "/data", "0.0.0.0:7379"]
```

Build it from an engine checkout:

```bash
docker build -t statelet/statelet:local .
```

## Docker Compose

Every service is configured through environment variables — there are no
`--id` / `--bind` style flags. See [Configuration](/getting-started/configuration)
for the full list.

```yaml
services:
  metadata:
    image: statelet/statelet:local
    command: ["metadata_service"]
    environment:
      META_ADDR: 0.0.0.0:8379
      META_DATA_DIR: /data
    ports:
      - "8379:8379"
    volumes:
      - metadata-data:/data

  data-node-1:
    image: statelet/statelet:local
    command: ["raft_engine", "/data"]
    environment:
      META_SERVER: http://metadata:8379
      DATA_NODE_ID: "1"
      DATA_ADDR: 0.0.0.0:7379
      RAFT_ADDR: 0.0.0.0:7380
    ports:
      - "7379:7379"
    volumes:
      - data1:/data
    depends_on:
      - metadata

  data-node-2:
    image: statelet/statelet:local
    command: ["raft_engine", "/data"]
    environment:
      META_SERVER: http://metadata:8379
      DATA_NODE_ID: "2"
      DATA_ADDR: 0.0.0.0:7379
      RAFT_ADDR: 0.0.0.0:7380
    volumes:
      - data2:/data
    depends_on:
      - metadata

  gateway:
    image: statelet/statelet:local
    command: ["gateway"]
    environment:
      GATEWAY_META: http://metadata:8379
      GATEWAY_ADDR: 0.0.0.0:9379
      GATEWAY_MGMT_ADDR: 0.0.0.0:9380
      GATEWAY_REDIS_ADDR: 0.0.0.0:6379
      GATEWAY_UI_DIR: /usr/local/share/statelet/ui
    ports:
      - "9379:9379"     # gRPC
      - "9380:9380"     # HTTP + admin UI
      - "6379:6379"     # Redis
    depends_on:
      - metadata
      - data-node-1
      - data-node-2

volumes:
  metadata-data:
  data1:
  data2:
```

```bash
docker compose up -d
```

## Step-by-Step

The metadata plane has to be answering before the data nodes register with it,
and the data nodes before the gateway routes to them:

```bash
# Start metadata plane first
docker compose up -d metadata

# Start data nodes
docker compose up -d data-node-1 data-node-2

# Start gateway
docker compose up -d gateway
```

## Verify

```bash
# Check all containers are running
docker compose ps

# Test connection
redis-cli -p 6379 PING
# → PONG

# Test with Python
python3 -c "
from statelet import Client
db = Client('localhost:9379')
db.put('test', b'docker works')
print(db.get('test'))
"
```

The admin UI is on `http://localhost:9380`.

## Persistent Storage

Data is stored in Docker volumes. To use host directories instead:

```yaml
volumes:
  - /var/lib/statelet/data1:/data
```

## Resource Limits

```yaml
data-node-1:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 8G
      reservations:
        cpus: '2'
        memory: 4G
```
