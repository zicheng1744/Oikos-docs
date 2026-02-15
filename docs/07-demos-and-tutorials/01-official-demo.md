# 官方 Demo 运行指南

本指南将带您运行 Oikos 的官方 Demo，快速体验系统的核心功能。

---

## Demo 概述

Oikos 提供三类官方 Demo，对应三种实验模式：

| Demo 类型 | 用途 | 时长 | 适合场景 |
|----------|------|------|---------|
| **Chat Demo** | 快速验证端到端流程 | 2-3 分钟 | 首次体验、调试 |
| **Test Demo** | 固定数据集评测 | 20-30 分钟 | 机制对比、性能评估 |
| **Train Demo** | 多轮训练与演化 | 1-2 小时 | 长期实验、冷启动 |

---

## 前提条件

确保您已完成：
- ✅ [安装 Oikos](../../01-getting-started/01-installation.md)
- ✅ 配置 `.env` 文件（设置 `OPENAI_API_KEY`）
- ✅ 激活 conda 环境：`conda activate holos`

---

## Demo 1: Chat Demo（5分钟快速体验）

### 用途

- 快速验证系统安装
- 理解 7 阶段管道流程
- 查看单次会话的完整输出

### 运行步骤

#### 步骤 1: 进入项目目录

```bash
cd /home/zicheng/holos/Holos-Oikos-Dev
conda activate holos
```

#### 步骤 2: 运行 Chat Demo

```bash
python -m oikos.cli chat --recipe TEMPLATE
```

**可选参数**:
```bash
# 自定义输出目录
python -m oikos.cli chat --recipe TEMPLATE --output-dir exp/my_chat

# 自定义 run_id
python -m oikos.cli chat --recipe TEMPLATE --run-id chat-demo-001
```

#### 步骤 3: 观察执行过程

系统会自动完成以下步骤：

```
[INFO] Starting Oikos Chat Demo...
[INFO] ========================================
[INFO] Initializing services...

1️⃣ 启动服务
[INFO] Starting API Server on port 8000... ✓
[INFO] Starting NVWA Agent Server on port 10000... ✓
[INFO] Starting Retrieval Service on port 10003... ✓
[INFO] Starting Evaluator Service on port 10002... ✓

2️⃣ 执行 7 阶段管道（以下为示意日志，实际端口/数值以 run 输出为准；端口冲突时会自动重映射）
[Phase 1] Sandbox Initialization...
  ├─ Loading configuration
  ├─ Initializing participants (User, Agent, Orchestrator, Platform)
  ├─ Setting up Ledger system
  └─ Initializing Marketplace ✓

[Phase 2] Task Creation...
  ├─ Extracting task from user input
  ├─ Task pricing: $100
  └─ Publishing task to marketplace ✓

[Phase 3] Task Allocation...
  ├─ Collecting bids from orchestrators (default recipe: 1 bid; multi-hub 可扩展)
  ├─ Running first-price auction
  └─ Winner: orchestrator-1 (bid: $85) ✓

[Phase 4] Task Execution...
  ├─ Task planning (decomposed into 4 subtasks)
  ├─ Routing subtasks to workers
  ├─ Executing subtasks in parallel
  ├─ Evaluating results (score: 0.85)
  └─ Execution completed ✓

[Phase 5] Settlement...
  ├─ Result evaluation (quality: 0.85)
  ├─ Calculating payment distribution
  ├─ Platform: $10, Orchestrator: $15, Worker: $72
  └─ Updating ledger ✓

[Phase 6] Feedback & Ranking...
  ├─ Evaluating agent performance
  ├─ Updating agent ranks
  └─ Collecting metrics ✓

[Phase 7] Pool Management...
  ├─ Health check (status: HEALTHY)
  ├─ Economic audit (conservation: PASSED)
  └─ Circuit breaker check ✓

3️⃣ 保存结果
[INFO] Results saved to: exp/chat/chat-2026-02-14-1215/

4️⃣ 停止服务
[INFO] Stopping all services...
[INFO] All services stopped successfully.

✅ Chat Demo completed!
```

