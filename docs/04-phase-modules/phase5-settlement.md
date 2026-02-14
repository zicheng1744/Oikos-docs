# Phase 5：Settlement（结算）

## 职责

Phase 5 负责结果评估和资金结算：

- result_eval：将执行结果转为质量分
- settlement：计算 O1/O2/O3 与 I1/I2/I3/I4/I5，并写入经济状态

## 配置入口

```yaml
phase5_settlement:
  result_eval:
    plugin: default_result_eval
    quality_threshold: 0.7
  settlement:
    plugin: default_settlement
    platform_fee_rate: 0.05
    orchestrator_fee_rate: 0.10
    insurance_rate: 0.02
    penalty_multiplier: 2.0
```

## 可选插件

- result_eval: `default_result_eval`, `aether_result_eval`
- settlement:
  - `default_settlement`, `aether_settlement`
  - `aether_first_price_equal_split_settlement`
  - `aether_second_price_equal_split_settlement`
  - `aether_second_price_contribution_settlement`
  - `aether_second_price_intelligence_settlement`
  - `aether_second_price_credit_settlement`
  - `aether_adversarial_contribution_settlement`

## 真实产物字段

结算相关核心结果在：

- `overall/economic_state.json`
- `overall/economic_audit.json`

`economic_audit.json` 的守恒字段是：

- `conservation.episodes`
- `conservation.outflow_total`
- `conservation.inflow_total`
- `conservation.balance_error`
- `conservation.conservative`

注意字段名是 `conservative`（布尔）和 `conservation`（对象），不是旧文档里其他拼写。
