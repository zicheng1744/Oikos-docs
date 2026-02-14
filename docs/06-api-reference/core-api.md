# 核心API参考

本文档详细说明 Oikos 核心系统的API,包括插件系统、配置管理和工厂模式。

---

## 目录

- [BasePlugin](#baseplugin)
- [PluginRegistry](#pluginregistry)
- [PluginFactory](#pluginfactory)
- [ConfigManager](#configmanager)
- [PhaseFramework](#phaseframework)

---

## BasePlugin

**文件**: `core/plugin_system.py`

### 类定义

```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class BasePlugin(ABC):
    """
    所有插件的抽象基类

    职责:
    - 定义插件生命周期接口
    - 提供通用的初始化和清理机制
    - 确保插件实现遵循统一规范

    生命周期:
    1. 实例化 (__init__)
    2. 初始化配置 (initialize)
    3. 执行任务 (execute)
    4. 清理资源 (cleanup)
    """

    def __init__(self) -> None:
        """
        插件构造函数

        Note:
            通常不需要重写此方法
            使用 initialize() 进行配置初始化
        """
        self._initialized: bool = False
        self._config: Dict[str, Any] = {}

    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """
        初始化插件配置

        此方法在插件实例创建后立即调用,用于:
        - 读取配置参数
        - 初始化内部状态
        - 验证配置有效性

        Args:
            config: 插件配置字典,来自YAML配置文件的 "config" 部分

        Raises:
            ValueError: 如果配置无效

        Example:
            >>> plugin = YourPlugin()
            >>> plugin.initialize({"base_price": 100.0})
            >>> print(plugin.base_price)
            100.0
        """
        pass

    @abstractmethod
    def execute(self, *args: Any, **kwargs: Any) -> Any:
        """
        执行插件主要逻辑

        此方法包含插件的核心功能实现。
        具体签名由子类接口定义 (如 SettlementInterface)

        Args:
            *args: 位置参数
            **kwargs: 关键字参数

        Returns:
            执行结果,类型由具体接口定义

        Raises:
            RuntimeError: 如果插件未初始化
            Exception: 执行过程中的异常

        Example:
            >>> plugin = YourPlugin()
            >>> plugin.initialize({})
            >>> result = plugin.execute(input_data)
        """
        if not self._initialized:
            raise RuntimeError(f"{self.__class__.__name__} not initialized")

    def cleanup(self) -> None:
        """
        清理插件资源

        在插件不再使用时调用,用于:
        - 释放内存
        - 关闭文件句柄
        - 断开网络连接

        Note:
            子类可以重写此方法,但应该调用 super().cleanup()
        """
        self._initialized = False
        self._config = {}

    def get_config(self) -> Dict[str, Any]:
        """
        获取插件配置

        Returns:
            配置字典副本

        Example:
            >>> config = plugin.get_config()
            >>> print(config['base_price'])
        """
        return self._config.copy()

    def __repr__(self) -> str:
        """字符串表示"""
        return f"{self.__class__.__name__}(initialized={self._initialized})"
```

---

### 使用示例

```python
from core.plugin_system import BasePlugin
from interfaces.phase5_settlement.base import SettlementInterface

class MySettlement(BasePlugin, SettlementInterface):
    """自定义结算插件"""

    def initialize(self, config: Dict[str, Any]) -> None:
        """初始化配置"""
        super().initialize(config)  # 可选: 调用父类

        # 读取配置
        self.base_price = config.get("base_price", 100.0)
        self._initialized = True

    def execute(self, *args, **kwargs) -> Any:
        """实现结算逻辑"""
        if not self._initialized:
            raise RuntimeError("Plugin not initialized")

        # 执行结算
        # ...
        return result

    def cleanup(self) -> None:
        """清理资源"""
        # 释放资源
        self.base_price = None
        super().cleanup()  # 调用父类清理
```

---

## PluginRegistry

**文件**: `core/plugin_registry.py`

### 类定义

```python
from typing import Dict, Type, Optional
from core.plugin_system import BasePlugin

class PluginRegistry:
    """
    插件注册表

    职责:
    - 管理所有已注册的插件
    - 提供插件查找功能
    - 防止插件名称冲突

    单例模式: 全局唯一的注册表实例
    """

    _plugins: Dict[str, Type[BasePlugin]] = {}

    @classmethod
    def register(
        cls,
        name: str,
        plugin_class: Type[BasePlugin],
        override: bool = False
    ) -> None:
        """
        注册插件

        Args:
            name: 插件名称,用于配置文件中引用
            plugin_class: 插件类 (不是实例)
            override: 是否允许覆盖已存在的插件

        Raises:
            ValueError: 如果插件名称已存在且 override=False
            TypeError: 如果 plugin_class 不是 BasePlugin 的子类

        Example:
            >>> from modules.phase5.settlement_modules import MySettlement
            >>> PluginRegistry.register("my_settlement", MySettlement)
        """
        if not issubclass(plugin_class, BasePlugin):
            raise TypeError(
                f"{plugin_class} must be a subclass of BasePlugin"
            )

        if name in cls._plugins and not override:
            raise ValueError(
                f"Plugin '{name}' already registered. "
                f"Use override=True to replace it."
            )

        cls._plugins[name] = plugin_class
        print(f"Plugin registered: {name} -> {plugin_class.__name__}")

    @classmethod
    def get(cls, name: str) -> Optional[Type[BasePlugin]]:
        """
        获取插件类

        Args:
            name: 插件名称

        Returns:
            插件类,如果不存在返回 None

        Example:
            >>> plugin_class = PluginRegistry.get("my_settlement")
            >>> if plugin_class:
            ...     plugin = plugin_class()
        """
        return cls._plugins.get(name)

    @classmethod
    def list_plugins(cls) -> Dict[str, Type[BasePlugin]]:
        """
        列出所有已注册插件

        Returns:
            插件名称到插件类的映射

        Example:
            >>> plugins = PluginRegistry.list_plugins()
            >>> for name, plugin_class in plugins.items():
            ...     print(f"{name}: {plugin_class.__name__}")
        """
        return cls._plugins.copy()

    @classmethod
    def unregister(cls, name: str) -> bool:
        """
        注销插件

        Args:
            name: 插件名称

        Returns:
            是否成功注销

        Example:
            >>> success = PluginRegistry.unregister("my_settlement")
        """
        if name in cls._plugins:
            del cls._plugins[name]
            return True
        return False

    @classmethod
    def clear(cls) -> None:
        """
        清空所有注册的插件

        Warning:
            此方法主要用于测试,生产环境慎用
        """
        cls._plugins.clear()
```

---

### 使用示例

```python
# 注册插件
from core.plugin_registry import PluginRegistry
from modules.phase5.settlement_modules import MySettlement

PluginRegistry.register("my_settlement", MySettlement)

# 查询插件
plugin_class = PluginRegistry.get("my_settlement")
if plugin_class:
    plugin = plugin_class()
    plugin.initialize({"base_price": 100.0})

# 列出所有插件
all_plugins = PluginRegistry.list_plugins()
print(f"Registered plugins: {list(all_plugins.keys())}")
```

---

## PluginFactory

**文件**: `core/plugin_factory.py`

### 类定义

```python
from typing import Dict, Any
from core.plugin_system import BasePlugin
from core.plugin_registry import PluginRegistry

class PluginFactory:
    """
    插件工厂

    职责:
    - 根据配置创建插件实例
    - 自动初始化插件
    - 管理插件生命周期

    工作流程:
    1. 从配置读取插件名称
    2. 从注册表获取插件类
    3. 创建插件实例
    4. 调用 initialize() 初始化
    """

    def __init__(self, global_config: Dict[str, Any]):
        """
        初始化工厂

        Args:
            global_config: 全局配置字典,包含所有Phase的配置
        """
        self.global_config = global_config
        self._plugin_instances: Dict[str, BasePlugin] = {}

    def create_plugin(
        self,
        plugin_path: str,
        plugin_config: Optional[Dict[str, Any]] = None
    ) -> BasePlugin:
        """
        创建并初始化插件实例

        Args:
            plugin_path: 插件路径,如 "phase5_settlement.settlement"
            plugin_config: 插件配置,如果为None则从global_config中提取

        Returns:
            初始化后的插件实例

        Raises:
            ValueError: 如果插件未注册
            RuntimeError: 如果插件初始化失败

        Example:
            >>> factory = PluginFactory(config)
            >>> settlement = factory.create_plugin(
            ...     "phase5_settlement.settlement"
            ... )
        """
        # 1. 解析配置
        if plugin_config is None:
            plugin_config = self._extract_config(plugin_path)

        plugin_name = plugin_config.get("plugin")
        if not plugin_name:
            raise ValueError(f"No plugin specified for {plugin_path}")

        # 2. 获取插件类
        plugin_class = PluginRegistry.get(plugin_name)
        if not plugin_class:
            raise ValueError(
                f"Plugin '{plugin_name}' not registered. "
                f"Available: {list(PluginRegistry.list_plugins().keys())}"
            )

        # 3. 创建实例
        plugin = plugin_class()

        # 4. 初始化
        init_config = plugin_config.get("config", {})
        try:
            plugin.initialize(init_config)
        except Exception as e:
            raise RuntimeError(
                f"Failed to initialize plugin '{plugin_name}': {e}"
            )

        # 5. 缓存实例
        self._plugin_instances[plugin_path] = plugin

        return plugin

    def _extract_config(self, plugin_path: str) -> Dict[str, Any]:
        """
        从全局配置中提取插件配置

        Args:
            plugin_path: 插件路径,如 "phase5_settlement.settlement"

        Returns:
            插件配置字典
        """
        keys = plugin_path.split(".")
        config = self.global_config

        for key in keys:
            if key not in config:
                raise ValueError(
                    f"Config path '{plugin_path}' not found in global config"
                )
            config = config[key]

        return config

    def get_plugin(self, plugin_path: str) -> Optional[BasePlugin]:
        """
        获取已创建的插件实例

        Args:
            plugin_path: 插件路径

        Returns:
            插件实例,如果不存在返回None
        """
        return self._plugin_instances.get(plugin_path)

    def cleanup_all(self) -> None:
        """
        清理所有插件实例
        """
        for plugin in self._plugin_instances.values():
            plugin.cleanup()
        self._plugin_instances.clear()
```

---

### 使用示例

```python
# 配置
config = {
    "phase5_settlement": {
        "settlement": {
            "plugin": "my_settlement",
            "config": {
                "base_price": 100.0
            }
        }
    }
}

# 创建工厂
factory = PluginFactory(config)

# 创建插件
settlement = factory.create_plugin("phase5_settlement.settlement")

# 使用插件
result = settlement.settle_episode(...)

# 清理
factory.cleanup_all()
```

---

## ConfigManager

**文件**: `core/config_manager.py`

### 类定义

```python
import yaml
from typing import Dict, Any
from pathlib import Path

class ConfigManager:
    """
    配置管理器

    职责:
    - 加载YAML配置文件
    - 验证配置完整性
    - 提供配置访问接口
    """

    @staticmethod
    def load(config_path: str) -> Dict[str, Any]:
        """
        加载配置文件

        Args:
            config_path: 配置文件路径

        Returns:
            配置字典

        Raises:
            FileNotFoundError: 如果配置文件不存在
            yaml.YAMLError: 如果YAML格式错误

        Example:
            >>> config = ConfigManager.load("recipes/TEMPLATE/conf/test_config.yaml")
            >>> print(config['phase5_settlement'])
        """
        path = Path(config_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(path, "r") as f:
            try:
                config = yaml.safe_load(f)
            except yaml.YAMLError as e:
                raise yaml.YAMLError(f"Invalid YAML in {config_path}: {e}")

        return config

    @staticmethod
    def validate(config: Dict[str, Any]) -> bool:
        """
        验证配置完整性

        Args:
            config: 配置字典

        Returns:
            是否有效

        Raises:
            ValueError: 如果配置无效

        Example:
            >>> config = ConfigManager.load("config.yaml")
            >>> ConfigManager.validate(config)
            True
        """
        required_keys = ["phase5_settlement", "phase6_feedback"]

        for key in required_keys:
            if key not in config:
                raise ValueError(f"Missing required config key: {key}")

        return True

    @staticmethod
    def save(config: Dict[str, Any], output_path: str) -> None:
        """
        保存配置到文件

        Args:
            config: 配置字典
            output_path: 输出文件路径

        Example:
            >>> ConfigManager.save(config, "output_config.yaml")
        """
        with open(output_path, "w") as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)
```

---

## PhaseFramework

**文件**: `core/phase_framework.py`

### 类定义

```python
from abc import ABC, abstractmethod
from typing import Any

class PhaseFramework(ABC):
    """
    Phase框架基类

    职责:
    - 定义Phase执行接口
    - 提供公共的Phase逻辑

    每个Phase应该继承此类并实现execute方法
    """

    @abstractmethod
    def execute(self, *args: Any, **kwargs: Any) -> Any:
        """
        执行Phase逻辑

        Args:
            *args: 输入参数
            **kwargs: 关键字参数

        Returns:
            Phase执行结果
        """
        pass

    def pre_execute(self) -> None:
        """Phase执行前的钩子"""
        pass

    def post_execute(self) -> None:
        """Phase执行后的钩子"""
        pass
```

---

## 总结

Oikos 核心API提供:

✅ **BasePlugin** - 插件基类,定义生命周期
✅ **PluginRegistry** - 插件注册表,管理所有插件
✅ **PluginFactory** - 插件工厂,根据配置创建实例
✅ **ConfigManager** - 配置管理器,加载和验证配置
✅ **PhaseFramework** - Phase框架,定义Phase接口

这些核心组件构成了 Oikos 的插件系统基础。

---

**下一步**: 👉 [phase5-api.md](phase5-api.md) - Phase 5 API参考
