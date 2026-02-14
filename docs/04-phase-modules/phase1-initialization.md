# Phase 1：Initialization（沙盒初始化）

## 职责

Phase 1 负责初始化系统基础状态：

- 通用运行参数（timesteps、seed 等）
- 任务池加载（dataset）
- 基础设施（ledger/marketplace/public pool）
- 经济系统初始参数（fee、初始余额）
- 参与者（agent/hub）

## 配置入口

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

## 可选插件

- general_config: `default_general_config`, `aether_general_config`
- task_pool: `default_task_pool`, `aether_task_pool`
- infrastructure: `default_infrastructure`, `aether_infrastructure`
- economic_system: `default_economic_system`, `aether_economic_system`
- participants: `default_participants`, `aether_participants`

## 真实输出（运行后）

Phase 1 的结果不会单独输出为一个文件，而是写入全局状态并体现在：

- `overall/config_resolved.yaml`（最终生效插件与参数）
- `overall/phase_trace.jsonl`（phase=1 事件）
- `overall/economic_state.json`（初始经济状态 + 后续演化）

## 常见误解（已修正）

- 文档不再使用旧插件名（如 `aether_participant_init` 这类命名）。
- 文档不再宣称固定存在 `insurance_pool` 字段；以当前 `economic_state.json` 真实字段为准。
