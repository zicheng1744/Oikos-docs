# 双 Agent 对抗 Demo（本地）

本指南对应当前仓库已验证可运行的场景：  
**仅使用 2 个本地 agent（1 好 1 坏）+ 20 条样本**，观察系统是否出现自然边缘化（评分、rank、调用率、资产分化）。

---

## 1. 适用目标

你会得到以下能力：

1. 从零开始配置环境并运行最小对抗实验。
2. 明确数据集、local workers、测试配置分别在哪里设置。
3. 一次命令跑完 20 轮 test。
4. 在 `exp/...` 中提取四类趋势：
   - 评分（score）
   - 排名（rank）
   - 调用率（call rate）
   - 资产（asset）

---

## 2. 环境准备（从 git clone 开始）

### 2.1 克隆

```bash
git clone <your-oikos-repo-url>
cd Holos-Oikos-Dev
```

### 2.2 创建环境

推荐使用项目内环境文件：

```bash
conda env create -f environment-holos.yml
conda activate holos
pip install -e .
```

### 2.3 配置 `.env`

```bash
cp .env.example .env
```

至少确保可用模型 API 配置正确（例如 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、模型名）。

---

## 3. Demo 的三类输入文件

这个实验依赖 3 个配置输入：

1. **数据集**：`recipes/TEMPLATE/data/*.jsonl`
2. **local workers**：`recipes/TEMPLATE/conf/local_workers.qa_adversarial.json`
3. **实验配置**：`recipes/TEMPLATE/conf/test_adversarial_two_agent.yaml`

### 3.1 数据集格式

推荐字段：

```json
{"id":"xxx","input":"...","target":"..."}
```

仓库内可直接用：

- `recipes/TEMPLATE/data/qa_squad_small.jsonl`（默认）
- `recipes/TEMPLATE/data/mmlu_20.jsonl`（20 条 MMLU 样本）

如果要切换到 MMLU 20，把 `test_adversarial_two_agent.yaml` 里 `data.dataset_path` 改为：

```yaml
data:
  dataset_path: "recipes/TEMPLATE/data/mmlu_20.jsonl"
```

### 3.2 本地 good/bad agent 配置

文件：`recipes/TEMPLATE/conf/local_workers.qa_adversarial.json`

该文件定义两个本地 worker：

1. `QA_Good_Agent`：`oikos.services.local_agents.good_agent_server`
2. `QA_Elite_Reasoner`：`oikos.services.local_agents.bad_agent_server`

注意：它们通过 `launch.module` 在 run 启动时自动拉起，且都走标准 A2A URL。

### 3.3 测试配置（关键开关）

文件：`recipes/TEMPLATE/conf/test_adversarial_two_agent.yaml`

关键项（建议保持）：

```yaml
runtime:
  orchestration_mode: "split_only"
  local_agents:
    enabled: true
    auto_start: true
    fail_fast: true
    workers_file: "recipes/TEMPLATE/conf/local_workers.qa_adversarial.json"
  worker_pool:
    local_workers_only: true

phase4_execution:
  task_routing:
    semantic_allow_lexical_fallback: false

economic:
  market:
    platform_subsidy_enabled: true
    subsidy_rate: 1.0
```

这组配置语义：

- Orchestrator 只做 DAG（split_only）
- 只用本地两 agent
- routing 禁 lexical fallback
- 平台 100% 资助

---

## 4. 运行命令（20 轮）

```bash
python -m oikos.cli test \
  --recipe TEMPLATE \
  --config recipes/TEMPLATE/conf/test_adversarial_two_agent.yaml \
  --max_episodes 20 \
  --run-id two_agent_local_20ep
```

---

## 5. 跑完后去哪里看结果

输出目录：

```text
exp/test/two_agent_local_20ep/
```

重点文件：

1. `overall/config_resolved.yaml`：确认本次生效配置
2. `overall/phase_trace.jsonl`：启动门禁、Phase 执行日志
3. `overall/conversation_trace.jsonl`：每轮会话级证据
4. `overall/node_ledger.jsonl`：节点级生命周期/评估/分配
5. `overall/results.json`：总体汇总
6. `overall/metrics/<run_id>/global_metrics.csv`
7. `overall/metrics/<run_id>/individual_profiles.csv`
8. `overall/workers.registry.export.json`：run 级 registry 导出

