# Phase 1-4 API 参考

Phase 1-4 的API参考文档(简化版)。

---

## 目录

- [Phase 1: 初始化](#phase-1-初始化)
- [Phase 2: 任务创建](#phase-2-任务创建)
- [Phase 3: 任务分配](#phase-3-任务分配)
- [Phase 4: 任务执行](#phase-4-任务执行)

---

## Phase 1: 初始化

**文件**: `interfaces/phase1_initialization/base.py`

### ParticipantInitInterface

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class ParticipantInitInterface(ABC):
    """
    参与者初始化接口

    职责:
    - 注册Orchestrator
    - 注册Workers
    - 创建Agent Profiles
    """

    @abstractmethod
    def initialize_participants(
        self,
        config: Dict[str, Any]
    ) -> List[str]:
        """
        初始化参与者

        Args:
            config: 初始化配置
                - num_agents: Agent数量
                - agent_source: Agent来源

        Returns:
            participant_ids: 参与者ID列表

        Example:
            >>> init = AetherParticipantInit()
            >>> participants = init.initialize_participants({
            ...     "num_agents": 10,
            ...     "agent_source": "nvwa"
            ... })
            >>> print(len(participants))
            11  # 10 Workers + 1 Orchestrator
        """
        pass
```

### EconomicInitInterface

```python
class EconomicInitInterface(ABC):
    """
    经济系统初始化接口

    职责:
    - 创建账本
    - 分配初始余额
    - 初始化资金池
    """

    @abstractmethod
    def initialize_economic_system(
        self,
        participants: List[str],
        config: Dict[str, Any]
    ) -> EconomicState:
        """
        初始化经济系统

        Args:
            participants: 参与者ID列表
            config: 初始化配置
                - initial_agent_balance: Agent初始余额
                - initial_public_pool: 平台资金池
                - initial_insurance_pool: 保险金池

        Returns:
            economic_state: 初始化后的经济状态

        Example:
            >>> init = AetherEconomicInit()
            >>> state = init.initialize_economic_system(
            ...     ["orchestrator", "agent-001"],
            ...     {"initial_agent_balance": 100.0}
            ... )
            >>> state.get_balance("agent-001")
            100.0
        """
        pass
```

### 配置示例

```yaml
phase1_init:
  participants:
    plugin: "aether_participant_init"
    config:
      num_agents: 10
      agent_source: "nvwa"

  economic_system:
    plugin: "aether_economic_init"
    config:
      initial_agent_balance: 100.0
      initial_public_pool: 10000.0
      initial_insurance_pool: 5000.0
```

---

## Phase 2: 任务创建

**文件**: `interfaces/phase2_creation/base.py`

### TaskCreatorInterface

```python
class TaskCreatorInterface(ABC):
    """
    任务创建接口

    职责:
    - 从数据集加载任务
    - 解析任务字段
    """

    @abstractmethod
    def load_task(
        self,
        dataset_path: str,
        task_index: int
    ) -> TaskData:
        """
        加载任务

        Args:
            dataset_path: 数据集路径
            task_index: 任务索引

        Returns:
            task_data: 任务对象

        Example:
            >>> creator = DefaultTaskCreator()
            >>> task = creator.load_task("dataset.jsonl", 0)
            >>> print(task.id)
            'task-001'
        """
        pass
```

### TaskPricingInterface

```python
class TaskPricingInterface(ABC):
    """
    任务定价接口

    职责:
    - 计算任务价格
    """

    @abstractmethod
    def calculate_price(
        self,
        task: TaskData
    ) -> float:
        """
        计算任务价格

        Args:
            task: 任务对象

        Returns:
            price: 任务价格

        Example:
            >>> pricing = DifficultyBasedPricing()
            >>> pricing.initialize({"base_price": 100.0})
            >>> task = TaskData(id="t1", difficulty="hard")
            >>> price = pricing.calculate_price(task)
            >>> print(price)
            200.0  # hard = base_price * 2.0
        """
        pass
```

### 实现: DifficultyBasedPricing

```python
class DifficultyBasedPricing(BasePlugin, TaskPricingInterface):
    """
    基于难度的定价

    配置:
    - base_price: 基础价格
    - difficulty_multipliers: 难度系数
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        self.base_price = config.get("base_price", 100.0)
        self.multipliers = config.get("difficulty_multipliers", {
            "easy": 1.0,
            "medium": 1.5,
            "hard": 2.0
        })

    def calculate_price(self, task: TaskData) -> float:
        difficulty = task.difficulty or "medium"
        multiplier = self.multipliers.get(difficulty, 1.0)
        return self.base_price * multiplier
```

### 配置示例

```yaml
phase2_creation:
  task_creator:
    plugin: "default_task_creator"

  task_pricing:
    plugin: "difficulty_based_pricing"
    config:
      base_price: 100.0
      difficulty_multipliers:
        easy: 1.0
        medium: 1.5
        hard: 2.0
```

---

## Phase 3: 任务分配

**文件**: `interfaces/phase3_allocation/base.py`

### TaskAllocatorInterface

```python
class TaskAllocatorInterface(ABC):
    """
    任务分配接口

    职责:
    - 从Worker Pool中选择Workers
    - 考虑排名、领域匹配等因素
    """

    @abstractmethod
    def allocate_workers(
        self,
        task: TaskData,
        worker_pool: List[str],
        agent_ranks: AgentRanks
    ) -> List[str]:
        """
        分配Workers到任务

        Args:
            task: 任务对象
            worker_pool: 可用Worker列表
            agent_ranks: Agent排名数据

        Returns:
            selected_workers: 选中的Worker ID列表

        Example:
            >>> allocator = RankBasedAllocator()
            >>> allocator.initialize({"top_k": 5})
            >>>
            >>> ranks = AgentRanks(ranks={
            ...     "agent-001": 0.9,
            ...     "agent-002": 0.6,
            ...     "agent-003": 0.8
            ... })
            >>>
            >>> workers = allocator.allocate_workers(
            ...     task, ["agent-001", "agent-002", "agent-003"], ranks
            ... )
            >>> print(workers)
            ['agent-001', 'agent-003', 'agent-002']  # 按排名降序
        """
        pass
```

### 实现: RankBasedAllocator

```python
class RankBasedAllocator(BasePlugin, TaskAllocatorInterface):
    """
    基于排名的分配器 ⭐ 推荐

    配置:
    - top_k: 选择Top-K Workers
    - min_rank_score: 最低排名阈值
    - exploration_rate: 探索率
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        self.top_k = config.get("top_k", 5)
        self.min_rank_score = config.get("min_rank_score", 0.5)
        self.exploration_rate = config.get("exploration_rate", 0.1)

    def allocate_workers(self, task, worker_pool, agent_ranks):
        import random

        # 1. 过滤低排名Agent
        eligible_workers = [
            worker_id for worker_id in worker_pool
            if agent_ranks.get_rank(worker_id) >= self.min_rank_score
        ]

        # 2. 按排名排序
        sorted_workers = sorted(
            eligible_workers,
            key=lambda w: agent_ranks.get_rank(w),
            reverse=True
        )

        # 3. 选择Top-K
        selected = sorted_workers[:self.top_k]

        # 4. 探索机制: 用低排名Agent替换部分高排名Agent
        if random.random() < self.exploration_rate and len(worker_pool) > len(selected):
            # 随机选择一个低排名Agent
            remaining = [w for w in worker_pool if w not in selected]
            if remaining:
                explore_agent = random.choice(remaining)
                # 替换排名最低的选中Agent
                selected[-1] = explore_agent

        return selected
```

### 配置示例

```yaml
phase3_allocation:
  allocator:
    plugin: "rank_based_allocator"
    config:
      top_k: 5
      min_rank_score: 0.5
      use_domain_matching: true
      exploration_rate: 0.1
```

---

## Phase 4: 任务执行

**文件**: `interfaces/phase4_execution/base.py`

### ExecutorInterface

```python
class ExecutorInterface(ABC):
    """
    执行器接口

    职责:
    - 执行任务
    - 协调Workers
    - 生成DAG trace
    """

    @abstractmethod
    def execute_task(
        self,
        task: TaskData,
        workers: List[str]
    ) -> ExecutionResult:
        """
        执行任务

        Args:
            task: 任务对象
            workers: 参与的Worker列表

        Returns:
            execution_result: 执行结果

        Example:
            >>> executor = LangGraphExecutor()
            >>> executor.initialize({"max_steps": 50})
            >>>
            >>> task = TaskData(id="t1", input="2+2=?")
            >>> result = executor.execute_task(task, ["agent-001"])
            >>>
            >>> print(result.output)
            '4'
            >>> print(len(result.dag_trace["nodes"]))
            3  # 3个执行节点
        """
        pass
```

### 实现: LangGraphExecutor

```python
class LangGraphExecutor(BasePlugin, ExecutorInterface):
    """
    LangGraph执行器

    配置:
    - max_steps: 最大执行步数
    - timeout: 超时时间
    - enable_parallel: 启用并行
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        self.max_steps = config.get("max_steps", 50)
        self.timeout = config.get("timeout", 300)
        self.enable_parallel = config.get("enable_parallel", True)

    def execute_task(self, task, workers):
        # 1. 构建LangGraph DAG
        dag = self._build_dag(task, workers)

        # 2. 执行DAG
        output, dag_trace = self._execute_dag(dag)

        # 3. 构建结果
        result = ExecutionResult(
            task_id=task.id,
            output=output,
            dag_trace=dag_trace,
            participants=workers
        )

        return result

    def _build_dag(self, task, workers):
        """构建DAG"""
        # 简化示例
        return {
            "nodes": [
                {"id": "node1", "agent": workers[0], "action": "analyze"},
                {"id": "node2", "agent": workers[1] if len(workers) > 1 else workers[0], "action": "solve"},
                {"id": "node3", "agent": "orchestrator", "action": "summarize"}
            ],
            "edges": [
                {"from": "node1", "to": "node2"},
                {"from": "node2", "to": "node3"}
            ]
        }

    def _execute_dag(self, dag):
        """执行DAG"""
        # 简化示例
        output = "Execution result..."
        trace = dag
        return output, trace
```

### 配置示例

```yaml
phase4_execution:
  executor:
    plugin: "langgraph_executor"
    config:
      max_steps: 50
      timeout: 300
      enable_parallel: true
```

---

## 完整工作流示例

```python
from core.plugin_factory import PluginFactory
from interfaces.types import TaskData, EconomicState, AgentRanks

# 加载配置
config = ConfigManager.load("config.yaml")
factory = PluginFactory(config)

# Phase 1: 初始化
participant_init = factory.create_plugin("phase1_init.participants")
economic_init = factory.create_plugin("phase1_init.economic_system")

participants = participant_init.initialize_participants(
    config["phase1_init"]["participants"]["config"]
)
economic_state = economic_init.initialize_economic_system(
    participants,
    config["phase1_init"]["economic_system"]["config"]
)

# Phase 2: 创建任务
task_creator = factory.create_plugin("phase2_creation.task_creator")
task_pricing = factory.create_plugin("phase2_creation.task_pricing")

task = task_creator.load_task("dataset.jsonl", 0)
task.price = task_pricing.calculate_price(task)

# Phase 3: 分配Workers
allocator = factory.create_plugin("phase3_allocation.allocator")

agent_ranks = AgentRanks(ranks={p: 0.5 for p in participants})
workers = allocator.allocate_workers(task, participants[1:], agent_ranks)

# Phase 4: 执行任务
executor = factory.create_plugin("phase4_execution.executor")
execution_result = executor.execute_task(task, workers)

print(f"Task: {task.id}")
print(f"Workers: {workers}")
print(f"Output: {execution_result.output}")
```

---

## 总结

Phase 1-4 API提供:

✅ **Phase 1** - 参与者和经济系统初始化
✅ **Phase 2** - 任务加载和定价
✅ **Phase 3** - 基于排名的Worker分配
✅ **Phase 4** - LangGraph DAG执行

这些Phase为后续的结算(Phase 5)、反馈(Phase 6)和池管理(Phase 7)提供基础。

---

**相关文档**:
- 👉 [phase5-api.md](phase5-api.md) - Phase 5: 清结算 API
- 👉 [phase6-api.md](phase6-api.md) - Phase 6: 反馈排名 API
- 👉 [phase7-api.md](phase7-api.md) - Phase 7: 资金池管理 API
- 👉 [common-types.md](common-types.md) - 公共类型定义
