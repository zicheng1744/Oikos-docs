# Phase 1-4 API 参考

本文档按当前代码实现说明 Phase1~Phase4 的接口分层、插件家族和配置键。

---

## 目录

- [Phase 1: 初始化](#phase-1-初始化)
- [Phase 2: 任务创建](#phase-2-任务创建)
- [Phase 3: 任务分配](#phase-3-任务分配)
- [Phase 4: 任务执行](#phase-4-任务执行)
- [最小可运行示例](#最小可运行示例)

---

## Phase 1: 初始化

**接口目录**: `interfaces/phase1_init/`
**实现目录**: `modules/phase1/`
**组装入口**: `modules/phase1/stack.py`

### 子模块（当前命名）

- `general_config`
- `task_pool`
- `infrastructure`
- `economic_system`
- `participants`

### 默认插件

- `default_general_config` / `aether_general_config`
- `default_task_pool` / `aether_task_pool`
- `default_infrastructure` / `aether_infrastructure`
- `default_economic_system` / `aether_economic_system`
- `default_participants` / `aether_participants`

---

## Phase 2: 任务创建

**接口目录**: `interfaces/phase2_creation/`
**实现目录**: `modules/phase2/`
**组装入口**: `modules/phase2/stack.py`

### 子模块（当前命名）

- `task_extraction`
- `task_pricing`
- `task_publishing`

### 默认插件

- `default_task_extraction` / `aether_task_extraction`
- `default_task_pricing` / `aether_task_pricing`
- `default_task_publishing` / `aether_task_publishing`

### 配置示例

```yaml
phase2_creation:
  task_extraction:
    plugin: default_task_extraction
  task_pricing:
    plugin: default_task_pricing
  task_publishing:
    plugin: default_task_publishing
```

---

## Phase 3: 任务分配

**接口目录**: `interfaces/phase3_allocation/`
**实现目录**: `modules/phase3/`
**组装入口**: `modules/phase3/stack.py`

### 子模块（当前命名）

- `task_orchestrator`
- `security_monitor`

### 默认插件

- `default_task_orchestrator` / `aether_task_orchestrator`
- `default_security_monitor` / `aether_security_monitor`

说明：
- 当前主路径不是旧版 `rank_based_allocator` 命名体系。
- 分配由 orchestrator（竞价/拍卖）+ 安全监控组合完成。

---

## Phase 4: 任务执行

**接口目录**: `interfaces/phase4_execution/`
**实现目录**: `modules/phase4/`
**组装入口**: `modules/phase4/stack.py`

### 子模块（当前命名）

- `task_planning`
- `task_routing`
- `subtask_management`
- `execution_coordination`
- `result_evaluation`
- `anomaly_injection`

### 默认插件

- `default_task_planning` / `aether_task_planning`
- `default_task_routing` / `aether_task_routing`
- `default_subtask_management` / `aether_subtask_management`
- `default_execution_coordination` / `aether_execution_coordination`
- `default_result_evaluation` / `aether_result_evaluation`
- `default_anomaly_injection` / `aether_anomaly_injection`

说明：
- 当前主链路是六子模块编排，不是旧版单一 `langgraph_executor` 插件。

---

## 最小可运行示例

```python
from oikos.core.factory import PluginFactory
from oikos.core.registry import PluginRegistry
from oikos.core.plugin import PluginConfig

registry = PluginRegistry()

phase2_extract_factory = PluginFactory("phase2_creation.task_extraction", registry)
phase3_orch_factory = PluginFactory("phase3_allocation.task_orchestrator", registry)
phase4_plan_factory = PluginFactory("phase4_execution.task_planning", registry)

task_extraction = phase2_extract_factory.create("default_task_extraction", PluginConfig())
task_orchestrator = phase3_orch_factory.create("default_task_orchestrator", PluginConfig())
task_planning = phase4_plan_factory.create("default_task_planning", PluginConfig())
```

---

## 相关文档

- `docs/04-phase-modules/phase1-initialization.md`
- `docs/04-phase-modules/phase2-creation.md`
- `docs/04-phase-modules/phase3-allocation.md`
- `docs/04-phase-modules/phase4-execution.md`