⏱️ **总时长**: 2-3 分钟

---

### 查看 Chat Demo 结果

#### 输出目录结构

```bash
cd exp/chat/chat-2026-02-14-1215/
tree -L 3
```

```
exp/chat/chat-2026-02-14-1215/
├── conversations/                          # 会话级数据
│   └── episode_0__thread_abc123/
│       ├── summary.json                    # 会话摘要
│       ├── record.json                     # 对话记录
│       ├── trace.json                      # DAG 执行轨迹
│       ├── phase_trace.jsonl               # Phase 1-7 事件流
│       ├── node_ledger.jsonl               # 节点级账本
│       ├── economic.json                   # 经济状态快照
│       └── telemetry_events.jsonl          # Telemetry 事件
│
├── overall/                                # 全局级数据
│   ├── config_resolved.yaml                # 解析后的配置
│   ├── results.json                        # 汇总指标
│   ├── summary.json                        # 总结
│   ├── economic_state.json                 # 最终经济状态
│   ├── economic_audit.json                 # 资金守恒审计
│   └── agent_ranks.json                    # Agent 排名
│
└── runtime/                                # 运行时数据
    ├── logs/
    │   ├── main_api_pid_*.log             # API 服务日志
    │   ├── main_nvwa_pid_*.log            # NVWA 服务日志
    │   ├── main_retrieval_pid_*.log       # Retrieval 服务日志
    │   └── main_evaluator_pid_*.log       # Evaluator 服务日志
    └── pids/
        └── history.jsonl                   # 进程历史
```

#### 快速查看关键结果

```bash
# 1. 查看会话摘要
cat conversations/episode_0__*/summary.json | jq .

# 2. 查看 DAG 执行轨迹
cat conversations/episode_0__*/trace.json | jq '.nodes | length'

# 3. 查看经济状态
cat overall/economic_state.json | jq .

# 4. 查看资金守恒审计（重要！）
cat overall/economic_audit.json | jq .
```

#### 示例输出 - 经济审计报告

```json
{
  "audit_timestamp": "2026-02-14T12:15:00Z",
  "total_conservation_check": "PASSED",
  "conservation_error": 0.0,
  "discrepancies": [],
  "summary": {
    "total_inflow": 1000.0,
    "total_outflow": 1000.0,
    "platform_revenue": 100.0,
    "orchestrator_earnings": 150.0,
    "agent_earnings": 720.0,
    "insurance_pool": 30.0
  },
  "detailed_flows": [
    {
      "flow_type": "User → Platform",
      "amount": 100.0,
      "description": "Platform fee (10%)"
    },
    {
      "flow_type": "User → Orchestrator",
      "amount": 150.0,
      "description": "Orchestrator coordination fee (15%)"
    },
    {
      "flow_type": "User → Worker",
      "amount": 720.0,
      "description": "Worker task payment (72%)"
    },
    {
      "flow_type": "User → Insurance Pool",
      "amount": 30.0,
      "description": "Insurance fee (3%)"
    }
  ]
}
```

> ✅ `conservation_error: 0.0` - 资金完全守恒！

---

## Demo 2: Test Demo（完整流程评测）

### 用途

- 在固定数据集上评估系统性能
- 对比不同的经济机制
- 收集详细的性能指标

### 运行步骤

#### 步骤 1: 准备数据集（可选）

Test Demo 默认使用内置的测试数据集。如果想使用自定义数据集：

```bash
# 查看默认数据集
ls recipes/TEMPLATE/data/

# 或准备自己的数据集
# 参考：数据集准备指南
```

#### 步骤 2: 运行 Test Demo

```bash
# 运行 20 个任务
python -m oikos.cli test --recipe TEMPLATE --max_episodes 20
```

**可选参数**:
```bash
# 自定义输出目录和任务数量
python -m oikos.cli test --recipe TEMPLATE \
  --output-dir exp/test_experiment \
  --max_episodes 50 \
  --run-id test-baseline

# 使用自定义配置文件
python -m oikos.cli test --recipe TEMPLATE \
  --config recipes/TEMPLATE/conf/my_test_config.yaml \
  --max_episodes 30
```

