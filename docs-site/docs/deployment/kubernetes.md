---
sidebar_position: 3
title: Kubernetes
---

# Kubernetes Deployment

Production deployment with 3+ data nodes using StatefulSets for stable network identities and persistent storage.

## Architecture

```
┌─────────────────────────────────┐
│         Ingress / LB            │
│     (ports 9379, 9380, 6379)    │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│       Gateway Deployment         │
│       (2+ replicas, stateless)   │
└──────┬───────────────────┬──────┘
       │                   │
┌──────▼──────┐    ┌───────▼─────┐
│  Metadata   │    │  Data Nodes │
│ StatefulSet │    │ StatefulSet │
│ (3 replicas)│    │ (3+ replicas│
└─────────────┘    └─────────────┘
```

:::info Image
No official image is published yet. Build one from an engine checkout and push it
to a registry your cluster can pull from — see
[Docker](/deployment/docker#build-the-image) for the Dockerfile — then replace
`statelet/statelet:local` below with that tag.
:::

## Deploy

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/metadata.yaml
kubectl apply -f k8s/raft-engine.yaml
kubectl apply -f k8s/gateway.yaml
```

## Manifests

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: statelet
```

### Metadata StatefulSet

```yaml
# k8s/metadata.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: metadata
  namespace: statelet
spec:
  serviceName: metadata
  replicas: 3
  selector:
    matchLabels:
      app: statelet-metadata
  template:
    metadata:
      labels:
        app: statelet-metadata
    spec:
      containers:
        - name: metadata
          image: statelet/statelet:local
          # Node ids are 1-based and the StatefulSet ordinal is 0-based, so the
          # id is derived from the hostname rather than passed in directly —
          # env-var substitution cannot do the arithmetic.
          command:
            - sh
            - -c
            - 'export META_NODE_ID=$(( ${HOSTNAME##*-} + 1 )) && exec metadata_service'
          env:
            - name: META_ADDR
              value: "0.0.0.0:8379"
            - name: META_PEERS
              value: "1@metadata-0.metadata:8379,2@metadata-1.metadata:8379,3@metadata-2.metadata:8379"
            - name: META_DATA_DIR
              value: "/data"
          ports:
            - containerPort: 8379
          volumeMounts:
            - name: data
              mountPath: /data
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: metadata
  namespace: statelet
spec:
  clusterIP: None
  selector:
    app: statelet-metadata
  ports:
    - port: 8379
```

### Data Node StatefulSet

```yaml
# k8s/raft-engine.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: data-node
  namespace: statelet
spec:
  serviceName: data-node
  replicas: 3
  selector:
    matchLabels:
      app: statelet-data
  template:
    metadata:
      labels:
        app: statelet-data
    spec:
      containers:
        - name: data-node
          image: statelet/statelet:local
          command:
            - sh
            - -c
            - 'export DATA_NODE_ID=$(( ${HOSTNAME##*-} + 1 )) && exec raft_engine /data'
          env:
            - name: META_SERVER
              value: "http://metadata:8379"
            - name: DATA_ADDR
              value: "0.0.0.0:7379"
            - name: RAFT_ADDR
              value: "0.0.0.0:7380"
          ports:
            - containerPort: 7379
            - containerPort: 7380
          volumeMounts:
            - name: data
              mountPath: /data
          resources:
            requests:
              cpu: "2"
              memory: "8Gi"
            limits:
              cpu: "4"
              memory: "16Gi"
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: data-node
  namespace: statelet
spec:
  clusterIP: None
  selector:
    app: statelet-data
  ports:
    - port: 7379
```

### Gateway Deployment

```yaml
# k8s/gateway.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
  namespace: statelet
spec:
  replicas: 2
  selector:
    matchLabels:
      app: statelet-gateway
  template:
    metadata:
      labels:
        app: statelet-gateway
    spec:
      containers:
        - name: gateway
          image: statelet/statelet:local
          command: ["gateway"]
          env:
            - name: GATEWAY_META
              value: "http://metadata:8379"
            - name: GATEWAY_ADDR
              value: "0.0.0.0:9379"
            - name: GATEWAY_MGMT_ADDR
              value: "0.0.0.0:9380"
            - name: GATEWAY_REDIS_ADDR
              value: "0.0.0.0:6379"
            - name: GATEWAY_UI_DIR
              value: "/usr/local/share/statelet/ui"
          ports:
            - containerPort: 9379
              name: grpc
            - containerPort: 9380
              name: http
            - containerPort: 6379
              name: redis
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2"
              memory: "4Gi"
---
apiVersion: v1
kind: Service
metadata:
  name: gateway
  namespace: statelet
spec:
  type: LoadBalancer
  selector:
    app: statelet-gateway
  ports:
    - name: grpc
      port: 9379
    - name: http
      port: 9380
    - name: redis
      port: 6379
```

## Verify

```bash
# Check pods
kubectl get pods -n statelet

# Test connection
kubectl port-forward svc/gateway 9379:9379 6379:6379 -n statelet

# In another terminal
redis-cli -p 6379 PING
```

## Monitoring

Statelet exposes Prometheus metrics on the HTTP port:

```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: statelet
  namespace: statelet
spec:
  selector:
    matchLabels:
      app: statelet-gateway
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

## Scaling

```bash
# Scale data nodes
kubectl scale statefulset data-node --replicas=5 -n statelet

# Scale gateways
kubectl scale deployment gateway --replicas=4 -n statelet
```

Shard rebalancing happens automatically when data nodes are added.
