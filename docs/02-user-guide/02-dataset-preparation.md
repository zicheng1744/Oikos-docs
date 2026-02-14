# 数据集准备

Oikos 当前主流程使用 `jsonl` 数据集，每行一个 JSON 对象。

## 1. 最小必需字段

- `id`
- `input`
- `target`

示例：

```jsonl
{"id":"q1","input":"2+3=?","target":"5"}
{"id":"q2","input":"巴黎是哪个国家的首都？","target":"法国"}
```

## 2. 可选字段

- `difficulty`
- `domain`
- `metadata`

这些字段不会阻塞主链路，主要用于分层分析或后续扩展。

## 3. 放置位置建议

- 直接放到 `recipes/<your_exp>/data/*.jsonl`
- 配置里用相对路径引用

## 4. 配置引用

```yaml
data:
  dataset_path: recipes/my_exp/data/my_dataset.jsonl
  id_field: id
  text_field: input
  label_field: target
```

## 5. 快速校验（不依赖 jq）

```bash
python - <<'PY'
import json, pathlib
p = pathlib.Path('recipes/my_exp/data/my_dataset.jsonl')
rows = [json.loads(x) for x in p.read_text(encoding='utf-8').splitlines() if x.strip()]
print('rows=', len(rows))
required = {'id','input','target'}
bad = [i for i,r in enumerate(rows,1) if not required.issubset(r.keys())]
print('invalid_rows=', bad[:10])
PY
```

## 6. 跑一个最小验证

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh \
  --config recipes/my_exp/conf/override.yaml \
  --max_episodes 1 \
  --output_dir exp/my_exp_check
```
