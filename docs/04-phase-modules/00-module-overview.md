# Phase 模块总览（当前实现）

本文档描述 Oikos 当前代码中 Phase1-Phase7 的真实模块结构、配置入口和运行产物。

## 1. 总体链路

Oikos 在一次 `train/test/chat` 运行中的主链路：

`Phase1 初始化 -> Phase2 任务创建 -> Phase3 任务分配 -> Phase4 执行 -> Phase5 结算 -> Phase6 反馈 -> Phase7 资金池/审计`

所有阶段的事件会写入：

- `overall/phase_trace.jsonl`
- `overall/node_ledger.jsonl`
- `overall/conversation_trace.jsonl`

并按对话拆分到：

- `conversations/<idx>__<thread_id>/phase_trace.jsonl`
- `conversations/<idx>__<thread_id>/node_ledger.jsonl`
- `conversations/<idx>__<thread_id>/trace.json`

## 2. 配置入口

统一在 YAML 中配置（示例见 `config_resolved.yaml`）：

- `phase1_init`
- `phase2_creation`
- `phase3_allocation`
- `phase4_execution`
- `phase5_settlement`
- `phase6_feedback`
- `phase7_pool`

经济侧（Phase5-7）的实际选中插件会写入：

- `overall/economic_audit.json` -> `plugin_selection`

## 3. 当前可用插件（按代码注册表）

### Phase 1
- `default_general_config`, `aether_general_config`
- `default_task_pool`, `aether_task_pool`
- `default_infrastructure`, `aether_infrastructure`
- `default_economic_system`, `aether_economic_system`
- `default_participants`, `aether_participants`

### Phase 2
- `default_task_extraction`, `aether_task_extraction`
- `default_task_pricing`, `aether_task_pricing`
- `default_task_publishing`, `aether_task_publishing`

### Phase 3
- `default_task_orchestrator`, `aether_task_orchestrator`
- `default_security_monitor`, `aether_security_monitor`

### Phase 4
- `default_task_planning`, `aether_task_planning`
- `default_task_routing`, `aether_task_routing`
- `default_subtask_management`, `aether_subtask_management`
- `default_result_evaluation`, `aether_result_evaluation`
- `default_execution_coordination`, `aether_execution_coordination`
- `default_anomaly_injection`, `aether_anomaly_injection`

### Phase 5
- 结果评估：`default_result_eval`, `aether_result_eval`
- 结算：
  - `default_settlement`, `aether_settlement`
  - `aether_first_price_equal_split_settlement`
  - `aether_second_price_equal_split_settlement`
  - `aether_second_price_contribution_settlement`
  - `aether_second_price_intelligence_settlement`
  - `aether_second_price_credit_settlement`
  - `aether_adversarial_contribution_settlement`

### Phase 6
- Agent 评估：
  - `default_agent_eval`, `aether_agent_eval`
  - `aether_agent_eval_random`
  - `aether_agent_eval_degree_centrality`
  - `aether_agent_eval_call_frequency`
  - `aether_agent_eval_success_rate`
  - `aether_agent_eval_quality_based`
  - `aether_agent_eval_credit_based`
  - `aether_agent_eval_hybrid`
- 观测导出：`default_observation`, `aether_observation`

### Phase 7
- `default_pool_management`, `aether_pool_management`
- `default_reinvestment`, `aether_reinvestment`
- `default_audit`, `aether_audit`
- `default_circuit_breaker`, `aether_circuit_breaker`

## 4. 运行后重点检查文件

- 阶段主线：`overall/phase_trace.jsonl`
- 节点审计：`overall/node_ledger.jsonl`
- 经济审计：`overall/economic_audit.json`
- 经济状态：`overall/economic_state.json`
- 结果汇总：`overall/results.json`

## 5. 说明

本文档只描述当前仓库已接入并可运行的模块，不再列出历史版本中未接入的旧插件名或伪代码接口。
