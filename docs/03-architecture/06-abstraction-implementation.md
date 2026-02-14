# 抽象层与实现层

## 1. 抽象层（interfaces）

定义每个阶段/模块的输入输出契约。

## 2. 实现层（modules）

按 phase 组织实现代码，运行时根据配置选择。

## 3. 接入原则

- 新模块先对齐接口
- 再在 YAML 暴露选择入口
- 保持默认实现可回退

## 4. 验证原则

接入后至少验证：
- `overall/config_resolved.yaml` 插件已生效
- `overall/phase_trace.jsonl` 有对应阶段事件
- `overall/results.json` 与 `overall/economic_audit.json` 可正常输出
