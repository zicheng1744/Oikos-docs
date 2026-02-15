# Phase 7 API 参考（Pool / Reinvestment / Audit / Circuit Breaker）

本文档以当前代码为准，说明 Phase7 的接口与实现现状。

---

## 接口文件

- `interfaces/phase7_pool/pool_management.py`
- `interfaces/phase7_pool/reinvestment.py`
- `interfaces/phase7_pool/audit.py`
- `interfaces/phase7_pool/circuit_breaker.py`

---

## 接口概览

| 接口 | 主要职责 | 关键方法（示例） |
|---|---|---|
| `IPoolManagement` | 管理公共资金池余额与流动 | `get_pool_balance`, `add_to_pool`, `withdraw_from_pool`, `rebalance_pool` |
| `IReinvestment` | 计算/执行再投资策略 | `calculate_reinvestment`, `execute_reinvestment`, `should_reinvest` |
| `IAudit` | 经济审计与一致性校验 | `generate_audit_trail`, `calculate_economic_metrics`, `verify_balance_consistency` |
| `ICircuitBreaker` | 风险规则检查与熔断动作 | `check_anomaly_indicators`, `should_trigger_circuit_breaker`, `execute_circuit_breaker` |

说明：
- 接口层保留完整契约，部分能力在实现层是“最小可用”或按 profile 选择实现。

---

## 当前插件栈（`modules/phase7/stack.py`）

### Phase 7 直接相关

- `pool_management`
  - `default_pool_management`
  - `aether_pool_management`
- `reinvestment`
  - `default_reinvestment`
  - `aether_reinvestment`
- `audit`
  - `default_audit`
  - `aether_audit`
- `circuit_breaker`
  - `default_circuit_breaker`
  - `aether_circuit_breaker`

### 与 Phase7 同栈编排的经济模块（Phase5/6）

- `result_eval`: `default_result_eval` / `aether_result_eval`
- `settlement`: `default_settlement` / 多个 `aether_*_settlement`
- `agent_eval`: `default_agent_eval` / `aether_agent_eval` 及变体
- `observation`: `default_observation` / `aether_observation`

---

## 配置示例

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

---

## 输出与对齐

Phase7 产物主要在 run 目录：

- `overall/economic_state.json`
- `overall/economic_audit.json`
- `overall/metrics/...`

指标口径统一依赖统一聚合链路（M4），建议用同一 run 下的 `economic_audit.json` 与 `global_metrics.csv` 做交叉验证。

---

## 相关文档

- `docs/04-phase-modules/phase7-pool-management.md`
- `docs/06-api-reference/configuration-schema.md`
- `docs/02-user-guide/01-running-experiments.md`