---

## 6. 如何提取四条趋势

## 6.1 调用率（按被分配 subtask 统计）

```bash
jq -r '
  .subtask_lifecycle // {} | to_entries[] |
  [.value.assigned_agent_url] | @tsv
' exp/test/two_agent_local_20ep/overall/conversation_trace.jsonl \
| sort | uniq -c
```

## 6.2 评分（按 subtask evaluation）

```bash
jq -r '
  (.subtask_evaluations // [])[] |
  [.agent_url, (.score_0_to_10|tostring)] | @tsv
' exp/test/two_agent_local_20ep/overall/conversation_trace.jsonl
```

## 6.3 rank（历史均分口径）

```bash
jq -r '
  .economic.phase6_feedback_subtasks[]? |
  [.agent_id, (.rank_position_new|tostring), (.historical_mean_score_0_to_10|tostring)] | @tsv
' exp/test/two_agent_local_20ep/overall/conversation_trace.jsonl
```

## 6.4 资产（账户变化）

```bash
jq '.accounts' exp/test/two_agent_local_20ep/overall/economic_state.json
```

---

## 7. 可视化（推荐最小脚本）

在仓库根目录新建 `scripts/plot_two_agent_demo.py`：

```python
import json
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

run_dir = Path("exp/test/two_agent_local_20ep/overall")
rows = [json.loads(x) for x in (run_dir / "conversation_trace.jsonl").read_text(encoding="utf-8").splitlines() if x.strip()]

score_records, rank_records, call_records = [], [], []
for i, r in enumerate(rows, start=1):
    for e in r.get("subtask_evaluations", []):
        score_records.append({"episode": i, "agent": e.get("agent_url"), "score": e.get("score_0_to_10")})
    for e in r.get("economic", {}).get("phase6_feedback_subtasks", []):
        rank_records.append({"episode": i, "agent": e.get("agent_id"), "rank": e.get("rank_position_new")})
    for _, node in (r.get("subtask_lifecycle") or {}).items():
        call_records.append({"episode": i, "agent": node.get("assigned_agent_url"), "calls": 1})

df_score = pd.DataFrame(score_records)
df_rank = pd.DataFrame(rank_records)
df_call = pd.DataFrame(call_records).groupby(["episode","agent"], as_index=False)["calls"].sum()

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for agent, g in df_score.groupby("agent"):
    axes[0].plot(g["episode"], g["score"], marker="o", label=agent)
axes[0].set_title("Score Trend")
axes[0].legend()

for agent, g in df_rank.groupby("agent"):
    axes[1].plot(g["episode"], g["rank"], marker="o", label=agent)
axes[1].set_title("Rank Trend")
axes[1].legend()

for agent, g in df_call.groupby("agent"):
    axes[2].plot(g["episode"], g["calls"], marker="o", label=agent)
axes[2].set_title("Call Count Trend")
axes[2].legend()

plt.tight_layout()
plt.savefig(run_dir / "two_agent_trends.png", dpi=180)
print("saved:", run_dir / "two_agent_trends.png")
```

运行：

```bash
python scripts/plot_two_agent_demo.py
```

---

## 8. 结果解读建议

你应重点检查：

1. **初期是否两边都有调用**（探索阶段）
2. **坏 agent 的均分是否持续偏低**
3. **rank 是否随历史均分分化**
4. **后半程调用率是否向好 agent 集中**
5. **资产曲线是否出现好坏分化**

若没有分化，优先排查：

1. evaluator 是否稳定产分（`regex_matched` 与 `score_0_to_10`）
2. routing 是否读取历史反馈并生效
3. bad agent 是否真的返回低质量输出

---

## 9. 常见问题

### Q1: 启动即失败（local agents）

检查：

1. `runtime.local_agents.fail_fast` 是否为 `true`
2. `workers_file` 路径是否存在
3. `launch.module` 能否在当前环境 import
4. 端口是否被占用

### Q2: 想接着上一次继续 train/test

把上次产物 `overall/workers.registry.export.json` 作为新 run seed：

```yaml
runtime:
  worker_pool:
    registry_seed_file: "exp/test/<prev_run>/overall/workers.registry.export.json"
```

