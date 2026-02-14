# 5分钟快速上手

本页只保留当前仓库可直接跑通的最短路径。

## 前提

- 已完成安装并可执行 `conda activate holos`
- `.env` 中已配置可用的 LLM API（至少 `OPENAI_API_KEY`）

## 1. 激活环境

```bash
cd /path/to/Holos-Oikos-Dev
conda activate holos
```

## 2. 运行一个最小 Test

```bash
python -m oikos.cli test --recipe TEMPLATE --max_episodes 1
```

说明：
- `oikos.cli test` 会自动拉起并停止 fullchain 服务
- 默认输出根目录是 `exp/test`
- 本地无 Docker 时，在 YAML 设置 `runtime.workspace_backend: host`

## 3. 查看输出

```bash
ls -la exp/test
# 进入最新 run 目录，例如：
cd exp/test/test-20260214T190527-22a9

ls -la
ls -la conversations
ls -la overall
ls -la runtime/logs
```

当前实际目录结构：

```text
<run_dir>/
├── conversations/
│   ├── 0001__run-.../
│   └── 0002__run-.../
├── overall/
│   ├── config_resolved.yaml
│   ├── results.json
│   ├── outputs.jsonl
│   ├── conversation_trace.jsonl
│   ├── phase_trace.jsonl
│   ├── node_ledger.jsonl
│   ├── economic_state.json
│   ├── economic_audit.json
│   ├── agent_ranks.json
│   └── metrics/<run_id>/
└── runtime/
    ├── logs/
    ├── pids/
    ├── workers.registered.json
    └── local_workers.effective.json
```

## 4. 快速检查关键结果

```bash
python - <<'PY'
import json, pathlib
run = pathlib.Path('.')
results = json.loads((run/'overall'/'results.json').read_text())
print('mode=', results.get('mode'))
print('samples=', results.get('num_samples'))
print('accuracy=', results.get('accuracy'))

audit = json.loads((run/'overall'/'economic_audit.json').read_text())
print('audit_schema=', audit.get('schema'))
print('conservation=', (audit.get('conservation') or {}).get('is_balanced'))
PY
```

## 5. Chat / Train 命令

```bash
# Chat（交互式，会等待输入）
python -m oikos.cli chat --recipe TEMPLATE

# Train
python -m oikos.cli train --recipe TEMPLATE --max_episodes 10
```

注意：
- chat 是交互式，不输入内容可能出现 `turns=0`
