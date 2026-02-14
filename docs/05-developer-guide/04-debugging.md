# 调试技巧

本文档提供 Oikos 开发和使用过程中的调试方法、工具和最佳实践。

---

## 目录

- [调试工具](#调试工具)
- [常见问题调试](#常见问题调试)
- [日志系统](#日志系统)
- [断点调试](#断点调试)
- [性能调试](#性能调试)
- [调试技巧总结](#调试技巧总结)

---

## 调试工具

### 1. Python 内置调试器 (pdb)

**快速插入断点**:
```python
# 在代码中任何位置插入
import pdb; pdb.set_trace()
```

**常用命令**:
```
n (next)      - 执行下一行
s (step)      - 进入函数
c (continue)  - 继续执行
l (list)      - 显示代码
p var         - 打印变量
pp var        - 美化打印
w (where)     - 显示调用栈
q (quit)      - 退出调试
```

**示例**:
```python
# modules/phase5/settlement_modules.py

def settle_episode(self, economic_state, quality_score, ...):
    import pdb; pdb.set_trace()  # ⭐ 断点

    task_price = self._calculate_task_price(quality_score)
    # ... 其余代码
```

---

### 2. IPython 调试器 (ipdb)

更强大的调试器,支持语法高亮和自动补全。

**安装**:
```bash
pip install ipdb
```

**使用**:
```python
import ipdb; ipdb.set_trace()
```

---

### 3. VSCode 调试器

**配置文件** `.vscode/launch.json`:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Run Experiment",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/cli.py",
            "args": [
                "run",
                "--mode", "test",
                "--recipe", "TEMPLATE",
                "--max_episodes", "5"
            ],
            "console": "integratedTerminal",
            "env": {
                "PYTHONPATH": "${workspaceFolder}",
                "OPENAI_API_KEY": "your_key_here"
            }
        },
        {
            "name": "Python: Current File",
            "type": "python",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal"
        },
        {
            "name": "Python: Pytest",
            "type": "python",
            "request": "launch",
            "module": "pytest",
            "args": [
                "${file}",
                "-v"
            ],
            "console": "integratedTerminal"
        }
    ]
}
```

**使用步骤**:
1. 在代码行号左侧点击,设置断点
2. 按 `F5` 启动调试
3. 使用调试工具栏 (继续、单步、进入、跳出)

---

### 4. PyCharm 调试器

**启动调试**:
1. 右键点击 `cli.py`
2. 选择 "Debug 'cli'"
3. 在代码中设置断点 (点击行号)

**调试面板**:
- **Variables** - 查看所有变量
- **Watches** - 监控特定表达式
- **Console** - 执行Python命令

---

## 常见问题调试

### 问题 1: 插件加载失败

**症状**:
```
KeyError: 'your_plugin_name'
PluginNotFoundError: Plugin 'your_plugin_name' not registered
```

**调试步骤**:

**1. 检查插件是否注册**
```python
# 在Python REPL中
from core.plugin_registry import PluginRegistry
print(PluginRegistry._plugins.keys())
```

**2. 检查导入路径**
```python
# 验证模块可以导入
from modules.phase5.settlement_modules import YourPlugin
```

**3. 检查注册代码是否执行**
```python
# modules/phase5/settlement_modules.py (底部)

from core.plugin_registry import PluginRegistry

# 添加调试打印
print("Registering YourPlugin...")
PluginRegistry.register("your_plugin_name", YourPlugin)
print(f"Registered plugins: {PluginRegistry._plugins.keys()}")
```

**4. 检查配置文件**
```yaml
# recipes/TEMPLATE/conf/test_config.yaml

phase5_settlement:
  settlement:
    plugin: "your_plugin_name"  # ⭐ 确保名称匹配
```

---

### 问题 2: 配置参数不生效

**症状**:
插件使用默认值而不是配置文件中的值

**调试步骤**:

**1. 验证配置文件语法**
```bash
python -c "import yaml; print(yaml.safe_load(open('recipes/TEMPLATE/conf/test_config.yaml')))"
```

**2. 打印加载的配置**
```python
# cli.py / 内部执行器

from core.config_manager import ConfigManager

config = ConfigManager.load("recipes/TEMPLATE/conf/test_config.yaml")
print("Loaded config:")
import json
print(json.dumps(config, indent=2))
```

**3. 在插件中打印配置**
```python
# modules/phase5/settlement_modules.py

def initialize(self, config: Dict[str, Any]) -> None:
    print(f"Received config: {config}")  # ⭐ 调试打印

    self.base_price = config.get("base_price", 100.0)
    print(f"base_price set to: {self.base_price}")
```

**4. 检查配置层级**
```yaml
# ❌ 错误: 层级不对
phase5_settlement:
  settlement:
    plugin: "your_plugin"
  config:  # ❌ 错误位置
    base_price: 100.0

# ✅ 正确: config在plugin下
phase5_settlement:
  settlement:
    plugin: "your_plugin"
    config:  # ✅ 正确位置
      base_price: 100.0
```

---

### 问题 3: 资金守恒失败

**症状**:
```
AssertionError: Fund conservation violated: before=1000.0, after=1005.0
```

**调试步骤**:

**1. 打印资金流动**
```python
# modules/phase5/settlement_modules.py

def settle_episode(self, economic_state, ...):
    # 结算前
    total_before = sum(economic_state.ledger.values())
    print(f"Total before settlement: {total_before}")
    print(f"Ledger before: {economic_state.ledger}")

    # 执行结算
    updated_state = self._update_ledger(...)

    # 结算后
    total_after = sum(updated_state.ledger.values())
    print(f"Total after settlement: {total_after}")
    print(f"Ledger after: {updated_state.ledger}")

    # 验证守恒
    diff = total_after - total_before
    if abs(diff) > 0.01:
        print(f"⚠️  Fund conservation violated: diff={diff}")

    return updated_state
```

**2. 检查每笔资金流**
```python
def _update_ledger(self, economic_state, task_price, reward_allocation, platform_fee):
    """更新账本"""

    updated_state = economic_state.copy()

    # O1: 用户支付
    user_payment = task_price
    updated_state.ledger["user"] -= user_payment
    print(f"O1 user_payment: -{user_payment}")

    # I1: Agent奖励
    for agent_id, reward in reward_allocation.items():
        updated_state.ledger[agent_id] += reward
        print(f"I1 {agent_id}_reward: +{reward}")

    # I3: 平台费用
    updated_state.ledger["platform"] += platform_fee
    print(f"I3 platform_fee: +{platform_fee}")

    # 验证: O1 = sum(I1) + I3
    total_inflow = sum(reward_allocation.values()) + platform_fee
    print(f"O1={user_payment}, sum(I*)={total_inflow}, diff={user_payment - total_inflow}")

    return updated_state
```

**3. 常见原因**:
- ❌ 忘记某项支出或收入
- ❌ 重复计算
- ❌ 浮点数精度问题 (使用 `pytest.approx` 或 `abs(diff) < 0.01`)

---

### 问题 4: Agent排名不更新

**症状**:
Agent排名在多个Episodes后仍然保持初始值

**调试步骤**:

**1. 检查排名插件是否被调用**
```python
# modules/phase6/feedback_modules.py

def evaluate_agents(self, agents, episode_results):
    print(f"⭐ evaluate_agents called: agents={agents}, results={episode_results}")

    # ... 排名逻辑
```

**2. 检查状态是否持久化**
```python
class YourRankingPlugin(BasePlugin, AgentEvalInterface):
    def initialize(self, config):
        self.agent_history = {}  # ⭐ 确保是实例变量

    def evaluate_agents(self, agents, episode_results):
        # 更新历史
        for agent_id, score in episode_results.items():
            if agent_id not in self.agent_history:
                self.agent_history[agent_id] = []
            self.agent_history[agent_id].append(score)

        print(f"Agent history: {self.agent_history}")  # 调试打印
```

**3. 检查AgentRanks是否传递**
```python
# cli.py / 内部执行器

for episode in range(max_episodes):
    # Phase 6: 更新排名
    agent_ranks = phase6_plugin.evaluate_agents(agents, episode_results)
    print(f"Episode {episode} agent_ranks: {agent_ranks}")

    # Phase 3: 使用排名分配任务
    selected_agents = phase3_plugin.allocate(agent_ranks)  # ⭐ 确保传递
```

---

### 问题 5: 测试失败

**症状**:
```
AssertionError: assert 150.5 == 123.5
```

**调试步骤**:

**1. 使用 pytest 的 `-vv` 选项**
```bash
pytest tests/test_phase5/test_settlement.py -vv
```

**2. 打印中间值**
```python
def test_settlement():
    # 执行
    updated_state = settlement.settle_episode(...)

    # 打印实际值
    print(f"Expected agent balance: {expected_balance}")
    print(f"Actual agent balance: {updated_state.ledger['agent-001']}")

    # 断言
    assert updated_state.ledger['agent-001'] == expected_balance
```

**3. 使用 `pytest.approx` 处理浮点数**
```python
import pytest

# ❌ 错误: 浮点数直接比较
assert updated_state.ledger['agent-001'] == 123.5

# ✅ 正确: 使用 pytest.approx
assert updated_state.ledger['agent-001'] == pytest.approx(123.5, abs=0.01)
```

**4. 只运行失败的测试**
```bash
# 运行特定测试
pytest tests/test_phase5/test_settlement.py::test_high_quality -v

# 运行上次失败的测试
pytest --lf
```

---

## 日志系统

### 配置日志

**文件**: `core/logging_config.py`

```python
import logging
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'detailed': {
            'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'detailed',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.FileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': 'oikos.log',
            'mode': 'a'
        }
    },
    'loggers': {
        '': {  # root logger
            'level': 'DEBUG',
            'handlers': ['console', 'file']
        },
        'modules.phase5': {
            'level': 'DEBUG',
            'handlers': ['console', 'file'],
            'propagate': False
        }
    }
}

def setup_logging():
    """初始化日志配置"""
    logging.config.dictConfig(LOGGING_CONFIG)
```

**使用**:
```python
# cli.py / 内部执行器

from core.logging_config import setup_logging
setup_logging()
```

---

### 在插件中使用日志

```python
# modules/phase5/settlement_modules.py

import logging

logger = logging.getLogger(__name__)  # ⭐ 使用模块名

class YourPlugin(BasePlugin, YourInterface):
    def initialize(self, config):
        logger.info("YourPlugin initialized")  # INFO级别
        logger.debug(f"Config: {config}")     # DEBUG级别

    def process(self, data):
        logger.info(f"Processing data: {data['id']}")

        try:
            result = self._do_something(data)
            logger.debug(f"Result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error processing: {e}", exc_info=True)  # 包含堆栈
            raise
```

---

### 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| `DEBUG` | 详细调试信息 | `logger.debug(f"Variable x={x}")` |
| `INFO` | 一般信息 | `logger.info("Plugin initialized")` |
| `WARNING` | 警告 | `logger.warning("Config missing, using default")` |
| `ERROR` | 错误 | `logger.error("Settlement failed")` |
| `CRITICAL` | 严重错误 | `logger.critical("System crash")` |

---

### 动态调整日志级别

**命令行**:
```bash
# 运行时设置日志级别
python -m oikos.cli run --mode test --recipe TEMPLATE --log-level DEBUG

# 只显示特定模块的日志
python -m oikos.cli run --mode test --recipe TEMPLATE --log-module modules.phase5 --log-level DEBUG
```

**代码**:
```python
import logging

# 调整整体级别
logging.getLogger().setLevel(logging.DEBUG)

# 调整特定模块级别
logging.getLogger('modules.phase5').setLevel(logging.DEBUG)
```

---

## 断点调试

### 条件断点

**在pdb中**:
```python
def settle_episode(self, economic_state, quality_score, ...):
    # 只在quality_score < 0.5时暂停
    if quality_score < 0.5:
        import pdb; pdb.set_trace()

    # ... 其余代码
```

**在VSCode中**:
1. 右键点击断点
2. 选择 "Edit Breakpoint"
3. 输入条件: `quality_score < 0.5`

---

### 日志点 (Logpoint)

不暂停执行,只打印信息。

**VSCode**:
1. 右键点击行号
2. 选择 "Add Logpoint"
3. 输入: `Quality score: {quality_score}`

---

### 远程调试

调试运行在服务器上的代码。

**安装 debugpy**:
```bash
pip install debugpy
```

**在服务器代码中**:
```python
# cli.py

import debugpy

# 启动调试服务器
debugpy.listen(("0.0.0.0", 5678))
print("Waiting for debugger attach...")
debugpy.wait_for_client()  # 等待客户端连接

# ... 其余代码
```

**VSCode配置** `.vscode/launch.json`:
```json
{
    "name": "Python: Attach to Remote",
    "type": "python",
    "request": "attach",
    "connect": {
        "host": "remote-server-ip",
        "port": 5678
    },
    "pathMappings": [
        {
            "localRoot": "${workspaceFolder}",
            "remoteRoot": "/path/on/server"
        }
    ]
}
```

---

## 性能调试

### 1. 时间测量

**简单计时**:
```python
import time

start = time.time()
result = expensive_function()
duration = time.time() - start
print(f"Duration: {duration:.2f}s")
```

**上下文管理器**:
```python
from contextlib import contextmanager
import time

@contextmanager
def timer(name):
    start = time.time()
    yield
    duration = time.time() - start
    print(f"{name}: {duration:.2f}s")

# 使用
with timer("Phase 5 Settlement"):
    result = settlement_plugin.settle_episode(...)
```

---

### 2. 性能分析 (Profiling)

**cProfile**:
```bash
# 分析整个程序
python -m cProfile -s cumulative -m oikos.cli run --mode test --recipe TEMPLATE > profile.txt

# 查看结果
cat profile.txt | head -50
```

**示例输出**:
```
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000   10.523   10.523 cli.py:1(<module>)
       50    0.012    0.000    8.456    0.169 settlement_modules.py:45(settle_episode)
      500    5.234    0.010    5.234    0.010 {built-in method builtins.sum}
```

**line_profiler** (逐行分析):
```bash
# 安装
pip install line_profiler

# 在代码中标记
@profile  # ⭐ 添加装饰器
def settle_episode(self, ...):
    # ... 代码

# 运行
kernprof -l -v -m oikos.cli run --mode test --recipe TEMPLATE
```

**示例输出**:
```
Line #      Hits         Time  Per Hit   % Time  Line Contents
==============================================================
    45                                           def settle_episode(self, ...):
    46         1         12.0     12.0      0.1      task_price = self._calculate_task_price(...)
    47         1       5234.0   5234.0     98.5      rewards = self._allocate_rewards(...)
    48         1         75.0     75.0      1.4      updated_state = self._update_ledger(...)
```

---

### 3. 内存分析

**memory_profiler**:
```bash
# 安装
pip install memory_profiler

# 在代码中标记
@profile
def settle_episode(self, ...):
    # ... 代码

# 运行
python -m memory_profiler -m oikos.cli run --mode test --recipe TEMPLATE
```

**示例输出**:
```
Line #    Mem usage    Increment  Line Contents
================================================
    45     50.2 MiB     50.2 MiB   def settle_episode(self, ...):
    46     55.3 MiB      5.1 MiB       task_price = ...
    47     78.9 MiB     23.6 MiB       rewards = ...  # ⚠️ 内存增加明显
```

---

### 4. 查找瓶颈

**常见瓶颈**:
1. **频繁的小对象创建** → 使用对象池或缓存
2. **大列表/字典操作** → 使用生成器或numpy
3. **重复计算** → 缓存结果 (`@lru_cache`)
4. **I/O操作** → 批量处理或异步I/O

**示例: 使用缓存**:
```python
from functools import lru_cache

class YourPlugin(BasePlugin, YourInterface):
    @lru_cache(maxsize=1000)  # ⭐ 缓存最近1000次调用
    def _calculate_task_price(self, quality_score: float) -> float:
        # 复杂计算
        return expensive_calculation(quality_score)
```

---

## 调试技巧总结

### 快速定位问题的流程

```
1. 复现问题
   ├─ 收集错误信息 (堆栈、错误消息)
   ├─ 记录复现步骤
   └─ 创建最小复现案例

2. 缩小范围
   ├─ 确定问题在哪个Phase
   ├─ 确定问题在哪个插件
   └─ 确定问题在哪个方法

3. 分析原因
   ├─ 添加日志打印
   ├─ 使用断点调试
   └─ 检查输入输出

4. 验证修复
   ├─ 修改代码
   ├─ 添加测试
   └─ 验证问题已解决
```

---

### 调试工具选择

| 场景 | 推荐工具 | 说明 |
|------|---------|------|
| 快速定位 | `print()` / `logger.debug()` | 最简单直接 |
| 交互调试 | `pdb` / `ipdb` | 命令行环境 |
| 图形化调试 | VSCode / PyCharm | IDE集成 |
| 性能问题 | `cProfile` / `line_profiler` | 找到慢代码 |
| 内存问题 | `memory_profiler` | 找到内存泄漏 |
| 远程调试 | `debugpy` | 服务器环境 |

---

### 调试最佳实践

✅ **应该**:
1. **使用日志而不是print** - 可控制级别和格式
2. **编写可复现的测试** - 验证修复
3. **保持调试代码** - 注释而不是删除
4. **从简单到复杂** - 逐步缩小范围
5. **记录调试过程** - 方便团队协作

❌ **不应该**:
1. **盲目修改代码** - 先理解问题
2. **忽略警告信息** - 可能是根本原因
3. **跳过测试** - 可能引入新问题
4. **在生产环境调试** - 使用测试环境

---

### 调试检查清单

遇到问题时,按顺序检查:

- [ ] 错误消息完整吗?
- [ ] 堆栈信息指向哪里?
- [ ] 输入数据正确吗?
- [ ] 配置参数正确吗?
- [ ] 插件注册了吗?
- [ ] 接口实现正确吗?
- [ ] 状态传递正确吗?
- [ ] 资金守恒吗?
- [ ] 测试覆盖了吗?
- [ ] 日志有异常吗?

---

## 总结

Oikos 调试的关键工具和方法:

✅ **日志系统** - 最常用,覆盖所有模块
✅ **断点调试** - 交互式探索代码
✅ **单元测试** - 验证修复
✅ **性能分析** - 优化性能
✅ **系统化方法** - 快速定位问题

掌握这些调试技巧,可以大大提高开发效率和代码质量。

---

**下一步**: 👉 [05-testing.md](05-testing.md) - 测试指南
