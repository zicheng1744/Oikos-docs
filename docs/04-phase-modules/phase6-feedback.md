# Phase 6：Feedback（反馈与排名）

## 职责

Phase 6 负责将执行/结算结果回写为 agent 反馈并导出观测数据：

- agent_eval：更新 agent 排名与画像信息
- observation：导出系统级观察指标

## 配置入口

```yaml
phase6_feedback:
  agent_eval:
    plugin: default_agent_eval
    ranking_algorithm: agent_rank
  observation:
    plugin: default_observation
```

## 可选插件

- agent_eval:
  - `default_agent_eval`, `aether_agent_eval`
  - `aether_agent_eval_random`
  - `aether_agent_eval_degree_centrality`
  - `aether_agent_eval_call_frequency`
  - `aether_agent_eval_success_rate`
  - `aether_agent_eval_quality_based`
  - `aether_agent_eval_credit_based`
  - `aether_agent_eval_hybrid`
- observation: `default_observation`, `aether_observation`

## 真实输出

- `overall/agent_ranks.json`
- `overall/metrics/<run_id>/global_metrics.csv`
- `overall/metrics/<run_id>/individual_profiles.csv`
- `overall/conversation_trace.jsonl`

## 说明

旧文档中的大量理论公式与演化叙述已删减，保留当前代码中真实可切换插件和实际落盘文件。
