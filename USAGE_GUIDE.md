# GitHub爬虫快速使用指南

## 快速开始

### 1. 安装依赖
```bash
pip3 install requests --break-system-packages
```

### 2. 基本使用
```bash
# 爬取Microsoft VSCode仓库信息
python3 github_scraper.py microsoft vscode

# 爬取Facebook React仓库信息
python3 github_scraper.py facebook react

# 爬取Vue.js仓库信息
python3 github_scraper.py vuejs vue
```

### 3. 常用参数

```bash
# 只输出JSON格式（适合程序处理）
python3 github_scraper.py microsoft vscode --format json

# 只输出CSV格式（适合Excel分析）
python3 github_scraper.py microsoft vscode --format csv

# 指定输出目录
python3 github_scraper.py microsoft vscode --output-dir ./my_data

# 跳过贡献者和发布版本（加快速度）
python3 github_scraper.py microsoft vscode --no-contributors --no-releases
```

## 输出文件说明

### JSON文件
包含完整的仓库信息，适合程序处理：
- 仓库基本信息（名称、描述、URL等）
- 统计数据（Stars、Forks、Watchers等）
- 编程语言分布（按字节数统计）
- 贡献者列表（可选）
- 发布版本信息（可选）

### CSV文件
包含核心统计数据，适合Excel分析：
- 仓库名称和描述
- 各种计数统计
- 主要编程语言
- 许可证信息
- 时间信息

## 热门仓库示例

```bash
# 前端框架
python3 github_scraper.py facebook react
python3 github_scraper.py vuejs vue
python3 github_scraper.py angular angular

# 编程语言
python3 github_scraper.py python cpython
python3 github_scraper.py microsoft TypeScript
python3 github_scraper.py golang go

# 开发工具
python3 github_scraper.py microsoft vscode
python3 github_scraper.py atom atom
python3 github_scraper.py sublimehq SublimeText

# 操作系统内核
python3 github_scraper.py torvalds linux
python3 github_scraper.py microsoft windows

# 机器学习
python3 github_scraper.py tensorflow tensorflow
python3 github_scraper.py pytorch pytorch
python3 github_scraper.py scikit-learn scikit-learn
```

## 注意事项

1. **频率限制**: 不使用Token时，每小时只能请求60次
2. **推荐使用Token**: 获取GitHub Personal Access Token可提高到每小时5000次
3. **请求延迟**: 程序会自动添加延迟，避免触发限制
4. **错误处理**: 如果某个仓库不存在或私有，会显示错误信息

## 获取GitHub Token（可选但推荐）

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token"
3. 选择权限（公开仓库只需要public_repo）
4. 复制token并在命令中使用：

```bash
python3 github_scraper.py microsoft vscode --token YOUR_TOKEN_HERE
```