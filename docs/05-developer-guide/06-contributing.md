# 贡献指南

欢迎为 Oikos 项目做出贡献!本文档介绍如何参与项目开发。

---

## 目录

- [贡献方式](#贡献方式)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request流程](#pull-request流程)
- [社区准则](#社区准则)

---

## 贡献方式

您可以通过多种方式为 Oikos 做出贡献:

### 1. 代码贡献
- 🐛 修复Bug
- ✨ 添加新功能
- 🚀 性能优化
- 🎨 代码重构

### 2. 文档贡献
- 📝 改进文档
- 📖 添加教程
- 🌍 翻译文档
- 💡 补充示例

### 3. 测试贡献
- 🧪 编写测试
- 🔍 报告Bug
- ✅ 验证修复

### 4. 社区贡献
- 💬 回答问题
- 🎯 提出建议
- 📢 推广项目
- 🤝 帮助新人

---

## 开发流程

### 步骤 1: 准备环境

**1.1 Fork项目**
```bash
# 在GitHub上点击 "Fork" 按钮
# 然后克隆你的fork
git clone https://github.com/YOUR_USERNAME/Holos-Oikos-Dev.git
cd Holos-Oikos-Dev
```

**1.2 添加上游仓库**
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/Holos-Oikos-Dev.git
git fetch upstream
```

**1.3 创建开发环境**
```bash
# 创建conda环境
conda create -n oikos-dev python=3.11 -y
conda activate oikos-dev

# 安装依赖
pip install -r requirements.txt

# 安装开发依赖
pip install -r requirements-dev.txt
```

**requirements-dev.txt**:
```
# 测试
pytest>=7.0.0
pytest-cov>=4.0.0
pytest-mock>=3.10.0

# 代码质量
black>=23.0.0
flake8>=6.0.0
mypy>=1.0.0
isort>=5.12.0

# 开发工具
ipython>=8.0.0
ipdb>=0.13.0
pre-commit>=3.0.0
```

---

### 步骤 2: 创建分支

```bash
# 确保在最新的main分支
git checkout main
git pull upstream main

# 创建特性分支
git checkout -b feature/your-feature-name

# 或修复bug分支
git checkout -b fix/bug-description
```

**分支命名规范**:
- `feature/xxx` - 新功能
- `fix/xxx` - Bug修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构
- `test/xxx` - 测试相关

---

### 步骤 3: 开发和测试

**3.1 开发代码**
```bash
# 编辑文件
vim modules/phase5/your_module.py

# 运行代码检查
black modules/
flake8 modules/
mypy modules/
```

**3.2 编写测试**
```bash
# 创建测试文件
vim tests/unit/test_phase5/test_your_module.py

# 运行测试
pytest tests/unit/test_phase5/test_your_module.py -v
```

**3.3 确保测试通过**
```bash
# 运行所有测试
pytest

# 检查覆盖率
pytest --cov=modules --cov=core --cov-report=term-missing

# 确保覆盖率达标
pytest --cov=modules --cov=core --cov-fail-under=80
```

---

### 步骤 4: 提交代码

**4.1 暂存更改**
```bash
# 查看更改
git status
git diff

# 暂存文件
git add modules/phase5/your_module.py
git add tests/unit/test_phase5/test_your_module.py
```

**4.2 提交更改**
```bash
git commit -m "feat(phase5): add new settlement mechanism

- Implement performance-based settlement
- Add unit tests with 85% coverage
- Update documentation

Closes #123"
```

---

### 步骤 5: 推送和创建PR

**5.1 推送到你的fork**
```bash
git push origin feature/your-feature-name
```

**5.2 创建Pull Request**
1. 访问你的GitHub fork
2. 点击 "Compare & pull request"
3. 填写PR模板
4. 等待审核

---

## 代码规范

### Python代码风格

Oikos 遵循 **PEP 8** 和 **Google Python Style Guide**。

#### 1. 代码格式化 (Black)

使用 Black 自动格式化代码:
```bash
# 格式化指定文件
black modules/phase5/settlement_modules.py

# 格式化整个目录
black modules/ tests/

# 检查但不修改
black --check modules/
```

**配置** `pyproject.toml`:
```toml
[tool.black]
line-length = 88
target-version = ['py39', 'py310', 'py311']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.venv
  | build
  | dist
)/
'''
```

---

#### 2. 代码检查 (Flake8)

使用 Flake8 检查代码质量:
```bash
flake8 modules/ tests/
```

**配置** `.flake8`:
```ini
[flake8]
max-line-length = 88
extend-ignore = E203, E266, E501, W503
exclude = .git,__pycache__,build,dist,.venv
max-complexity = 10
```

---

#### 3. 类型检查 (MyPy)

使用 MyPy 进行类型检查:
```bash
mypy modules/ --ignore-missing-imports
```

**配置** `mypy.ini`:
```ini
[mypy]
python_version = 3.9
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
ignore_missing_imports = True
```

---

#### 4. Import排序 (isort)

使用 isort 排序import语句:
```bash
isort modules/ tests/
```

**配置** `pyproject.toml`:
```toml
[tool.isort]
profile = "black"
line_length = 88
multi_line_output = 3
include_trailing_comma = true
force_grid_wrap = 0
use_parentheses = true
ensure_newline_before_comments = true
```

---

### 代码风格指南

#### 命名规范

```python
# ✅ 类名: PascalCase
class PerformanceBasedSettlement:
    pass

# ✅ 函数/方法: snake_case
def calculate_task_price():
    pass

# ✅ 变量: snake_case
task_price = 100.0
quality_score = 0.8

# ✅ 常量: UPPER_CASE
MAX_EPISODES = 100
DEFAULT_BASE_PRICE = 100.0

# ✅ 私有方法: _开头
def _internal_helper():
    pass

# ✅ 特殊方法: __开头__结尾
def __init__(self):
    pass
```

---

#### 类型注解

```python
from typing import Dict, List, Optional, Any

# ✅ 函数参数和返回值类型
def calculate_price(
    quality_score: float,
    base_price: float = 100.0
) -> float:
    return base_price * (1 + quality_score)

# ✅ 变量类型注解
agent_ranks: Dict[str, float] = {}
participants: List[str] = []
config: Optional[Dict[str, Any]] = None
```

---

#### Docstring规范

使用 **Google Style** docstring:

```python
def settle_episode(
    self,
    economic_state: EconomicState,
    quality_score: float,
    task_data: Dict[str, Any],
    participants: List[str]
) -> EconomicState:
    """
    执行结算,更新经济状态

    Args:
        economic_state: 当前经济状态 (账本、资金池)
        quality_score: 任务质量分数,范围 [0.0, 1.0]
        task_data: 任务元数据,包含id、input等字段
        participants: 参与者ID列表

    Returns:
        updated_economic_state: 更新后的经济状态

    Raises:
        ValueError: 如果quality_score不在[0, 1]范围内
        InsufficientFundsError: 如果用户余额不足

    Examples:
        >>> state = EconomicState(ledger={"user": 1000.0})
        >>> updated = settlement.settle_episode(state, 0.8, {}, [])
        >>> updated.ledger["user"] < 1000.0
        True
    """
    pass
```

---

#### 代码组织

```python
# ✅ 好的代码组织
class PerformanceBasedSettlement(BasePlugin, SettlementInterface):
    """
    类文档字符串
    """

    # 1. 常量
    DEFAULT_BASE_PRICE: float = 100.0

    # 2. 初始化方法
    def initialize(self, config: Dict[str, Any]) -> None:
        """初始化"""
        self.base_price = config.get("base_price", self.DEFAULT_BASE_PRICE)

    # 3. 公共方法 (接口实现)
    def settle_episode(self, ...) -> EconomicState:
        """结算"""
        task_price = self._calculate_task_price(...)
        return self._update_ledger(...)

    # 4. 私有方法 (辅助方法)
    def _calculate_task_price(self, quality_score: float) -> float:
        """计算任务价格"""
        return self.base_price * (1 + quality_score)

    def _update_ledger(self, ...) -> EconomicState:
        """更新账本"""
        pass

    # 5. 清理方法
    def cleanup(self) -> None:
        """清理资源"""
        pass
```

---

## 提交规范

### Conventional Commits

Oikos 使用 **Conventional Commits** 规范:

**格式**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

---

### 提交类型 (type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(phase5): add second-price auction` |
| `fix` | Bug修复 | `fix(settlement): correct fund conservation` |
| `docs` | 文档更新 | `docs(api): update settlement API docs` |
| `style` | 代码格式 | `style: run black formatter` |
| `refactor` | 重构 | `refactor(phase6): simplify ranking logic` |
| `test` | 测试 | `test(phase5): add settlement edge cases` |
| `chore` | 构建/工具 | `chore: update dependencies` |
| `perf` | 性能优化 | `perf(ranking): optimize graph construction` |

---

### 作用域 (scope)

常用作用域:
- `core` - 核心系统
- `phase1-7` - 具体Phase
- `docs` - 文档
- `tests` - 测试
- `ci` - CI/CD

---

### 提交消息示例

**好的提交消息** ✅:

```
feat(phase5): add performance-based settlement mechanism

- Implement dynamic pricing based on quality score
- Add unit tests with 85% coverage
- Update phase5 documentation

The new mechanism adjusts task price according to quality:
price = base_price * (1 + quality_multiplier * quality_score)

Closes #123
```

```
fix(settlement): correct fund conservation calculation

Fixed incorrect platform fee calculation that violated fund
conservation. Added test to verify conservation in all scenarios.

Fixes #456
```

```
docs(getting-started): improve installation instructions

- Add troubleshooting section
- Update conda environment setup
- Include Windows-specific notes
```

**不好的提交消息** ❌:

```
update code
```

```
fix bug
```

```
add feature
```

---

## Pull Request流程

### PR模板

创建PR时,填写以下模板:

```markdown
## 描述
<!-- 简要描述此PR的目的和内容 -->

## 变更类型
- [ ] 🐛 Bug修复
- [ ] ✨ 新功能
- [ ] 📝 文档更新
- [ ] 🎨 代码重构
- [ ] 🚀 性能优化
- [ ] 🧪 测试

## 相关Issue
<!-- 关联的Issue编号,如 Closes #123 -->

## 变更清单
- 变更1
- 变更2
- 变更3

## 测试
<!-- 描述如何测试此变更 -->

- [ ] 添加了单元测试
- [ ] 所有测试通过
- [ ] 代码覆盖率 ≥ 80%
- [ ] 手动测试通过

## 检查清单
- [ ] 代码遵循项目风格指南
- [ ] 添加了必要的文档
- [ ] 更新了CHANGELOG
- [ ] 提交消息符合规范
- [ ] PR标题清晰描述变更
```

---

### PR审核标准

PR会根据以下标准审核:

#### 1. 代码质量
- [ ] 代码清晰易读
- [ ] 遵循项目风格指南
- [ ] 没有明显的Bug或问题
- [ ] 适当的错误处理
- [ ] 合理的性能

#### 2. 测试
- [ ] 有相应的单元测试
- [ ] 测试覆盖率达标 (≥80%)
- [ ] 所有测试通过
- [ ] 测试边缘情况

#### 3. 文档
- [ ] 更新了相关文档
- [ ] 添加了必要的注释
- [ ] Docstring完整准确
- [ ] README更新 (如需要)

#### 4. 提交
- [ ] 提交消息清晰
- [ ] 提交历史整洁
- [ ] 没有不相关的更改

---

### PR审核流程

1. **自动检查** (CI)
   - 代码风格检查
   - 单元测试
   - 覆盖率检查
   - 构建验证

2. **代码审核** (人工)
   - 至少1位maintainer审核
   - 解决所有评论
   - 获得 "LGTM" (Looks Good To Me)

3. **合并**
   - Squash and merge (推荐)
   - 清理提交历史
   - 更新CHANGELOG

---

## 社区准则

### 行为准则

我们致力于为所有人提供友好、安全和包容的环境。

**我们的承诺**:
- ✅ 使用友好和包容的语言
- ✅ 尊重不同的观点和经验
- ✅ 优雅地接受建设性批评
- ✅ 关注对社区最有利的事情
- ✅ 对其他社区成员表示同理心

**不可接受的行为**:
- ❌ 使用性暗示的语言或图像
- ❌ 挑衅、侮辱性评论或人身攻击
- ❌ 公开或私下骚扰
- ❌ 未经许可发布他人的私人信息
- ❌ 其他不道德或不专业的行为

---

### 沟通渠道

- 📧 Email: oikos-dev@example.com
- 💬 GitHub Issues: 报告Bug和提出建议
- 🗨️ GitHub Discussions: 一般讨论和问答
- 📖 Wiki: 社区维护的文档

---

### 获得帮助

如果您在贡献过程中遇到问题:

1. 查阅文档
2. 搜索已有Issues
3. 提问在GitHub Discussions
4. 联系maintainers

---

## 致谢

感谢所有贡献者!您的努力使 Oikos 变得更好。

贡献者名单: [CONTRIBUTORS.md](../CONTRIBUTORS.md)

---

## 总结

成为 Oikos 贡献者的步骤:

1. ✅ **准备环境** - Fork + 安装依赖
2. ✅ **创建分支** - feature/xxx 或 fix/xxx
3. ✅ **开发代码** - 遵循代码规范
4. ✅ **编写测试** - 覆盖率 ≥80%
5. ✅ **提交代码** - 遵循提交规范
6. ✅ **创建PR** - 填写完整模板
7. ✅ **代码审核** - 响应评论
8. ✅ **合并代码** - 庆祝贡献! 🎉

我们期待您的贡献!

---

**相关文档**:
- 👉 [01-development-setup.md](01-development-setup.md) - 开发环境搭建
- 👉 [03-creating-plugins.md](03-creating-plugins.md) - 创建插件
- 👉 [05-testing.md](05-testing.md) - 测试指南
