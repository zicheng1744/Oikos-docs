# 核心 API 参考

本文档描述当前 Oikos 核心层（`core/`）的稳定抽象与常用调用方式。

---

## 目录

- [BasePlugin](#baseplugin)
- [PluginRegistry](#pluginregistry)
- [PluginFactory](#pluginfactory)
- [OikosConfig](#oikosconfig)
- [PhaseRunner](#phaserunner)

---

## BasePlugin

**文件**: `core/plugin.py`

`BasePlugin` 是插件生命周期基类，当前实现以 `initialize/start/stop` 为主，同时支持状态与元信息管理。

```python
from oikos.core.plugin import BasePlugin, PluginConfig

class MyPlugin(BasePlugin):
    metadata = ...

    def initialize(self, **kwargs) -> None:
        ...

    def start(self) -> None:
        ...

    def stop(self) -> None:
        ...
```

要点：
- 插件实例化后由工厂注入配置并调用 `initialize(...)`。
- 生命周期方法在实现层中定义，不应放在 `interfaces/*` 契约层。

---

## PluginRegistry

**文件**: `core/registry.py`

`PluginRegistry` 维护插件类型到插件实现的注册表，供工厂检索与实例化。

常用方法：
- `register(plugin_type, plugin_name, plugin_class, ...)`
- `get(plugin_type, plugin_name)`
- `list_plugins(plugin_type)`

```python
from oikos.core.registry import PluginRegistry
from oikos.modules.phase2.task_extraction_modules import DefaultTaskExtraction

registry = PluginRegistry()
registry.register(
    plugin_type="phase2_creation.task_extraction",
    plugin_name="default_task_extraction",
    plugin_class=DefaultTaskExtraction,
)
```

---

## PluginFactory

**文件**: `core/factory.py`

`PluginFactory` 负责按“插件类型 + 插件名 + 配置”创建并初始化插件实例。

```python
from oikos.core.factory import PluginFactory
from oikos.core.registry import PluginRegistry
from oikos.core.plugin import PluginConfig

registry = PluginRegistry()
factory = PluginFactory(
    plugin_type="phase4_execution.task_routing",
    registry=registry,
)

routing = factory.create(
    plugin_name="default_task_routing",
    config=PluginConfig(enabled=True),
)
```

异常约定：
- 插件不存在：`PluginCreationError(error_code="PLUGIN_NOT_FOUND")`
- 插件构造/初始化失败：`PluginCreationError(error_code="PLUGIN_CREATE_FAILED")`

---

## OikosConfig

**文件**: `core/config.py`

`OikosConfig` 是系统级配置对象，支持从 YAML/JSON 加载：

```python
from oikos.core.config import OikosConfig

cfg = OikosConfig.from_yaml("oikos.yaml")
```

CLI 实验链路中，Phase 配置通常来自 recipe 下的多份 YAML 叠加（`modules.yaml`、`economic.yaml`、`<mode>_config.yaml`）。

---

## PhaseRunner

**文件**: `core/phase.py`

`PhaseRunner` 执行 1~7 阶段，并对阶段依赖和数据契约做校验（fail-fast）。

关键数据结构：
- `PhaseState`
- `PhaseResult`
- `PHASE_DATA_CONTRACTS`

典型执行流程：
1. 注册 phase 实现。
2. 构建初始 `PhaseState`。
3. 按阶段执行并产出 `PhaseResult`。
4. 依赖缺失或输入 key 缺失时抛出 `PhaseDependencyError` / `PhaseContractError`。

```python
from oikos.core.phase import PhaseRunner, PhaseState

runner = PhaseRunner(...)
state = PhaseState(phase_id=0, phase_name="bootstrap", data={})
result = await runner.run(state, start_phase=1, end_phase=7)
```

---

## 相关文档

- `docs/06-api-reference/phase1-4-api.md`
- `docs/06-api-reference/phase5-api.md`
- `docs/06-api-reference/phase6-api.md`
- `docs/06-api-reference/phase7-api.md`
