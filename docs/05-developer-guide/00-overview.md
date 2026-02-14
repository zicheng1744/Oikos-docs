# 开发者指南概述

本目录包含 Oikos 系统的开发者指南,帮助您理解代码结构、开发自定义插件和贡献代码。

---

## 📚 文档导航

### 入门指南

1. **[01-development-setup.md](01-development-setup.md)** - 开发环境搭建
   - 安装依赖
   - 配置开发工具
   - 运行测试

2. **[02-code-structure.md](02-code-structure.md)** - 代码结构详解
   - 目录组织
   - 核心模块
   - 代码规范

---

### 插件开发

3. **[03-creating-plugins.md](03-creating-plugins.md)** - 创建自定义插件
   - 插件开发流程
   - 接口实现
   - 注册和测试
   - 完整示例

---

### 调试和测试

4. **[04-debugging.md](04-debugging.md)** - 调试技巧
   - 日志系统
   - 断点调试
   - 常见问题排查

5. **[05-testing.md](05-testing.md)** - 测试指南
   - 单元测试
   - 集成测试
   - 测试最佳实践

---

### 贡献指南

6. **[06-contributing.md](06-contributing.md)** - 贡献代码
   - Git工作流
   - 代码审查
   - 文档编写

---

## 🎯 快速开始

### 我想开发一个新的结算机制

👉 跟随这个流程:
1. 阅读 [03-creating-plugins.md](03-creating-plugins.md)
2. 参考 [../06-api-reference/05-phase5-api.md](../06-api-reference/05-phase5-api.md)
3. 查看示例代码 `modules/phase5/settlement_modules.py`

### 我想调试执行问题

👉 查看:
1. [04-debugging.md](04-debugging.md) - 调试技巧
2. [../02-user-guide/08-troubleshooting.md](../02-user-guide/08-troubleshooting.md) - 故障排除

### 我想贡献代码

👉 遵循:
1. [06-contributing.md](06-contributing.md) - 贡献流程
2. [02-code-structure.md](02-code-structure.md) - 代码规范

---

## 📖 推荐阅读顺序

**新手开发者**:
1. 开发环境搭建
2. 代码结构详解
3. 创建简单插件
4. 调试和测试

**经验开发者**:
1. 创建自定义插件
2. API参考文档
3. 贡献指南

---

## 🔗 相关资源

- [架构文档](../03-architecture/) - 理解系统设计
- [Phase模块](../04-phase-modules/) - 深入各Phase
- [API参考](../06-api-reference/) - 接口详细说明

---

**准备好开始开发了吗?** 👉 [01-development-setup.md](01-development-setup.md)