#### 步骤 3: 实时监控进度

在另一个终端查看实时日志：

```bash
# 找到最新的运行目录
cd exp/test/test-2026-02-14-*/

# 实时监控 API 日志
tail -f runtime/logs/main_api_pid_*.log

# 实时监控整体进度
watch -n 5 'ls conversations/ | wc -l'
```

#### 步骤 4: 等待完成

```
Progress: [████████████████████] 20/20 episodes
Estimated time remaining: 0 minutes

✅ Test Demo completed!
Total episodes: 20
Success rate: 95.0%
Average quality: 0.82
Results saved to: exp/test/test-2026-02-14-1220/
```

⏱️ **总时长**: 20-30 分钟（20 个任务）

---

### 查看 Test Demo 结果

#### 全局指标分析

```bash
cd exp/test/test-2026-02-14-1220/

# 查看总体结果
cat overall/results.json | jq .
```

**示例输出** - `results.json`:

```json
{
  "experiment_info": {
    "run_id": "test-2026-02-14-1220",
    "mode": "test",
    "total_episodes": 20,
    "success_count": 19,
    "failure_count": 1
  },
  "performance_metrics": {
    "success_rate": 0.95,
    "average_quality": 0.82,
    "average_latency_sec": 15.3,
    "throughput_tasks_per_min": 1.2
  },
  "economic_metrics": {
    "total_revenue": 2000.0,
    "platform_earnings": 200.0,
    "orchestrator_earnings": 300.0,
    "agent_total_earnings": 1440.0,
    "insurance_pool_balance": 60.0
  },
  "agent_statistics": {
    "total_agents": 10,
    "active_agents": 8,
    "top_agent_earnings": 320.0,
    "average_agent_earnings": 144.0,
    "gini_coefficient": 0.28
  }
}
```

#### Agent 排名演化

```bash
# 查看最终排名
cat overall/agent_ranks.json | jq '.ranks | sort_by(-.score) | .[0:5]'
```

**示例输出** - Top 5 Agents:

```json
[
  {
    "agent_id": "agent-003",
    "rank": 1,
    "score": 0.92,
    "total_tasks": 12,
    "success_rate": 0.92,
    "avg_quality": 0.88,
    "total_earnings": 320.0
  },
  {
    "agent_id": "agent-007",
    "rank": 2,
    "score": 0.87,
    "total_tasks": 10,
    "success_rate": 0.90,
    "avg_quality": 0.85,
    "total_earnings": 280.0
  },
  ...
]
```

#### 时序指标分析

```bash
# 查看详细指标文件
ls overall/metrics/

# 输出：
# global_metrics.csv           # 全局指标时间序列
# individual_profiles.csv      # 个体 Agent 指标
```

**分析指标演化**（Python）:

```python
import pandas as pd
import matplotlib.pyplot as plt

# 加载全局指标
df = pd.read_csv('overall/metrics/global_metrics.csv')

# 查看列
print(df.columns)
# Output: ['episode', 'success_rate', 'avg_quality', 'platform_revenue', ...]

# 绘制成功率演化
plt.plot(df['episode'], df['success_rate'])
plt.xlabel('Episode')
plt.ylabel('Success Rate')
plt.title('Success Rate Evolution')
plt.savefig('success_rate.png')
```

---

## Demo 3: Train Demo（长期演化实验）

### 用途

- 冷启动系统（建立初始 Agent 信誉）
- 观察 Agent 排名演化
- 研究长期市场动态
- 测试经济系统可持续性

### 运行步骤

#### 步骤 1: 运行 Train Demo

```bash
# 运行 50 轮训练
python -m oikos.cli train --recipe TEMPLATE --max_episodes 50
```

**推荐参数**:
```bash
# 短期训练（快速冷启动）
python -m oikos.cli train --recipe TEMPLATE --max_episodes 20

# 中期训练（观察演化）
python -m oikos.cli train --recipe TEMPLATE --max_episodes 100

# 长期训练（稳定状态）
python -m oikos.cli train --recipe TEMPLATE --max_episodes 500
```

