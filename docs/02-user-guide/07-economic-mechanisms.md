# 经济机制选择

## 1. 两个关键阶段

- Phase 5：结算（settlement）
- Phase 6：反馈与排名（agent_eval / observation）

当前可通过 YAML 切换插件。

## 2. 配置入口

`recipes/TEMPLATE/conf/economic.yaml` 与 mode 配置中的：

- `phase5_settlement.result_eval.plugin`
- `phase5_settlement.settlement.plugin`
- `phase6_feedback.agent_eval.plugin`
- `phase6_feedback.observation.plugin`
- `phase7_pool.*.plugin`

## 3. 推荐实验方法

- 固定数据集与随机种子
- 每次只改一个插件（单变量）
- 每组至少重复 3 次
- 对比 `overall/results.json` + `overall/economic_audit.json` + `metrics/*.csv`

## 4. 运行模板

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh \
  --config recipes/my_exp/conf/mech_a.yaml \
  --output_dir exp/mech_a

STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh \
  --config recipes/my_exp/conf/mech_b.yaml \
  --output_dir exp/mech_b
```

## 5. 注意

当前仓库未内置官方 `compare_experiments.py`，请先使用自定义脚本或手动比对。
