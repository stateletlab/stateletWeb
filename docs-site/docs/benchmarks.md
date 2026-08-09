---
sidebar_position: 8
title: Benchmarks
---

# Benchmarks

Statelet's performance story is the unified engine: temporal graph, vector, and memory operations run inside the same process that stores the data, avoiding cross-service hops between a KV store, vector database, and graph database.

## LongMemEval-S

Statelet's server-side memory engine was evaluated on LongMemEval-S, the standard benchmark for AI agent memory systems. The full 500-question end-to-end run reached **91.6%** accuracy. Reader / judge model: `gpt-5.6-sol` medium.

### Retrieval-Only, 500 Questions, k=5

| Metric | Value |
|--------|-------|
| hit@5 / recall_any@5 | **99.0%** |
| recall@5 | **0.937** |
| MRR | **0.938** |
| span_hit@5 | **0.900** |
| span_recall@5 | **0.789** |

### End-to-End Accuracy

| Q Type | Correct / N | Accuracy |
|--------|-------------|----------|
| single-session-assistant | 55 / 56 | 98.2% |
| single-session-user | 68 / 70 | 97.1% |
| knowledge-update | 74 / 78 | 94.9% |
| temporal-reasoning | 122 / 133 | 91.7% |
| single-session-preference | 26 / 30 | 86.7% |
| multi-session | 113 / 133 | 85.0% |
| **Overall** | **458 / 500** | **91.6%** |

## Reproducing Benchmarks

Enable server-side memory extraction for memory evaluations:

```bash
export STATELET_LLM_EXTRACT=1
export STATELET_LLM_API_KEY=sk-...
export STATELET_LLM_BASE_URL=https://api.deepseek.com
export STATELET_LLM_MODEL=deepseek-chat
```