#### 步骤 2: 保存 Checkpoint（可选）

Train 模式会自动保存 checkpoint：

```bash
# Checkpoint 保存位置
ls exp/train/train-*/checkpoints/

# 输出：
# checkpoint_episode_10.pkl
# checkpoint_episode_20.pkl
# checkpoint_episode_50.pkl
```

#### 步骤 3: 从 Checkpoint 恢复（可选）

```bash
# 从上次停止的地方继续训练
python -m oikos.cli train --recipe TEMPLATE \
  --load_checkpoint exp/train/train-2026-02-14-1230/checkpoints/checkpoint_episode_50.pkl \
  --max_episodes 100
```

⏱️ **总时长**: 1-2 小时（50 轮）

---

### 分析 Train Demo 结果

#### Agent 排名演化曲线

```python
import json
import matplotlib.pyplot as plt

# 加载 agent_ranks.json
with open('overall/agent_ranks.json', 'r') as f:
    data = json.load(f)

# 提取演化数据
evolution = data['evolution']  # List of snapshots at different episodes

# 绘制 Top 3 Agent 的分数演化
episodes = [snapshot['episode'] for snapshot in evolution]

for agent_id in ['agent-001', 'agent-003', 'agent-007']:
    scores = [
        next((a['score'] for a in snapshot['ranks'] if a['agent_id'] == agent_id), 0)
        for snapshot in evolution
    ]
    plt.plot(episodes, scores, label=agent_id)

plt.xlabel('Episode')
plt.ylabel('Agent Score')
plt.title('Top Agents Score Evolution')
plt.legend()
plt.savefig('agent_evolution.png')
```

#### 经济系统健康度

```bash
# 查看经济状态演化
cat overall/economic_state.json | jq '.pool_state'
```

**示例输出**:

```json
{
  "pool_state": {
    "total_balance": 5000.0,
    "reserve_balance": 1000.0,
    "insurance_balance": 500.0,
    "reinvestment_balance": 200.0,
    "health_status": "HEALTHY",
    "solvency_ratio": 1.2,
    "liquidity_ratio": 0.8
  }
}
```

---

## Demo 4: 机制对比实验

### 用途

- 对比不同的结算机制（Phase 5）
- 对比不同的排名算法（Phase 6）
- 研究机制设计的影响

### 实验设计

#### 实验 A: 默认结算机制

```bash
# 使用默认配置运行
python -m oikos.cli test --recipe TEMPLATE \
  --output-dir exp/comparison/baseline \
  --run-id baseline \
  --max_episodes 50
```

配置文件 `test_config.yaml`:
```yaml
phase5_settlement:
  settlement:
    plugin: "default_settlement"  # 基础分成模型
```

---

#### 实验 B: 基于性能的结算机制

复制并修改配置文件：

```bash
# 复制配置
cp recipes/TEMPLATE/conf/test_config.yaml recipes/TEMPLATE/conf/performance_based_config.yaml

# 编辑配置文件
vim recipes/TEMPLATE/conf/performance_based_config.yaml
```

修改结算插件：
```yaml
phase5_settlement:
  settlement:
    plugin: "performance_based_settlement"  # 基于性能的结算
    config:
      base_fee_rate: 0.1
      performance_multiplier: 1.5
      quality_threshold: 0.8
```

运行实验 B：
```bash
python -m oikos.cli test --recipe TEMPLATE \
  --config recipes/TEMPLATE/conf/performance_based_config.yaml \
  --output-dir exp/comparison/performance_based \
  --run-id performance-based \
  --max_episodes 50
```

---

### 对比分析结果

#### 方案 1: 手动对比

```bash
# 对比总体指标
echo "=== Baseline ==="
cat exp/comparison/baseline/overall/results.json | jq '.economic_metrics'

echo "=== Performance-Based ==="
cat exp/comparison/performance_based/overall/results.json | jq '.economic_metrics'
```

#### 方案 2: 使用内置 parity/gate 工具

