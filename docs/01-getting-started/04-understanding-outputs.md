# 理解输出结果

本文只描述当前代码真实产物（以 `exp/docs_verify/test-20260214T190527-22a9` 为样例验证）。

## 1. 目录分层

每次运行目录：

```text
<run_dir>/
├── conversations/        # 按会话拆分
├── overall/              # 全局汇总
└── runtime/              # 运行时日志/进程/注册快照
```

## 2. conversations（会话级）

会话目录命名：
- `0001__run-...`
- `0002__run-...`

单会话包含：

```text
conversations/<conversation_dir>/
├── summary.json
├── record.json
├── trace.json
├── phase_trace.jsonl
├── node_ledger.jsonl
├── economic.json
└── telemetry_events.jsonl
```

### 2.1 `summary.json`

当前关键字段：
- `mode`
- `episode`
- `sample_id`
- `thread_id`
- `event_counts`
- `errors`
- `orchestration_signals`
- `telemetry_event_count`
- `paths`

### 2.2 `record.json`

当前关键字段：
- `episode` / `sample_id` / `input` / `target`
- `prediction` / `is_correct`
- `thread_id`
- `event_counts` / `errors`
- `orchestration_signals`
- `update_signals` / `update_evidence`
- `economic`

### 2.3 `trace.json`

当前是标准化审计记录，不是“简化 DAG 教学示例”。

常见字段：
- `schema_name` / `schema_version`
- `trace_id` / `record_type` / `canonical`
- `run_id` / `mode` / `episode` / `sample_id` / `thread_id`
- `orchestrator` / `worker` / `evaluator` / `audit`

### 2.4 `phase_trace.jsonl`

每行一个 phase 事件。当前记录至少含 `episode`，并携带 phase 相关信息用于审计。

### 2.5 `node_ledger.jsonl`

每行一个节点账本记录，常见字段：
- `schema_name` / `schema_version`
- `record_id` / `parent_trace_id`
- `plan_dag_id` / `plan_id`
- `assigned_agent_url`
- `worker_raw_response`
- `evaluator_score_0_to_10`

### 2.6 `telemetry_events.jsonl`

当前事件模型示例字段：
- `timestamp`
- `experiment_id`
- `thread_id`
- `event_type`（例如 `EXEC_REQ`）
- `source_agent` / `target_agent`
- `interaction_id`
- `metadata_info`

## 3. overall（全局级）

```text
overall/
├── config_resolved.yaml
├── summary.json
├── results.json
├── outputs.jsonl
├── conversation_trace.jsonl
├── phase_trace.jsonl
├── node_ledger.jsonl
├── economic_state.json
├── economic_audit.json
├── agent_ranks.json
└── metrics/<run_id>/
    ├── summary.json
    ├── global_metrics.csv
    └── individual_profiles.csv
```

### 3.1 `results.json`

当前关键字段：
- `mode`
- `dataset_path`
- `num_samples`
- `max_episodes`
- `passed` / `failed` / `accuracy`
- `market_efficiency`
- `gini_coefficient`
- `avg_revenue`
- `agent_satisfaction`
- `full_chain_detect_rate`
- `evaluator_detect_rate`

### 3.2 `summary.json`

当前关键字段：
- `status`
- `run_id`
- `mode`
- `started_at` / `finished_at`
- `output_dir`
- `module_load_report`
- `execution_profile`
- `artifacts`
- `phase_status_summary`

### 3.3 `economic_audit.json`

当前关键字段：
- `schema`
- `version`
- `run_id`
- `execution_profile`
- `plugin_selection`
- `conservation`
- `audit_report`

### 3.4 `agent_ranks.json`

当前是 `list`，不是对象。

每个元素常见字段：
- `agent_id`
- `rank`
- `tasks_participated`
- `avg_task_score_0_to_10`
- `balance`

## 4. runtime（运行时）

```text
runtime/
├── logs/
├── pids/
├── workers.registered.json
└── local_workers.effective.json
```

说明：
- `workers.registered.json`：本次运行实际注册到系统的 worker 快照
- `local_workers.effective.json`：本地附加 worker 配置快照

## 5. 快速自检命令

```bash
python - <<'PY'
import json, pathlib
run = pathlib.Path('.')
conv = sorted((run/'conversations').iterdir())[0]
print('conversation dir =', conv.name)
print('summary keys =', list(json.loads((conv/'summary.json').read_text()).keys()))
print('results keys =', list(json.loads((run/'overall'/'results.json').read_text()).keys()))
print('audit keys =', list(json.loads((run/'overall'/'economic_audit.json').read_text()).keys()))
PY
```
