# 实验模式

## 1. Chat

用途：交互式快速验证。

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_chat.sh --output_dir exp/chat
```

特点：
- 交互式输入
- 输入 `/exit` 结束
- 若不输入有效 prompt，可能 `turns=0`

## 2. Train

用途：多轮训练/演化。

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_train.sh --max_episodes 10 --output_dir exp/train
```

输出重点：
- `overall/results.json`
- `overall/agent_ranks.json`
- `overall/economic_state.json`
- `overall/metrics/<run_id>/`

## 3. Test

用途：固定数据上的评估与对比。

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh --max_episodes 20 --output_dir exp/test
```

输出重点：
- `overall/results.json`
- `overall/economic_audit.json`
- `overall/phase_trace.jsonl`

## 4. 当前目录命名

- Chat: `exp/chat/<run_id>`
- Train: `exp/train/<run_id>`
- Test: `exp/test/<run_id>`

不是旧的 `*_runs` 目录。

## 5. 模式选择建议

- 先 `chat` 验证链路
- 再 `train` 预热/演化
- 最后 `test` 做指标比较
