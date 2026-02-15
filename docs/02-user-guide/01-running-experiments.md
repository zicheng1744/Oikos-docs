# 运行实验

本页只描述当前仓库已验证可用的运行方式。

## 1. 统一入口（CLI）

推荐使用统一 CLI 入口：

```text
python -m oikos.cli chat  --recipe TEMPLATE
python -m oikos.cli train --recipe TEMPLATE
python -m oikos.cli test  --recipe TEMPLATE
```

CLI 会自动：启动 fullchain → 执行实验 → 写入 run 目录 → 停止服务。

## 2. 通用参数（CLI）

- `--output-dir <dir>`
- `--run-id <id>`
- 其他参数会透传给内部执行器（无需直接调用）

示例：

```bash
# chat（交互式）
python -m oikos.cli chat --recipe TEMPLATE --output-dir exp/chat

# train
python -m oikos.cli train --recipe TEMPLATE --max_episodes 10 --output-dir exp/train

# test
python -m oikos.cli test --recipe TEMPLATE --max_episodes 20 --output-dir exp/test
```

## 3. 配置文件覆盖

脚本内部默认加载：

- `recipes/TEMPLATE/conf/modules.yaml`
- `recipes/TEMPLATE/conf/economic.yaml`
- `recipes/TEMPLATE/conf/<mode>_config.yaml`

可以改用 `run` 命令追加覆盖文件：

```bash
python -m oikos.cli run --mode test \
  --config recipes/TEMPLATE/conf/modules.yaml \
  --config recipes/TEMPLATE/conf/economic.yaml \
  --config recipes/my_experiment/conf/override.yaml \
  --output-dir exp/my_experiment
```

建议覆盖文件只写“要改动的键”。

## 4. 手动服务管理（调试）

```bash
bash scripts/start_fullchain.sh start
bash scripts/start_fullchain.sh status
bash scripts/start_fullchain.sh stop
bash scripts/start_fullchain.sh restart
```

本地一键拓扑（推荐）：

```bash
bash scripts/local_topology.sh up
bash scripts/local_topology.sh status
bash scripts/local_topology.sh smoke
bash scripts/local_topology.sh down
```

## 5. 健康检查地址（当前默认）

- API: `http://127.0.0.1:8000/nvwa/health`
- NVWA: `http://127.0.0.1:10000/health`（冲突时脚本会自动换端口）
- Retrieval: `http://127.0.0.1:10003/health`
- Evaluator: `http://127.0.0.1:10002/.well-known/agent-card.json`

## 6. 运行后核心产物

```text
<run_dir>/
├── conversations/
├── overall/
└── runtime/
```

关键文件：

- `overall/config_resolved.yaml`
- `overall/results.json`
- `overall/summary.json`
- `overall/phase_trace.jsonl`
- `runtime/logs/`
- `runtime/planning_memory/`（PlanningAgent 的 run 级记忆目录）

## 7. 注意事项

- 本地无 Docker 时，请在 YAML 中设置 `runtime.workspace_backend: host`。
- chat 模式为交互式；输入 `/exit` 可退出。
- 当前没有官方 `compare_experiments.py` 脚本。
- 默认配置为单 orchestrator（`num_hubs: 1`）；如需多 orchestrator 竞价实验，请显式在 recipe 中调大该值。
- 启动链路默认会执行 `card/route/a2a` 三段门禁探测；失败会在启动阶段直接报错。
- Holos 对标回归可使用 `scripts/run_holos_parity_gate.sh`（基于 `scripts/m7_holos_parity.py` 与 `benchmarks/holos_parity/thresholds.yaml`）。
