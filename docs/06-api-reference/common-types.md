# 公共类型定义

Oikos 系统中使用的公共数据类型定义。

---

## 目录

- [EconomicState](#economicstate)
- [AgentRanks](#agentranks)
- [ConversationContext](#conversationcontext)
- [TaskData](#taskdata)
- [MetricsData](#metricsdata)

---

## EconomicState

**文件**: `interfaces/common/types.py`

### 类定义

```python
from dataclasses import dataclass, field
from typing import Dict

@dataclass
class EconomicState:
    """
    经济状态对象

    包含整个系统的经济状态:
    - 所有账户的余额
    - 平台资金池
    - 保险金池

    用于Phase间传递经济状态
    """

    ledger: Dict[str, float] = field(default_factory=dict)
    """
    账本: {account_id: balance}

    常见账户:
    - "user": 用户账户
    - "orchestrator": 编排器账户
    - "agent-001", "agent-002", ...: Worker账户
    - "platform": 平台账户
    """

    public_pool: float = 0.0
    """平台资金池"""

    insurance_pool: float = 0.0
    """保险金池"""

    def copy(self) -> 'EconomicState':
        """
        创建深拷贝

        Returns:
            新的EconomicState对象

        Example:
            >>> state1 = EconomicState(ledger={"user": 1000.0})
            >>> state2 = state1.copy()
            >>> state2.ledger["user"] = 500.0
            >>> state1.ledger["user"]  # 不受影响
            1000.0
        """
        return EconomicState(
            ledger=self.ledger.copy(),
            public_pool=self.public_pool,
            insurance_pool=self.insurance_pool
        )

    @property
    def total_fund(self) -> float:
        """
        计算总资金

        Returns:
            所有账户余额 + 资金池的总和

        Example:
            >>> state = EconomicState(
            ...     ledger={"user": 1000.0, "agent": 50.0},
            ...     public_pool=100.0,
            ...     insurance_pool=50.0
            ... )
            >>> state.total_fund
            1200.0
        """
        return sum(self.ledger.values()) + self.public_pool + self.insurance_pool

    def get_balance(self, account_id: str) -> float:
        """
        获取账户余额

        Args:
            account_id: 账户ID

        Returns:
            余额,如果账户不存在返回0.0

        Example:
            >>> state = EconomicState(ledger={"user": 1000.0})
            >>> state.get_balance("user")
            1000.0
            >>> state.get_balance("nonexistent")
            0.0
        """
        return self.ledger.get(account_id, 0.0)

    def set_balance(self, account_id: str, balance: float) -> None:
        """
        设置账户余额

        Args:
            account_id: 账户ID
            balance: 新余额

        Example:
            >>> state = EconomicState()
            >>> state.set_balance("user", 1000.0)
            >>> state.get_balance("user")
            1000.0
        """
        self.ledger[account_id] = balance

    def transfer(self, from_id: str, to_id: str, amount: float) -> None:
        """
        账户间转账

        Args:
            from_id: 源账户ID
            to_id: 目标账户ID
            amount: 转账金额

        Raises:
            ValueError: 如果余额不足

        Example:
            >>> state = EconomicState(ledger={"user": 1000.0, "agent": 0.0})
            >>> state.transfer("user", "agent", 100.0)
            >>> state.get_balance("user")
            900.0
            >>> state.get_balance("agent")
            100.0
        """
        if self.get_balance(from_id) < amount:
            raise ValueError(
                f"Insufficient funds: {from_id} has {self.get_balance(from_id)}, "
                f"need {amount}"
            )

        self.ledger[from_id] = self.get_balance(from_id) - amount
        self.ledger[to_id] = self.get_balance(to_id) + amount

    def to_dict(self) -> Dict:
        """
        转换为字典

        Returns:
            字典表示

        Example:
            >>> state = EconomicState(ledger={"user": 1000.0}, public_pool=100.0)
            >>> state.to_dict()
            {'ledger': {'user': 1000.0}, 'public_pool': 100.0, 'insurance_pool': 0.0}
        """
        return {
            "ledger": self.ledger,
            "public_pool": self.public_pool,
            "insurance_pool": self.insurance_pool
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'EconomicState':
        """
        从字典创建

        Args:
            data: 字典数据

        Returns:
            EconomicState对象

        Example:
            >>> data = {'ledger': {'user': 1000.0}, 'public_pool': 100.0}
            >>> state = EconomicState.from_dict(data)
            >>> state.get_balance("user")
            1000.0
        """
        return cls(
            ledger=data.get("ledger", {}),
            public_pool=data.get("public_pool", 0.0),
            insurance_pool=data.get("insurance_pool", 0.0)
        )
```

---

## AgentRanks

**文件**: `interfaces/common/types.py`

### 类定义

```python
from dataclasses import dataclass, field
from typing import Dict, List

@dataclass
class AgentRanks:
    """
    Agent排名数据

    记录所有Agent的排名分数和历史
    """

    ranks: Dict[str, float] = field(default_factory=dict)
    """
    当前排名: {agent_id: rank_score}

    rank_score: 排名分数,通常范围 [0.0, 1.0]
    分数越高,排名越好
    """

    history: Dict[str, List[float]] = field(default_factory=dict)
    """
    历史排名: {agent_id: [rank_at_episode_0, rank_at_episode_1, ...]}
    """

    def get_rank(self, agent_id: str) -> float:
        """
        获取Agent排名分数

        Args:
            agent_id: Agent ID

        Returns:
            排名分数,如果不存在返回0.5(中性)

        Example:
            >>> ranks = AgentRanks(ranks={"agent-001": 0.8})
            >>> ranks.get_rank("agent-001")
            0.8
            >>> ranks.get_rank("agent-999")
            0.5
        """
        return self.ranks.get(agent_id, 0.5)

    def set_rank(self, agent_id: str, rank_score: float) -> None:
        """
        设置Agent排名

        Args:
            agent_id: Agent ID
            rank_score: 排名分数

        Example:
            >>> ranks = AgentRanks()
            >>> ranks.set_rank("agent-001", 0.8)
            >>> ranks.get_rank("agent-001")
            0.8
        """
        self.ranks[agent_id] = rank_score

    def update_ranks(self, new_ranks: Dict[str, float]) -> None:
        """
        批量更新排名

        同时将当前排名添加到历史

        Args:
            new_ranks: 新排名字典

        Example:
            >>> ranks = AgentRanks()
            >>> ranks.update_ranks({"agent-001": 0.8, "agent-002": 0.6})
            >>> ranks.get_rank("agent-001")
            0.8
        """
        # 保存当前排名到历史
        for agent_id, rank_score in self.ranks.items():
            if agent_id not in self.history:
                self.history[agent_id] = []
            self.history[agent_id].append(rank_score)

        # 更新当前排名
        self.ranks = new_ranks

    def get_history(self, agent_id: str) -> List[float]:
        """
        获取Agent历史排名

        Args:
            agent_id: Agent ID

        Returns:
            历史排名列表

        Example:
            >>> ranks = AgentRanks(history={"agent-001": [0.5, 0.7, 0.8]})
            >>> ranks.get_history("agent-001")
            [0.5, 0.7, 0.8]
        """
        return self.history.get(agent_id, [])

    def get_top_agents(self, k: int = 5) -> List[tuple]:
        """
        获取Top-K Agents

        Args:
            k: 返回前k个Agent

        Returns:
            [(agent_id, rank_score), ...] 按分数降序

        Example:
            >>> ranks = AgentRanks(ranks={"a1": 0.9, "a2": 0.5, "a3": 0.7})
            >>> ranks.get_top_agents(k=2)
            [('a1', 0.9), ('a3', 0.7)]
        """
        sorted_ranks = sorted(
            self.ranks.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_ranks[:k]

    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            "ranks": self.ranks,
            "history": self.history
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'AgentRanks':
        """从字典创建"""
        return cls(
            ranks=data.get("ranks", {}),
            history=data.get("history", {})
        )
```

---

## ConversationContext

**文件**: `interfaces/common/types.py`

### 类定义

```python
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

@dataclass
class ConversationContext:
    """
    对话上下文

    记录整个对话/实验的上下文信息
    """

    conversation_id: str
    """对话ID"""

    episode_id: int = 0
    """当前轮次ID"""

    participants: List[str] = field(default_factory=list)
    """参与者ID列表 (Orchestrator + Workers)"""

    current_phase: str = ""
    """当前执行的Phase"""

    metadata: Dict[str, Any] = field(default_factory=dict)
    """额外的元数据"""

    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            "conversation_id": self.conversation_id,
            "episode_id": self.episode_id,
            "participants": self.participants,
            "current_phase": self.current_phase,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'ConversationContext':
        """从字典创建"""
        return cls(
            conversation_id=data["conversation_id"],
            episode_id=data.get("episode_id", 0),
            participants=data.get("participants", []),
            current_phase=data.get("current_phase", ""),
            metadata=data.get("metadata", {})
        )
```

---

## TaskData

**文件**: `interfaces/common/types.py`

### 类定义

```python
from dataclasses import dataclass, field
from typing import Dict, Any, Optional

@dataclass
class TaskData:
    """
    任务数据

    表示一个待执行的任务
    """

    id: str
    """任务ID"""

    input: str
    """任务输入"""

    target: Optional[str] = None
    """期望输出 (用于评估)"""

    difficulty: Optional[str] = None
    """难度: "easy", "medium", "hard" """

    domain: Optional[str] = None
    """领域: "math", "code", "reasoning", etc."""

    price: float = 0.0
    """任务价格 (Phase 2定价后设置)"""

    metadata: Dict[str, Any] = field(default_factory=dict)
    """额外元数据"""

    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            "id": self.id,
            "input": self.input,
            "target": self.target,
            "difficulty": self.difficulty,
            "domain": self.domain,
            "price": self.price,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'TaskData':
        """从字典创建"""
        return cls(
            id=data["id"],
            input=data["input"],
            target=data.get("target"),
            difficulty=data.get("difficulty"),
            domain=data.get("domain"),
            price=data.get("price", 0.0),
            metadata=data.get("metadata", {})
        )

    @classmethod
    def from_jsonl_line(cls, line: str) -> 'TaskData':
        """
        从JSONL行创建

        Args:
            line: JSONL格式的一行

        Returns:
            TaskData对象

        Example:
            >>> line = '{"id": "t1", "input": "2+2=?", "target": "4"}'
            >>> task = TaskData.from_jsonl_line(line)
            >>> task.id
            't1'
        """
        import json
        data = json.loads(line)
        return cls.from_dict(data)
```

---

## MetricsData

**文件**: `interfaces/common/types.py`

### 类定义

```python
from dataclasses import dataclass, field
from typing import Dict, Any, List

@dataclass
class MetricsData:
    """
    指标数据

    收集整个实验的指标
    """

    num_episodes: int = 0
    """总轮次数"""

    avg_quality_score: float = 0.0
    """平均质量分数"""

    total_cost: float = 0.0
    """总成本"""

    agent_metrics: Dict[str, Dict[str, float]] = field(default_factory=dict)
    """
    Agent级别指标: {agent_id: {metric_name: value}}

    常见指标:
    - "avg_quality": 平均质量
    - "total_reward": 总奖励
    - "final_rank": 最终排名
    """

    episode_metrics: List[Dict[str, Any]] = field(default_factory=list)
    """
    每轮指标列表: [
        {"episode": 0, "quality": 0.8, "cost": 100.0},
        ...
    ]
    """

    def add_episode_metric(self, episode: int, metrics: Dict[str, Any]) -> None:
        """
        添加一轮的指标

        Args:
            episode: 轮次ID
            metrics: 指标字典

        Example:
            >>> metrics_data = MetricsData()
            >>> metrics_data.add_episode_metric(0, {"quality": 0.8, "cost": 100.0})
            >>> len(metrics_data.episode_metrics)
            1
        """
        metrics["episode"] = episode
        self.episode_metrics.append(metrics)

    def get_agent_metric(self, agent_id: str, metric_name: str) -> float:
        """
        获取Agent的某个指标

        Args:
            agent_id: Agent ID
            metric_name: 指标名称

        Returns:
            指标值,如果不存在返回0.0

        Example:
            >>> metrics_data = MetricsData(
            ...     agent_metrics={"agent-001": {"avg_quality": 0.85}}
            ... )
            >>> metrics_data.get_agent_metric("agent-001", "avg_quality")
            0.85
        """
        return self.agent_metrics.get(agent_id, {}).get(metric_name, 0.0)

    def set_agent_metric(self, agent_id: str, metric_name: str, value: float) -> None:
        """设置Agent指标"""
        if agent_id not in self.agent_metrics:
            self.agent_metrics[agent_id] = {}
        self.agent_metrics[agent_id][metric_name] = value

    def to_dict(self) -> Dict:
        """转换为字典"""
        return {
            "num_episodes": self.num_episodes,
            "avg_quality_score": self.avg_quality_score,
            "total_cost": self.total_cost,
            "agent_metrics": self.agent_metrics,
            "episode_metrics": self.episode_metrics
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'MetricsData':
        """从字典创建"""
        return cls(
            num_episodes=data.get("num_episodes", 0),
            avg_quality_score=data.get("avg_quality_score", 0.0),
            total_cost=data.get("total_cost", 0.0),
            agent_metrics=data.get("agent_metrics", {}),
            episode_metrics=data.get("episode_metrics", [])
        )
```

---

## 辅助类型

### ExecutionResult

```python
@dataclass
class ExecutionResult:
    """
    Phase 4 执行结果

    表示一个任务的执行结果
    """

    task_id: str
    """任务ID"""

    output: str
    """实际输出"""

    reasoning: Optional[str] = None
    """推理过程"""

    dag_trace: Optional[Dict[str, Any]] = None
    """DAG执行轨迹 (LangGraph)"""

    participants: List[str] = field(default_factory=list)
    """参与的Worker IDs"""

    quality_score: float = 0.0
    """质量分数 (Phase 5评估后设置)"""

    def to_dict(self) -> Dict:
        return {
            "task_id": self.task_id,
            "output": self.output,
            "reasoning": self.reasoning,
            "dag_trace": self.dag_trace,
            "participants": self.participants,
            "quality_score": self.quality_score
        }
```

---

## 类型别名

```python
# 常用类型别名
AccountID = str              # 账户ID
AgentID = str                # Agent ID
TaskID = str                 # 任务ID
EpisodeID = int              # 轮次ID
Balance = float              # 余额
Score = float                # 分数 [0.0, 1.0]
Price = float                # 价格
```

---

## 总结

Oikos 公共类型提供:

✅ **EconomicState** - 经济状态对象 (账本 + 资金池)
✅ **AgentRanks** - Agent排名数据 (当前 + 历史)
✅ **ConversationContext** - 对话上下文
✅ **TaskData** - 任务数据结构
✅ **MetricsData** - 指标收集
✅ **ExecutionResult** - 执行结果

这些类型在各Phase间传递,构成了 Oikos 的数据流骨架。

---

**下一步**: 👉 [configuration-schema.md](configuration-schema.md) - 配置文件Schema
