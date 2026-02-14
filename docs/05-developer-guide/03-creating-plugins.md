# 创建自定义插件

本文档详细介绍如何为 Oikos 创建自定义插件,从接口定义到注册使用的完整流程。

---

## 目录

- [插件开发概述](#插件开发概述)
- [5步创建插件](#5步创建插件)
- [完整示例](#完整示例)
- [最佳实践](#最佳实践)
- [常见错误](#常见错误)
- [高级话题](#高级话题)

---

## 插件开发概述

### 什么是插件?

Oikos 的插件是实现特定接口的 Python 类,用于扩展或替换系统的某个功能模块。

**插件特点**:
- ✅ **可替换**: 通过配置文件切换实现
- ✅ **可组合**: 不同Phase可独立选择插件
- ✅ **标准化**: 遵循统一的接口契约
- ✅ **易测试**: 独立单元测试

### 插件类型

Oikos 支持 7 个 Phase 的插件扩展:

| Phase | 插件类型 | 典型用途 |
|-------|---------|---------|
| Phase 1 | 初始化插件 | 自定义参与者注册、经济初始化 |
| Phase 2 | 任务创建插件 | 自定义数据加载、任务定价 |
| Phase 3 | 分配插件 | 自定义Worker选择策略 |
| Phase 4 | 执行插件 | 自定义执行引擎 |
| Phase 5 | 结算插件 | 自定义结算机制 ⭐ |
| Phase 6 | 反馈插件 | 自定义排名算法 ⭐ |
| Phase 7 | 资金池插件 | 自定义池管理策略 |

---

## 5步创建插件

### 步骤概览

```
1. 定义接口 (interfaces/)
   ↓
2. 实现插件 (modules/)
   ↓
3. 注册插件 (PluginRegistry)
   ↓
4. 配置使用 (recipes/conf/)
   ↓
5. 测试验证 (tests/)
```

---

## 步骤 1: 定义接口

### 何时需要定义新接口?

- ✅ 需要全新的功能模块
- ❌ 只是替换现有实现 (使用现有接口)

### 接口定义模板

**文件**: `interfaces/phase{N}_{name}/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class YourModuleInterface(ABC):
    """
    模块功能描述

    职责:
    1. 职责一
    2. 职责二
    """

    @abstractmethod
    def your_method(
        self,
        param1: Type1,
        param2: Type2
    ) -> ReturnType:
        """
        方法功能描述

        Args:
            param1: 参数1说明
            param2: 参数2说明

        Returns:
            返回值说明

        Raises:
            ExceptionType: 异常说明
        """
        pass
```

### 示例: 自定义结算接口

```python
# interfaces/phase5_settlement/base.py

from abc import ABC, abstractmethod
from typing import Dict, Any
from interfaces.types import EconomicState

class SettlementInterface(ABC):
    """
    结算接口

    职责:
    1. 计算任务价格
    2. 分配奖励给Workers
    3. 更新账本
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
            economic_state: 当前经济状态 (账本、资金池)
            quality_score: 任务质量分数 [0.0, 1.0]
            task_data: 任务元数据
            participants: 参与者ID列表

        Returns:
            updated_economic_state: 更新后的经济状态

        Raises:
            ValueError: 如果参数无效
            InsufficientFundsError: 如果余额不足
        """
        pass
```

---

## 步骤 2: 实现插件

### 实现基本结构

**文件**: `modules/phase{N}/{name}_modules.py`

```python
from core.plugin_system import BasePlugin
from interfaces.phase{N}_{name}.base import YourModuleInterface
from typing import Dict, Any

class CustomPluginName(BasePlugin, YourModuleInterface):
    """
    自定义插件实现

    特点:
    - 特点1
    - 特点2

    配置参数:
    - param1 (type): 说明
    - param2 (type): 说明
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        """
        初始化插件配置

        Args:
            config: 配置字典
        """
        # 读取配置参数
        self.param1 = config.get("param1", default_value)
        self.param2 = config.get("param2", default_value)

        # 初始化内部状态
        self._internal_state = None

    def your_method(self, param1: Type1, param2: Type2) -> ReturnType:
        """实现接口方法"""
        # 实现逻辑
        result = self._do_something(param1, param2)
        return result

    def _do_something(self, param1, param2):
        """私有辅助方法"""
        # 实现细节
        pass

    def cleanup(self) -> None:
        """清理资源"""
        # 释放资源
        self._internal_state = None
```

### 完整示例: 自定义结算插件

```python
# modules/phase5/settlement_modules.py

from core.plugin_system import BasePlugin
from interfaces.phase5_settlement.base import SettlementInterface
from interfaces.types import EconomicState
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

class PerformanceBasedSettlement(BasePlugin, SettlementInterface):
    """
    基于性能的结算机制

    特点:
    - 高质量任务获得更高奖励
    - 支持奖励倍数调整
    - 自动平台抽成

    配置参数:
    - base_price (float): 基础任务价格,默认100.0
    - quality_multiplier (float): 质量系数,默认2.0
    - platform_fee_rate (float): 平台费率,默认0.05 (5%)
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        """初始化配置"""
        self.base_price = config.get("base_price", 100.0)
        self.quality_multiplier = config.get("quality_multiplier", 2.0)
        self.platform_fee_rate = config.get("platform_fee_rate", 0.05)

        logger.info(f"PerformanceBasedSettlement initialized: "
                   f"base_price={self.base_price}, "
                   f"quality_multiplier={self.quality_multiplier}")

    def settle_episode(
        self,
        economic_state: EconomicState,
        quality_score: float,
        task_data: Dict[str, Any],
        participants: List[str]
    ) -> EconomicState:
        """执行结算"""

        # 1. 计算任务价格 (基于质量)
        task_price = self._calculate_task_price(quality_score)

        # 2. 计算平台费用
        platform_fee = task_price * self.platform_fee_rate

        # 3. 计算Worker奖励总额
        total_rewards = task_price - platform_fee

        # 4. 分配奖励给Workers
        reward_allocation = self._allocate_rewards(
            total_rewards, participants, quality_score
        )

        # 5. 更新账本
        updated_state = self._update_ledger(
            economic_state, task_price, reward_allocation, platform_fee
        )

        # 6. 记录日志
        logger.info(f"Settlement completed: price={task_price:.2f}, "
                   f"rewards={total_rewards:.2f}, "
                   f"platform_fee={platform_fee:.2f}")

        return updated_state

    def _calculate_task_price(self, quality_score: float) -> float:
        """
        计算任务价格

        公式: price = base_price * (1 + quality_multiplier * quality_score)
        """
        return self.base_price * (1 + self.quality_multiplier * quality_score)

    def _allocate_rewards(
        self,
        total_rewards: float,
        participants: List[str],
        quality_score: float
    ) -> Dict[str, float]:
        """
        分配奖励给Workers

        策略: 平均分配 (可扩展为基于贡献的分配)
        """
        if not participants:
            return {}

        reward_per_agent = total_rewards / len(participants)
        return {agent_id: reward_per_agent for agent_id in participants}

    def _update_ledger(
        self,
        economic_state: EconomicState,
        task_price: float,
        reward_allocation: Dict[str, float],
        platform_fee: float
    ) -> EconomicState:
        """更新账本"""

        # 复制状态 (避免修改原状态)
        updated_state = economic_state.copy()

        # 用户支付
        updated_state.ledger["user"] -= task_price

        # Workers获得奖励
        for agent_id, reward in reward_allocation.items():
            updated_state.ledger[agent_id] = \
                updated_state.ledger.get(agent_id, 0.0) + reward

        # 平台获得费用
        updated_state.ledger["platform"] = \
            updated_state.ledger.get("platform", 0.0) + platform_fee

        return updated_state

    def cleanup(self) -> None:
        """清理资源"""
        logger.info("PerformanceBasedSettlement cleaned up")
```

---

## 步骤 3: 注册插件

### 注册方式

**方式1: 模块内注册** (推荐)

在实现文件底部注册:

```python
# modules/phase5/settlement_modules.py (底部)

from core.plugin_registry import PluginRegistry

# 注册插件
PluginRegistry.register("performance_based_settlement", PerformanceBasedSettlement)
```

**方式2: 集中注册**

在 `core/plugin_registry.py` 中导入并注册:

```python
# core/plugin_registry.py

from modules.phase5.settlement_modules import PerformanceBasedSettlement

class PluginRegistry:
    _plugins: Dict[str, Type[BasePlugin]] = {
        "performance_based_settlement": PerformanceBasedSettlement,
        # ... 其他插件
    }
```

### 验证注册

```python
# 验证插件是否注册成功
python -c "from core.plugin_registry import PluginRegistry; \
           print('performance_based_settlement' in PluginRegistry._plugins)"
```

---

## 步骤 4: 配置使用

### 配置文件

**文件**: `recipes/TEMPLATE/conf/test_config.yaml`

```yaml
# Phase 5 结算配置
phase5_settlement:
  result_eval:
    plugin: "default_result_eval"  # 使用默认结果评估

  settlement:
    plugin: "performance_based_settlement"  # ⭐ 使用自定义插件
    config:
      base_price: 100.0
      quality_multiplier: 2.0
      platform_fee_rate: 0.05
```

### 配置验证

```bash
# 验证配置文件语法
python -c "import yaml; yaml.safe_load(open('recipes/TEMPLATE/conf/test_config.yaml'))"
```

---

## 步骤 5: 测试验证

### 单元测试

**文件**: `tests/test_phase5/test_custom_settlement.py`

```python
import pytest
from modules.phase5.settlement_modules import PerformanceBasedSettlement
from interfaces.types import EconomicState

def test_performance_based_settlement_high_quality():
    """测试高质量任务的结算"""

    # 1. 准备
    settlement = PerformanceBasedSettlement()
    settlement.initialize({
        "base_price": 100.0,
        "quality_multiplier": 2.0,
        "platform_fee_rate": 0.05
    })

    economic_state = EconomicState(
        ledger={
            "user": 1000.0,
            "agent-001": 50.0,
            "agent-002": 50.0,
            "platform": 0.0
        },
        public_pool=0.0
    )

    # 2. 执行
    updated_state = settlement.settle_episode(
        economic_state=economic_state,
        quality_score=0.8,  # 高质量
        task_data={"id": "task-001"},
        participants=["agent-001", "agent-002"]
    )

    # 3. 验证

    # 任务价格 = 100 * (1 + 2.0 * 0.8) = 260.0
    expected_price = 260.0

    # 平台费用 = 260 * 0.05 = 13.0
    expected_platform_fee = 13.0

    # Worker奖励总额 = 260 - 13 = 247.0
    expected_total_rewards = 247.0

    # 每个Worker奖励 = 247 / 2 = 123.5
    expected_reward_per_agent = 123.5

    # 验证用户余额减少
    assert updated_state.ledger["user"] == pytest.approx(1000.0 - expected_price)

    # 验证Agent余额增加
    assert updated_state.ledger["agent-001"] == pytest.approx(50.0 + expected_reward_per_agent)
    assert updated_state.ledger["agent-002"] == pytest.approx(50.0 + expected_reward_per_agent)

    # 验证平台费用
    assert updated_state.ledger["platform"] == pytest.approx(expected_platform_fee)

    # 验证资金守恒
    total_before = sum(economic_state.ledger.values())
    total_after = sum(updated_state.ledger.values())
    assert total_after == pytest.approx(total_before)


def test_performance_based_settlement_low_quality():
    """测试低质量任务的结算"""

    settlement = PerformanceBasedSettlement()
    settlement.initialize({
        "base_price": 100.0,
        "quality_multiplier": 2.0,
        "platform_fee_rate": 0.05
    })

    economic_state = EconomicState(
        ledger={"user": 1000.0, "agent-001": 50.0, "platform": 0.0},
        public_pool=0.0
    )

    updated_state = settlement.settle_episode(
        economic_state=economic_state,
        quality_score=0.2,  # 低质量
        task_data={"id": "task-002"},
        participants=["agent-001"]
    )

    # 任务价格 = 100 * (1 + 2.0 * 0.2) = 140.0
    expected_price = 140.0

    # 验证价格低于高质量任务
    assert updated_state.ledger["user"] > 1000.0 - 260.0  # 支付更少


def test_performance_based_settlement_no_participants():
    """测试无参与者的边缘情况"""

    settlement = PerformanceBasedSettlement()
    settlement.initialize({
        "base_price": 100.0,
        "quality_multiplier": 2.0,
        "platform_fee_rate": 0.05
    })

    economic_state = EconomicState(
        ledger={"user": 1000.0, "platform": 0.0},
        public_pool=0.0
    )

    updated_state = settlement.settle_episode(
        economic_state=economic_state,
        quality_score=0.8,
        task_data={"id": "task-003"},
        participants=[]  # 无参与者
    )

    # 验证用户仍然支付
    assert updated_state.ledger["user"] < 1000.0

    # 验证平台仍然收到费用
    assert updated_state.ledger["platform"] > 0.0
```

### 运行测试

```bash
# 运行单个测试文件
pytest tests/test_phase5/test_custom_settlement.py -v

# 运行特定测试
pytest tests/test_phase5/test_custom_settlement.py::test_performance_based_settlement_high_quality -v

# 运行所有Phase 5测试
pytest tests/test_phase5/ -v
```

### 集成测试

```bash
# 使用自定义插件运行完整实验
cd recipes/TEMPLATE
python -m oikos.cli run --mode test \
  --config conf/modules.yaml \
  --config conf/economic.yaml \
  --config conf/test_config.yaml \
  --max_episodes 5
```

---

## 完整示例

### 示例: 自定义排名插件 (Phase 6)

#### 1. 定义接口 (如果需要)

```python
# interfaces/phase6_feedback/base.py (已存在,跳过)
```

#### 2. 实现插件

```python
# modules/phase6/feedback_modules.py

from core.plugin_system import BasePlugin
from interfaces.phase6_feedback.base import AgentEvalInterface
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class RecentSuccessRateRanking(BasePlugin, AgentEvalInterface):
    """
    基于近期成功率的排名算法

    特点:
    - 只考虑最近N次任务
    - 成功率 = 成功次数 / 总次数
    - 简单易理解

    配置参数:
    - window_size (int): 考虑最近N次任务,默认10
    """

    def initialize(self, config: Dict) -> None:
        self.window_size = config.get("window_size", 10)
        self.agent_history: Dict[str, List[float]] = {}  # agent_id -> [scores]

    def evaluate_agents(
        self,
        agents: List[str],
        episode_results: Dict[str, float]
    ) -> Dict[str, float]:
        """
        评估并排名Agents

        Args:
            agents: Agent ID列表
            episode_results: 本轮结果 {agent_id: quality_score}

        Returns:
            agent_ranks: {agent_id: rank_score}
        """

        # 1. 更新历史记录
        for agent_id in agents:
            if agent_id not in self.agent_history:
                self.agent_history[agent_id] = []

            # 添加本轮结果
            if agent_id in episode_results:
                self.agent_history[agent_id].append(episode_results[agent_id])

            # 保持窗口大小
            if len(self.agent_history[agent_id]) > self.window_size:
                self.agent_history[agent_id] = \
                    self.agent_history[agent_id][-self.window_size:]

        # 2. 计算排名分数
        agent_ranks = {}
        for agent_id in agents:
            if agent_id in self.agent_history and self.agent_history[agent_id]:
                # 成功率 = 平均质量分数
                success_rate = sum(self.agent_history[agent_id]) / \
                              len(self.agent_history[agent_id])
                agent_ranks[agent_id] = success_rate
            else:
                # 新Agent默认0.5
                agent_ranks[agent_id] = 0.5

        logger.info(f"Agents ranked (window={self.window_size}): {agent_ranks}")

        return agent_ranks
```

#### 3. 注册插件

```python
# modules/phase6/feedback_modules.py (底部)

from core.plugin_registry import PluginRegistry
PluginRegistry.register("recent_success_rate_ranking", RecentSuccessRateRanking)
```

#### 4. 配置使用

```yaml
# recipes/TEMPLATE/conf/test_config.yaml

phase6_feedback:
  agent_eval:
    plugin: "recent_success_rate_ranking"
    config:
      window_size: 10
```

#### 5. 测试

```python
# tests/test_phase6/test_recent_success_ranking.py

import pytest
from modules.phase6.feedback_modules import RecentSuccessRateRanking

def test_recent_success_rate_ranking():
    """测试近期成功率排名"""

    ranking = RecentSuccessRateRanking()
    ranking.initialize({"window_size": 3})

    agents = ["agent-001", "agent-002"]

    # Episode 1: agent-001高质量, agent-002低质量
    ranks1 = ranking.evaluate_agents(
        agents, {"agent-001": 0.9, "agent-002": 0.3}
    )
    assert ranks1["agent-001"] > ranks1["agent-002"]

    # Episode 2: agent-002提升
    ranks2 = ranking.evaluate_agents(
        agents, {"agent-001": 0.8, "agent-002": 0.7}
    )
    assert ranks2["agent-001"] > ranks2["agent-002"]

    # Episode 3: agent-002超越
    ranks3 = ranking.evaluate_agents(
        agents, {"agent-001": 0.5, "agent-002": 0.9}
    )

    # Episode 4: 窗口滑动,早期低分被移出
    ranks4 = ranking.evaluate_agents(
        agents, {"agent-001": 0.5, "agent-002": 0.9}
    )

    # agent-002的排名应该提升 (窗口内 [0.7, 0.9, 0.9])
    assert ranks4["agent-002"] > ranks4["agent-001"]
```

---

## 最佳实践

### 1. 接口设计

✅ **应该**:
- 使用类型提示 (`typing`)
- 编写详细的docstring
- 定义清晰的输入输出契约
- 考虑异常情况

❌ **不应该**:
- 在接口中实现逻辑
- 使用模糊的参数类型 (`Any`)
- 忽略边缘情况

### 2. 插件实现

✅ **应该**:
- 遵循单一职责原则
- 使用私有方法组织代码 (`_method_name`)
- 记录日志 (使用 `logging`)
- 验证输入参数
- 处理异常

❌ **不应该**:
- 在 `initialize()` 中执行耗时操作
- 修改输入参数 (使用 `.copy()`)
- 忽略资源清理 (`cleanup()`)
- 硬编码配置值

### 3. 配置管理

✅ **应该**:
- 提供默认值 (`config.get(key, default)`)
- 验证配置参数
- 文档化所有配置选项

❌ **不应该**:
- 使用魔法数字
- 忽略配置错误

### 4. 测试

✅ **应该**:
- 编写单元测试 (覆盖率 >80%)
- 测试边缘情况
- 测试异常处理
- 使用 `pytest.approx()` 比较浮点数

❌ **不应该**:
- 跳过测试
- 只测试正常路径

### 5. 文档

✅ **应该**:
- 编写清晰的类和方法docstring
- 提供使用示例
- 说明配置参数
- 记录已知限制

---

## 常见错误

### 错误 1: 忘记注册插件

**症状**:
```
KeyError: 'your_plugin_name'
```

**解决**:
```python
# 在模块底部添加
from core.plugin_registry import PluginRegistry
PluginRegistry.register("your_plugin_name", YourPluginClass)
```

---

### 错误 2: 接口方法签名不匹配

**症状**:
```
TypeError: your_method() missing 1 required positional argument
```

**解决**:
确保实现方法的签名与接口完全一致:

```python
# 接口定义
def your_method(self, param1: Type1, param2: Type2) -> ReturnType:

# 实现 (必须完全匹配)
def your_method(self, param1: Type1, param2: Type2) -> ReturnType:
```

---

### 错误 3: 修改输入参数

**症状**:
其他插件或Phase看到意外的状态变化

**解决**:
使用 `.copy()` 避免修改原始对象:

```python
# ❌ 错误: 直接修改
def process(self, economic_state: EconomicState) -> EconomicState:
    economic_state.ledger["user"] -= 100  # 修改了原始对象!
    return economic_state

# ✅ 正确: 复制后修改
def process(self, economic_state: EconomicState) -> EconomicState:
    updated_state = economic_state.copy()  # 创建副本
    updated_state.ledger["user"] -= 100
    return updated_state
```

---

### 错误 4: 忘记调用父类 `__init__`

**症状**:
```
AttributeError: 'YourPlugin' object has no attribute '...'
```

**解决**:
如果重写 `__init__`,调用父类初始化:

```python
class YourPlugin(BasePlugin, YourInterface):
    def __init__(self):
        super().__init__()  # ⭐ 调用父类__init__
        # 你的初始化代码
```

**最佳实践**: 使用 `initialize()` 而不是 `__init__`

---

### 错误 5: 配置参数类型错误

**症状**:
```
TypeError: unsupported operand type(s) for *: 'str' and 'float'
```

**解决**:
验证和转换配置参数类型:

```python
def initialize(self, config: Dict[str, Any]) -> None:
    # ❌ 错误: 直接使用,可能是字符串
    self.base_price = config.get("base_price", 100.0)

    # ✅ 正确: 验证类型
    base_price = config.get("base_price", 100.0)
    if not isinstance(base_price, (int, float)):
        raise ValueError(f"base_price must be numeric, got {type(base_price)}")
    self.base_price = float(base_price)
```

---

## 高级话题

### 1. 插件依赖其他插件

某些插件可能依赖其他插件的输出。

**示例**: Phase 6 排名插件依赖 Phase 5 的结果

```python
class AdvancedRanking(BasePlugin, AgentEvalInterface):
    """需要访问结算结果的排名插件"""

    def initialize(self, config: Dict) -> None:
        # 获取其他插件的引用 (通过Factory)
        from core.plugin_factory import PluginFactory
        self.factory = PluginFactory.get_instance()

    def evaluate_agents(self, agents, episode_results):
        # 访问Phase 5的结算插件
        settlement_plugin = self.factory.get_plugin("phase5_settlement")
        settlement_data = settlement_plugin.get_last_settlement()

        # 基于结算数据进行排名
        # ...
```

---

### 2. 状态持久化

某些插件需要在Episodes间保持状态。

**方式1: 使用实例变量**
```python
class StatefulPlugin(BasePlugin, YourInterface):
    def initialize(self, config: Dict) -> None:
        self.episode_count = 0
        self.historical_data = []

    def process(self, data):
        self.episode_count += 1
        self.historical_data.append(data)
        # ...
```

**方式2: 使用外部存储**
```python
import json

class PersistentPlugin(BasePlugin, YourInterface):
    def initialize(self, config: Dict) -> None:
        self.state_file = config.get("state_file", "plugin_state.json")
        self._load_state()

    def _load_state(self):
        try:
            with open(self.state_file, "r") as f:
                self.state = json.load(f)
        except FileNotFoundError:
            self.state = {}

    def _save_state(self):
        with open(self.state_file, "w") as f:
            json.dump(self.state, f)

    def cleanup(self):
        self._save_state()
```

---

### 3. 异步插件

如果插件需要执行异步操作 (如HTTP请求),使用 `async/await`。

```python
import asyncio
from core.plugin_system import BaseAsyncPlugin

class AsyncPlugin(BaseAsyncPlugin, YourInterface):
    """异步插件示例"""

    async def initialize(self, config: Dict) -> None:
        self.api_url = config.get("api_url")

    async def process(self, data):
        # 异步HTTP请求
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(self.api_url, json=data) as resp:
                result = await resp.json()
                return result
```

**注意**: 主运行脚本需要支持异步执行。

---

### 4. 插件热重载

开发时,支持插件热重载避免重启进程。

```python
# core/plugin_registry.py

class PluginRegistry:
    @classmethod
    def reload_plugin(cls, plugin_name: str) -> None:
        """重新加载插件"""
        import importlib
        import sys

        # 查找插件模块
        plugin_class = cls._plugins.get(plugin_name)
        if not plugin_class:
            raise ValueError(f"Plugin {plugin_name} not found")

        module_name = plugin_class.__module__
        if module_name in sys.modules:
            # 重新加载模块
            importlib.reload(sys.modules[module_name])

            # 重新注册
            # (假设模块重新加载时会自动注册)
```

**使用**:
```python
from core.plugin_registry import PluginRegistry

# 修改插件代码后
PluginRegistry.reload_plugin("your_plugin_name")
```

---

## 总结

创建 Oikos 插件的 5 个步骤:

1. ✅ **定义接口** - 明确职责和契约
2. ✅ **实现插件** - 遵循最佳实践
3. ✅ **注册插件** - 添加到 PluginRegistry
4. ✅ **配置使用** - 在 YAML 中指定插件
5. ✅ **测试验证** - 单元测试 + 集成测试

通过插件系统,Oikos 实现了高度的可扩展性和灵活性,让研究人员可以轻松实验不同的机制设计。

---

**下一步**: 👉 [04-debugging.md](04-debugging.md) - 调试技巧
