# Phase 4：Task Execution（任务执行）

## 职责

Phase 4 负责把分配任务真正执行完，并记录执行轨迹：

- task_planning
- task_routing
- subtask_management
- execution_coordination
- result_evaluation
- anomaly_injection

## 配置入口

```yaml
phase4_execution:
  task_planning:
    plugin: default_task_planning
  task_routing:
    plugin: default_task_routing
  subtask_management:
    plugin: default_subtask_management
  execution_coordination:
    plugin: default_execution_coordination
  result_evaluation:
    plugin: default_result_evaluation
  anomaly_injection:
    plugin: default_anomaly_injection
    enable_injection: false
```

## 可选插件

每个子模块都支持 `default_*` 和 `aether_*` 两套实现（见总览文档）。

## 当前实现说明

- 旧文档中的 `langgraph_executor` / `simple_executor` 插件名不是当前插件注册名。
- 当前实现是六个子模块组合，不是单一 executor 插件。
- `anomaly_injection` 已接入，但默认可通过 `enable_injection: false` 关闭。

## 真实输出

- `overall/phase_trace.jsonl`（phase=4）
- `overall/node_ledger.jsonl`（ready/execute/writeback/evaluator/settlement 等阶段化记录）
- `conversations/*/phase_trace.jsonl`（单会话时间线）
