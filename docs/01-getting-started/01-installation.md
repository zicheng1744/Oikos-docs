# 安装指南

## 系统要求

- Python 3.12+
- Conda（Anaconda/Miniconda）
- Linux / macOS / WSL2
- Docker 可选（仅在 `workspace_backend: docker` 时需要）

## 1. 克隆仓库

```bash
git clone <your-repo-url>
cd Holos-Oikos-Dev
```

## 2. 创建并激活环境

```bash
conda create -n holos python=3.12 -y
conda activate holos
python --version
```

## 3. 安装项目依赖

```bash
pip install --upgrade pip
pip install -e .
```

验证：

```bash
python -c "import oikos; print('ok')"
```

## 4. 配置 `.env`

```bash
cp .env.example .env
```

至少配置：

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=...   # 可选，默认官方地址
OPENAI_MODEL=...      # 例如 gpt-4.1 / gpt-5.2
```

## 5. 最小自检

```bash
python scripts/check_installation.py
```

## 6. 运行一次最小测试

```bash
python -m oikos.cli test --recipe TEMPLATE --max_episodes 1
```

如果成功，输出会在 `exp/test/<run_id>/`。

## 常见问题

### 1) `docker: command not found` 或 daemon 不可用

- 仅在 `workspace_backend: docker` 时必须处理
- 本地 host 模式可先用：

```bash
python -m oikos.cli test --recipe TEMPLATE --max_episodes 1
```

### 2) API Key 已配置但仍报鉴权错误

检查 `.env` 是否在项目根目录，且当前 shell 启动脚本会加载该文件。
