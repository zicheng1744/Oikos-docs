# 系统概述

## Oikos 是什么？

**Oikos** 是一个 **可插件化的 LaMAS（Large-scale Multi-Agent System）多智能体实验运行系统**。它提供了一个完整的沙盒环境，让研究人员和开发者能够：

- 🔬 **设计和运行** 多智能体交互实验
- 💰 **测试和对比** 不同的经济机制设计
- 📊 **收集和分析** 详细的行为和经济数据
- 🔌 **灵活替换** 系统中的任何模块实现

简单来说，Oikos 让您能够：
> "在一个可控的环境中，让多个AI智能体根据您设计的经济规则进行协作、竞争和交易，并观察整个系统的演化过程。"

---

## 核心定位

### Backend-First 设计

Oikos 是一个 **backend-first** 的实验系统，专注于：
- ✅ 完整的 7 阶段管道执行
- ✅ 精确的经济机制实现
- ✅ 详尽的数据采集和审计
- ✅ 命令行驱动的自动化实验

前端 UI 不是必要条件 - 所有功能都可以通过配置文件和命令行完成。

### 面向研究与开发

**适合研究人员**:
- 对比不同的经济机制设计
- 研究智能体行为和演化
- 设计激励相容的市场规则
- 发表相关研究成果

**适合开发者**:
- 理解多智能体系统架构
- 开发自定义的智能体策略
- 实现新的经济机制
- 构建可插拔的模块

---

## 核心概念

### 1. 七阶段管道（Seven-Phase Pipeline）

Oikos 将一次完整的多智能体交互分解为 **7 个阶段**，每个阶段负责特定的职责：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Oikos 七阶段管道                          │
└─────────────────────────────────────────────────────────────────┘

Phase 1: 沙盒初始化 (Sandbox Initialization)
    ├─ 加载配置与环境
    ├─ 初始化参与者（User, Agent, Orchestrator, Platform）
    ├─ 启动基础设施（Ledger账本, Marketplace市场）
    └─ 加载任务池

                    ↓

Phase 2: 任务创建 (Task Creation)
    ├─ 从用户输入提取任务
    ├─ 任务定价（估算成本）
    └─ 任务发布到市场

                    ↓

Phase 3: 任务分配 (Task Allocation)
    ├─ Orchestrator收集出价（bids）
    ├─ 运行拍卖机制（first-price/second-price）
    ├─ 选出中标Orchestrator
    └─ 安全监控（反共谋、女巫攻击检测）

                    ↓

Phase 4: 任务执行 (Task Execution)
    ├─ 任务规划（分解为子任务DAG）
    ├─ 路由到具体Worker智能体
    ├─ 子任务管理与协调
    ├─ 结果评估（评估器打分）
    └─ 异常注入（可选，用于鲁棒性测试）

                    ↓

Phase 5: 清结算 (Settlement)
    ├─ 结果评估（Result Evaluation）
    │   └─ 根据评估器打分计算任务质量
    └─ 资金结算（Settlement）
        ├─ 计算资金流向（9种机制可选）
        ├─ 更新账本（User → Platform → Orchestrator → Worker）
        └─ 生成交易记录

                    ↓

Phase 6: 反馈与排名 (Feedback & Ranking)
    ├─ Agent评估（10种排名算法可选）
    │   ├─ 基于贡献度的排名
    │   ├─ 基于ELO的竞争排名
    │   ├─ 基于PageRank的网络排名
    │   └─ ...
    └─ 观测数据收集（Observation）
        ├─ 个体指标（agent performance）
        └─ 全局指标（system metrics）

                    ↓

Phase 7: 资金池管理 (Pool Management)
    ├─ 资金池健康检查
    ├─ 再平衡（Rebalancing）
    ├─ 再投资策略（Reinvestment）
    ├─ 经济审计（Economic Audit）
    │   └─ 验证资金守恒性
    └─ 断路器（Circuit Breaker）
        └─ 异常情况下的保护措施
