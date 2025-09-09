# 百度云模型使用情况统计工具

这是一个用于统计百度云AI模型（如文心一言、千帆大模型等）使用情况的Python工具。

## 功能特性

- 📊 **使用统计**: 统计模型的总请求数、Token使用量、成功率等
- 📅 **时间范围**: 支持自定义日期范围查询
- 📝 **详细日志**: 获取具体的使用记录和日志
- 📋 **多模型支持**: 同时统计多个模型的使用情况
- 📄 **报告生成**: 自动生成格式化的统计报告
- 💾 **文件保存**: 将报告保存为文本文件

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置API密钥

### 方法1: 环境变量（推荐）

```bash
export BAIDU_API_KEY=your_api_key_here
export BAIDU_SECRET_KEY=your_secret_key_here
```

### 方法2: 直接修改代码

在 `baidu_cloud_model_stats.py` 中直接设置：

```python
api_key = "your_api_key_here"
secret_key = "your_secret_key_here"
```

### 方法3: 使用配置文件

复制 `.env.example` 为 `.env` 并填入您的API密钥。

## 快速开始

### 基础使用

```python
from baidu_cloud_model_stats import BaiduCloudAPIClient

# 创建客户端
client = BaiduCloudAPIClient(api_key, secret_key)

# 获取模型使用统计
stats = client.get_model_usage_stats(
    model_name="ernie-bot",
    start_date="2024-01-01",
    end_date="2024-01-07"
)

print(f"总请求数: {stats.total_requests}")
print(f"总Token数: {stats.total_tokens}")
```

### 生成统计报告

```python
from baidu_cloud_model_stats import BaiduCloudAPIClient, ModelStatsReporter

# 创建客户端和报告生成器
client = BaiduCloudAPIClient(api_key, secret_key)
reporter = ModelStatsReporter(client)

# 生成报告
report = reporter.generate_summary_report(
    model_names=["ernie-bot", "ernie-bot-turbo"],
    days=30
)

print(report)
reporter.save_report_to_file(report)
```

### 运行主程序

```bash
python baidu_cloud_model_stats.py
```

## 支持的模型

- `ernie-bot` - 文心一言基础版
- `ernie-bot-turbo` - 文心一言Turbo版
- `ernie-bot-4` - 文心一言4.0
- `ernie-bot-8k` - 文心一言8K版本
- `ernie-bot-128k` - 文心一言128K版本
- `ernie-vilg-v2` - 文心一格图像生成
- `ernie-speed` - 文心一言Speed版
- `ernie-speed-128k` - 文心一言Speed 128K版

## API参考

### BaiduCloudAPIClient

#### 初始化
```python
client = BaiduCloudAPIClient(api_key, secret_key)
```

#### 主要方法

##### get_model_usage_stats()
获取模型使用统计信息

**参数:**
- `model_name` (str): 模型名称
- `start_date` (str): 开始日期，格式：YYYY-MM-DD
- `end_date` (str): 结束日期，格式：YYYY-MM-DD

**返回:**
- `ModelUsageStats`: 包含统计信息的对象

##### get_available_models()
获取可用的模型列表

**返回:**
- `List[Dict]`: 可用模型列表

##### get_detailed_usage_logs()
获取详细的使用日志

**参数:**
- `model_name` (str): 模型名称
- `start_date` (str): 开始日期
- `end_date` (str): 结束日期
- `limit` (int): 返回记录数限制

**返回:**
- `List[Dict]`: 详细使用日志

### ModelStatsReporter

#### 主要方法

##### generate_summary_report()
生成汇总报告

**参数:**
- `model_names` (List[str]): 要统计的模型名称列表
- `days` (int): 统计天数

**返回:**
- `str`: 格式化的报告文本

##### save_report_to_file()
保存报告到文件

**参数:**
- `report` (str): 报告内容
- `filename` (str): 文件名

## 使用示例

查看 `example_usage.py` 文件获取更多详细的使用示例。

### 运行示例

```bash
python example_usage.py
```

## 输出示例

### 统计报告示例

```
============================================================
百度云模型使用情况统计报告
============================================================
统计时间范围: 2024-01-01 至 2024-01-07
生成时间: 2024-01-08 10:30:00

模型名称: ernie-bot
  总请求数: 1,250
  总Token数: 45,680
  成功请求: 1,200
  失败请求: 50
  平均响应时间: 1.25ms
  成功率: 96.0%

模型名称: ernie-bot-turbo
  总请求数: 890
  总Token数: 32,150
  成功请求: 875
  失败请求: 15
  平均响应时间: 0.95ms
  成功率: 98.3%

----------------------------------------
总计
----------------------------------------
总请求数: 2,140
总Token数: 77,830
============================================================
```

## 错误处理

程序包含完善的错误处理机制：

- 网络请求失败自动重试
- API密钥验证
- 数据格式验证
- 详细的错误信息提示

## 注意事项

1. **API密钥安全**: 请妥善保管您的API密钥，不要将其提交到版本控制系统
2. **请求限制**: 注意百度云API的请求频率限制
3. **数据准确性**: 统计数据可能存在延迟，建议查询时包含一定的缓冲时间
4. **网络连接**: 确保网络连接稳定，程序会自动重试失败的请求

## 故障排除

### 常见问题

1. **获取访问令牌失败**
   - 检查API密钥是否正确
   - 确认网络连接正常

2. **获取统计数据失败**
   - 检查模型名称是否正确
   - 确认日期格式为 YYYY-MM-DD
   - 验证是否有权限访问该模型

3. **网络请求超时**
   - 检查网络连接
   - 增加请求超时时间

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础的使用统计功能
- 支持多模型统计
- 支持报告生成和保存