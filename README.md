# GitHub 仓库信息爬虫

一个功能完整的GitHub仓库信息爬虫，可以获取指定仓库的详细信息、统计数据、贡献者信息和发布版本等。

## 功能特性

- ✅ 获取仓库基本信息（名称、描述、URL等）
- ✅ 获取统计数据（Stars、Forks、Watchers、Issues等）
- ✅ 获取编程语言统计
- ✅ 获取贡献者信息
- ✅ 获取发布版本信息
- ✅ 支持JSON和CSV格式输出
- ✅ 支持GitHub Token避免频率限制
- ✅ 命令行界面友好

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 基本用法

```bash
# 爬取指定仓库的基本信息
python github_scraper.py microsoft vscode

# 指定输出目录
python github_scraper.py microsoft vscode --output-dir ./data

# 只输出JSON格式
python github_scraper.py microsoft vscode --format json

# 只输出CSV格式
python github_scraper.py microsoft vscode --format csv
```

### 高级用法

```bash
# 使用GitHub Token（推荐，避免频率限制）
python github_scraper.py microsoft vscode --token YOUR_GITHUB_TOKEN

# 不获取贡献者信息（加快速度）
python github_scraper.py microsoft vscode --no-contributors

# 不获取发布版本信息
python github_scraper.py microsoft vscode --no-releases

# 完整命令示例
python github_scraper.py microsoft vscode --token YOUR_TOKEN --output-dir ./results --format both --no-contributors
```

### 参数说明

- `owner`: 仓库所有者用户名或组织名（必需）
- `repo`: 仓库名称（必需）
- `--token`: GitHub Personal Access Token（可选，推荐使用）
- `--no-contributors`: 不获取贡献者信息
- `--no-releases`: 不获取发布版本信息
- `--output-dir`: 输出目录（默认：./output）
- `--format`: 输出格式，可选 json/csv/both（默认：both）

## 获取GitHub Token

为了避免API频率限制，建议使用GitHub Personal Access Token：

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token"
3. 选择适当的权限（对于公开仓库，只需要public_repo权限）
4. 复制生成的token

## 输出文件

爬虫会生成以下文件：

### JSON文件
包含完整的仓库信息，包括：
- 仓库基本信息
- 统计数据
- 编程语言分布
- 贡献者列表
- 发布版本信息

### CSV文件
包含仓库的核心统计数据，适合数据分析：
- 仓库名称、描述
- Stars、Forks、Watchers数量
- 主要编程语言
- 许可证信息
- 创建和更新时间

## 示例输出

### 命令行输出示例

```
开始爬取仓库: microsoft/vscode
获取贡献者信息...
获取发布版本信息...
仓库 microsoft/vscode 爬取完成!
数据已保存到: ./output/microsoft_vscode_20231201_143022.json
CSV数据已保存到: ./output/microsoft_vscode_20231201_143022.csv

=== 仓库基本信息 ===
仓库名: microsoft/vscode
描述: Visual Studio Code
⭐ Stars: 150000
🍴 Forks: 26000
👀 Watchers: 15000
🐛 Issues: 8000
💻 主要语言: TypeScript
📄 许可证: MIT
📅 创建时间: 2015-04-18T18:40:15Z
🔄 更新时间: 2023-12-01T14:30:22Z

=== 编程语言统计 ===
TypeScript: 85.2%
JavaScript: 8.1%
CSS: 3.2%
HTML: 2.1%
Other: 1.4%

=== 主要贡献者 ===
1. username1: 1500 次提交
2. username2: 1200 次提交
3. username3: 900 次提交
...

=== 最新发布版本 ===
1.89.0 - Visual Studio Code 1.89.0 ✅ 正式版
1.88.1 - Visual Studio Code 1.88.1 ✅ 正式版
...
```

## 注意事项

1. **API频率限制**: 不使用Token时，GitHub API有频率限制（每小时60次请求）
2. **请求间隔**: 程序会自动在请求间添加延迟，避免触发限制
3. **错误处理**: 程序包含完善的错误处理机制
4. **数据完整性**: 如果某个API调用失败，程序会继续获取其他可用信息

## 常见问题

### Q: 为什么需要GitHub Token？
A: GitHub API对未认证请求有严格的频率限制（每小时60次）。使用Token可以将限制提高到每小时5000次。

### Q: 爬取速度很慢怎么办？
A: 可以使用 `--no-contributors` 和 `--no-releases` 参数跳过非必要信息，或者使用GitHub Token提高请求频率。

### Q: 支持私有仓库吗？
A: 支持，但需要提供有相应权限的GitHub Token。

### Q: 输出文件在哪里？
A: 默认在 `./output` 目录下，可以通过 `--output-dir` 参数自定义。

## 许可证

MIT License