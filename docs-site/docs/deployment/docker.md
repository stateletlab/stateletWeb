---
sidebar_position: 2
title: Docker
---

# Docker Deployment

Run Statelet as a multi-container cluster with Docker Compose.

## Quick Start

```bash
docker compose up -d
```

## Docker Compose

```yaml
version: '3.8'

services:
  metadata:
    image: statelet/statelet:latest
    command: ["metadata", "--id", "1", "--bind", "0.0.0.0:7380"]
    ports:
      - "7380:7380"
    volumes:
      - metadata-data:/data

  data-node-1:
    image: statelet/statelet:latest
    command: ["raft_engine", "/data", "0.0.0.0:7379"]
    ports:
      - "7379:7379"
    volumes:
      - data1:/data
    depends_on:
      - metadata

  data-node-2:
    image: statelet/statelet:latest
    command: ["raft_engine", "/data", "0.0.0.0:7379"]
    volumes:
      - data2:/data
    depends_on:
      - metadata

  gateway:
    image: statelet/statelet:latest
    command: ["gateway", "--metadata", "metadata:7380"]
    ports:
      - "9379:9379"     # gRPC
      - "9380:9380"     # HTTP
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

## Step-by-Step

```bash
# Start metadata plane first
docker compose up -d metadata

# Start data nodes
docker compose up -d data-node-1
docker compose up -d data-node-2

# Start gateway
docker compose up -d gateway
```

## Build from Source

```dockerfile
# Multi-stage build
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release --features data-node

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/raft_engine /usr/local/bin/
COPY --from=builder /app/target/release/gateway /usr/local/bin/
COPY --from=builder /app/target/release/metadata /usr/local/bin/
EXPOSE 7379 9379 9380 6379
CMD ["raft_engine", "/data", "0.0.0.0:7379"]
```

```bash
docker build -t statelet:local .
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
