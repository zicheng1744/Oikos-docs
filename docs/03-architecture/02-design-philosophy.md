# 设计理念

## 1. Phase 化

系统按 7 个阶段组织执行，避免把业务逻辑塞进单个巨型流程。

## 2. 抽象与实现分离

- `interfaces/` 定义契约
- `modules/` 放实现

这样做的目的：在不改主流程的情况下替换模块策略。

## 3. 配置驱动

实验行为主要由 YAML 驱动，脚本会合并多份配置并生成 `overall/config_resolved.yaml`。

## 4. 结果可审计

每次运行都生成会话级与全局级产物（trace/ledger/metrics/audit），支持复盘与回归。
