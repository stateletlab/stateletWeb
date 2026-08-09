---
sidebar_position: 2
title: KV Operations
---

# Key-Value Operations

Statelet's distributed key-value API is accessible via gRPC (port 9379) or Redis protocol (port 6379).

## Basic Operations

### Put

```python
db.put(key: str, value: bytes)
```

### Get

```python
value = db.get(key: str) -> bytes | None
```

### Delete

```python
db.delete(key: str)
```

### Exists

```python
exists = db.exists(key: str) -> bool
```

## Batch Operations

### BatchWrite

Atomically write multiple key-value pairs:

```python
db.batch_write([
    ("key1", b"value1"),
    ("key2", b"value2"),
    ("key3", b"value3"),
])
```

Batch writes are atomic — either all keys are written or none are.

## Scan Operations

### Scan

Iterate over a key range:

```python
results = db.scan(
    start: str,             # Start key (inclusive)
    end: str,               # End key (exclusive)
    limit: int              # Maximum results
) -> list[tuple[str, bytes]]
```

### Prefix Scan

Iterate over all keys with a given prefix:

```python
results = db.scan_prefix(
    prefix: str,
    limit: int
) -> list[tuple[str, bytes]]
```

## TTL Support

Set time-to-live on keys:

```python
# Set with TTL
db.put(key: str, value: bytes, ttl: int)  # TTL in seconds

# Check remaining TTL
remaining = db.ttl(key: str) -> int  # -1 if no TTL, -2 if expired
```

## Atomic Operations

### Compare-and-Swap

```python
success = db.cas_put(
    key: str,
    value: bytes,
    expected_seq: int
) -> bool
```

### Increment

```python
new_value = db.incr(key: str, delta: int) -> int
```

## Column Families

Organize data into logical groups:

```python
# Create a column family
db.create_cf("agent_state")

# Operations within a column family
db.put(key: str, value: bytes, cf: str = "default")
db.get(key: str, cf: str = "default")
```

## gRPC API

All KV operations are available via gRPC. The protobuf definition:

```protobuf
service KVService {
    rpc Put(PutRequest) returns (PutResponse);
    rpc Get(GetRequest) returns (GetResponse);
    rpc Delete(DeleteRequest) returns (DeleteResponse);
    rpc BatchWrite(BatchWriteRequest) returns (BatchWriteResponse);
    rpc Scan(ScanRequest) returns (stream ScanResponse);
}

message PutRequest {
    string key = 1;
    bytes value = 2;
    optional string column_family = 3;
    optional uint64 ttl_seconds = 4;
}

message GetRequest {
    string key = 1;
    optional string column_family = 2;
}
```
