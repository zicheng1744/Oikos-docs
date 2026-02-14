# 配置文件说明

当前运行由多份 YAML 合并得到最终配置。

## 1. 合并顺序（后者覆盖前者）

1. `recipes/TEMPLATE/conf/modules.yaml`
2. `recipes/TEMPLATE/conf/economic.yaml`
3. `recipes/TEMPLATE/conf/<mode>_config.yaml`
4. 你额外传入的 `--config xxx.yaml`

最终结果写到：`overall/config_resolved.yaml`。

## 2. 最常用配置区块

### system

- `mode`: `chat|train|test`
- `max_episodes`
- `output_dir`
- `run_id`（可由命令行覆盖）

### data

- `dataset_path`
- `id_field`
- `text_field`
- `label_field`

### runtime

- `execution_profile`: `oikos|aether`
- `workspace_backend`: `host|docker`
- `use_nvwa_engine`: `true|false`
- `use_retrieval_pool`: `true|false`
- `retrieval_mode`: `strict|offline`
- `retrieval_embedding_mode`: `local_hash|api`
- `rerank_backend`: `chun|local|unified_api|siliconflow`
- `parallel_execution`: `true|false`
- `max_parallel_plans`: 正整数

## 3. 推荐覆盖方式

新建一个小覆盖文件，只写差异：

```yaml
system:
  max_episodes: 5

data:
  dataset_path: recipes/my_exp/data/my_dataset.jsonl

runtime:
  workspace_backend: host
```

运行：

```bash
python -m oikos.cli test --recipe TEMPLATE \
  --config recipes/my_exp/conf/override.yaml
```

## 4. 常见误区

- 复制整份 `test_config.yaml` 后忘记改 `dataset_path`。
- 把 `.env` 当作实验参数总入口（实验参数优先放 YAML）。
- 误以为脚本层会读取 `--save_interval` 等未定义参数（这类参数只是透传给 Python 层）。
