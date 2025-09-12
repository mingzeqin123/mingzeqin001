# 中国行政区划信息爬虫

这是一个用于爬取中国行政区划信息的Python爬虫程序，可以获取全国省、市、县三级行政区划数据。

## 功能特点

- 🏛️ **三级数据爬取**: 支持省、市、县三级行政区划数据爬取
- 📊 **多格式输出**: 支持JSON和CSV两种数据格式输出
- 🔄 **错误处理**: 内置重试机制和错误处理
- 📝 **详细日志**: 完整的爬取过程日志记录
- ⚡ **高效爬取**: 智能延迟避免请求过于频繁

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 基本使用

```bash
python region_crawler.py
```

### 编程接口使用

```python
from region_crawler import RegionCrawler

# 创建爬虫实例
crawler = RegionCrawler()

# 爬取所有数据（包括区县）
regions_data = crawler.crawl_all_regions(include_counties=True)

# 只爬取省市数据
regions_data = crawler.crawl_all_regions(include_counties=False)

# 保存数据
crawler.save_to_json("regions_data.json")
crawler.save_to_csv("regions_data.csv")

# 获取统计信息
stats = crawler.get_statistics()
print(f"总计: {stats['total_regions']} 个行政区划")
```

## 数据结构

### 省份数据格式
```json
{
  "code": "110000",
  "name": "北京市",
  "level": "province",
  "parent_code": ""
}
```

### 城市数据格式
```json
{
  "code": "110100",
  "name": "北京市",
  "level": "city",
  "parent_code": "110000"
}
```

### 区县数据格式
```json
{
  "code": "110101",
  "name": "东城区",
  "level": "county",
  "parent_code": "110100"
}
```

## 输出文件

程序运行后会生成以下文件：

- `regions_data.json`: JSON格式的完整数据
- `regions_data.csv`: CSV格式的完整数据
- `region_crawler.log`: 详细的运行日志

## 配置说明

### 爬虫配置
- `max_retries`: 最大重试次数（默认：3）
- `retry_delay`: 重试延迟时间（默认：1秒）
- `include_counties`: 是否包含区县数据（默认：True）

### 请求配置
- 自动设置User-Agent等请求头
- 智能延迟避免被反爬虫机制拦截
- 支持会话保持提高效率

## 数据来源说明

当前版本使用内置的示例数据，包含：
- 34个省级行政区（包括直辖市、自治区、特别行政区）
- 主要城市的市级行政区划
- 部分重要城市的区县级行政区划

## 扩展说明

### 接入真实API
要接入真实的行政区划API，需要：

1. 修改 `get_cities_by_province()` 方法
2. 修改 `get_counties_by_city()` 方法
3. 添加API认证和请求处理逻辑

### 常见API源
- 国家统计局API
- 高德地图API
- 百度地图API
- 腾讯地图API

## 注意事项

1. **遵守法律法规**: 请确保爬取行为符合相关法律法规
2. **尊重网站规则**: 遵守目标网站的robots.txt和使用条款
3. **合理使用**: 避免过于频繁的请求，建议添加适当的延迟
4. **数据准确性**: 行政区划数据可能发生变化，建议定期更新

## 错误处理

程序包含完善的错误处理机制：
- 网络请求失败自动重试
- 数据解析错误记录日志
- 文件保存失败提示用户

## 日志说明

日志文件 `region_crawler.log` 包含：
- 爬取进度信息
- 错误和警告信息
- 数据统计信息
- 性能监控数据

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

**免责声明**: 本工具仅供学习和研究使用，使用者需要自行承担使用风险，并确保遵守相关法律法规。