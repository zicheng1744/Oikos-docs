# 七阶段管道

当前主链路采用 7 阶段组织：

1. `phase1_init`：初始化（参与者、基础状态、任务池等）
2. `phase2_creation`：任务抽取/定价/发布
3. `phase3_allocation`：分配与安全检查
4. `phase4_execution`：规划、路由、执行、结果评估
5. `phase5_settlement`：清结算
6. `phase6_feedback`：反馈与排名更新
7. `phase7_pool`：资金池与审计

## 关键说明

- 每个阶段会写入 `overall/phase_trace.jsonl`。
- `conversations/<id>/phase_trace.jsonl` 是按会话切分后的阶段事件。
- 审计结果在 `overall/economic_audit.json`，核心字段在 `conservation`（而非旧字段 `conservative`）。
- 默认 recipe 下 Phase 3 采用单 orchestrator 路径（`num_hubs: 1`），优先保证链路稳定和审计一致性。
