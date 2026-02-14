# Phase 7 API 参考

Phase 7 (资金池管理) 的完整API参考文档。

---

## 目录

- [PoolManagerInterface](#poolmanagerinterface)
- [资金池类型](#资金池类型)
- [实现变体](#实现变体)
- [资金守恒审计](#资金守恒审计)

---

## PoolManagerInterface

**文件**: `interfaces/phase7_pool_management/base.py`

### 接口定义

```python
from abc import ABC, abstractmethod
from typing import Dict, Any
from interfaces.types import EconomicState

class PoolManagerInterface(ABC):
    """
    资金池管理接口

    职责:
    - 管理平台资金池
    - 管理保险金池
    - 处理池资金的流入流出
    - 验证资金守恒

    典型实现:
    - DefaultPoolManager: 基础池管理
    - AetherPoolManager: 高级池管理
    """

    @abstractmethod
    def manage_pools(
        self,
        economic_state: EconomicState,
        episode_data: Dict[str, Any]
    ) -> EconomicState:
        """
        管理资金池

        Args:
            economic_state: 当前经济状态
                - ledger: 账本
                - public_pool: 平台资金池
                - insurance_pool: 保险金池
            episode_data: 本轮数据
                - platform_fee: 平台费用
                - penalties: 罚金
                - insurance_claims: 保险赔付

        Returns:
            updated_economic_state: 更新后的经济状态

        Example:
            >>> manager = AetherPoolManager()
            >>> manager.initialize({"pool_allocation_rate": 0.5})
            >>>
            >>> state = EconomicState(
            ...     ledger={"platform": 10.0},
            ...     public_pool=100.0,
            ...     insurance_pool=50.0
            ... )
            >>>
            >>> episode_data = {
            ...     "platform_fee": 10.0,
            ...     "penalties": 5.0
            ... }
            >>>
            >>> updated = manager.manage_pools(state, episode_data)
            >>> updated.public_pool > 100.0  # 资金流入
            True
        """
        pass

    @abstractmethod
    def verify_conservation(
        self,
        before_state: EconomicState,
        after_state: EconomicState
    ) -> bool:
        """
        验证资金守恒

        Args:
            before_state: 操作前的经济状态
            after_state: 操作后的经济状态

        Returns:
            是否守恒

        Example:
            >>> conserved = manager.verify_conservation(before, after)
            >>> assert conserved
        """
        pass
```

---

## 资金池类型

### 1. Public Pool (平台资金池)

**用途**:
- 收取平台费用
- 补贴高质量任务
- 平台运营资金

**资金流动**:
```python
# 流入:
# - Phase 5: 平台费用 (I3_platform_fee)
# - Phase 5: 罚金 (I5_penalty)

# 流出:
# - Phase 5: 平台补贴 (O2_platform_subsidy)
# - Phase 7: 分配到保险池
```

### 2. Insurance Pool (保险金池)

**用途**:
- 保险赔付
- 风险缓冲
- 系统稳定性

**资金流动**:
```python
# 流入:
# - Phase 5: 保险金 (I4_insurance)
# - Phase 7: 从平台池转入

# 流出:
# - Phase 5: 保险赔付 (用户/Agent失败时)
```

---

## 实现变体

### 1. DefaultPoolManager

**插件名**: `default_pool_manager`

```python
class DefaultPoolManager(BasePlugin, PoolManagerInterface):
    """
    默认资金池管理

    特点:
    - 简单的池管理
    - 自动流入平台费用
    - 无主动分配

    配置:
    - 无特殊配置
    """

    def manage_pools(self, economic_state, episode_data):
        updated = economic_state.copy()

        # 1. 平台费用流入Public Pool
        platform_fee = episode_data.get("platform_fee", 0.0)
        updated.public_pool += platform_fee

        # 2. 罚金流入Public Pool
        penalties = episode_data.get("penalties", 0.0)
        updated.public_pool += penalties

        # 3. 保险金流入Insurance Pool
        insurance = episode_data.get("insurance", 0.0)
        updated.insurance_pool += insurance

        return updated

    def verify_conservation(self, before_state, after_state):
        """验证资金守恒"""
        total_before = (
            sum(before_state.ledger.values()) +
            before_state.public_pool +
            before_state.insurance_pool
        )

        total_after = (
            sum(after_state.ledger.values()) +
            after_state.public_pool +
            after_state.insurance_pool
        )

        diff = abs(total_after - total_before)
        return diff < 0.01  # 允许0.01的浮点误差
```

---

### 2. AetherPoolManager

**插件名**: `aether_pool_manager`

```python
class AetherPoolManager(BasePlugin, PoolManagerInterface):
    """
    高级资金池管理 ⭐ 推荐

    特点:
    - 自动分配Public Pool到Insurance Pool
    - 动态调整池比例
    - 风险管理

    配置:
    - pool_allocation_rate: 分配率 (默认 0.3)
    - min_insurance_ratio: 最小保险池比例 (默认 0.2)
    - max_public_pool: 最大平台池 (默认 10000.0)
    """

    def initialize(self, config: Dict[str, Any]) -> None:
        self.pool_allocation_rate = config.get("pool_allocation_rate", 0.3)
        self.min_insurance_ratio = config.get("min_insurance_ratio", 0.2)
        self.max_public_pool = config.get("max_public_pool", 10000.0)

    def manage_pools(self, economic_state, episode_data):
        updated = economic_state.copy()

        # 1. 收取平台费用和罚金
        platform_fee = episode_data.get("platform_fee", 0.0)
        penalties = episode_data.get("penalties", 0.0)
        updated.public_pool += platform_fee + penalties

        # 2. 收取保险金
        insurance = episode_data.get("insurance", 0.0)
        updated.insurance_pool += insurance

        # 3. 动态分配: Public Pool → Insurance Pool
        total_pool = updated.public_pool + updated.insurance_pool

        if total_pool > 0:
            current_insurance_ratio = updated.insurance_pool / total_pool

            # 如果保险池比例过低,从平台池转入
            if current_insurance_ratio < self.min_insurance_ratio:
                target_insurance = total_pool * self.min_insurance_ratio
                transfer_amount = target_insurance - updated.insurance_pool

                # 确保平台池有足够余额
                transfer_amount = min(transfer_amount, updated.public_pool * 0.5)

                if transfer_amount > 0:
                    updated.public_pool -= transfer_amount
                    updated.insurance_pool += transfer_amount

        # 4. 限制平台池上限
        if updated.public_pool > self.max_public_pool:
            # 超出部分转入保险池
            excess = updated.public_pool - self.max_public_pool
            updated.public_pool = self.max_public_pool
            updated.insurance_pool += excess

        return updated

    def verify_conservation(self, before_state, after_state):
        """验证资金守恒"""
        return self._check_total_conservation(before_state, after_state)

    def _check_total_conservation(
        self,
        before: EconomicState,
        after: EconomicState
    ) -> bool:
        """检查总资金守恒"""
        total_before = (
            sum(before.ledger.values()) +
            before.public_pool +
            before.insurance_pool
        )

        total_after = (
            sum(after.ledger.values()) +
            after.public_pool +
            after.insurance_pool
        )

        diff = abs(total_after - total_before)

        if diff >= 0.01:
            print(f"⚠️  Conservation violation: {total_before} -> {total_after} (diff={diff})")
            return False

        return True
```

---

## 资金守恒审计

### EconomicAudit 类

```python
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class EconomicAudit:
    """
    经济审计报告

    记录整个实验过程的资金流动
    """

    initial_total: float                    # 初始总资金
    final_total: float                      # 最终总资金
    episode_totals: List[float]             # 每轮总资金
    violations: List[Dict[str, Any]]        # 守恒违规记录

    @property
    def conservation_passed(self) -> bool:
        """是否通过守恒检查"""
        return len(self.violations) == 0

    @property
    def total_diff(self) -> float:
        """总资金变化"""
        return self.final_total - self.initial_total

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "initial_total": self.initial_total,
            "final_total": self.final_total,
            "total_diff": self.total_diff,
            "conservation_passed": self.conservation_passed,
            "num_violations": len(self.violations),
            "violations": self.violations
        }
```

### 审计器实现

```python
class EconomicAuditor:
    """
    经济审计器

    职责:
    - 记录每轮的资金状态
    - 检测守恒违规
    - 生成审计报告
    """

    def __init__(self):
        self.episode_states: List[EconomicState] = []
        self.violations: List[Dict[str, Any]] = []

    def record_state(self, episode: int, state: EconomicState) -> None:
        """
        记录一轮的经济状态

        Args:
            episode: 轮次
            state: 经济状态
        """
        self.episode_states.append(state)

        # 如果不是第一轮,检查守恒
        if len(self.episode_states) > 1:
            self._check_conservation(episode, self.episode_states[-2], state)

    def _check_conservation(
        self,
        episode: int,
        before: EconomicState,
        after: EconomicState
    ) -> None:
        """检查守恒"""
        total_before = self._calculate_total(before)
        total_after = self._calculate_total(after)

        diff = total_after - total_before

        if abs(diff) >= 0.01:
            violation = {
                "episode": episode,
                "total_before": total_before,
                "total_after": total_after,
                "diff": diff,
                "ledger_before": before.ledger.copy(),
                "ledger_after": after.ledger.copy()
            }
            self.violations.append(violation)

    def _calculate_total(self, state: EconomicState) -> float:
        """计算总资金"""
        return (
            sum(state.ledger.values()) +
            state.public_pool +
            state.insurance_pool
        )

    def generate_report(self) -> EconomicAudit:
        """
        生成审计报告

        Returns:
            审计报告对象
        """
        if not self.episode_states:
            raise ValueError("No states recorded")

        initial_total = self._calculate_total(self.episode_states[0])
        final_total = self._calculate_total(self.episode_states[-1])

        episode_totals = [
            self._calculate_total(state)
            for state in self.episode_states
        ]

        return EconomicAudit(
            initial_total=initial_total,
            final_total=final_total,
            episode_totals=episode_totals,
            violations=self.violations
        )

    def save_report(self, output_path: str) -> None:
        """保存审计报告到文件"""
        import json

        report = self.generate_report()

        with open(output_path, "w") as f:
            json.dump(report.to_dict(), f, indent=2)
```

---

## 配置示例

### 推荐配置

```yaml
phase7_pool_management:
  pool_manager:
    plugin: "aether_pool_manager"
    config:
      pool_allocation_rate: 0.3       # 30%分配率
      min_insurance_ratio: 0.2        # 20%最小保险池比例
      max_public_pool: 10000.0        # 平台池上限
```

### 实验对比配置

```yaml
# 实验A: 无主动管理
phase7_pool_management:
  pool_manager:
    plugin: "default_pool_manager"

# 实验B: 高保险比例
phase7_pool_management:
  pool_manager:
    plugin: "aether_pool_manager"
    config:
      min_insurance_ratio: 0.4  # 40%保险池

# 实验C: 低保险比例
phase7_pool_management:
  pool_manager:
    plugin: "aether_pool_manager"
    config:
      min_insurance_ratio: 0.1  # 10%保险池
```

---

## 使用示例

### 完整流程

```python
# 1. 初始化
pool_manager = AetherPoolManager()
pool_manager.initialize({
    "pool_allocation_rate": 0.3,
    "min_insurance_ratio": 0.2
})

auditor = EconomicAuditor()

# 2. 初始状态
economic_state = EconomicState(
    ledger={"user": 1000.0, "platform": 0.0},
    public_pool=0.0,
    insurance_pool=0.0
)

auditor.record_state(0, economic_state)

# 3. 每轮结算后管理池
for episode in range(1, 11):
    # Phase 5 结算后...
    episode_data = {
        "platform_fee": 5.0,
        "penalties": 2.0,
        "insurance": 3.0
    }

    # 管理资金池
    economic_state = pool_manager.manage_pools(economic_state, episode_data)

    # 记录状态
    auditor.record_state(episode, economic_state)

# 4. 生成审计报告
audit_report = auditor.generate_report()

print(f"Conservation passed: {audit_report.conservation_passed}")
print(f"Total diff: {audit_report.total_diff}")
print(f"Violations: {len(audit_report.violations)}")

# 保存报告
auditor.save_report("economic_audit.json")
```

---

## 池状态可视化

```python
import matplotlib.pyplot as plt

def plot_pool_evolution(audit_report: EconomicAudit, episode_states: List[EconomicState]):
    """绘制资金池演化图"""

    episodes = range(len(episode_states))
    public_pools = [state.public_pool for state in episode_states]
    insurance_pools = [state.insurance_pool for state in episode_states]

    plt.figure(figsize=(12, 6))

    plt.subplot(1, 2, 1)
    plt.plot(episodes, public_pools, label="Public Pool", marker='o')
    plt.plot(episodes, insurance_pools, label="Insurance Pool", marker='s')
    plt.xlabel("Episode")
    plt.ylabel("Pool Balance")
    plt.title("Pool Evolution")
    plt.legend()
    plt.grid(True)

    plt.subplot(1, 2, 2)
    plt.plot(episodes, audit_report.episode_totals, label="Total", marker='o', color='green')
    plt.axhline(y=audit_report.initial_total, color='r', linestyle='--', label='Initial Total')
    plt.xlabel("Episode")
    plt.ylabel("Total Fund")
    plt.title("Fund Conservation Check")
    plt.legend()
    plt.grid(True)

    plt.tight_layout()
    plt.savefig("pool_evolution.png")
```

---

## 总结

Phase 7 API提供:

✅ **PoolManagerInterface** - 资金池管理接口
✅ **两种资金池** - Public Pool和Insurance Pool
✅ **动态分配策略** - 自动平衡池比例
✅ **资金守恒审计** - EconomicAuditor全程监控
✅ **审计报告** - 完整的资金流动记录

通过Phase 7的池管理和审计,确保整个系统的经济守恒和稳定性。

---

**下一步**: 👉 [common-types.md](common-types.md) - 公共类型定义
