# 系统总览

本文给出当前 Oikos 仓库的实际架构（以代码现状为准）。

## 1. 目录层次

```text
core/            # 运行框架与基础能力（配置、插件基类、注册器等）
interfaces/      # 抽象接口层（各 Phase 的契约）
modules/         # 各 Phase 的可替换实现
infrastructure/  # 基础设施与运行依赖（如 docker、agent infra）
services/        # 运行时服务（api/nvwa/retrieval/evaluator）
utils/           # 纯工具实现（logger/clients/metrics/tools 等）
recipes/         # 配置模板与兼容 wrapper
exp/             # 运行产物
```

## 2. 运行入口

- 推荐入口（统一 CLI）：
  - `python -m oikos.cli chat --recipe TEMPLATE`
  - `python -m oikos.cli train --recipe TEMPLATE`
  - `python -m oikos.cli test --recipe TEMPLATE`
- `recipes/TEMPLATE/run_*.sh` 仅兼容 wrapper，内部委托 CLI。

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
