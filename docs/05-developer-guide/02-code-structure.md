# 代码结构

本文档按当前仓库实现描述 Oikos 的目录组织与依赖边界。

---

## 顶层目录

```text
Holos-Oikos-Dev/
├── cli.py
├── core/
├── interfaces/
├── modules/
├── infrastructure/
├── services/
├── recipes/
├── scripts/
├── tests/
└── exp/
```

---

## 核心分层

1. `core/`
作用：插件基类、注册表、工厂、phase runner、配置对象。
关键文件：`core/plugin.py`、`core/registry.py`、`core/factory.py`、`core/phase.py`、`core/config.py`。

2. `interfaces/`
作用：行为契约（ABC/Protocol），不承载实现细节。
关键目录：`interfaces/phase1_init` ... `interfaces/phase7_pool`、`interfaces/common`。

3. `modules/`
作用：可插拔默认实现（按 phase 组织），通过 `stack.py` 组装。
关键目录：`modules/phase1` ... `modules/phase7`。

4. `infrastructure/`
作用：运行时基础设施（agent、runtime、memory、economic runtime 等）。

5. `services/`
作用：对外服务（api/nvwa/retrieval/evaluator/registry）。

6. `recipes/`
作用：配置模板与数据。

7. `scripts/`
作用：本地拓扑、全链路启动、启动门禁、对标工具等。

---

## Phase 模块映射

| Phase | 配置键 | 组装入口 | 子模块键 |
|---|---|---|---|
| 1 | `phase1_init` | `modules/phase1/stack.py` | `general_config/task_pool/infrastructure/economic_system/participants` |
| 2 | `phase2_creation` | `modules/phase2/stack.py` | `task_extraction/task_pricing/task_publishing` |
| 3 | `phase3_allocation` | `modules/phase3/stack.py` | `task_orchestrator/security_monitor` |
| 4 | `phase4_execution` | `modules/phase4/stack.py` | `task_planning/task_routing/subtask_management/execution_coordination/result_evaluation/anomaly_injection` |
| 5-7 | `phase5_settlement/phase6_feedback/phase7_pool` | `modules/phase7/stack.py` | 经济闭环子模块 |

---

## 运行入口

推荐入口：

```bash
python -m oikos.cli chat --recipe TEMPLATE
python -m oikos.cli train --recipe TEMPLATE --max_episodes 5
python -m oikos.cli test --recipe TEMPLATE --max_episodes 10
```

本地平台拓扑：

```bash
bash scripts/local_topology.sh up
bash scripts/local_topology.sh smoke
```

---

## 插件开发落点

1. 在 `interfaces/phaseX_*` 定义/扩展契约（如确有必要）。
2. 在 `modules/phaseX/*_modules.py` 实现插件。
3. 在对应 `modules/phaseX/stack.py` 注册插件映射。
4. 在 `recipes/TEMPLATE/conf/*.yaml` 配置切换插件。
5. 在 `tests/` 增加回归测试。

---

## 依赖边界约束

允许：
- `modules -> interfaces/core`
- `services -> core/interfaces/modules/infrastructure`
- `scripts -> services/core`

禁止（设计目标）：
- `interfaces -> modules`
- `core -> modules`
- `infrastructure -> modules`（除明确过渡白名单）

---

## 常用定位

- 插件创建失败：`core/factory.py`
- 插件未注册：`modules/*/stack.py` + `core/registry.py`
- Phase 依赖/契约失败：`core/phase.py`
- A2A/worker 发现问题：`services/registry/`、`scripts/startup_gate.py`、`scripts/start_fullchain.sh`
- 指标/审计口径：`modules/phase7/*` + 运行产物 `overall/*.json/csv`