```bash
# 抽取 Oikos run 的对标指标
python scripts/m7_holos_parity.py extract-oikos \
  --run-dir exp/comparison/baseline \
  --out exp/comparison/baseline/overall/oikos_parity_metrics.json

python scripts/m7_holos_parity.py extract-oikos \
  --run-dir exp/comparison/performance_based \
  --out exp/comparison/performance_based/overall/oikos_parity_metrics.json

# 与 Holos baseline 比较（可选）
python scripts/m7_holos_parity.py compare \
  --oikos exp/comparison/performance_based/overall/oikos_parity_metrics.json \
  --holos benchmarks/holos_parity/holos_baseline_seed42.json \
  --thresholds benchmarks/holos_parity/thresholds.yaml \
  --report exp/comparison/performance_based/overall/holos_parity_report.json
```

**示例输出**:

```
============================================================
Metric                    Baseline        Performance-Based Δ%
============================================================
success_rate              0.9500          0.9600          +1.05%
average_quality           0.8200          0.8700          +6.10%
gini_coefficient          0.2800          0.2400          -14.29%
============================================================

Economic Metrics:
============================================================
platform_earnings         200.00          210.00          +5.00%
agent_total_earnings      1440.00         1500.00         +4.17%
gini_coefficient          0.2800          0.2400          -14.29%
============================================================
```

**结论**:
- ✅ Performance-Based 机制提高了 6.1% 的质量
- ✅ 降低了 14.3% 的基尼系数（更公平）
- ✅ Agent 总收益增加了 4.2%

---

## Demo 输出解读

### 会话级输出（单次任务）

位置: `conversations/<episode>__<thread_id>/`

| 文件 | 内容 | 用途 |
|------|------|------|
| `summary.json` | 会话摘要（任务、结果、耗时） | 快速了解单次任务 |
| `trace.json` | DAG 执行轨迹 | 分析任务分解与执行流程 |
| `phase_trace.jsonl` | Phase 1-7 事件流 | 详细追踪每个阶段 |
| `node_ledger.jsonl` | 节点级账本记录 | 审计每个节点的资金流 |
| `economic.json` | 经济状态快照 | 查看任务的经济影响 |

---

### 全局级输出（整个实验）

位置: `overall/`

| 文件 | 内容 | 用途 |
|------|------|------|
| `results.json` | 汇总指标 | 整体性能评估 |
| `economic_state.json` | 最终经济状态 | 经济系统健康度 |
| `economic_audit.json` | 资金守恒审计 | **验证资金守恒** ⭐ |
| `agent_ranks.json` | Agent 排名与演化 | 分析 Agent 行为 |
| `metrics/global_metrics.csv` | 时序全局指标 | 绘制演化曲线 |
| `metrics/individual_profiles.csv` | 个体 Agent 指标 | 深入分析个体 |

---

## 常见 Demo 问题

### Q1: Demo 运行失败，服务无法启动

**症状**:
```
ERROR: Failed to start API Server
Port 8000 is already in use
```

**解决方案**:

```bash
# 1. 检查端口占用
lsof -i :8000
lsof -i :10000

# 2. 终止占用进程
kill -9 <PID>

# 3. 或修改 .env 中的端口
echo "API_PORT=8001" >> .env
echo "NVWA_PORT=10001" >> .env

# 4. 重新运行 Demo
```

---

### Q2: Demo 运行时 API Key 错误

**症状**:
```
openai.error.AuthenticationError: Incorrect API key
```

**解决方案**:

```bash
# 1. 检查 .env 配置
cat .env | grep OPENAI_API_KEY

# 2. 确认 API Key 有效性
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 3. 重新设置 API Key
echo "OPENAI_API_KEY=sk-your-actual-key" >> .env
```

---

### Q3: Demo 结果中资金不守恒

**症状**:
```json
{
  "total_conservation_check": "FAILED",
  "conservation_error": 0.05
}
```

**解决方案**:

