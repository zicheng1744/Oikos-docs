# Telemetry 采集

## 1. 采集位置

- 会话级：`conversations/<id>/telemetry_events.jsonl`
- 汇总级：事件会被转换为 trace/metrics 的组成部分

## 2. 常见字段

- `timestamp`
- `experiment_id`
- `thread_id`
- `event_type`（如 `EXEC_REQ`）
- `source_agent` / `target_agent`
- `interaction_id`
- `metadata_info`

## 3. 使用建议

- 用会话级 telemetry 对照 `trace.json`/`node_ledger.jsonl` 复盘单任务。
- 用 `overall/metrics/*.csv` 做宏观趋势分析。
