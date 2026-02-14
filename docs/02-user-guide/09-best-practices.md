# 最佳实践

## 1. 推荐流程

1. 先 `chat` 验证链路
2. 再 `train` 小规模预热
3. 最后 `test` 做正式评估

## 2. 配置管理

- 不要直接改 TEMPLATE 原文件做实验记录
- 每个实验写独立 override YAML
- 保留 `overall/config_resolved.yaml` 作为可复现依据

## 3. 输出管理

- 每次实验使用独立 `--output_dir`
- 保留 `runtime/logs` 与 `overall/*` 全量产物
- 对重要 run 归档压缩

## 4. 对比实验原则

- 单变量改动
- 固定数据集与运行参数
- 至少 3 次重复
- 比较 `results.json`、`economic_audit.json`、`metrics/*.csv`

## 5. 常见反模式

- 一次改多个机制后再比较
- 只看单次结果下结论
- 只保留汇总指标不保留原始 trace

## 6. 最小可复现命令模板

```bash
STRICT_DOCKER=false bash recipes/TEMPLATE/run_test.sh \
  --config recipes/my_exp/conf/override.yaml \
  --output_dir exp/my_exp \
  --max_episodes 20
```
