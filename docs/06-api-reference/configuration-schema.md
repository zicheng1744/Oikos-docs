# 配置文件 Schema

本文档以当前 `recipes/TEMPLATE/conf/*.yaml` 为准，说明可运行配置结构。

---

## 顶层结构

```yaml
system: {...}
data: {...}
runtime: {...}

phase1_init: {...}
phase2_creation: {...}
phase3_allocation: {...}
phase4_execution: {...}
phase5_settlement: {...}
phase6_feedback: {...}
phase7_pool: {...}

agents: {...}
economic: {...}
logging: {...}
checkpointing: {...}
```

---

## Phase 1（初始化）

```yaml
phase1_init:
  general_config:
    plugin: default_general_config
  task_pool:
    plugin: default_task_pool
  infrastructure:
    plugin: default_infrastructure
  economic_system:
    plugin: default_economic_system
  participants:
    plugin: default_participants
```

---

## Phase 2（任务创建）

```yaml
phase2_creation:
  task_extraction:
    plugin: default_task_extraction
  task_pricing:
    plugin: default_task_pricing
  task_publishing:
    plugin: default_task_publishing
```

---

## Phase 3（任务分配）

```yaml
phase3_allocation:
  task_orchestrator:
    plugin: default_task_orchestrator
    single_orchestrator_only: true
  security_monitor:
    plugin: default_security_monitor
```

---

## Phase 4（任务执行）

```yaml
phase4_execution:
  task_planning:
    plugin: default_task_planning
  task_routing:
    plugin: default_task_routing
  subtask_management:
    plugin: default_subtask_management
  result_evaluation:
    plugin: default_result_evaluation
  execution_coordination:
    plugin: default_execution_coordination
  anomaly_injection:
    plugin: default_anomaly_injection
```

---

## Phase 5-7（经济闭环）

```yaml
phase5_settlement:
  result_eval:
    plugin: default_result_eval
  settlement:
    plugin: default_settlement

phase6_feedback:
  agent_eval:
    plugin: default_agent_eval
  observation:
    plugin: default_observation

phase7_pool:
  pool_management:
    plugin: default_pool_management
  reinvestment:
    plugin: default_reinvestment
  audit:
    plugin: default_audit
  circuit_breaker:
    plugin: default_circuit_breaker
```

---

## Runtime 关键项

```yaml
runtime:
  execution_profile: oikos         # oikos | aether
  workspace_backend: host          # host | docker
  use_nvwa_engine: true
  use_retrieval_pool: true
  retrieval_mode: strict           # strict | offline
  retrieval_embedding_mode: local_hash   # local_hash | api
  rerank_backend: chun             # chun | local | unified_api | siliconflow
  rerank_strict: true
  full_chain_required: true
  full_chain_max_retries: 2
```

---

## 校验方式

推荐使用 CLI 进行端到端校验，而不是手写解析脚本：

```bash
python -m oikos.cli test --recipe TEMPLATE --max_episodes 1
```

如需检查完整拓扑（registry + retrieval + nvwa + orchestrator + api）：

```bash
bash scripts/local_topology.sh up
bash scripts/local_topology.sh smoke
```

---

## 配置叠加顺序

默认 recipe 模式下按以下顺序叠加（后者覆盖前者）：

1. `recipes/<recipe>/conf/modules.yaml`
2. `recipes/<recipe>/conf/economic.yaml`
3. `recipes/<recipe>/conf/<mode>_config.yaml`
4. CLI 追加 `--config ...`（若提供）

---

## 相关文档

- `docs/02-user-guide/01-running-experiments.md`
- `docs/04-phase-modules/00-module-overview.md`
- `docs/06-api-reference/phase1-4-api.md`
