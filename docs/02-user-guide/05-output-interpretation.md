# 输出解读（研究向）

本页基于当前真实产物结构。

## 1. 总体结构

```text
<run_dir>/
├── conversations/
├── overall/
└── runtime/
```

## 2. conversations（单会话）

目录示例：`conversations/0001__run-1-xxxx/`

常见文件：
- `summary.json`
- `record.json`
- `trace.json`
- `phase_trace.jsonl`
- `node_ledger.jsonl`
- `economic.json`
- `telemetry_events.jsonl`

## 3. overall（全局）

关键文件：
- `config_resolved.yaml`
- `results.json`
- `summary.json`
- `outputs.jsonl`
- `conversation_trace.jsonl`
- `phase_trace.jsonl`
- `node_ledger.jsonl`
- `economic_state.json`（train/test）
- `economic_audit.json`（train/test）
- `agent_ranks.json`（train/test）

## 4. 字段现实说明

- `results.json` 顶层直接是指标键（不是 `performance_metrics` 嵌套）。
- `agent_ranks.json` 当前是 `list`，不是对象。
- `economic_audit.json` 关键在 `conservation` 子结构。

## 5. 建议分析顺序

1. 先看 `overall/summary.json`：是否成功、phase 状态。
2. 再看 `overall/results.json`：核心指标。
3. 再看 `overall/economic_audit.json`：守恒与审计。
4. 最后下钻 `conversations/*/` 做逐会话分析。
