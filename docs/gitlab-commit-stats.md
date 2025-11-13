## GitLab Commit Statistics Script

`gitlab_commit_stats.py` 是一个面向 GitLab 管理员的命令行工具，可以统计指定项目或群组成员在每日、每周、每月维度的提交次数。脚本默认输出文本表格，也支持 JSON。

### 先决条件
- Python 3.9+
- 已安装依赖：`pip install -r requirements.txt`
- 具备 `api` 权限的 GitLab Personal Access Token（PAT）

可以通过环境变量简化参数输入：
```shell
export GITLAB_BASE_URL="https://gitlab.example.com"
export GITLAB_TOKEN="glpat-xxxx"
```

### 基本用法
统计群组（包含子群组）内所有项目近 90 天的提交：
```shell
python gitlab_commit_stats.py --group-id 123 --include-subgroups
```

指定日期范围（`--until` 为截止日的次日，默认为明天）：
```shell
python gitlab_commit_stats.py --group-id 123 --since 2025-01-01 --until 2025-02-01
```

仅统计指定项目（可重复）：
```shell
python gitlab_commit_stats.py --project-id 456 --project-id 789
```

输出 JSON 以便进一步处理：
```shell
python gitlab_commit_stats.py --group-id 123 --output json > commits.json
```

如需限制检索的项目数量，可使用 `--max-projects` 避免一次性扫描过多项目：
```shell
python gitlab_commit_stats.py --group-id 123 --max-projects 50
```

### 输出说明
- `Daily breakdown`：按日期（YYYY-MM-DD）统计的提交次数。
- `Weekly breakdown`：按 ISO 周（YYYY-Wxx）统计。
- `Monthly breakdown`：按月份（YYYY-MM）统计。
- `Overall totals`：在选定时间范围内的总提交量。

若无提交记录，会显示 `No commits.`。
