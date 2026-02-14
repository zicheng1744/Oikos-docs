# 代码结构

本文档介绍 Oikos 项目的代码组织结构,帮助开发者快速定位和理解各模块。

---

## 目录

- [项目根目录](#项目根目录)
- [核心模块详解](#核心模块详解)
- [目录依赖关系](#目录依赖关系)
- [代码导航指南](#代码导航指南)
- [命名约定](#命名约定)

---

## 项目根目录

```
Holos-Oikos-Dev/
├── services/               # 运行时服务
├── core/                   # 核心系统
├── interfaces/             # 接口定义
├── modules/                # 默认实现
├── recipes/                # 配置和场景
├── tests/                  # 测试文件
├── docs/                   # 文档系统
├── requirements.txt        # 依赖清单
├── setup.py                # 安装脚本
└── README.md               # 项目介绍
```

### 快速定位

| 你想要... | 去哪里 | 示例文件 |
|---------|-------|---------|
| 运行实验 | `cli.py` | 统一 CLI 入口 |
| 理解接口 | `interfaces/` | `phase5_settlement/base.py` |
| 查看实现 | `modules/` | `phase5/settlement_modules.py` |
| 修改配置 | `recipes/TEMPLATE/conf/` | `test_config.yaml` |
| 添加测试 | `tests/` | `test_phase5.py` |
| 理解插件系统 | `core/` | `plugin_system.py` |

---

## 核心模块详解

### 1. CLI 与入口

**职责**: 统一运行入口

```
cli.py                      # 主 CLI 入口
recipes/TEMPLATE/run_*.sh   # 兼容 wrapper（内部委托 CLI）
```

**关键说明**:
- 推荐入口：`python -m oikos.cli <chat|train|test|run> ...`
- 不建议直接把 `run_experiment.py` 当用户入口。

**示例代码**:
```python
# CLI（简化版）
# python -m oikos.cli test --recipe TEMPLATE --max_episodes 5
```

---

### 2. core/ - 核心系统

**职责**: 提供插件系统、配置管理、注册表、工厂等核心功能

```
core/
├── plugin_system.py        # 插件基类和生命周期
├── plugin_registry.py      # 插件注册表
├── plugin_factory.py       # 插件工厂
├── config_manager.py       # 配置管理器
├── phase_framework.py      # Phase框架基类
└── telemetry.py            # 遥测和数据采集
```

**关键组件**:

#### PluginSystem (plugin_system.py)
```python
class BasePlugin(ABC):
    """所有插件的基类"""

    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """初始化插件"""
        pass

    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        """执行插件主要逻辑"""
        pass

    def cleanup(self) -> None:
        """清理资源"""
        pass
```

#### PluginRegistry (plugin_registry.py)
```python
class PluginRegistry:
    """插件注册表,管理所有可用插件"""

    _plugins: Dict[str, Type[BasePlugin]] = {}

    @classmethod
    def register(cls, name: str, plugin_class: Type[BasePlugin]) -> None:
        """注册插件"""
        cls._plugins[name] = plugin_class

    @classmethod
    def get(cls, name: str) -> Type[BasePlugin]:
        """获取插件类"""
        return cls._plugins.get(name)
```

#### PluginFactory (plugin_factory.py)
```python
class PluginFactory:
    """插件工厂,根据配置创建插件实例"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def create_plugin(self, plugin_name: str, plugin_config: Dict) -> BasePlugin:
        """创建插件实例"""
        plugin_class = PluginRegistry.get(plugin_name)
        if not plugin_class:
            raise ValueError(f"Plugin {plugin_name} not found")

        plugin = plugin_class()
        plugin.initialize(plugin_config)
        return plugin
```

---

### 3. interfaces/ - 接口定义

**职责**: 定义7个Phase的抽象接口

```
interfaces/
├── phase1_initialization/
│   ├── base.py             # Phase 1接口定义
│   └── types.py            # 类型定义
├── phase2_creation/
│   ├── base.py
│   └── types.py
├── phase3_allocation/
├── phase4_execution/
├── phase5_settlement/
│   ├── base.py             # ⭐ 关键:结算接口
│   │   ├── ResultEvalInterface
│   │   └── SettlementInterface
│   └── types.py            # O1-O3/I1-I5类型定义
├── phase6_feedback/
│   ├── base.py             # ⭐ 关键:排名接口
│   └── types.py
└── phase7_pool_management/
```

**接口设计模式**:

每个Phase接口文件通常包含:
```python
# interfaces/phase5_settlement/base.py (示例结构)

from abc import ABC, abstractmethod
from typing import Dict, Any

class ResultEvalInterface(ABC):
    """结果评估接口"""

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
            result: 执行结果

        Returns:
            quality_score: 质量分数 [0.0, 1.0]
        """
        pass

class SettlementInterface(ABC):
    """结算接口"""

    @abstractmethod
    def settle_episode(
        self,
        economic_state: EconomicState,
        quality_score: float,
        participants: List[str]
    ) -> EconomicState:
        """
        执行结算,更新账本

        Args:
            economic_state: 当前经济状态
            quality_score: 任务质量分数
            participants: 参与者列表

        Returns:
            updated_economic_state: 更新后的经济状态
        """
        pass
```

---

### 4. modules/ - 默认实现

**职责**: 提供7个Phase的默认实现

```
modules/
├── phase1/
│   └── init_modules.py
├── phase2/
│   └── creation_modules.py
├── phase3/
│   └── allocation_modules.py
├── phase4/
│   └── execution_modules.py
├── phase5/
│   └── settlement_modules.py    # ⭐ 9种结算机制实现
├── phase6/
│   └── feedback_modules.py      # ⭐ 10种排名算法实现
└── phase7/
    └── pool_modules.py
```

**实现模式**:

每个模块实现对应接口:
```python
# modules/phase5/settlement_modules.py (示例)

from interfaces.phase5_settlement.base import SettlementInterface
from core.plugin_system import BasePlugin

class DefaultSettlement(BasePlugin, SettlementInterface):
    """默认结算实现 - 固定价格"""

    def initialize(self, config: Dict[str, Any]) -> None:
        self.base_price = config.get("base_price", 100.0)

    def settle_episode(
        self,
        economic_state: EconomicState,
        quality_score: float,
        participants: List[str]
    ) -> EconomicState:
        # 实现结算逻辑
        # ...
        return updated_economic_state

# 注册插件
from core.plugin_registry import PluginRegistry
PluginRegistry.register("default_settlement", DefaultSettlement)
```

---

### 5. recipes/ - 配置和场景

**职责**: 存储实验配置和场景定义

```
recipes/
├── TEMPLATE/               # 标准模板
│   ├── conf/
│   │   ├── test_config.yaml      # Test模式配置
│   │   ├── chat_config.yaml      # Chat模式配置
│   │   └── train_config.yaml     # Train模式配置
│   ├── datasets/
│   │   └── sample_dataset.jsonl  # 示例数据集
│   └── outputs/                  # 输出目录
└── custom_experiments/     # 自定义实验
```

**配置文件结构**:
```yaml
# recipes/TEMPLATE/conf/test_config.yaml (简化版)

# Phase 1: 初始化
phase1_init:
  participants:
    plugin: "default_participant_init"
    config:
      num_agents: 10

  economic_system:
    plugin: "aether_economic_init"
    config:
      initial_agent_balance: 100.0

# Phase 5: 结算
phase5_settlement:
  result_eval:
    plugin: "default_result_eval"

  settlement:
    plugin: "aether_second_price_contribution"  # 选择插件
    config:
      base_price: 100.0
```

---

### 6. tests/ - 测试文件

**职责**: 单元测试和集成测试

```
tests/
├── test_core/
│   ├── test_plugin_system.py
│   └── test_config_manager.py
├── test_phase1/
├── test_phase5/
│   ├── test_settlement.py
│   └── test_result_eval.py
└── test_integration/
    └── test_end_to_end.py
```

**测试示例**:
```python
# tests/test_phase5/test_settlement.py

import pytest
from modules.phase5.settlement_modules import DefaultSettlement
from interfaces.phase5_settlement.types import EconomicState

def test_default_settlement():
    """测试默认结算机制"""

    # 准备
    settlement = DefaultSettlement()
    settlement.initialize({"base_price": 100.0})

    economic_state = EconomicState(
        ledger={"user": 1000.0, "agent-001": 50.0},
        public_pool=0.0
    )

    # 执行
    updated_state = settlement.settle_episode(
        economic_state=economic_state,
        quality_score=0.8,
        participants=["agent-001"]
    )

    # 验证
    assert updated_state.ledger["user"] < 1000.0  # 用户支付
    assert updated_state.ledger["agent-001"] > 50.0  # Agent获得奖励
```

---

### 7. docs/ - 文档系统

```
docs/
├── 01-getting-started/     # 快速开始
├── 02-user-guide/          # 用户指南
├── 03-architecture/        # 架构文档
├── 04-phase-modules/       # Phase详解
├── 05-developer-guide/     # 开发者指南 (本文档)
├── 06-api-reference/       # API参考
└── 07-demos-and-tutorials/ # 演示教程
```

---

## 目录依赖关系

```
依赖层次 (从底向上):

[4] bin/                    # 应用层 - 使用所有其他模块
     ↑
[3] modules/                # 实现层 - 依赖 interfaces/ 和 core/
     ↑
[2] interfaces/             # 接口层 - 定义抽象接口
     ↑
[1] core/                   # 核心层 - 最底层,无依赖
```

**依赖规则**:

✅ **允许的依赖方向**:
- `bin/` → `modules/`, `core/`, `interfaces/`
- `modules/` → `interfaces/`, `core/`
- `interfaces/` → `core/`
- `tests/` → 所有模块

❌ **禁止的依赖方向**:
- `core/` → `interfaces/`, `modules/`, `bin/`
- `interfaces/` → `modules/`, `bin/`
- `modules/` → `bin/`

---

## 代码导航指南

### 场景1: 理解某个Phase如何工作

**步骤**:
1. 阅读文档: `docs/04-phase-modules/phase{N}-*.md`
2. 查看接口: `interfaces/phase{N}_*/base.py`
3. 查看实现: `modules/phase{N}/*.py`
4. 运行示例: `recipes/TEMPLATE/`

**示例: 理解Phase 5结算机制**
```bash
# 1. 阅读文档
cat docs/04-phase-modules/phase5-settlement.md

# 2. 查看接口定义
cat interfaces/phase5_settlement/base.py

# 3. 查看默认实现
cat modules/phase5/settlement_modules.py

# 4. 查看配置示例
cat recipes/TEMPLATE/conf/test_config.yaml | grep -A 10 "phase5_settlement"
```

---

### 场景2: 添加新功能

**步骤**:
1. 确定功能属于哪个Phase
2. 在 `interfaces/phase{N}_*/` 定义接口 (如果需要新接口)
3. 在 `modules/phase{N}/` 实现功能
4. 在 `core/plugin_registry.py` 注册插件
5. 在 `recipes/` 添加配置示例
6. 在 `tests/` 添加测试

---

### 场景3: 调试问题

**调试路径**:

1. **配置问题** → `recipes/TEMPLATE/conf/`
2. **插件加载失败** → `core/plugin_registry.py`
3. **Phase执行错误** → `modules/phase{N}/`
4. **接口不匹配** → `interfaces/phase{N}_*/base.py`
5. **运行入口问题** → `cli.py` / `recipes/TEMPLATE/run_*.sh`

**常用调试命令**:
```bash
# 检查插件注册
python -c "from core.plugin_registry import PluginRegistry; print(PluginRegistry._plugins.keys())"

# 验证配置文件
python -c "from core.config_manager import ConfigManager; ConfigManager.validate('recipes/TEMPLATE/conf/test_config.yaml')"

# 运行单个Phase测试
pytest tests/test_phase5/ -v
```

---

## 命名约定

### 文件命名

| 类型 | 约定 | 示例 |
|-----|------|------|
| 模块文件 | `{phase}_modules.py` | `settlement_modules.py` |
| 接口文件 | `base.py` | `interfaces/phase5_settlement/base.py` |
| 类型文件 | `types.py` | `interfaces/phase5_settlement/types.py` |
| 测试文件 | `test_{module}.py` | `test_settlement.py` |
| 配置文件 | `{mode}_config.yaml` | `test_config.yaml` |

### 类命名

| 类型 | 约定 | 示例 |
|-----|------|------|
| 接口 | `{Name}Interface` | `SettlementInterface` |
| 实现 | `{Mechanism}{Name}` | `AetherSecondPriceSettlement` |
| 基类 | `Base{Name}` | `BasePlugin` |
| 工具类 | `{Name}Manager/Helper` | `ConfigManager` |

### 变量命名

| 类型 | 约定 | 示例 |
|-----|------|------|
| 配置 | `snake_case` | `base_price`, `num_agents` |
| 常量 | `UPPER_CASE` | `MAX_EPISODES`, `DEFAULT_PORT` |
| 私有方法 | `_method_name` | `_resolve_task_price()` |
| Phase名 | `phase{N}_{name}` | `phase5_settlement` |

---

## 快速参考

### 添加新插件的完整路径

1. **定义接口** (如果需要):
   - 文件: `interfaces/phase{N}_{name}/base.py`
   - 类名: `{Name}Interface`

2. **实现插件**:
   - 文件: `modules/phase{N}/{name}_modules.py`
   - 类名: `{Mechanism}{Name}`
   - 继承: `BasePlugin, {Name}Interface`

3. **注册插件**:
   - 文件: `modules/phase{N}/{name}_modules.py` (底部)
   - 代码: `PluginRegistry.register("plugin_name", PluginClass)`

4. **配置插件**:
   - 文件: `recipes/TEMPLATE/conf/test_config.yaml`
   - 位置: `phase{N}_{name}` 部分

5. **测试插件**:
   - 文件: `tests/test_phase{N}/test_{name}.py`

6. **文档化**:
   - 文件: `docs/04-phase-modules/phase{N}-{name}.md`

---

## 总结

Oikos 代码结构遵循清晰的分层架构:

✅ **core/** - 核心系统 (插件、配置)
✅ **interfaces/** - 抽象接口 (契约定义)
✅ **modules/** - 默认实现 (插件实现)
✅ **bin/** - 可执行脚本 (入口点)
✅ **recipes/** - 配置场景 (实验定义)
✅ **tests/** - 测试文件 (质量保证)

通过这种结构,Oikos 实现了高度的可扩展性和可维护性。

---

**下一步**: 👉 [03-creating-plugins.md](03-creating-plugins.md) - 创建自定义插件
