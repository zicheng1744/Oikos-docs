# 插件系统

## 1. 目标

在固定执行骨架下，允许替换各阶段模块实现。

## 2. 现状

- 模块选择主要通过 YAML 配置完成。
- 常见可切换点：
  - `phase5_settlement.*.plugin`
  - `phase6_feedback.*.plugin`
  - `phase7_pool.*.plugin`

## 3. 配置示例

```yaml
phase5_settlement:
  settlement:
    plugin: default_settlement

phase6_feedback:
  agent_eval:
    plugin: default_agent_eval

phase7_pool:
  audit:
    plugin: default_audit
```

## 4. 实验切换建议

通过 `--config <override.yaml>` 追加覆盖，不直接改 TEMPLATE 基线配置。
