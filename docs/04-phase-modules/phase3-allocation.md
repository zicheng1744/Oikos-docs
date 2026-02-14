# Phase 3：Task Allocation（任务分配）

## 职责

Phase 3 在 marketplace 上完成竞价与分配：

- task_orchestrator：收集 bids、跑 auction、产生分配
- security_monitor：分配前安全检查

## 配置入口

```yaml
phase3_allocation:
  task_orchestrator:
    plugin: default_task_orchestrator
    auction_type: first_price
  security_monitor:
    plugin: default_security_monitor
```

## 可选插件

- `default_task_orchestrator`, `aether_task_orchestrator`
- `default_security_monitor`, `aether_security_monitor`

## 当前实现说明

- 分配逻辑走 `task_orchestrator`（竞价+拍卖），不是旧文档中的 `rank_based_allocator` / `hybrid_allocator` 命名体系。
- Phase 6 的 rank 会影响后续行为，但入口是 orchestrator/marketplace 机制，不是独立 `allocator` 插件家族。

## 真实输出

- `overall/phase_trace.jsonl`（phase=3）
- `overall/node_ledger.jsonl`（可看到分配和执行节点信息）
- `conversations/*/trace.json`（单会话执行轨迹）
