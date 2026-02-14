# 状态管理

## 1. 运行态与结果态

- 运行态：服务进程与日志（`runtime/`）
- 结果态：会话与全局产物（`conversations/`, `overall/`）

## 2. 关键状态文件

- `overall/config_resolved.yaml`：最终配置
- `overall/summary.json`：run 级状态摘要
- `overall/economic_state.json`：经济状态快照（train/test）

## 3. 排查顺序

1. 先看 `runtime/logs/`
2. 再看 `overall/summary.json`
3. 最后下钻 `conversations/*/`
