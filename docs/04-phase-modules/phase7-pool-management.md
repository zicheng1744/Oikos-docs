# Phase 7：Pool Management（资金池管理）

## 职责

Phase 7 负责经济系统的收尾与稳态控制：

- pool_management：资金池管理
- reinvestment：再投入策略
- audit：经济审计
- circuit_breaker：熔断规则

## 配置入口

```yaml
phase7_pool:
  pool_management:
    plugin: default_pool_management
    auto_adjust: true
  reinvestment:
    plugin: default_reinvestment
    required_ratio: 0.3
    min_pool_balance: 1000.0
  audit:
    plugin: default_audit
    enabled: true
  circuit_breaker:
    plugin: default_circuit_breaker
    enabled: true
    max_dispute_rate: 0.2
    max_inflation_rate: 0.5
```

## 可选插件

- pool_management: `default_pool_management`, `aether_pool_management`
- reinvestment: `default_reinvestment`, `aether_reinvestment`
- audit: `default_audit`, `aether_audit`
- circuit_breaker: `default_circuit_breaker`, `aether_circuit_breaker`

## 真实输出

- `overall/economic_audit.json`
- `overall/economic_state.json`

重点检查：

- `economic_audit.json.conservation`（守恒统计）
- `economic_audit.json.audit_report`（审计报告）

## 当前字段说明

守恒状态字段为：`conservation.conservative`。

不要使用旧文档中的错误字段名或未实现字段。