```

**关键设计思想**:
- **单一职责**: 每个Phase专注一个核心功能
- **状态传递**: Phase间通过标准化的状态对象通信
- **可观测性**: 每个Phase产生详细的Telemetry事件
- **可替换性**: 每个Phase内的模块都可以独立替换

---

### 2. 可插件化架构（Plugin-Based Architecture）

Oikos 的核心优势是 **完全可插件化**。系统分为两层：

#### 抽象层（Abstraction Layer）
位于 [`interfaces/`](../../interfaces/) 目录，定义：
- 📜 **接口契约**（Interface Contracts）
- 📝 **数据模型**（Data Models）
- 🎯 **设计意图**（Design Intentions）

**示例** - Phase 5 Settlement 接口:
```python
class ISettlement(BasePlugin):
    @abstractmethod
    def calculate_payment(
        self,
        task_result: TaskResult,
        allocation_info: AllocationInfo,
        config: SettlementConfig
    ) -> PaymentDistribution:
        """
        计算资金分配方案

        Returns:
            PaymentDistribution: 包含各方收支明细
        """
        pass
```

#### 实现层（Implementation Layer）
位于 [`modules/`](../../modules/) 目录，提供：
- 🔧 **具体实现**（Concrete Implementations）
- 🎨 **多种变体**（Multiple Variants）
- 🔌 **注册机制**（Registration）

**示例** - Phase 5 Settlement 的 9 种实现:
1. `DefaultSettlement` - 基础分成模型
2. `PerformanceBasedSettlement` - 基于质量的分成
3. `TieredSettlement` - 分层费率
4. `BonusPenaltySettlement` - 奖惩机制
5. `StakeWeightedSettlement` - 质押权重
6. ... 以及其他 4 种变体

#### 插件选择机制

通过 **YAML 配置** 选择使用哪个实现：

```yaml
phase5_settlement:
  result_eval:
    plugin: default_result_eval       # 选择默认评估器
  settlement:
    plugin: performance_based_settlement  # 选择基于性能的结算
    config:
      base_fee_rate: 0.1
      performance_multiplier: 1.5
```

**优势**:
- ✅ 无需修改代码即可切换机制
- ✅ 对比实验只需修改配置文件
- ✅ 自定义实现只需继承接口并注册
- ✅ 系统自动验证插件兼容性

---

### 3. 经济四方主体（Four Economic Actors）

Oikos 模拟了一个完整的多智能体经济系统，包含 **四类参与者**：

```
┌──────────────────────────────────────────────────────────────┐
│                      经济系统参与者                            │
└──────────────────────────────────────────────────────────────┘

1. User（用户）
   ├─ 发起任务
   ├─ 支付任务费用
   ├─ 评价任务结果
   └─ 账户余额管理

2. Agent/Worker（智能体/工作者）
   ├─ 执行具体子任务
   ├─ 竞争任务分配
   ├─ 获得任务报酬
   ├─ 信誉积累与排名
   └─ 策略学习与演化

3. Orchestrator（编排器）
   ├─ 竞标任务
   ├─ 任务分解与规划
   ├─ 子任务分配给Worker
   ├─ 协调执行流程
   ├─ 获得协调费用
   └─ Hub角色（可管理多个Worker）

4. Platform（平台）
   ├─ 提供基础设施（Ledger, Marketplace）
   ├─ 收取平台费
   ├─ 管理资金池
   ├─ 维护系统安全
   └─ 提供保险与信用机制
```

#### 资金流向示例

```
完整的任务资金流（Phase 5 Settlement）:

用户支付 100 Token
    ↓
┌─────────────────────────┐
│   O1: User → Platform   │  10 Token (平台费 10%)
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ O2: User → Orchestrator │  15 Token (协调费 15%)
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│   O3: User → Worker     │  72 Token (任务报酬 80% * 0.9)
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│   I1: Insurance Pool    │  3 Token (保险费 3%)
└─────────────────────────┘

