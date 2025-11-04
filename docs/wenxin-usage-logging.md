# 文心一言调用成本统计指南

本指南介绍如何使用脚本 `scripts/wenxin_usage_logger.py` 来记录文心一言（ERNIE Bot）每次调用的字符数、Token 消耗以及对应的人民币成本，并基于历史数据估算每日支出。

## 1. 准备环境

- Python 3.8 及以上版本
- 项目根目录（`/workspace`）下执行：

```bash
pip install -r requirements.txt
```

> `report` 子命令依赖 `pandas`，已包含在 `requirements.txt` 中。

## 2. 配置模型价格

先在百度智能云千帆控制台确认所用模型的价格（输入/输出千 Token 对应 RMB），然后执行：

```bash
python3 scripts/wenxin_usage_logger.py set-price ERNIE-Bot-4.0 \
    --input-price 0.012 --output-price 0.016
```

- 价格会写入 `scripts/wenxin_price_config.json`
- 可通过 `list-price` 查看当前配置：

```bash
python3 scripts/wenxin_usage_logger.py list-price
```

## 3. 记录一次交互

从调用返回中获取提问/回复文本与 Token 数（百度 API 的 `usage.prompt_tokens` / `usage.completion_tokens`），然后执行：

```bash
python3 scripts/wenxin_usage_logger.py record \
    --model ERNIE-Bot-4.0 \
    --prompt "写一首关于春天的七言绝句" --prompt-tokens 120 \
    --response "春风拂面柳如烟……" --response-tokens 98 \
    --notes "社群日常问答"
```

脚本会自动计算字符数、成本并追加到 `scripts/wenxin_usage_log.csv`。

### 没有 Token 数据怎么办？

可以临时省略 `--prompt-tokens` / `--response-tokens`，脚本会按“1 个汉字 ≈ 1 个 Token”估算，并可使用 `--char-to-token-ratio` 调整换算比例：

```bash
python3 scripts/wenxin_usage_logger.py record \
    --model ERNIE-Bot-4.0 \
    --prompt "……" \
    --response "……" \
    --char-to-token-ratio 1.2
```

若需要在日志中保留原文（默认只记录统计数据），可追加 `--store-text`。

## 4. 查看日报 & 费用预测

```bash
python3 scripts/wenxin_usage_logger.py report --days 7 --show-daily
```

- 聚合所有记录，按天统计交互次数、Token 总量、RMB 成本
- 计算最近 `--days` 天的平均每日花费，并按 30 天估算月度费用
- 可使用 `--export-excel reports/wenxin_cost_report.xlsx` 导出 Excel

示例输出：

```
统计区间：2025-11-01 至 2025-11-04
平均每日消耗（基于最近 4 天）：¥3.268500
平均每日Tokens：18420.75
按30天估算月度消耗：¥98.06
```

## 5. 日志文件结构

`scripts/wenxin_usage_log.csv` 包含以下字段：

- `timestamp_utc`：UTC 时间戳
- `model`：模型名称
- `prompt_chars` / `prompt_tokens`
- `response_chars` / `response_tokens`
- `total_tokens`
- `input_price_per_1k` / `output_price_per_1k`
- `input_cost_rmb` / `output_cost_rmb` / `total_cost_rmb`
- `notes`
- `prompt_text` / `response_text`（若启用 `--store-text`）

日志为 CSV 格式，可直接导入 Excel 或 BI 工具继续分析。

## 6. 最佳实践

- 优先使用 API 返回的 Token 统计，确保成本计算准确
- 按模型名称配置多套价格，适配不同版本/规格
- 每日固定时间运行 `report`，监控近 7 天趋势
- 定期备份 `wenxin_usage_log.csv`，或同步到数据库/数据仓库
- 若需要团队共享，建议将脚本封装成定时任务或简单的 Web 面板

通过以上流程即可持续记录文心一言的调用开销，并快速掌握日均 / 月度 RMB 消耗水平。
