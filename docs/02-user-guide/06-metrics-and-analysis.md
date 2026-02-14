# 指标与分析

## 1. 指标来源

- `overall/results.json`：run 级核心指标
- `overall/metrics/<run_id>/global_metrics.csv`：时间序列
- `overall/metrics/<run_id>/individual_profiles.csv`：个体画像
- `overall/economic_audit.json`：账务审计

## 2. 当前 `results.json` 常见键

- 通用：`mode`, `dataset_path`, `num_samples`, `max_episodes`, `passed`, `failed`, `accuracy`
- test 扩展：`test_pass_rate`, `generalization_score`
- train 扩展：`train_loss`, `convergence_step`
- 经济相关：`market_efficiency`, `gini_coefficient`, `avg_revenue`, `agent_satisfaction`
- 链路相关：`full_chain_detect_rate`, `evaluator_detect_rate`

## 3. 不用 jq 的读取方式

```bash
python - <<'PY'
import json
p='exp/test/<run_id>/overall/results.json'
r=json.load(open(p,'r',encoding='utf-8'))
for k in ['accuracy','gini_coefficient','full_chain_detect_rate']:
    print(k, r.get(k))
PY
```

## 4. CSV 读取示例

```bash
python - <<'PY'
import pandas as pd
p='exp/test/<run_id>/overall/metrics/<run_id>/global_metrics.csv'
df=pd.read_csv(p)
print(df.head(3).to_string(index=False))
PY
```

## 5. 审计读取示例

```bash
python - <<'PY'
import json
p='exp/test/<run_id>/overall/economic_audit.json'
a=json.load(open(p,'r',encoding='utf-8'))
print('schema=',a.get('schema'))
print('is_balanced=', (a.get('conservation') or {}).get('is_balanced'))
PY
```
