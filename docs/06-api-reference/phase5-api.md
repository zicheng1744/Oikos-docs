# Phase 5 API 参考

Phase 5 (清结算) 的完整API参考文档。

---

## 目录

- [ResultEvalInterface](#resultevalinterface)
- [SettlementInterface](#settlementinterface)
- [O1-O3/I1-I5 资金流模型](#资金流模型)
- [实现变体](#实现变体)

---

## ResultEvalInterface

**文件**: `interfaces/phase5_settlement/base.py`

### 接口定义

```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class ResultEvalInterface(ABC):
    """
    结果评估接口

    职责:
    - 评估任务执行结果的质量
    - 返回质量分数 [0.0, 1.0]

    典型实现:
    - DefaultResultEval: 基于字符串匹配
    - AetherResultEval: 基于LLM评分
    """

    @abstractmethod
    def evaluate_result(
        self,
        task: Dict[str, Any],
        result: Dict[str, Any]
    ) -> float:
        """
        评估任务结果质量

        Args:
            task: 任务对象
                - id: 任务ID
                - input: 任务输入
                - target: 期望输出
            result: 执行结果
                - output: 实际输出
                - reasoning: 推理过程 (可选)

        Returns:
            quality_score: 质量分数,范围 [0.0, 1.0]
                - 1.0 = 完全正确
                - 0.5 = 部分正确
                - 0.0 = 完全错误

        Example:
            >>> evaluator = DefaultResultEval()
            >>> task = {"id": "t1", "input": "2+2=?", "target": "4"}
            >>> result = {"output": "4"}
            >>> score = evaluator.evaluate_result(task, result)
            >>> print(score)
            1.0
        """
        pass
```

---

## SettlementInterface

**文件**: `interfaces/phase5_settlement/base.py`

### 接口定义

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from interfaces.types import EconomicState

class SettlementInterface(ABC):
    """
    结算接口

    职责:
    - 计算任务价格
    - 分配奖励给Workers
    - 更新账本
    - 确保资金守恒

    典型实现:
    - DefaultSettlement: 固定价格
    - AetherFirstPrice: 第一价格拍卖
    - AetherSecondPrice*: 第二价格拍卖变体
    """

    @abstractmethod
    def settle_episode(
        self,
        economic_state: EconomicState,
        quality_score: float,
        task_data: Dict[str, Any],
        participants: List[str]
    ) -> EconomicState:
        """
        执行结算,更新经济状态

        Args:
            economic_state: 当前经济状态
                - ledger: 账本 {agent_id: balance}
                - public_pool: 平台资金池
                - insurance_pool: 保险金池
            quality_score: 任务质量分数 [0.0, 1.0]
            task_data: 任务元数据
            participants: 参与者ID列表

        Returns:
            updated_economic_state: 更新后的经济状态

        Raises:
            InsufficientFundsError: 如果用户余额不足
            ValueError: 如果参数无效

        Example:
            >>> settlement = AetherSecondPriceContribution()
            >>> settlement.initialize({"base_price": 100.0})
            >>>
            >>> state = EconomicState(
            ...     ledger={"user": 1000.0, "agent-001": 50.0},
            ...     public_pool=0.0
            ... )
            >>>
            >>> updated = settlement.settle_episode(
            ...     state, 0.8, {"id": "t1"}, ["agent-001"]
            ... )
            >>>
            >>> # 验证资金守恒
            >>> sum(state.ledger.values()) == sum(updated.ledger.values())
            True
        """
        pass
```

---

## 资金流模型

### O1-O3: 支出项

```python
@dataclass
class Outflows:
    """
    支出项

    O1: 用户支付 = task_price
    O2: 平台补贴 (可选)
    O3: Orchestrator超支 (可选)
    """

    O1_user_payment: float      # 用户支付的任务价格
    O2_platform_subsidy: float  # 平台补贴 (如果有)
    O3_orchestrator_overrun: float  # Orchestrator超支 (如果有)

    @property
    def total(self) -> float:
        """总支出"""
        return self.O1_user_payment + self.O2_platform_subsidy + self.O3_orchestrator_overrun
```

### I1-I5: 收入项

```python
@dataclass
class Inflows:
    """
    收入项

    I1: Agent奖励
    I2: Orchestrator费用
    I3: 平台费用
    I4: 保险金 (可选)
    I5: 罚金 (可选)
    """

    I1_agent_rewards: Dict[str, float]  # Agent获得的奖励
    I2_orchestrator_fee: float          # Orchestrator获得的费用
    I3_platform_fee: float              # 平台获得的费用
    I4_insurance: float                 # 存入保险池
    I5_penalty: float                   # 罚金

    @property
    def total(self) -> float:
        """总收入"""
        return (
            sum(self.I1_agent_rewards.values()) +
            self.I2_orchestrator_fee +
            self.I3_platform_fee +
            self.I4_insurance +
            self.I5_penalty
        )
```

### 资金守恒公式

```python
# 守恒公式:
# O1 + O2 + O3 = I1_total + I2 + I3 + I4 + I5

def verify_conservation(outflows: Outflows, inflows: Inflows) -> bool:
    """
    验证资金守恒

    Returns:
        True if outflows.total == inflows.total (within tolerance)
    """
    diff = abs(outflows.total - inflows.total)
    tolerance = 0.01
    return diff < tolerance
```

---

## 实现变体

### 1. DefaultSettlement

**插件名**: `default_settlement`

```python
class DefaultSettlement(BasePlugin, SettlementInterface):
    """
    默认结算 - 固定价格

    特点:
    - 固定任务价格
    - 平均分配奖励
    - 简单直接

    配置:
    - base_price: 基础价格 (默认 100.0)
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        self.base_price = config.get("base_price", 100.0)

    def settle_episode(self, economic_state, quality_score, task_data, participants):
        # O1: 用户支付
        task_price = self.base_price

        # I1: Agent奖励 (平均分配)
        reward_per_agent = task_price / len(participants)
        agent_rewards = {agent_id: reward_per_agent for agent_id in participants}

        # 更新账本
        updated_state = economic_state.copy()
        updated_state.ledger["user"] -= task_price
        for agent_id, reward in agent_rewards.items():
            updated_state.ledger[agent_id] += reward

        return updated_state
```

---

### 2. AetherFirstPrice (第一价格拍卖)

**插件名**: `aether_first_price_*`

变体:
- `aether_first_price_equal`: 平均分配
- `aether_first_price_contribution`: 按贡献分配
- `aether_first_price_intelligence`: 按智能分配

```python
class AetherFirstPriceContribution(BasePlugin, SettlementInterface):
    """
    第一价格拍卖 + 按贡献分配

    公式:
    - task_price = base_price * (1 + quality_multiplier * quality_score)
    - agent_reward[i] = (task_price - fees) * contribution[i]

    配置:
    - base_price: 基础价格
    - quality_multiplier: 质量系数
    - platform_fee_rate: 平台费率
    """

    def settle_episode(self, economic_state, quality_score, task_data, participants):
        # 1. 计算任务价格
        task_price = self.base_price * (1 + self.quality_multiplier * quality_score)

        # 2. 计算费用
        platform_fee = task_price * self.platform_fee_rate

        # 3. 可分配奖励
        distributable = task_price - platform_fee

        # 4. 获取贡献度
        contributions = self._get_contributions(task_data, participants)

        # 5. 按贡献分配
        agent_rewards = {}
        for agent_id in participants:
            contribution_ratio = contributions[agent_id]
            agent_rewards[agent_id] = distributable * contribution_ratio

        # 6. 更新账本
        updated_state = self._update_ledger(
            economic_state, task_price, agent_rewards, platform_fee
        )

        return updated_state
```

---

### 3. AetherSecondPrice (第二价格拍卖)

**插件名**: `aether_second_price_*`

变体:
- `aether_second_price_equal`: 平均分配
- `aether_second_price_contribution`: 按贡献分配 ⭐ 推荐
- `aether_second_price_intelligence`: 按智能分配
- `aether_second_price_credit`: 按信用分配

```python
class AetherSecondPriceContribution(BasePlugin, SettlementInterface):
    """
    第二价格拍卖 + 按贡献分配

    特点:
    - 激励真实报价
    - 按贡献公平分配
    - 平台收取费用

    公式:
    - winner_bid = max(agent_bids)
    - second_price = second_max(agent_bids)
    - task_price = second_price * (1 + quality_bonus)
    - agent_reward[i] = (task_price - fees) * contribution[i]

    配置:
    - base_price: 基础价格
    - quality_bonus_rate: 质量奖励率
    - platform_fee_rate: 平台费率
    """

    def settle_episode(self, economic_state, quality_score, task_data, participants):
        # 1. 获取Agent出价 (假设从task_data中获取)
        agent_bids = self._get_agent_bids(task_data, participants)

        # 2. 计算第二价格
        sorted_bids = sorted(agent_bids.values(), reverse=True)
        second_price = sorted_bids[1] if len(sorted_bids) > 1 else sorted_bids[0]

        # 3. 质量奖励
        quality_bonus = second_price * self.quality_bonus_rate * quality_score
        task_price = second_price + quality_bonus

        # 4. 计算费用
        platform_fee = task_price * self.platform_fee_rate

        # 5. 可分配奖励
        distributable = task_price - platform_fee

        # 6. 获取贡献度并分配
        contributions = self._get_contributions(task_data, participants)
        agent_rewards = {
            agent_id: distributable * contributions[agent_id]
            for agent_id in participants
        }

        # 7. 更新账本
        updated_state = self._update_ledger(
            economic_state, task_price, agent_rewards, platform_fee
        )

        return updated_state
```

---

### 4. AetherAdversarial (对抗式/VCG)

**插件名**: `aether_adversarial_*`

```python
class AetherAdversarialContribution(BasePlugin, SettlementInterface):
    """
    对抗式拍卖 (VCG机制)

    特点:
    - 激励真实贡献
    - 基于边际贡献计算奖励
    - 理论上激励相容

    公式:
    - marginal_contribution[i] = value(with i) - value(without i)
    - agent_reward[i] = marginal_contribution[i]

    配置:
    - base_price: 基础价格
    - platform_fee_rate: 平台费率
    """

    def settle_episode(self, economic_state, quality_score, task_data, participants):
        # 1. 计算总价值
        total_value = self.base_price * quality_score

        # 2. 计算每个Agent的边际贡献
        marginal_contributions = {}
        for agent_id in participants:
            # 模拟移除该Agent后的质量
            quality_without = self._estimate_quality_without(agent_id, task_data)
            value_without = self.base_price * quality_without

            # 边际贡献 = 有该Agent - 无该Agent
            marginal_contributions[agent_id] = total_value - value_without

        # 3. 归一化边际贡献
        total_marginal = sum(marginal_contributions.values())
        if total_marginal > 0:
            contributions = {
                agent_id: mc / total_marginal
                for agent_id, mc in marginal_contributions.items()
            }
        else:
            # 如果无法区分,平均分配
            contributions = {agent_id: 1.0 / len(participants) for agent_id in participants}

        # 4. 计算任务价格和费用
        task_price = total_value
        platform_fee = task_price * self.platform_fee_rate
        distributable = task_price - platform_fee

        # 5. 分配奖励
        agent_rewards = {
            agent_id: distributable * contributions[agent_id]
            for agent_id in participants
        }

        # 6. 更新账本
        updated_state = self._update_ledger(
            economic_state, task_price, agent_rewards, platform_fee
        )

        return updated_state
```

---

## 配置示例

### 推荐配置 (第二价格 + 按贡献)

```yaml
phase5_settlement:
  result_eval:
    plugin: "default_result_eval"

  settlement:
    plugin: "aether_second_price_contribution"
    config:
      base_price: 100.0
      quality_bonus_rate: 0.5      # 50%质量奖励
      platform_fee_rate: 0.05      # 5%平台费
```

### 实验对比配置

```yaml
# 实验A: 固定价格
phase5_settlement:
  settlement:
    plugin: "default_settlement"
    config:
      base_price: 100.0

# 实验B: 第一价格拍卖
phase5_settlement:
  settlement:
    plugin: "aether_first_price_contribution"
    config:
      base_price: 100.0
      quality_multiplier: 2.0

# 实验C: 第二价格拍卖
phase5_settlement:
  settlement:
    plugin: "aether_second_price_contribution"
    config:
      base_price: 100.0
      quality_bonus_rate: 0.5
```

---

## 辅助方法

### 贡献度计算

```python
def _get_contributions(
    self,
    task_data: Dict[str, Any],
    participants: List[str]
) -> Dict[str, float]:
    """
    计算Agent贡献度

    Returns:
        contributions: {agent_id: contribution_ratio}
        所有比例之和为 1.0
    """
    # 从task_data中提取贡献度
    # 例如: 基于LangGraph trace中每个Agent的节点数
    contributions = {}

    if "dag_trace" in task_data:
        node_counts = self._count_agent_nodes(task_data["dag_trace"])
        total_nodes = sum(node_counts.values())

        for agent_id in participants:
            contributions[agent_id] = node_counts.get(agent_id, 0) / total_nodes
    else:
        # 默认: 平均分配
        contributions = {agent_id: 1.0 / len(participants) for agent_id in participants}

    return contributions
```

### 账本更新

```python
def _update_ledger(
    self,
    economic_state: EconomicState,
    task_price: float,
    agent_rewards: Dict[str, float],
    platform_fee: float
) -> EconomicState:
    """
    更新账本

    Returns:
        updated_economic_state
    """
    updated = economic_state.copy()

    # O1: 用户支付
    updated.ledger["user"] -= task_price

    # I1: Agent奖励
    for agent_id, reward in agent_rewards.items():
        updated.ledger[agent_id] = updated.ledger.get(agent_id, 0.0) + reward

    # I3: 平台费用
    updated.ledger["platform"] = updated.ledger.get("platform", 0.0) + platform_fee

    # 验证守恒
    total_before = sum(economic_state.ledger.values())
    total_after = sum(updated.ledger.values())

    if abs(total_after - total_before) > 0.01:
        raise RuntimeError(f"Fund conservation violated: {total_before} -> {total_after}")

    return updated
```

---

## 总结

Phase 5 API提供:

✅ **ResultEvalInterface** - 评估任务质量
✅ **SettlementInterface** - 执行结算
✅ **9种结算机制** - 固定价格、拍卖、VCG
✅ **资金流模型** - O1-O3/I1-I5完整定义
✅ **资金守恒保证** - 自动验证

通过不同的结算机制,可以实验不同的经济激励设计。

---

**下一步**: 👉 [phase6-api.md](phase6-api.md) - Phase 6 API参考