```bash
# 1. 查看详细审计报告
cat overall/economic_audit.json | jq '.discrepancies'

# 2. 检查配置文件中的费率设置
cat recipes/TEMPLATE/conf/test_config.yaml | grep -A 10 "economic_system"

# 3. 报告 Bug（如果是系统问题）
# 附带 economic_audit.json 和配置文件
```

> 💡 **提示**: 资金守恒是 Oikos 的核心保证，任何不守恒都应该被视为 Bug。

---

### Q4: Train Demo 运行很慢

**优化建议**:

```yaml
# 在配置文件中启用并行执行
runtime:
  parallel_execution: true
  max_parallel_plans: 8  # 根据您的 CPU 核心数调整

# 使用更快的模型
runtime:
  model_name: "gpt-3.5-turbo"  # 而不是 gpt-4

# 减少 Agent 数量（测试阶段）
phase1_init:
  participants:
    num_agents: 5  # 而不是 10
```

---

### Q5: 如何在 Demo 中使用自定义数据集？

**方法**:

```bash
# 1. 准备数据集
cp my_dataset.jsonl recipes/TEMPLATE/data/

# 2. 修改配置文件
vim recipes/TEMPLATE/conf/test_config.yaml
```

修改数据集路径：
```yaml
data:
  dataset_path: "recipes/TEMPLATE/data/my_dataset.jsonl"
```

```bash
# 3. 运行 Demo
python -m oikos.cli test --recipe TEMPLATE --max_episodes 10
```

详见 [数据集准备指南](../../02-user-guide/02-dataset-preparation.md)。

---

## 下一步

Demo 运行完成后，您可以：

### 深入学习

1. 👉 [理解输出结果](../../01-getting-started/04-understanding-outputs.md) - 详细解读输出文件
2. 👉 [配置文件详解](../../02-user-guide/03-configuration-guide.md) - 学习配置选项
3. 👉 [经济机制选择](../../02-user-guide/07-economic-mechanisms.md) - 了解 9 种结算机制

### 进阶实验

1. 👉 [自定义数据集教程](02-custom-dataset.md) - 使用您的数据
2. 👉 [机制对比实验](03-mechanism-comparison.md) - 设计对比实验
3. 👉 [自定义插件开发](04-custom-plugin.md) - 开发您的机制

### 研究指南

1. 👉 [实验设计方法](../../08-research-guide/01-experimental-design.md) - 科学实验设计
2. 👉 [对比研究指南](../../08-research-guide/02-comparative-studies.md) - 机制对比研究
3. 👉 [经济机制分析](../../08-research-guide/03-economic-analysis.md) - 经济数据分析

---

## 附录: Demo 脚本参数

### oikos.cli chat 参数

```bash
python -m oikos.cli chat --recipe TEMPLATE [OPTIONS]

OPTIONS:
  --output-dir DIR    输出目录（默认: exp/chat）
  --run-id ID         自定义运行 ID（默认: 自动生成）
  --config FILE       配置文件路径（默认: conf/chat_config.yaml）
  --help              显示帮助信息
```

---

### oikos.cli test 参数

```bash
python -m oikos.cli test --recipe TEMPLATE [OPTIONS]

OPTIONS:
  --output-dir DIR      输出目录（默认: exp/test）
  --run-id ID           自定义运行 ID（默认: 自动生成）
  --max_episodes N      运行任务数量（默认: 10）
  --config FILE         配置文件路径（默认: conf/test_config.yaml）
  --help                显示帮助信息
```

---

### oikos.cli train 参数

```bash
python -m oikos.cli train --recipe TEMPLATE [OPTIONS]

OPTIONS:
  --output-dir DIR          输出目录（默认: exp/train）
  --run-id ID               自定义运行 ID（默认: 自动生成）
  --max_episodes N          训练轮数（默认: 50）
  --config FILE             配置文件路径（默认: conf/train_config.yaml）
  --load_checkpoint FILE    从 checkpoint 恢复（可选）
  --save_interval N         保存 checkpoint 的间隔（默认: 10）
  --help                    显示帮助信息
```

---

**准备好开始实验了吗？** 👉 [自定义数据集教程](02-custom-dataset.md)
