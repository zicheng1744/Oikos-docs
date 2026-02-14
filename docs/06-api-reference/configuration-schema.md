# 配置文件Schema

Oikos 配置文件的完整Schema定义和说明。

---

## 目录

- [配置文件结构](#配置文件结构)
- [Phase配置详解](#phase配置详解)
- [Runtime配置](#runtime配置)
- [配置验证](#配置验证)
- [配置模板](#配置模板)

---

## 配置文件结构

### 顶层结构

```yaml
# 全局配置
mode: "test"                    # 运行模式: "chat", "train", "test"
max_episodes: 10                # 最大轮次数
dataset_path: "path/to/dataset.jsonl"  # 数据集路径
output_dir: "outputs/"          # 输出目录

# Phase 1-7 配置
phase1_init: { ... }
phase2_creation: { ... }
phase3_allocation: { ... }
phase4_execution: { ... }
phase5_settlement: { ... }
phase6_feedback: { ... }
phase7_pool_management: { ... }

# 运行时配置
runtime: { ... }
```

---

## Phase配置详解

### Phase 1: 初始化

```yaml
phase1_init:
  # 参与者初始化
  participants:
    plugin: "aether_participant_init"
    config:
      num_agents: 10              # Agent数量
      agent_source: "nvwa"        # Agent来源: "nvwa" 或 "local"
      orchestrator_type: "holos_orchestrator"  # Orchestrator类型

  # 经济系统初始化
  economic_system:
    plugin: "aether_economic_init"
    config:
      initial_agent_balance: 100.0       # Agent初始余额
      initial_public_pool: 10000.0       # 平台资金池
      initial_insurance_pool: 5000.0     # 保险金池
```

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `num_agents` | int | 10 | Agent数量,推荐 5-20 |
| `agent_source` | str | "nvwa" | "nvwa": 从NVWA服务获取, "local": 本地Agent |
| `initial_agent_balance` | float | 100.0 | Agent初始余额 |
| `initial_public_pool` | float | 10000.0 | 平台资金池初始值 |

---

### Phase 2: 任务创建

```yaml
phase2_creation:
  # 任务加载器
  task_creator:
    plugin: "default_task_creator"
    config:
      dataset_format: "jsonl"     # 数据集格式

  # 任务定价
  task_pricing:
    plugin: "difficulty_based_pricing"
    config:
      base_price: 100.0
      difficulty_multipliers:
        easy: 1.0
        medium: 1.5
        hard: 2.0
```

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `base_price` | float | 100.0 | 基础任务价格 |
| `difficulty_multipliers` | dict | - | 难度系数映射 |

---

### Phase 3: 任务分配

```yaml
phase3_allocation:
  allocator:
    plugin: "rank_based_allocator"
    config:
      top_k: 5                          # 选择Top-K Workers
      min_rank_score: 0.5               # 最低排名阈值
      use_domain_matching: true         # 是否使用领域匹配
      exploration_rate: 0.1             # 探索率 (选择低排名Agent)
```

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `top_k` | int | 5 | 选择的Worker数量,推荐 3-10 |
| `min_rank_score` | float | 0.5 | 最低排名分数,范围 [0.0, 1.0] |
| `use_domain_matching` | bool | true | 是否匹配任务领域 |
| `exploration_rate` | float | 0.1 | 探索率,范围 [0.0, 1.0] |

---

### Phase 4: 任务执行

```yaml
phase4_execution:
  executor:
    plugin: "langgraph_executor"
    config:
      max_steps: 50                     # 最大执行步数
      timeout: 300                      # 超时时间(秒)
      enable_parallel: true             # 启用并行执行
```

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_steps` | int | 50 | DAG最大步数 |
| `timeout` | int | 300 | 单个任务超时时间(秒) |
| `enable_parallel` | bool | true | 是否启用并行Worker |

---

### Phase 5: 清结算 ⭐

```yaml
phase5_settlement:
  # 结果评估
  result_eval:
    plugin: "default_result_eval"
    config:
      eval_method: "string_match"       # 评估方法: "string_match", "llm"

  # 结算机制
  settlement:
    plugin: "aether_second_price_contribution"  # ⭐ 推荐
    config:
      base_price: 100.0                 # 基础价格
      quality_bonus_rate: 0.5           # 质量奖励率
      platform_fee_rate: 0.05           # 平台费率 (5%)
      orchestrator_fee_rate: 0.1        # Orchestrator费率 (10%)
      insurance_rate: 0.03              # 保险率 (3%)
```

**可用插件**:
- `default_settlement`: 固定价格
- `aether_first_price_equal`: 第一价格拍卖 + 平均分配
- `aether_first_price_contribution`: 第一价格拍卖 + 按贡献分配
- `aether_second_price_equal`: 第二价格拍卖 + 平均分配
- `aether_second_price_contribution`: 第二价格拍卖 + 按贡献分配 ⭐
- `aether_second_price_intelligence`: 第二价格拍卖 + 按智能分配
- `aether_adversarial_contribution`: 对抗式拍卖(VCG) + 按贡献分配

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `base_price` | float | 100.0 | 基础任务价格 |
| `quality_bonus_rate` | float | 0.5 | 质量奖励率,范围 [0.0, 1.0] |
| `platform_fee_rate` | float | 0.05 | 平台费率,范围 [0.0, 1.0] |
| `orchestrator_fee_rate` | float | 0.1 | Orchestrator费率 |
| `insurance_rate` | float | 0.03 | 保险率 |

---

### Phase 6: 反馈与排名 ⭐

```yaml
phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"         # ⭐ 推荐
    config:
      algorithm: "agent_rank"           # 排名算法
      damping_factor: 0.85              # PageRank阻尼系数
      history_window: 10                # 历史窗口大小
      interaction_weight_method: "quality"  # 交互权重方法
```

**可用算法**:
- `random`: 随机排名 (Baseline)
- `avg_quality`: 平均质量
- `recent_success`: 近期成功率
- `weighted_history`: 加权历史
- `agent_rank`: AgentRank算法 ⭐

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `algorithm` | str | "agent_rank" | 排名算法名称 |
| `damping_factor` | float | 0.85 | PageRank阻尼系数,范围 [0.0, 1.0] |
| `history_window` | int | 10 | 历史窗口大小,推荐 5-20 |
| `interaction_weight_method` | str | "quality" | "quality", "count", "contribution" |

---

### Phase 7: 资金池管理

```yaml
phase7_pool_management:
  pool_manager:
    plugin: "aether_pool_manager"
    config:
      pool_allocation_rate: 0.3         # 分配率
      min_insurance_ratio: 0.2          # 最小保险池比例
      max_public_pool: 10000.0          # 平台池上限
```

**参数说明**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pool_allocation_rate` | float | 0.3 | 分配率,范围 [0.0, 1.0] |
| `min_insurance_ratio` | float | 0.2 | 最小保险池比例 |
| `max_public_pool` | float | 10000.0 | 平台池上限 |

---

## Runtime配置

```yaml
runtime:
  # 日志配置
  logging:
    level: "INFO"                       # 日志级别: DEBUG, INFO, WARNING, ERROR
    output_dir: "logs/"                 # 日志输出目录
    console_output: true                # 是否输出到控制台

  # 服务配置
  services:
    api_port: 8000                      # API服务端口
    nvwa_port: 10000                    # NVWA服务端口
    enable_telemetry: true              # 启用遥测

  # 性能配置
  performance:
    parallel_workers: 4                 # 并行Worker数
    batch_size: 1                       # 批处理大小
    cache_enabled: true                 # 启用缓存
```

---

## 配置验证

### 使用ConfigManager验证

```python
from core.config_manager import ConfigManager

# 加载配置
config = ConfigManager.load("recipes/TEMPLATE/conf/test_config.yaml")

# 验证配置
try:
    ConfigManager.validate(config)
    print("✓ 配置验证通过")
except ValueError as e:
    print(f"✗ 配置验证失败: {e}")
```

### 必需字段检查

```python
REQUIRED_KEYS = [
    "mode",
    "phase1_init",
    "phase2_creation",
    "phase3_allocation",
    "phase4_execution",
    "phase5_settlement",
    "phase6_feedback",
    "phase7_pool_management"
]

def validate_config(config: Dict) -> bool:
    """验证配置完整性"""
    for key in REQUIRED_KEYS:
        if key not in config:
            raise ValueError(f"Missing required key: {key}")
    return True
```

---

## 配置模板

### Chat模式配置

```yaml
# recipes/TEMPLATE/conf/chat_config.yaml

mode: "chat"
max_episodes: 1

# 简化的Phase配置
phase1_init:
  participants:
    plugin: "aether_participant_init"
    config:
      num_agents: 3
      agent_source: "nvwa"

phase5_settlement:
  settlement:
    plugin: "default_settlement"
    config:
      base_price: 100.0

phase6_feedback:
  agent_eval:
    plugin: "default_agent_eval"
```

---

### Test模式配置

```yaml
# recipes/TEMPLATE/conf/test_config.yaml

mode: "test"
max_episodes: 10
dataset_path: "recipes/TEMPLATE/datasets/test_dataset.jsonl"
output_dir: "recipes/TEMPLATE/outputs/test/"

phase1_init:
  participants:
    plugin: "aether_participant_init"
    config:
      num_agents: 10
      agent_source: "nvwa"

  economic_system:
    plugin: "aether_economic_init"
    config:
      initial_agent_balance: 100.0
      initial_public_pool: 10000.0

phase5_settlement:
  result_eval:
    plugin: "default_result_eval"

  settlement:
    plugin: "aether_second_price_contribution"
    config:
      base_price: 100.0
      quality_bonus_rate: 0.5
      platform_fee_rate: 0.05

phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"
    config:
      algorithm: "agent_rank"
      damping_factor: 0.85
      history_window: 10
```

---

### Train模式配置

```yaml
# recipes/TEMPLATE/conf/train_config.yaml

mode: "train"
max_episodes: 100                # 长期训练
dataset_path: "recipes/TEMPLATE/datasets/train_dataset.jsonl"
output_dir: "recipes/TEMPLATE/outputs/train/"

# 启用排名演化
phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"
    config:
      algorithm: "agent_rank"
      damping_factor: 0.85
      history_window: 20          # 更大的历史窗口

# 动态池管理
phase7_pool_management:
  pool_manager:
    plugin: "aether_pool_manager"
    config:
      pool_allocation_rate: 0.3
      min_insurance_ratio: 0.2
```

---

## 实验对比配置

### 机制对比实验

创建多个配置文件,只改变关键机制:

**实验A: 固定价格**
```yaml
# exp_a_fixed.yaml
phase5_settlement:
  settlement:
    plugin: "default_settlement"
    config:
      base_price: 100.0

phase6_feedback:
  agent_eval:
    plugin: "default_agent_eval"  # 随机排名
```

**实验B: 第二价格拍卖 + AgentRank**
```yaml
# exp_b_auction_rank.yaml
phase5_settlement:
  settlement:
    plugin: "aether_second_price_contribution"
    config:
      base_price: 100.0

phase6_feedback:
  agent_eval:
    plugin: "aether_agent_eval"
    config:
      algorithm: "agent_rank"
```

**运行对比**:
```bash
# 实验A
python -m oikos.cli run --mode test \
  --config recipes/TEMPLATE/conf/modules.yaml \
  --config recipes/TEMPLATE/conf/economic.yaml \
  --config recipes/exp_a_fixed.yaml \
  --output-dir outputs/exp_a/

# 实验B
python -m oikos.cli run --mode test \
  --config recipes/TEMPLATE/conf/modules.yaml \
  --config recipes/TEMPLATE/conf/economic.yaml \
  --config recipes/exp_b_auction_rank.yaml \
  --output-dir outputs/exp_b/

# 对比结果
python scripts/compare_experiments.py outputs/exp_a/ outputs/exp_b/
```

---

## 配置继承

### 使用基础配置

```yaml
# base_config.yaml
_base_: null

mode: "test"
max_episodes: 10

phase1_init:
  # ... 通用配置
```

```yaml
# experiment_config.yaml
_base_: "base_config.yaml"

# 只覆盖需要修改的部分
phase5_settlement:
  settlement:
    plugin: "aether_second_price_contribution"
```

---

## 环境变量替换

配置文件支持环境变量:

```yaml
phase1_init:
  participants:
    config:
      num_agents: ${NUM_AGENTS:10}      # 默认10

runtime:
  services:
    api_port: ${API_PORT:8000}          # 默认8000
```

使用:
```bash
export NUM_AGENTS=20
export API_PORT=8080
python -m oikos.cli run --mode test \
  --config recipes/TEMPLATE/conf/modules.yaml \
  --config recipes/TEMPLATE/conf/economic.yaml \
  --config config.yaml
```

---

## 总结

Oikos 配置系统提供:

✅ **完整的Schema定义** - 所有Phase可配置
✅ **多种配置模板** - Chat/Test/Train模式
✅ **配置验证** - 自动检查必需字段
✅ **环境变量支持** - 灵活配置
✅ **配置继承** - 复用通用配置

通过配置文件,可以轻松切换不同的经济机制和实验设置。

---

**相关文档**:
- 👉 [phase5-api.md](phase5-api.md) - Phase 5 API参考
- 👉 [phase6-api.md](phase6-api.md) - Phase 6 API参考
- 👉 [../02-user-guide/03-configuration-guide.md](../02-user-guide/03-configuration-guide.md) - 配置指南