最终分配:
- Platform: 10 Token
- Orchestrator: 15 Token
- Worker: 72 Token
- Insurance Pool: 3 Token
═══════════════════════════
总计: 100 Token ✓（守恒）
```

**经济机制设计空间**:
- 费率结构（platform_fee, orchestrator_fee, agent_cut）
- 激励设计（bonus, penalty, stake）
- 风险管理（insurance, reserve）
- 市场机制（拍卖类型、定价策略）

---

### 4. 三种实验模式（Three Experiment Modes）

Oikos 支持三种运行模式，适应不同的研究和测试需求：

#### 🗣️ Chat 模式（交互式对话）

**用途**: 快速验证端到端流程

```bash
bash recipes/TEMPLATE/run_chat.sh
```

**特点**:
- 单次会话
- 交互式输入
- 即时查看结果
- 适合调试和演示

**输出**: `exp/chat/<run_id>/conversations/0001__<thread_id>/`

---

#### 🏋️ Train 模式（多轮训练）

**用途**: 冷启动、稳定排名、观察演化

```bash
bash recipes/TEMPLATE/run_train.sh --max_episodes 50
```

**特点**:
- 多轮次（episodes）迭代
- Agent 状态累积（信誉、余额）
- 排名逐步稳定（AgentRank）
- 适合长期演化研究

**典型场景**:
- 冷启动系统（建立初始信誉）
- 观察策略演化
- 研究市场动态
- 测试经济可持续性

**输出**: `exp/train/<run_id>/overall/agent_ranks.json`（演化曲线）

---

#### 🧪 Test 模式（评测与对比）

**用途**: 机制对比、基准测试、论文实验

```bash
bash recipes/TEMPLATE/run_test.sh --max_episodes 100
```

**特点**:
- 固定数据集
- 可控实验条件
- 详细的指标收集
- 适合对比实验

**典型对比实验**:
1. **结算机制对比**
   ```yaml
   # Experiment A: Default Settlement
   phase5_settlement:
     settlement:
       plugin: default_settlement

   # Experiment B: Performance-Based Settlement
   phase5_settlement:
     settlement:
       plugin: performance_based_settlement
   ```

2. **排名算法对比**
   ```yaml
   # Experiment A: ELO Ranking
   phase6_feedback:
     agent_eval:
       plugin: elo_agent_eval

   # Experiment B: PageRank
   phase6_feedback:
     agent_eval:
       plugin: pagerank_agent_eval
   ```

3. **分析对比结果**
   使用 `overall/results.json`、`overall/economic_audit.json`、`overall/metrics/` 做逐项对比（当前仓库未内置统一的 compare 脚本）。

**输出**: `exp/test/<run_id>/overall/metrics/`（完整指标）

---

## 系统特点

### ✅ 完全自动化

一条命令完成全流程：
```bash
bash recipes/TEMPLATE/run_test.sh
```
自动执行：
1. 启动全链条服务（API / NVWA / Retrieval / Evaluator）
2. 运行实验（Phase 1-7）
3. 收集结果（JSON / JSONL）
4. 停止服务

无需手动管理服务生命周期。

---

### 📊 完整的可观测性

每次运行产生 **详尽的输出**：

**会话级数据** - `conversations/<episode>__<thread_id>/`:
- `trace.json` - DAG执行轨迹
- `phase_trace.jsonl` - 逐Phase事件流
- `node_ledger.jsonl` - 节点级账本记录
- `economic.json` - 经济状态快照
- `telemetry_events.jsonl` - 完整的Telemetry事件

**全局级数据** - `overall/`:
- `results.json` - 汇总指标
- `economic_state.json` - 最终经济状态
- `economic_audit.json` - 资金守恒审计
- `agent_ranks.json` - Agent排名演化
- `metrics/` - 详细的时序指标（CSV）

---

### 🔒 经济守恒保证

Phase 7 的 **Audit 模块** 自动验证：
- ✅ 资金总量守恒
- ✅ 每笔交易可追溯
- ✅ 账本余额一致性
- ✅ 资金流向合法性

审计失败会产生明确的错误报告。

---

### 🎯 配置驱动

**核心理念**: "配置即实验设计"

所有实验参数都在 YAML 中定义：
- Phase 1-7 的插件选择
- 经济参数（费率、保险、激励）
- Runtime 行为（并行、Docker、Retrieval）
- 数据集和任务池配置

**优势**:
- 实验可复现（版本控制配置文件）
- 对比实验简单（复制并修改YAML）
- 无需修改代码

---

### 🔌 高度可扩展

**三种扩展方式**:

1. **替换现有插件**
   - 在 YAML 中切换 `plugin: xxx`
   - 使用系统内置的其他变体

2. **实现自定义插件**
   - 继承接口（如 `ISettlement`）
   - 注册到对应的 Registry
   - 在 YAML 中指定自定义插件名

3. **添加新的 Phase 或子模块**
   - 定义新接口（在 `interfaces/`）
   - 实现插件（在 `modules/`）
   - 集成到管道（修改 `core/`）

详见 [创建自定义插件](../05-developer-guide/03-creating-plugins.md)。

---

## 适用场景

### 🔬 学术研究

- **经济机制设计**: 测试不同的拍卖、定价、激励机制
- **多智能体系统**: 研究协作、竞争、演化行为
- **机制设计理论**: 验证激励相容性、纳什均衡
- **分布式系统**: 研究共识、信任、安全机制

**示例论文主题**:
- "Performance-Based vs. Flat-Rate Settlement in Multi-Agent Task Markets"
- "Long-Term Dynamics of ELO-Based Agent Ranking Systems"
- "Collusion Detection in Decentralized Task Allocation"

---

### 💡 系统原型开发

- **AI Agent 平台**: 构建生产级多智能体系统
- **去中心化市场**: 设计点对点任务市场
- **众包平台**: 实现智能任务分配和质量控制
- **DAO 治理**: 测试去中心化的资源分配机制

---

### 📚 教学与培训

- **多智能体系统课程**: 可视化的教学案例
- **机制设计实验**: 让学生设计和测试经济规则
- **系统架构学习**: 理解插件化、工厂模式等设计模式

---

## 核心数据结构

### EconomicState（经济状态）

Phase 1-7 之间传递的核心状态对象：

```python
@dataclass
class EconomicState:
    """贯穿 Phase 1-7 的经济状态"""

    # Phase 1 初始化
    ledger: Ledger                          # 账本系统
    marketplace: Marketplace                # 市场机制
    participants: ParticipantRegistry       # 参与者注册表

    # Phase 2 任务创建
    published_tasks: List[Task]             # 已发布任务

    # Phase 3 任务分配
    allocations: Dict[str, Allocation]      # 任务分配记录

    # Phase 4 任务执行
    execution_results: Dict[str, Result]    # 执行结果

    # Phase 5 清结算
    settlements: List[Settlement]           # 结算记录

    # Phase 6 反馈与排名
    agent_ranks: Dict[str, AgentRank]       # Agent排名
    metrics: MetricsSnapshot                # 指标快照

    # Phase 7 资金池管理
    pool_state: PoolState                   # 资金池状态
    audit_report: AuditReport               # 审计报告
