# GitHub仓库信息爬虫

一个功能强大的GitHub仓库信息爬虫工具，支持通过GitHub API获取仓库的详细信息，包括基本信息、编程语言统计、贡献者信息和发布版本等。

## 功能特性

- ✅ 获取仓库基本信息（星标数、fork数、语言等）
- ✅ 获取编程语言统计
- ✅ 获取贡献者信息
- ✅ 获取发布版本信息
- ✅ 支持批量爬取多个仓库
- ✅ 支持JSON和CSV格式输出
- ✅ 自动处理API限制
- ✅ 支持GitHub Personal Access Token认证

## 安装依赖

```bash
pip install -r requirements_github_crawler.txt
```

## 使用方法

### 基本用法

```bash
# 爬取单个仓库
python github_crawler.py microsoft/vscode

# 爬取多个仓库
python github_crawler.py microsoft/vscode facebook/react google/go

# 使用完整URL
python github_crawler.py https://github.com/microsoft/vscode
```

### 高级用法

```bash
# 使用GitHub Token（推荐，提高API限制）
python github_crawler.py --token your_github_token microsoft/vscode

# 指定输出格式
python github_crawler.py --format json microsoft/vscode
python github_crawler.py --format csv microsoft/vscode

# 自定义输出文件名
python github_crawler.py --output my_repos microsoft/vscode

# 只获取基本信息，不包含额外信息
python github_crawler.py --no-extra microsoft/vscode
```

### 环境变量

你也可以通过环境变量设置GitHub Token：

```bash
export GITHUB_TOKEN=your_github_token
python github_crawler.py microsoft/vscode
```

## 输出格式

### JSON格式示例

```json
{
  "name": "vscode",
  "full_name": "microsoft/vscode",
  "description": "Visual Studio Code",
  "url": "https://github.com/microsoft/vscode",
  "owner": {
    "login": "microsoft",
    "type": "Organization",
    "avatar_url": "https://avatars.githubusercontent.com/u/6154722?v=4"
  },
  "language": "TypeScript",
  "stargazers_count": 142000,
  "forks_count": 25000,
  "languages": {
    "TypeScript": 125000000,
    "JavaScript": 15000000,
    "CSS": 5000000
  },
  "contributors": [
    {
      "login": "bpasero",
      "contributions": 8000,
      "avatar_url": "https://avatars.githubusercontent.com/u/900690?v=4"
    }
  ],
  "releases": [
    {
      "tag_name": "1.75.0",
      "name": "January 2023",
      "published_at": "2023-01-26T16:00:00Z"
    }
  ]
}
```

### CSV格式

CSV文件包含扁平化的数据结构，便于在Excel等工具中分析。

## 获取的信息字段

### 基本信息
- `name`: 仓库名称
- `full_name`: 完整名称 (owner/repo)
- `description`: 仓库描述
- `url`: 仓库网页URL
- `clone_url`: Git克隆URL
- `language`: 主要编程语言
- `size`: 仓库大小（KB）
- `stargazers_count`: 星标数
- `watchers_count`: 关注者数
- `forks_count`: Fork数
- `open_issues_count`: 开放问题数
- `created_at`: 创建时间
- `updated_at`: 最后更新时间
- `is_private`: 是否私有
- `is_fork`: 是否为Fork
- `license`: 许可证
- `topics`: 主题标签

### 额外信息（默认包含）
- `languages`: 编程语言统计
- `contributors`: 贡献者信息
- `releases`: 发布版本信息

## API限制

- **未认证**: 每小时60次请求
- **使用Token**: 每小时5000次请求

建议使用GitHub Personal Access Token以获得更高的API限制。

## 获取GitHub Token

1. 登录GitHub
2. 进入 Settings > Developer settings > Personal access tokens
3. 点击 "Generate new token"
4. 选择适当的权限（public_repo即可）
5. 复制生成的token

## 错误处理

程序会自动处理以下情况：
- API限制达到时自动等待
- 仓库不存在或无权访问
- 网络连接问题
- 无效的仓库URL格式

## 示例脚本

查看 `example_usage.py` 文件了解更多使用示例。

## 注意事项

1. 请遵守GitHub的使用条款和API限制
2. 建议在爬取大量仓库时使用Token认证
3. 程序会在请求间添加延时以避免过于频繁的API调用
4. 私有仓库需要相应的访问权限

## 许可证

MIT License