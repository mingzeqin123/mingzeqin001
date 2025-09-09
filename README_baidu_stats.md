# 百度云千帆大模型使用情况统计工具

这是一个用于统计百度云千帆大模型使用情况的Python工具，可以帮助您监控和分析模型的调用情况、Token消耗、成功率等关键指标。

## 功能特性

- 🔍 **模型列表查询**: 获取所有可用的模型列表
- 📊 **使用统计**: 查看指定时间段内的模型使用情况
- 📈 **详细分析**: 包括请求数、Token消耗、成功率等
- 📅 **按日统计**: 提供每日详细的使用数据
- 🔍 **错误分析**: 分析失败请求的类型和原因
- 📁 **数据导出**: 支持JSON和CSV格式导出
- 📝 **日志记录**: 完整的操作日志记录
- ⚙️ **配置管理**: 灵活的配置文件管理

## 安装要求

- Python 3.7+
- 百度云千帆大模型服务账号
- API Key 和 Secret Key

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

或者只安装基础依赖：

```bash
pip install requests
```

### 2. 配置API密钥

编辑 `config.ini` 文件，填入您的百度云API信息：

```ini
[DEFAULT]
api_key = 您的API_KEY
secret_key = 您的SECRET_KEY
app_id = 您的应用ID
```

**获取API密钥的步骤：**

1. 登录 [百度智能云控制台](https://console.bce.baidu.com/)
2. 进入 [千帆大模型平台](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
3. 创建应用或选择已有应用
4. 在应用详情页面获取 API Key 和 Secret Key

### 3. 运行程序

```bash
python baidu_cloud_model_stats.py
```

## 详细使用说明

### 基本用法

```python
from baidu_cloud_model_stats import BaiduCloudModelStats

# 初始化统计工具
stats_tool = BaiduCloudModelStats()

# 获取模型列表
models = stats_tool.get_model_list()
print(f"可用模型数量: {len(models)}")

# 获取使用统计（最近7天）
stats = stats_tool.get_usage_statistics()
print(stats_tool.format_statistics(stats))
```

### 高级用法

```python
# 查询特定模型的使用情况
stats = stats_tool.get_usage_statistics(
    model_name="ERNIE-Bot-turbo",
    start_date="2024-01-01",
    end_date="2024-01-07"
)

# 导出数据
json_file = stats_tool.export_to_json(stats, "my_stats.json")
csv_file = stats_tool.export_to_csv(stats, "my_stats.csv")
```

### 配置参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `api_key` | 百度云API密钥 | 必填 |
| `secret_key` | 百度云Secret密钥 | 必填 |
| `app_id` | 应用ID | 可选 |
| `default_days` | 默认查询天数 | 7 |
| `log_level` | 日志级别 | INFO |
| `timeout` | 请求超时时间（秒） | 30 |

## API方法说明

### BaiduCloudModelStats 类

#### 初始化方法

```python
stats_tool = BaiduCloudModelStats(config_file="config.ini")
```

#### 主要方法

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `get_access_token()` | 获取访问令牌 | 无 | str |
| `get_model_list()` | 获取模型列表 | 无 | List[Dict] |
| `get_usage_statistics()` | 获取使用统计 | model_name, start_date, end_date | Dict |
| `format_statistics()` | 格式化统计信息 | stats | str |
| `export_to_json()` | 导出JSON格式 | stats, filename | str |
| `export_to_csv()` | 导出CSV格式 | stats, filename | str |

### 统计数据结构

返回的统计数据包含以下字段：

```json
{
  "error_code": 0,
  "error_msg": "success",
  "result": {
    "model_name": "ERNIE-Bot-turbo",
    "start_date": "2024-01-01",
    "end_date": "2024-01-07",
    "total_requests": 1250,
    "total_tokens": 125000,
    "input_tokens": 75000,
    "output_tokens": 50000,
    "success_requests": 1200,
    "failed_requests": 50,
    "success_rate": "96.0%",
    "daily_stats": [...],
    "error_breakdown": {...}
  }
}
```

## 输出示例

```
============================================================
模型使用统计报告
============================================================
模型名称: ERNIE-Bot-turbo
统计时间: 2024-01-01 到 2024-01-07

总体统计:
  总请求数: 1,250
  总Token数: 125,000
  输入Token数: 75,000
  输出Token数: 50,000
  成功请求数: 1,200
  失败请求数: 50
  成功率: 96.0%

每日统计:
  2024-01-01: 180 请求, 18,000 Tokens, 成功 175, 失败 5
  2024-01-02: 200 请求, 20,000 Tokens, 成功 195, 失败 5
  ...

错误分析:
  rate_limit_exceeded: 20
  invalid_request: 15
  server_error: 10
  other: 5
============================================================
```

## 文件说明

- `baidu_cloud_model_stats.py` - 主程序文件
- `config.ini` - 配置文件
- `requirements.txt` - 依赖包列表
- `baidu_model_stats.log` - 日志文件（运行后生成）
- `model_stats_*.json` - 导出的JSON数据文件
- `model_stats_*.csv` - 导出的CSV数据文件

## 常见问题

### Q: 如何获取API密钥？

A: 请访问 [百度智能云千帆大模型平台](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)，创建应用并获取API密钥。

### Q: 提示"请在config.ini文件中配置正确的API密钥"怎么办？

A: 请检查config.ini文件中的api_key和secret_key是否正确填写，不要保留默认的"your_api_key_here"。

### Q: 无法获取真实数据怎么办？

A: 程序会在无法连接到百度云API时返回模拟数据用于演示。请检查网络连接和API密钥配置。

### Q: 如何查询特定时间段的数据？

A: 调用`get_usage_statistics()`方法时指定start_date和end_date参数：

```python
stats = stats_tool.get_usage_statistics(
    model_name="ERNIE-Bot-turbo",
    start_date="2024-01-01", 
    end_date="2024-01-31"
)
```

### Q: 支持哪些模型？

A: 支持百度千帆平台上的所有模型，包括但不限于：
- ERNIE-Bot
- ERNIE-Bot-turbo
- ERNIE-Bot-4
- ChatGLM2-6B
- Llama-2系列
- 等等

## 技术支持

如果您在使用过程中遇到问题，请：

1. 检查配置文件是否正确
2. 查看日志文件了解详细错误信息
3. 确认API密钥权限和余额
4. 检查网络连接状态

## 许可证

本项目采用MIT许可证，详情请参阅LICENSE文件。

## 更新日志

### v1.0.0 (2024-12-19)
- 初始版本发布
- 支持模型列表查询
- 支持使用统计查询
- 支持数据导出功能
- 完整的错误处理和日志记录