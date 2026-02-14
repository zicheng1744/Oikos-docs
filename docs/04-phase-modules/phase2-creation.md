# Phase 2：Task Creation（任务创建）

## 职责

Phase 2 负责把数据集任务转成可发布任务，并完成定价。

- task_extraction：抽取任务
- task_pricing：任务定价
- task_publishing：发布任务到 marketplace

## 配置入口

```yaml
phase2_creation:
  task_extraction:
    plugin: default_task_extraction
  task_pricing:
    plugin: default_task_pricing
    pricing_strategy: complexity_based
  task_publishing:
    plugin: default_task_publishing
```

## 可选插件

- `default_task_extraction`, `aether_task_extraction`
- `default_task_pricing`, `aether_task_pricing`
- `default_task_publishing`, `aether_task_publishing`

## 定价策略（当前实现）

`default_task_pricing` / `aether_task_pricing` 支持：

- `fixed`
- `dynamic`
- `complexity_based`

策略通过 `pricing_strategy` 切换，不是通过切换成 `fixed_pricing` 这类独立插件名。

## 真实输出

- `overall/phase_trace.jsonl`（phase=2 事件）
- 后续在 `overall/node_ledger.jsonl` 与 `overall/conversation_trace.jsonl` 能看到任务进入执行链路
