# 故障排查

## 1. 先看哪里

- `runtime/logs/`：服务日志
- `overall/summary.json`：run 状态
- `overall/config_resolved.yaml`：最终生效配置

## 2. 常见问题

### 2.1 端口冲突

现象：服务起不来或 health check 失败。

处理：

```bash
bash scripts/start_fullchain.sh stop
bash scripts/start_fullchain.sh restart
```

脚本对 NVWA 端口冲突会自动切换（如 `10000 -> 10004`）。

### 2.2 Docker 不可用

若你用 host 模式：

```bash
python -m oikos.cli test --recipe TEMPLATE --max_episodes 1
```

并确认 YAML：`runtime.workspace_backend: host`。

### 2.3 API 鉴权失败

检查 `.env`：

```bash
python - <<'PY'
import os
print('OPENAI_API_KEY set=', bool(os.getenv('OPENAI_API_KEY')))
print('OPENAI_BASE_URL=', os.getenv('OPENAI_BASE_URL'))
PY
```

### 2.4 数据集路径错误

看报错中的绝对路径，再对照 `overall/config_resolved.yaml` 的 `data.dataset_path`。

## 3. 快速诊断脚本

```bash
python scripts/check_installation.py
```

## 4. 性能慢

- 降低 `max_episodes`
- 降低 `max_parallel_plans`
- 临时禁用检索池（按实验需求）
