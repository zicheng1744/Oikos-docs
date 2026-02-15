# 第一个完整实验

本教程按当前仓库真实流程，跑一个 10 条样本的 `test` 实验。

## 目标

- 准备数据集
- 写一个覆盖配置（override）
- 运行实验
- 验证输出文件

## 1) 准备数据

```bash
cd /home/zicheng/holos/Holos-Oikos-Dev
mkdir -p recipes/first_experiment/data recipes/first_experiment/conf

cat > recipes/first_experiment/data/math_tasks.jsonl << 'EOF_DATA'
{"id":"m001","input":"计算 2 + 3 的值","target":"5","difficulty":"easy","domain":"math"}
{"id":"m002","input":"计算 15 - 7 的值","target":"8","difficulty":"easy","domain":"math"}
{"id":"m003","input":"计算 6 × 8 的值","target":"48","difficulty":"easy","domain":"math"}
{"id":"m004","input":"计算 24 ÷ 4 的值","target":"6","difficulty":"easy","domain":"math"}
{"id":"m005","input":"求解方程 2x + 5 = 13","target":"x = 4","difficulty":"medium","domain":"math"}
{"id":"m006","input":"求解方程 3x - 7 = 8","target":"x = 5","difficulty":"medium","domain":"math"}
{"id":"m007","input":"计算 15 的平方根","target":"约 3.87","difficulty":"medium","domain":"math"}
{"id":"m008","input":"求解二次方程 x² - 5x + 6 = 0","target":"x = 2 或 x = 3","difficulty":"hard","domain":"math"}
{"id":"m009","input":"计算 sin(30°) 的值","target":"0.5","difficulty":"hard","domain":"math"}
{"id":"m010","input":"求函数 f(x) = x³ 在 x=2 处的导数","target":"f'(2) = 12","difficulty":"hard","domain":"math"}
EOF_DATA

wc -l recipes/first_experiment/data/math_tasks.jsonl
```

期望：`10 recipes/first_experiment/data/math_tasks.jsonl`

## 2) 写覆盖配置（只写你要改的项）

```bash
cat > recipes/first_experiment/conf/experiment_config.yaml << 'EOF_CFG'
system:
  mode: test
  max_episodes: 10

data:
  dataset_path: recipes/first_experiment/data/math_tasks.jsonl
  id_field: id
  text_field: input
  label_field: target

runtime:
  workspace_backend: host
  execution_profile: oikos
EOF_CFG
```

说明：
- `oikos.cli test` 内部会先加载 `recipes/TEMPLATE/conf/*.yaml`
- 通过额外 `--config` 传入本文件可覆盖默认项

## 3) 运行实验

```bash
conda activate holos
python -m oikos.cli test --recipe TEMPLATE \
  --config recipes/first_experiment/conf/experiment_config.yaml \
  --output-dir exp/first_experiment
```

## 4) 验证这次 run 确实使用了你的数据

```bash
# 进入最新 run
cd exp/first_experiment/$(ls -t exp/first_experiment | head -n 1)

python - <<'PY'
import json, yaml, pathlib
run = pathlib.Path('.')
cfg = yaml.safe_load((run/'overall'/'config_resolved.yaml').read_text())
print('dataset_path_in_config =', cfg.get('data',{}).get('dataset_path'))
results = json.loads((run/'overall'/'results.json').read_text())
print('dataset_path_in_results =', results.get('dataset_path'))
print('num_samples =', results.get('num_samples'))
PY
```

如果路径是 `recipes/first_experiment/data/math_tasks.jsonl` 且 `num_samples=10`，说明覆盖成功。

## 5) 查看关键输出

```bash
ls -la overall
ls -la conversations

python - <<'PY'
import json, pathlib
run = pathlib.Path('.')
print('results keys:', list(json.loads((run/'overall'/'results.json').read_text()).keys()))
print('summary keys:', list(json.loads((run/'overall'/'summary.json').read_text()).keys()))
print('audit keys:', list(json.loads((run/'overall'/'economic_audit.json').read_text()).keys()))
PY
```

下一步建议：阅读 [`04-understanding-outputs.md`](04-understanding-outputs.md) 对照字段语义。
