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
          image: statelet/statelet:latest
          command: ["metadata"]
          args:
            - "--id=$(POD_INDEX)"
            - "--bind=0.0.0.0:7380"
            - "--peers=metadata-0.metadata:7380,metadata-1.metadata:7380,metadata-2.metadata:7380"
          env:
            - name: POD_INDEX
              valueFrom:
                fieldRef:
                  fieldPath: metadata.labels['apps.kubernetes.io/pod-index']
          ports:
            - containerPort: 7380
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
    - port: 7380
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
          image: statelet/statelet:latest
          command: ["raft_engine", "/data", "0.0.0.0:7379"]
          ports:
            - containerPort: 7379
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
          image: statelet/statelet:latest
          command: ["gateway"]
          args:
            - "--metadata=metadata-0.metadata:7380,metadata-1.metadata:7380,metadata-2.metadata:7380"
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
