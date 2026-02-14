# API 参考文档

本目录包含 Oikos 所有模块的API参考文档。

---

## 目录结构

### 核心API
- [core-api.md](core-api.md) - 核心系统API (插件系统、配置管理、工厂)

### Phase接口API
- [phase1-api.md](phase1-api.md) - Phase 1: 初始化接口
- [phase2-api.md](phase2-api.md) - Phase 2: 任务创建接口
- [phase3-api.md](phase3-api.md) - Phase 3: 任务分配接口
- [phase4-api.md](phase4-api.md) - Phase 4: 任务执行接口
- [phase5-api.md](phase5-api.md) - Phase 5: 清结算接口
- [phase6-api.md](phase6-api.md) - Phase 6: 反馈排名接口
- [phase7-api.md](phase7-api.md) - Phase 7: 资金池管理接口

### 公共类型和配置
- [common-types.md](common-types.md) - 公共类型定义 (EconomicState, AgentRanks等)
- [configuration-schema.md](configuration-schema.md) - 配置文件Schema

---

## 快速索引

### 按功能查找

| 功能 | 接口文档 | 实现示例 |
|------|---------|---------|
| 插件系统 | [core-api.md#BasePlugin](core-api.md) | `modules/phase5/settlement_modules.py` |
| 任务定价 | [phase2-api.md#TaskPricing](phase2-api.md) | `modules/phase2/creation_modules.py` |
| Worker分配 | [phase3-api.md#TaskAllocator](phase3-api.md) | `modules/phase3/allocation_modules.py` |
| 结算机制 | [phase5-api.md#SettlementInterface](phase5-api.md) | `modules/phase5/settlement_modules.py` |
| 排名算法 | [phase6-api.md#AgentEvalInterface](phase6-api.md) | `modules/phase6/feedback_modules.py` |
| 资金池管理 | [phase7-api.md#PoolManager](phase7-api.md) | `modules/phase7/pool_modules.py` |

---

### 按类型查找

| 类型 | 文档 | 说明 |
|------|------|------|
| `EconomicState` | [common-types.md#EconomicState](common-types.md) | 经济状态对象 |
| `AgentRanks` | [common-types.md#AgentRanks](common-types.md) | Agent排名数据 |
| `ConversationContext` | [common-types.md#ConversationContext](common-types.md) | 对话上下文 |
| `TaskData` | [common-types.md#TaskData](common-types.md) | 任务数据结构 |
| `MetricsData` | [common-types.md#MetricsData](common-types.md) | 指标数据 |

---

## 使用指南

### 如何阅读API文档

每个API文档包含:

1. **接口概述** - 接口的职责和设计目的
2. **类/方法签名** - 完整的类型注解
3. **参数说明** - 每个参数的类型和含义
4. **返回值** - 返回值类型和说明
5. **异常** - 可能抛出的异常
6. **示例代码** - 使用示例

### API文档模板

```python
class YourInterface(ABC):
    """
    接口简要描述

    职责:
    - 职责1
    - 职责2

    典型实现:
    - Implementation1: 说明
    - Implementation2: 说明
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

        Example:
            >>> instance = YourImplementation()
            >>> result = instance.your_method(arg1, arg2)
            >>> print(result)
            expected_output
        """
        pass
```

---

## 版本说明

- **当前版本**: v1.0.0
- **API稳定性**:
  - ✅ **稳定** - `core/`, Phase 5-7接口
  - ⚠️  **实验性** - Phase 1-4接口 (可能有小变动)

---

## 版本兼容性

| Oikos版本 | Python版本 | 主要变更 |
|-----------|-----------|---------|
| v1.0.0 | 3.9+ | 初始发布 |
| v0.9.0 | 3.9+ | Beta版本 |

---

## 相关文档

### 开发指南
- 👉 [05-developer-guide/03-creating-plugins.md](../05-developer-guide/03-creating-plugins.md) - 如何创建插件
- 👉 [05-developer-guide/04-debugging.md](../05-developer-guide/04-debugging.md) - 调试技巧

### 架构文档
- 👉 [03-architecture/04-plugin-system.md](../03-architecture/04-plugin-system.md) - 插件系统架构
- 👉 [03-architecture/05-data-flow.md](../03-architecture/05-data-flow.md) - 数据流动

### 模块详解
- 👉 [04-phase-modules/](../04-phase-modules/) - 各Phase模块详解

---

## API更新日志

### v1.0.0 (2024-XX-XX)
- ✅ 发布稳定的核心API
- ✅ Phase 5-7接口完全稳定
- ✅ 完整的类型注解
- ✅ 详细的文档和示例

---

## 贡献API文档

如果您发现API文档有错误或需要改进:

1. 在GitHub提交Issue
2. 或直接提交PR修改文档
3. 参考 [06-contributing.md](../05-developer-guide/06-contributing.md)

---

## 文档约定

### 类型注解
```python
from typing import Dict, List, Optional, Any, Union

# 简单类型
value: int = 42
name: str = "example"

# 复合类型
config: Dict[str, Any] = {}
participants: List[str] = []
result: Optional[float] = None

# 联合类型
price: Union[int, float] = 100.0
```

### 参数说明

- **必需参数** - 没有默认值
- **可选参数** - 有默认值或 `Optional[...]`

### 返回值

- 明确说明返回值类型
- 说明返回值的含义和取值范围

### 异常

- 列出所有可能抛出的异常
- 说明异常发生的条件

---

## 总结

Oikos API参考文档提供:

✅ **完整的接口定义** - 所有模块的API
✅ **详细的类型注解** - 清晰的参数和返回值
✅ **丰富的示例代码** - 实际使用案例
✅ **版本兼容性说明** - 稳定性保证

使用本文档,您可以:
- 快速查找接口定义
- 理解参数和返回值
- 学习如何使用API
- 开发自定义插件

---

**下一步**: 选择具体的API文档开始阅读
