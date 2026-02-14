# 系统总览

本文给出当前 Oikos 仓库的实际架构（以代码现状为准）。

## 1. 目录层次

```text
core/            # 运行框架与基础能力（配置、插件基类、注册器等）
interfaces/      # 抽象接口层（各 Phase 的契约）
modules/         # 各 Phase 的可替换实现
infrastructure/  # 基础设施与运行依赖（如 docker、agent infra）
utils/           # 服务与工具实现（api/nvwa/retrieval/evaluator、metrics 等）
bin/             # CLI 入口（run_experiment）
recipes/         # 实验脚本与配置模板
exp/             # 运行产物
```

## 2. 运行入口

- 推荐入口：
  - `recipes/TEMPLATE/run_chat.sh`
  - `recipes/TEMPLATE/run_train.sh`
  - `recipes/TEMPLATE/run_test.sh`
- Python 入口：`python -m oikos.bin.run_experiment`（通常由脚本调用）

## 3. 服务拓扑（脚本自动管理）

- API: `127.0.0.1:8000`
- Evaluator: `127.0.0.1:10002`
- Retrieval: `127.0.0.1:10003`
- NVWA: `127.0.0.1:10000`（冲突时会自动换端口）

## 4. 产物结构

```text
<run_dir>/
├── conversations/
├── overall/
└── runtime/
```

详见：`docs/01-getting-started/04-understanding-outputs.md`。
