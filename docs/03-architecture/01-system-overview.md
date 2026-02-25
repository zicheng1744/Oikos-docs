# 系统总览

本文给出当前 Oikos 仓库的实际架构（以代码现状为准），重点覆盖最近稳定下来的运行机制。

## 1. 目录层次

```text
core/            # 运行框架与基础能力（配置、插件基类、注册器等）
interfaces/      # 抽象接口层（各 Phase 的契约）
modules/         # 各 Phase 的可替换实现（Phase1~7）
infrastructure/  # 基础设施与 agent 运行依赖
services/        # 运行时服务（api/nvwa/retrieval/evaluator/registry）
utils/           # 工具实现（logger/clients/metrics/tools）
recipes/         # 配置模板（当前推荐唯一配置入口）
exp/             # 每次 run 的输出目录
```

## 2. 统一入口

- 推荐入口（统一 CLI）：
  - `python -m oikos.cli chat --recipe TEMPLATE`
  - `python -m oikos.cli train --recipe TEMPLATE`
  - `python -m oikos.cli test --recipe TEMPLATE`
- `recipes/TEMPLATE/run_*.sh` 仅为兼容 wrapper，内部仍委托 `oikos.cli`。

## 3. 当前关键运行机制（最新）

### 3.1 编排模式（runtime.orchestration_mode）

- `split_only`（默认）：
  - Orchestrator 只负责 DAG 规划，不负责 `search/assign/execute`。
  - 具体节点分配与执行由 Phase4 Router/Coordinator 完成。
- `orchestrator_prebind`：
  - 允许上游预绑定（prebind），但仍要经过 Phase3/4 校验链路。
- `orchestrator_monolith` 已废弃（配置会报迁移提示）。

### 3.2 Worker 池与注册中心

- 运行期 worker 源由配置驱动：
  - `runtime.local_agents.workers_file`（recipe 内 JSON）
  - 统一注册中心在 run 启动时汇聚并输出快照
- 不再依赖项目根目录的默认 `local_workers*.json / workers.registry.json`。
- 每次 run 会导出：
  - `overall/workers.registry.export.json`（可作为后续 run 的 seed）

### 3.3 本地 Agent 启动门禁

- `runtime.local_agents` 支持：
  - `enabled / auto_start / fail_fast / workers_file / startup_timeout_sec / health_path`
- 逻辑：
  - run 启动时自动拉起 local agent 服务并做健康检查；
  - 任一启动/健康失败，`fail_fast=true` 时直接终止 run。

### 3.4 路由与执行

- 默认路由链路：
  - `retrieval -> top-k -> rerank -> reachable filter -> assign`
- 支持 `semantic_allow_lexical_fallback=false`（严格禁 lexical fallback）。
- 节点生命周期与决策证据写入：
  - `node_ledger.jsonl`
  - `conversation_trace.jsonl`

### 3.5 评分、反馈与排名

- Evaluator 以 subtask 粒度参与闭环，写入每个节点的评估记录。
- Phase6/7 使用 `historical_mean_score` 口径更新 rank（包含 `rank_position` 等字段）。

## 4. 服务拓扑（脚本自动管理）

- API: `127.0.0.1:8000`
- Evaluator: `127.0.0.1:10002`
- Retrieval: `127.0.0.1:10003`
- NVWA: `127.0.0.1:10000`（端口冲突时自动切换）

## 5. Run 产物结构

```text
<run_dir>/
├── conversations/
├── overall/
└── runtime/
```

关键文件：

- `overall/config_resolved.yaml`：本次生效配置
- `overall/phase_trace.jsonl`：阶段级执行与门禁日志
- `overall/conversation_trace.jsonl`：会话级编排+执行证据
- `overall/node_ledger.jsonl`：节点级生命周期与评估
- `overall/workers.registry.export.json`：本次 run 的 registry 导出

详见：`docs/01-getting-started/04-understanding-outputs.md`。
