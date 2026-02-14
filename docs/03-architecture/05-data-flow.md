# 数据流

## 1. 主路径

`dataset row -> phase1..phase7 -> conversations/* + overall/*`

## 2. 会话级文件

- `record.json`
- `trace.json`
- `phase_trace.jsonl`
- `node_ledger.jsonl`
- `telemetry_events.jsonl`
- `economic.json`

## 3. 全局级文件

- `results.json`
- `summary.json`
- `conversation_trace.jsonl`
- `phase_trace.jsonl`
- `node_ledger.jsonl`
- `economic_state.json`（train/test）
- `economic_audit.json`（train/test）
- `agent_ranks.json`（train/test）
- `metrics/<run_id>/*.csv`

## 4. 当前字段现实

- `results.json` 为顶层指标键，不使用旧的 `performance_metrics` 嵌套结构。
- `economic_audit.json` 守恒信息位于 `conservation`。
- `agent_ranks.json` 当前为列表结构。
