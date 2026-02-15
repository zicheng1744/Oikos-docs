# Phase 6 API 参考

Phase 6 (反馈与排名) 的完整API参考文档。

---

## 目录

- [AgentEvalInterface](#agentevalinterface)
- [AgentRank算法](#agentrank算法)
- [实现变体](#实现变体)
- [交互图构建](#交互图构建)

---

## AgentEvalInterface

**文件**: `interfaces/phase6_feedback/agent_eval.py + interfaces/phase6_feedback/observation.py`

### 接口定义

```python
from abc import ABC, abstractmethod
from typing import Dict, List

class AgentEvalInterface(ABC):
    """
    Agent评估接口

    职责:
    - 评估Agent表现
    - 计算Agent排名分数
    - 更新排名历史

    典型实现:
    - DefaultAgentEval: 随机排名
    - AetherAgentEval: AgentRank算法 ⭐
    """

    @abstractmethod
    def evaluate_agents(
        self,
        agents: List[str],
        episode_results: Dict[str, float]
    ) -> Dict[str, float]:
        """
        评估并排名Agents

        Args:
            agents: Agent ID列表
            episode_results: 本轮结果
                {agent_id: quality_score}
                quality_score: 本轮任务的质量分数 [0.0, 1.0]

        Returns:
            agent_ranks: Agent排名分数
                {agent_id: rank_score}
                rank_score: 排名分数,范围通常 [0.0, 1.0]
                分数越高,排名越好

        Example:
            >>> evaluator = AetherAgentEval()
            >>> evaluator.initialize({"algorithm": "agent_rank"})
            >>>
            >>> agents = ["agent-001", "agent-002", "agent-003"]
            >>> results = {
            ...     "agent-001": 0.9,
            ...     "agent-002": 0.5,
            ...     "agent-003": 0.7
            ... }
            >>>
            >>> ranks = evaluator.evaluate_agents(agents, results)
            >>> print(ranks)
            {'agent-001': 0.85, 'agent-002': 0.42, 'agent-003': 0.63}
        """
        pass

    def get_agent_history(self, agent_id: str) -> List[float]:
        """
        获取Agent历史分数

        Args:
            agent_id: Agent ID

        Returns:
            历史分数列表,按时间顺序

        Example:
            >>> history = evaluator.get_agent_history("agent-001")
            >>> print(history)
            [0.8, 0.9, 0.85, 0.92]
        """
        pass
```

---

## AgentRank算法

### 算法概述

AgentRank 是类似 PageRank 的图排名算法,基于Agent之间的交互关系计算排名。

**核心思想**:
- 被高排名Agent引用的Agent,排名也会提升
- 考虑交互权重和方向性
- 迭代收敛到稳定排名

### 数学公式

```python
# AgentRank公式:
# AgentRank(A) = (1 - d) + d * Σ [AgentRank(B_i) * w(B_i → A) / Out(B_i)]
#
# 其中:
# - d: 阻尼系数 (通常 0.85)
# - B_i: 指向Agent A的所有Agent
# - w(B_i → A): B_i到A的交互权重
# - Out(B_i): B_i的出度 (总交互次数)
```

### 实现

```python
class AgentRankAlgorithm:
    """
    AgentRank算法实现

    配置:
    - damping_factor: 阻尼系数,默认 0.85
    - max_iterations: 最大迭代次数,默认 100
    - convergence_threshold: 收敛阈值,默认 0.001
    """

    def __init__(
        self,
        damping_factor: float = 0.85,
        max_iterations: int = 100,
        convergence_threshold: float = 0.001
    ):
        self.d = damping_factor
        self.max_iterations = max_iterations
        self.threshold = convergence_threshold

    def calculate_ranks(
        self,
        interaction_graph: Dict[str, Dict[str, float]]
    ) -> Dict[str, float]:
        """
        计算AgentRank

        Args:
            interaction_graph: 交互图
                {agent_id: {target_agent_id: weight}}
                例如: {
                    "agent-001": {"agent-002": 3.0, "agent-003": 2.0},
                    "agent-002": {"agent-003": 1.0}
                }

        Returns:
            ranks: {agent_id: rank_score}

        Example:
            >>> graph = {
            ...     "A": {"B": 2.0, "C": 1.0},
            ...     "B": {"C": 3.0},
            ...     "C": {}
            ... }
            >>> algo = AgentRankAlgorithm()
            >>> ranks = algo.calculate_ranks(graph)
            >>> print(ranks)
            {'A': 0.35, 'B': 0.42, 'C': 0.58}
        """
        # 1. 获取所有Agent
        agents = set(interaction_graph.keys())
        for targets in interaction_graph.values():
            agents.update(targets.keys())

        # 2. 初始化排名 (均匀分布)
        ranks = {agent: 1.0 / len(agents) for agent in agents}

        # 3. 计算出度
        out_degrees = {}
        for agent, targets in interaction_graph.items():
            out_degrees[agent] = sum(targets.values())

        # 4. 迭代计算
        for iteration in range(self.max_iterations):
            new_ranks = {}

            for agent in agents:
                # 基础分数
                rank = 1 - self.d

                # 来自其他Agent的贡献
                for source_agent in agents:
                    if agent in interaction_graph.get(source_agent, {}):
                        weight = interaction_graph[source_agent][agent]
                        out_degree = out_degrees.get(source_agent, 1.0)

                        contribution = ranks[source_agent] * weight / out_degree
                        rank += self.d * contribution

                new_ranks[agent] = rank

            # 5. 检查收敛
            diff = sum(abs(new_ranks[a] - ranks[a]) for a in agents)
            ranks = new_ranks

            if diff < self.threshold:
                break

        # 6. 归一化到 [0, 1]
        max_rank = max(ranks.values())
        min_rank = min(ranks.values())
        if max_rank > min_rank:
            ranks = {
                agent: (r - min_rank) / (max_rank - min_rank)
                for agent, r in ranks.items()
            }

        return ranks
```

---

## 实现变体

### 1. DefaultAgentEval (随机)

**插件名**: `default_agent_eval`

```python
class DefaultAgentEval(BasePlugin, AgentEvalInterface):
    """
    默认Agent评估 - 随机排名

    特点:
    - 用于Baseline实验
    - 随机分配排名
    - 无激励机制

    配置:
    - 无特殊配置
    """

    def evaluate_agents(self, agents, episode_results):
        import random

        # 随机排名
        ranks = {agent_id: random.random() for agent_id in agents}

        return ranks
```

---

### 2. AetherAgentEval (AgentRank)

**插件名**: `aether_agent_eval`

```python
class AetherAgentEval(BasePlugin, AgentEvalInterface):
    """
    Aether Agent评估 - AgentRank算法 ⭐ 推荐

    特点:
    - 基于交互图的PageRank算法
    - 考虑历史表现
    - 激励高质量协作

    配置:
    - algorithm: 排名算法 (默认 "agent_rank")
    - damping_factor: 阻尼系数 (默认 0.85)
    - history_window: 历史窗口 (默认 10)
    - interaction_weight_method: 交互权重方法 (默认 "quality")
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        self.algorithm = config.get("algorithm", "agent_rank")
        self.damping_factor = config.get("damping_factor", 0.85)
        self.history_window = config.get("history_window", 10)
        self.interaction_weight_method = config.get("interaction_weight_method", "quality")

        # 历史记录
        self.agent_history: Dict[str, List[float]] = {}
        self.interaction_graph: Dict[str, Dict[str, float]] = {}

        # AgentRank算法
        self.agent_rank_algo = AgentRankAlgorithm(
            damping_factor=self.damping_factor
        )

    def evaluate_agents(self, agents, episode_results):
        # 1. 更新历史
        self._update_history(episode_results)

        # 2. 更新交互图
        self._update_interaction_graph(episode_results)

        # 3. 计算排名
        if self.algorithm == "agent_rank":
            ranks = self.agent_rank_algo.calculate_ranks(self.interaction_graph)
        elif self.algorithm == "avg_quality":
            ranks = self._calculate_avg_quality_ranks(agents)
        elif self.algorithm == "recent_success":
            ranks = self._calculate_recent_success_ranks(agents)
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")

        return ranks

    def _update_history(self, episode_results: Dict[str, float]) -> None:
        """更新历史记录"""
        for agent_id, score in episode_results.items():
            if agent_id not in self.agent_history:
                self.agent_history[agent_id] = []

            self.agent_history[agent_id].append(score)

            # 保持窗口大小
            if len(self.agent_history[agent_id]) > self.history_window:
                self.agent_history[agent_id] = \
                    self.agent_history[agent_id][-self.history_window:]

    def _update_interaction_graph(self, episode_results: Dict[str, float]) -> None:
        """
        更新交互图

        假设所有参与Agent相互交互
        权重基于质量分数
        """
        agents = list(episode_results.keys())

        for i, agent_i in enumerate(agents):
            if agent_i not in self.interaction_graph:
                self.interaction_graph[agent_i] = {}

            for j, agent_j in enumerate(agents):
                if i != j:  # 不包括自己
                    # 交互权重 = 目标Agent的质量分数
                    weight = episode_results[agent_j]

                    if agent_j in self.interaction_graph[agent_i]:
                        # 累积权重
                        self.interaction_graph[agent_i][agent_j] += weight
                    else:
                        self.interaction_graph[agent_i][agent_j] = weight
```

---

### 3. 其他排名算法

#### 平均质量排名

```python
def _calculate_avg_quality_ranks(self, agents: List[str]) -> Dict[str, float]:
    """
    平均质量排名

    rank = 历史质量分数的平均值
    """
    ranks = {}
    for agent_id in agents:
        if agent_id in self.agent_history and self.agent_history[agent_id]:
            ranks[agent_id] = sum(self.agent_history[agent_id]) / \
                             len(self.agent_history[agent_id])
        else:
            ranks[agent_id] = 0.5  # 新Agent默认0.5

    return ranks
```

#### 近期成功率排名

```python
def _calculate_recent_success_ranks(
    self,
    agents: List[str],
    success_threshold: float = 0.7
) -> Dict[str, float]:
    """
    近期成功率排名

    rank = 近期窗口内质量 >= threshold 的比例
    """
    ranks = {}
    for agent_id in agents:
        if agent_id in self.agent_history and self.agent_history[agent_id]:
            recent_scores = self.agent_history[agent_id]
            success_count = sum(1 for s in recent_scores if s >= success_threshold)
            ranks[agent_id] = success_count / len(recent_scores)
        else:
            ranks[agent_id] = 0.5

    return ranks
```

#### 加权历史排名

```python
def _calculate_weighted_history_ranks(
    self,
    agents: List[str],
    decay_rate: float = 0.9
) -> Dict[str, float]:
    """
    加权历史排名

    近期分数权重更高

    rank = Σ (score[t] * decay_rate^(now - t))
    """
    ranks = {}
    for agent_id in agents:
        if agent_id in self.agent_history and self.agent_history[agent_id]:
            history = self.agent_history[agent_id]
            weighted_sum = 0.0
            weight_sum = 0.0

            for t, score in enumerate(reversed(history)):
                weight = decay_rate ** t
                weighted_sum += score * weight
                weight_sum += weight

            ranks[agent_id] = weighted_sum / weight_sum if weight_sum > 0 else 0.5
        else:
            ranks[agent_id] = 0.5

    return ranks
```

---

## 交互图构建

### 从DAG Trace构建

```python
def build_interaction_graph_from_dag(
    dag_trace: Dict[str, Any]
) -> Dict[str, Dict[str, float]]:
    """
    从LangGraph的DAG trace构建交互图

    Args:
        dag_trace: DAG执行轨迹
            {
                "nodes": [
                    {"id": "node1", "agent": "agent-001", ...},
                    {"id": "node2", "agent": "agent-002", ...}
                ],
                "edges": [
                    {"from": "node1", "to": "node2", "weight": 1.0}
                ]
            }

    Returns:
        interaction_graph: {agent_id: {target_agent_id: weight}}
    """
    # 1. 节点ID到Agent ID映射
    node_to_agent = {}
    for node in dag_trace.get("nodes", []):
        node_to_agent[node["id"]] = node["agent"]

    # 2. 构建Agent级别的交互图
    interaction_graph = {}
    for edge in dag_trace.get("edges", []):
        source_node = edge["from"]
        target_node = edge["to"]
        weight = edge.get("weight", 1.0)

        source_agent = node_to_agent.get(source_node)
        target_agent = node_to_agent.get(target_node)

        if source_agent and target_agent and source_agent != target_agent:
            if source_agent not in interaction_graph:
                interaction_graph[source_agent] = {}

            if target_agent in interaction_graph[source_agent]:
                interaction_graph[source_agent][target_agent] += weight
            else:
                interaction_graph[source_agent][target_agent] = weight

    return interaction_graph
```

---

## 配置示例

### 推荐配置 (AgentRank)

```yaml
phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"
    config:
      algorithm: "agent_rank"        # AgentRank算法
      damping_factor: 0.85           # 阻尼系数
      history_window: 10             # 历史窗口
      interaction_weight_method: "quality"  # 交互权重方法
```

### 实验对比配置

```yaml
# 实验A: 随机排名 (Baseline)
phase6_feedback:
  agent_eval:
    plugin: "default_agent_eval"

# 实验B: 平均质量
phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"
    config:
      algorithm: "avg_quality"

# 实验C: AgentRank
phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"
    config:
      algorithm: "agent_rank"
      damping_factor: 0.85
```

---

## 排名演化分析

### 可视化排名变化

```python
import matplotlib.pyplot as plt

def plot_rank_evolution(agent_ranks_history: Dict[str, List[float]]):
    """
    绘制排名演化图

    Args:
        agent_ranks_history: {agent_id: [rank_at_episode_0, rank_at_episode_1, ...]}
    """
    plt.figure(figsize=(12, 6))

    for agent_id, ranks in agent_ranks_history.items():
        plt.plot(ranks, label=agent_id, marker='o')

    plt.xlabel("Episode")
    plt.ylabel("Rank Score")
    plt.title("Agent Rank Evolution")
    plt.legend()
    plt.grid(True)
    plt.savefig("rank_evolution.png")
```

### 计算排名相关性

```python
def calculate_rank_correlation(
    ranks_episode_1: Dict[str, float],
    ranks_episode_2: Dict[str, float]
) -> float:
    """
    计算两轮排名的相关性

    Returns:
        correlation: Spearman相关系数 [-1, 1]
    """
    from scipy.stats import spearmanr

    agents = sorted(set(ranks_episode_1.keys()) & set(ranks_episode_2.keys()))

    ranks_1 = [ranks_episode_1[a] for a in agents]
    ranks_2 = [ranks_episode_2[a] for a in agents]

    correlation, _ = spearmanr(ranks_1, ranks_2)

    return correlation
```

---

## 总结

Phase 6 API提供:

✅ **AgentEvalInterface** - Agent评估和排名
✅ **AgentRank算法** - PageRank式图排名
✅ **10种排名算法** - 随机、平均、加权等
✅ **交互图构建** - 从DAG trace自动构建
✅ **排名演化分析** - 可视化和相关性分析

通过不同的排名算法,可以实验不同的激励机制设计。

---

**下一步**: 👉 [phase7-api.md](phase7-api.md) - Phase 7 API参考
