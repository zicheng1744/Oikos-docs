# 测试指南

本文档介绍 Oikos 项目的测试策略、框架和最佳实践。

---

## 目录

- [测试概述](#测试概述)
- [测试框架](#测试框架)
- [编写测试](#编写测试)
- [运行测试](#运行测试)
- [测试覆盖率](#测试覆盖率)
- [持续集成](#持续集成)

---

## 测试概述

### 测试类型

Oikos 使用多层测试策略:

```
[5] 端到端测试 (E2E)         - 完整实验流程
     ↑
[4] 集成测试 (Integration)   - 多个模块协作
     ↑
[3] 功能测试 (Functional)    - Phase完整功能
     ↑
[2] 单元测试 (Unit)          - 单个函数/类
     ↑
[1] 静态检查 (Static)        - 类型、语法
```

### 测试目录结构

```
tests/
├── unit/                   # 单元测试
│   ├── test_core/
│   ├── test_phase1/
│   ├── test_phase5/
│   └── test_phase6/
├── integration/            # 集成测试
│   ├── test_phase_pipeline.py
│   └── test_economic_flow.py
├── functional/             # 功能测试
│   ├── test_settlement_mechanisms.py
│   └── test_ranking_algorithms.py
├── e2e/                    # 端到端测试
│   └── test_full_experiment.py
├── conftest.py             # Pytest fixtures
└── test_utils.py           # 测试工具
```

---

## 测试框架

### Pytest

Oikos 使用 **pytest** 作为主要测试框架。

**安装**:
```bash
pip install pytest pytest-cov pytest-mock
```

**为什么选择pytest?**
- ✅ 简洁的断言语法
- ✅ 强大的fixture系统
- ✅ 丰富的插件生态
- ✅ 详细的错误报告

---

### 基本测试结构

```python
# tests/unit/test_phase5/test_settlement.py

import pytest
from modules.phase5.settlement_modules import DefaultSettlement
from interfaces.types import EconomicState

def test_default_settlement():
    """测试默认结算机制"""

    # 1. 准备 (Arrange)
    settlement = DefaultSettlement()
    settlement.initialize({"base_price": 100.0})

    economic_state = EconomicState(
        ledger={"user": 1000.0, "agent-001": 50.0},
        public_pool=0.0
    )

    # 2. 执行 (Act)
    updated_state = settlement.settle_episode(
        economic_state=economic_state,
        quality_score=0.8,
        task_data={"id": "task-001"},
        participants=["agent-001"]
    )

    # 3. 验证 (Assert)
    assert updated_state.ledger["user"] < 1000.0  # 用户支付
    assert updated_state.ledger["agent-001"] > 50.0  # Agent获得奖励

    # 验证资金守恒
    total_before = sum(economic_state.ledger.values())
    total_after = sum(updated_state.ledger.values())
    assert total_after == pytest.approx(total_before)
```

---

## 编写测试

### 1. 单元测试

**目标**: 测试单个函数或类方法

**示例: 测试价格计算**

```python
# tests/unit/test_phase5/test_pricing.py

import pytest
from modules.phase5.settlement_modules import PerformanceBasedSettlement

class TestPricing:
    """测试任务定价功能"""

    @pytest.fixture
    def settlement(self):
        """创建结算实例"""
        s = PerformanceBasedSettlement()
        s.initialize({
            "base_price": 100.0,
            "quality_multiplier": 2.0
        })
        return s

    def test_calculate_price_high_quality(self, settlement):
        """测试高质量任务定价"""
        price = settlement._calculate_task_price(quality_score=0.9)
        expected = 100.0 * (1 + 2.0 * 0.9)  # = 280.0
        assert price == pytest.approx(expected)

    def test_calculate_price_low_quality(self, settlement):
        """测试低质量任务定价"""
        price = settlement._calculate_task_price(quality_score=0.1)
        expected = 100.0 * (1 + 2.0 * 0.1)  # = 120.0
        assert price == pytest.approx(expected)

    def test_calculate_price_zero_quality(self, settlement):
        """测试零质量任务定价"""
        price = settlement._calculate_task_price(quality_score=0.0)
        expected = 100.0  # base_price
        assert price == pytest.approx(expected)

    @pytest.mark.parametrize("quality,expected", [
        (0.0, 100.0),
        (0.5, 200.0),
        (1.0, 300.0)
    ])
    def test_calculate_price_parametrized(self, settlement, quality, expected):
        """参数化测试"""
        price = settlement._calculate_task_price(quality_score=quality)
        assert price == pytest.approx(expected)
```

---

### 2. 集成测试

**目标**: 测试多个模块协作

**示例: 测试Phase 5-6协作**

```python
# tests/integration/test_settlement_feedback_integration.py

import pytest
from modules.phase5.settlement_modules import AetherSecondPriceSettlement
from modules.phase6.feedback_modules import AetherAgentEval
from interfaces.types import EconomicState

def test_settlement_updates_ranking():
    """测试结算结果影响排名"""

    # 1. 准备
    settlement = AetherSecondPriceSettlement()
    settlement.initialize({"base_price": 100.0})

    ranking = AetherAgentEval()
    ranking.initialize({})

    economic_state = EconomicState(
        ledger={"user": 1000.0, "agent-001": 50.0, "agent-002": 50.0},
        public_pool=0.0
    )

    # 2. Episode 1: agent-001高质量
    updated_state_1 = settlement.settle_episode(
        economic_state, 0.9, {}, ["agent-001", "agent-002"]
    )

    ranks_1 = ranking.evaluate_agents(
        ["agent-001", "agent-002"],
        {"agent-001": 0.9, "agent-002": 0.3}
    )

    # 3. Episode 2: agent-002提升
    updated_state_2 = settlement.settle_episode(
        updated_state_1, 0.8, {}, ["agent-001", "agent-002"]
    )

    ranks_2 = ranking.evaluate_agents(
        ["agent-001", "agent-002"],
        {"agent-001": 0.8, "agent-002": 0.8}
    )

    # 4. 验证排名变化
    assert ranks_1["agent-001"] > ranks_1["agent-002"]  # Episode 1
    # Episode 2: 排名接近
    assert abs(ranks_2["agent-001"] - ranks_2["agent-002"]) < 0.2
```

---

### 3. 功能测试

**目标**: 测试完整的Phase功能

**示例: 测试Phase 5完整流程**

```python
# tests/functional/test_phase5_full.py

import pytest
from core.plugin_factory import PluginFactory
from interfaces.types import EconomicState

def test_phase5_full_pipeline():
    """测试Phase 5完整流程: 结果评估 → 结算 → 账本更新"""

    # 1. 加载配置
    config = {
        "phase5_settlement": {
            "result_eval": {
                "plugin": "default_result_eval"
            },
            "settlement": {
                "plugin": "aether_second_price_contribution",
                "config": {"base_price": 100.0}
            }
        }
    }

    # 2. 创建插件
    factory = PluginFactory(config)
    result_eval = factory.create_plugin("phase5_settlement.result_eval")
    settlement = factory.create_plugin("phase5_settlement.settlement")

    # 3. 准备任务和结果
    task = {"id": "task-001", "input": "2+2=?", "target": "4"}
    result = {"output": "4", "reasoning": "..."}

    # 4. 评估结果
    quality_score = result_eval.evaluate_result(task, result)
    assert 0.0 <= quality_score <= 1.0

    # 5. 执行结算
    economic_state = EconomicState(
        ledger={"user": 1000.0, "agent-001": 50.0, "agent-002": 50.0},
        public_pool=0.0
    )

    updated_state = settlement.settle_episode(
        economic_state, quality_score, task, ["agent-001", "agent-002"]
    )

    # 6. 验证结果
    assert updated_state.ledger["user"] < 1000.0  # 用户支付
    assert sum(updated_state.ledger.values()) == \
           pytest.approx(sum(economic_state.ledger.values()))  # 守恒
```

---

### 4. 端到端测试

**目标**: 测试完整的实验流程

**示例: 测试完整实验**

```python
# tests/e2e/test_full_experiment.py

import pytest
import subprocess
import json
import os

def test_full_experiment_e2e():
    """端到端测试: 运行完整实验"""

    # 1. 准备测试配置
    test_config = "tests/fixtures/test_e2e_config.yaml"
    output_dir = "tests/outputs/e2e_test"

    # 2. 运行实验
    result = subprocess.run(
        [
            "python", "bin/run_experiment.py",
            "--config", test_config,
            "--max_episodes", "5",
            "--output_dir", output_dir
        ],
        capture_output=True,
        text=True,
        timeout=300  # 5分钟超时
    )

    # 3. 验证运行成功
    assert result.returncode == 0, f"Experiment failed: {result.stderr}"

    # 4. 验证输出文件
    assert os.path.exists(f"{output_dir}/results.json")
    assert os.path.exists(f"{output_dir}/economic_state.json")
    assert os.path.exists(f"{output_dir}/economic_audit.json")

    # 5. 验证结果内容
    with open(f"{output_dir}/results.json") as f:
        results = json.load(f)
        assert "avg_quality_score" in results
        assert results["num_episodes"] == 5

    # 6. 验证资金守恒
    with open(f"{output_dir}/economic_audit.json") as f:
        audit = json.load(f)
        assert audit["fund_conservation_passed"] is True
```

---

## 运行测试

### 基本命令

```bash
# 运行所有测试
pytest

# 运行特定目录
pytest tests/unit/test_phase5/

# 运行特定文件
pytest tests/unit/test_phase5/test_settlement.py

# 运行特定测试
pytest tests/unit/test_phase5/test_settlement.py::test_default_settlement

# 显示详细输出
pytest -v

# 显示更详细输出
pytest -vv

# 显示print输出
pytest -s

# 失败时立即停止
pytest -x

# 只运行上次失败的测试
pytest --lf

# 运行匹配关键词的测试
pytest -k "settlement"

# 并行运行 (需要 pytest-xdist)
pytest -n 4  # 使用4个进程
```

---

### 使用标记 (Markers)

**定义标记**:
```python
# tests/unit/test_phase5/test_settlement.py

import pytest

@pytest.mark.slow
def test_long_running_settlement():
    """耗时测试"""
    # ... 长时间运行的测试

@pytest.mark.unit
def test_quick_settlement():
    """快速单元测试"""
    # ... 快速测试

@pytest.mark.integration
def test_settlement_integration():
    """集成测试"""
    # ...
```

**配置标记** `pytest.ini`:
```ini
[pytest]
markers =
    slow: 标记耗时测试
    unit: 单元测试
    integration: 集成测试
    e2e: 端到端测试
```

**运行特定标记**:
```bash
# 只运行快速测试 (排除slow)
pytest -m "not slow"

# 只运行单元测试
pytest -m unit

# 运行单元测试和集成测试
pytest -m "unit or integration"
```

---

### Fixtures

Fixtures 提供测试数据和环境设置。

**定义Fixture**:
```python
# tests/conftest.py

import pytest
from interfaces.types import EconomicState

@pytest.fixture
def economic_state():
    """提供初始经济状态"""
    return EconomicState(
        ledger={
            "user": 1000.0,
            "agent-001": 50.0,
            "agent-002": 50.0,
            "platform": 0.0
        },
        public_pool=0.0,
        insurance_pool=0.0
    )

@pytest.fixture
def settlement_plugin():
    """提供结算插件"""
    from modules.phase5.settlement_modules import DefaultSettlement
    settlement = DefaultSettlement()
    settlement.initialize({"base_price": 100.0})
    return settlement

@pytest.fixture(scope="session")
def test_config():
    """提供测试配置 (session级别,只创建一次)"""
    return {
        "base_price": 100.0,
        "num_agents": 10
    }
```

**使用Fixture**:
```python
# tests/unit/test_phase5/test_settlement.py

def test_settlement(economic_state, settlement_plugin):
    """使用fixtures"""
    updated_state = settlement_plugin.settle_episode(
        economic_state, 0.8, {}, ["agent-001"]
    )
    assert updated_state.ledger["user"] < 1000.0
```

**Fixture作用域**:
- `function` (默认) - 每个测试函数执行一次
- `class` - 每个测试类执行一次
- `module` - 每个模块执行一次
- `session` - 整个测试会话执行一次

---

## 测试覆盖率

### 使用 pytest-cov

**安装**:
```bash
pip install pytest-cov
```

**运行覆盖率测试**:
```bash
# 生成覆盖率报告
pytest --cov=modules --cov=core

# 生成HTML报告
pytest --cov=modules --cov=core --cov-report=html

# 只显示未覆盖的行
pytest --cov=modules --cov=core --cov-report=term-missing

# 指定最低覆盖率
pytest --cov=modules --cov=core --cov-fail-under=80
```

**查看HTML报告**:
```bash
# 生成后打开
open htmlcov/index.html
```

---

### 覆盖率目标

| 模块类型 | 目标覆盖率 | 说明 |
|---------|----------|------|
| 核心系统 (`core/`) | 90%+ | 最关键,需要高覆盖率 |
| Phase实现 (`modules/`) | 80%+ | 核心逻辑需要覆盖 |
| 工具函数 (`utils/`) | 70%+ | 常用工具需要测试 |
| 测试代码 (`tests/`) | - | 不计算覆盖率 |

---

### 提高覆盖率技巧

1. **识别未覆盖代码**:
```bash
pytest --cov=modules.phase5 --cov-report=term-missing
```

输出示例:
```
Name                              Stmts   Miss  Cover   Missing
---------------------------------------------------------------
modules/phase5/settlement.py        100     20    80%   45-50, 78-82
```

2. **编写针对性测试**:
```python
def test_settlement_edge_case():
    """测试第45-50行的边缘情况"""
    # 针对未覆盖的代码编写测试
```

3. **使用参数化测试**:
```python
@pytest.mark.parametrize("input,expected", [
    (0.0, 100.0),
    (0.5, 200.0),
    (1.0, 300.0),
    # 添加更多测试案例
])
def test_pricing(input, expected):
    # ...
```

---

## 持续集成

### GitHub Actions

**配置文件** `.github/workflows/test.yml`:
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: [3.9, 3.10, 3.11]

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      run: |
        pytest --cov=modules --cov=core --cov-report=xml

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

    - name: Check coverage threshold
      run: |
        pytest --cov=modules --cov=core --cov-fail-under=80
```

---

### Pre-commit Hooks

在提交代码前自动运行测试。

**安装 pre-commit**:
```bash
pip install pre-commit
```

**配置文件** `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: Run tests
        entry: pytest tests/unit -x
        language: system
        pass_filenames: false
        always_run: true

      - id: pytest-cov
        name: Check coverage
        entry: pytest --cov=modules --cov=core --cov-fail-under=80
        language: system
        pass_filenames: false
        always_run: true
```

**启用 hooks**:
```bash
pre-commit install
```

现在每次 `git commit` 都会自动运行测试。

---

## 测试最佳实践

### 1. 测试命名

✅ **应该**:
```python
def test_default_settlement_with_high_quality():
    """清晰描述测试内容"""

def test_settlement_fund_conservation():
    """测试资金守恒"""
```

❌ **不应该**:
```python
def test1():  # 不清楚测试什么

def test_settlement():  # 太笼统
```

---

### 2. 测试独立性

✅ **应该**:
```python
def test_a():
    """独立测试A"""
    # 自己准备数据
    data = create_data()
    result = process(data)
    assert result == expected

def test_b():
    """独立测试B"""
    # 自己准备数据
    data = create_data()
    # ...
```

❌ **不应该**:
```python
shared_data = None

def test_a():
    global shared_data
    shared_data = create_data()  # 修改全局状态

def test_b():
    # 依赖test_a的结果
    result = process(shared_data)  # ❌ 顺序依赖
```

---

### 3. 测试清晰性

✅ **应该**:
```python
def test_high_quality_increases_price():
    """高质量任务价格更高"""

    # Arrange
    settlement = create_settlement()
    low_quality_price = settlement.calculate_price(0.2)

    # Act
    high_quality_price = settlement.calculate_price(0.9)

    # Assert
    assert high_quality_price > low_quality_price, \
        "High quality should result in higher price"
```

❌ **不应该**:
```python
def test_price():
    s = S()
    p1 = s.cp(0.2)
    p2 = s.cp(0.9)
    assert p2 > p1  # 不清楚为什么
```

---

### 4. 边缘情况

✅ **应该** 测试:
- 空输入 (`[]`, `{}`, `None`)
- 边界值 (0, 1, 最大值, 最小值)
- 异常输入 (负数, 超范围)
- 特殊值 (NaN, Inf)

```python
@pytest.mark.parametrize("quality_score", [
    -0.1,  # 负数
    0.0,   # 最小值
    0.5,   # 中间值
    1.0,   # 最大值
    1.1,   # 超范围
])
def test_price_with_various_quality(quality_score):
    """测试各种质量分数"""
    # ...
```

---

### 5. 使用断言消息

✅ **应该**:
```python
assert updated_state.ledger["user"] < 1000.0, \
    f"User should pay, but balance increased: {updated_state.ledger['user']}"

assert len(participants) > 0, \
    "Participants list should not be empty"
```

❌ **不应该**:
```python
assert updated_state.ledger["user"] < 1000.0  # 失败时不知道原因
```

---

## 测试检查清单

编写测试前检查:

- [ ] 测试名称清晰描述意图
- [ ] 使用 Arrange-Act-Assert 模式
- [ ] 测试独立,不依赖其他测试
- [ ] 测试正常路径和边缘情况
- [ ] 使用fixture避免重复代码
- [ ] 添加断言消息说明
- [ ] 测试覆盖率达标 (>80%)
- [ ] 测试运行快速 (<1秒/单元测试)
- [ ] 集成测试和E2E测试有合理超时

---

## 总结

Oikos 测试体系:

✅ **多层测试** - 单元 → 集成 → 功能 → E2E
✅ **Pytest框架** - 简洁强大
✅ **高覆盖率** - 核心模块 >80%
✅ **CI/CD集成** - GitHub Actions
✅ **最佳实践** - 清晰、独立、完整

通过完善的测试体系,确保 Oikos 代码质量和系统稳定性。

---

**下一步**: 👉 [06-contributing.md](06-contributing.md) - 贡献指南
