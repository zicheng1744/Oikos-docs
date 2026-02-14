# 运行实验

本页只描述当前仓库已验证可用的运行方式。

## 1. 三个入口脚本

```text
recipes/TEMPLATE/run_chat.sh
recipes/TEMPLATE/run_train.sh
recipes/TEMPLATE/run_test.sh
```

三个脚本都会自动：启动 fullchain → 执行实验 → 写入 run 目录 → 停止服务。

## 2. 通用参数（脚本层）

- `--output_dir <dir>`
- `--run_id <id>`
- 其他参数会透传给 `python -m oikos.bin.run_experiment`

示例：

```bash
# chat（交互式）
STRICT_DOCKER=false bash recipes/TEMPLATE/run_chat.sh --output_dir exp/chat

# train
STRICT_DOCKER=false bash recipes/TEMPLATE/run_train.sh --max_episodes 10 --output_dir exp/train

# test
STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh --max_episodes 20 --output_dir exp/test
```

## 3. 配置文件覆盖

脚本内部默认加载：

- `recipes/TEMPLATE/conf/modules.yaml`
- `recipes/TEMPLATE/conf/economic.yaml`
- `recipes/TEMPLATE/conf/<mode>_config.yaml`

可以追加覆盖文件：

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh \
  --config recipes/my_experiment/conf/override.yaml \
  --output_dir exp/my_experiment
```

建议覆盖文件只写“要改动的键”。

## 4. 手动服务管理（调试）

```bash
bash scripts/start_fullchain.sh start
bash scripts/start_fullchain.sh status
bash scripts/start_fullchain.sh stop
bash scripts/start_fullchain.sh restart
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

## 7. 注意事项

- 本地无 Docker 时请显式使用 `STRICT_DOCKER=false`。
- `run_chat.sh` 为交互式；输入 `/exit` 可退出。
- 当前没有官方 `compare_experiments.py` 脚本。
