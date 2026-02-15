# 开发环境搭建

本文档介绍如何搭建 Oikos 的开发环境。

---

## 前置要求

### 系统要求

- **操作系统**: Linux / macOS / Windows (WSL2)
- **Python**: 3.12+
- **Conda**: 推荐使用 Miniconda/Anaconda
- **Git**: 用于版本控制

### 可选工具

- **Docker**: 用于 Workspace 隔离 (可选)
- **VSCode**: 推荐的IDE
- **PyCharm**: 或其他Python IDE

---

## 安装步骤

### 1. 克隆代码库

```bash
cd /path/to/your/workspace
git clone https://github.com/your-org/Holos-Oikos-Dev.git
cd Holos-Oikos-Dev
```

### 2. 创建Conda环境

```bash
# 创建环境
conda create -n holos python=3.12 -y

# 激活环境
conda activate holos
```

### 3. 安装依赖

```bash
# 安装核心依赖
pip install -r requirements.txt

# 或使用 environment.yml
conda env create -f environment.yml
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
vim .env
```

**必需的环境变量**:
```bash
# LLM API
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选

# 数据库 (可选)
ARXIV_DATABASE_TOKEN=your_token
```

### 5. 验证安装

```bash
# 运行测试
pytest tests/ -v

# 或运行快速验证
python -c "import oikos; print('Installation successful!')"
```

---

## IDE 配置

### VSCode

**推荐扩展**:
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Jupyter (ms-toolsai.jupyter)

**配置文件** `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "/path/to/conda/envs/holos/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true
}
```

---

### PyCharm

1. 打开项目: `File` → `Open` → 选择项目目录
2. 配置解释器: `Settings` → `Project` → `Python Interpreter`
3. 选择 Conda 环境: `/path/to/conda/envs/holos`
4. 启用自动格式化: `Settings` → `Tools` → `Black`

---

## 开发工具

### 代码格式化

```bash
# 安装 black
pip install black

# 格式化代码
black oikos/ tests/
```

### 代码检查

```bash
# 安装 flake8
pip install flake8

# 检查代码
flake8 oikos/ tests/
```

### 类型检查

```bash
# 安装 mypy
pip install mypy

# 类型检查
mypy oikos/
```

---

## 运行开发服务器

### 启动所有服务

```bash
cd recipes/TEMPLATE

# Chat模式 (快速测试)
bash oikos.cli chat

# Test模式 (完整测试)
bash oikos.cli test --max_episodes 10
```

### 单独启动服务

```bash
# API服务
python -m oikos.services.api.main --port 8000

# NVWA服务
python -m oikos.services.nvwa.main --port 10000

# Retrieval服务
python -m oikos.services.retrieval.main --port 10003

# Evaluator服务
python -m oikos.services.evaluator.main --port 10002
```

---

## 常见问题

### 问题 1: Conda 环境激活失败

**症状**: `conda: command not found`

**解决**:
```bash
# 初始化 conda
conda init bash  # 或 zsh

# 重新打开终端
source ~/.bashrc  # 或 ~/.zshrc
```

### 问题 2: 依赖安装失败

**症状**: `pip install` 报错

**解决**:
```bash
# 升级 pip
pip install --upgrade pip

# 清理缓存
pip cache purge

# 重新安装
pip install -r requirements.txt
```

### 问题 3: OPENAI_API_KEY 未设置

**症状**: `Error: OPENAI_API_KEY not found`

**解决**:
```bash
# 方式1: 设置环境变量
export OPENAI_API_KEY=your_key

# 方式2: 创建 .env 文件
echo "OPENAI_API_KEY=your_key" > .env
```

---

## 下一步

环境搭建完成后,您可以:

1. 👉 [02-code-structure.md](02-code-structure.md) - 了解代码结构
2. 👉 [03-creating-plugins.md](03-creating-plugins.md) - 开发第一个插件
3. 👉 [05-testing.md](05-testing.md) - 运行测试

---

**开发环境已就绪!** 🚀