```

---

## 技术栈

- **语言**: Python 3.12+
- **智能体框架**: LangGraph
- **配置管理**: YAML + Pydantic
- **数据存储**: JSON / JSONL（可扩展到数据库）
- **服务架构**: FastAPI（API Server）
- **测试**: pytest
- **日志**: structlog

---

## 下一步

### 快速开始
- 👉 [安装指南](01-installation.md) - 配置环境
- 👉 [5分钟快速上手](02-quick-start.md) - 运行第一个实验

### 深入学习
- 📖 [七阶段管道详解](../03-architecture/03-seven-phase-pipeline.md)
- 📖 [插件系统架构](../03-architecture/04-plugin-system.md)
- 📖 [Phase 5-7 经济模块](../04-phase-modules/)

### 实战教程
- 🎯 [官方Demo运行](../07-demos-and-tutorials/01-official-demo.md)
- 🎯 [自定义数据集](../07-demos-and-tutorials/02-custom-dataset.md)
- 🎯 [机制对比实验](../07-demos-and-tutorials/03-mechanism-comparison.md)

---

## 常见问题

### Q1: Oikos 和其他多智能体框架有什么区别？

**Oikos 的独特之处**:
1. **经济机制优先**: 内置完整的账本、市场、结算系统
2. **可插件化**: 每个模块都可独立替换，无需修改代码
3. **完整的生命周期**: 从初始化到审计的 7 阶段闭环
4. **实验导向**: 专为对比实验和研究设计

其他框架（如 AutoGen, LangChain, CrewAI）更专注于智能体协作和对话，而 Oikos 关注经济激励和系统行为。

---

### Q2: 我需要懂区块链才能使用 Oikos 吗？

**不需要**。Oikos 是一个 **中心化的实验沙盒**，不涉及区块链技术。

虽然概念上借鉴了去中心化系统的设计（账本、市场、拍卖），但实现是完全中心化的，便于调试和研究。

---

### Q3: Oikos 可以用于生产环境吗？

**当前版本主要用于研究和原型开发**。

如果要用于生产：
- ✅ 经济模块（Phase 5-7）已经生产就绪
- 🔶 执行层（Phase 3-4）需要进一步封装
- ❌ 初始化层（Phase 1-2）需要完善

建议先在实验环境充分测试。

---

### Q4: 支持分布式部署吗？

当前版本是 **单机运行**。

分布式支持需要：
- 状态同步机制
- 分布式账本
- 服务发现与注册

这些功能在路线图中，但当前版本不支持。

---

**准备好开始了吗？** 👉 [安装 Oikos](01-installation.md)
