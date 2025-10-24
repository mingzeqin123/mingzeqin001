# IT新闻爬虫 🕷️

一个功能强大的IT行业新闻爬虫，能够从多个知名IT媒体网站爬取最新新闻，并根据热度算法筛选出最受关注的新闻内容。

## 🌟 主要特性

- **多源爬取**: 支持36氪、虎嗅网、InfoQ、CSDN、IT之家等主流IT媒体
- **智能热度算法**: 综合浏览量、评论数、点赞数和时间新鲜度计算新闻热度
- **数据去重**: 自动识别和过滤重复新闻
- **多格式输出**: 支持JSON、控制台输出等多种格式
- **可配置**: 丰富的配置选项，支持自定义爬取参数
- **容错处理**: 完善的异常处理和重试机制

## 📁 文件结构

```
├── it_news_crawler.py      # 主爬虫程序
├── test_crawler.py         # 测试脚本（包含演示数据）
├── crawler_config.py       # 配置文件
├── requirements.txt        # 依赖包列表
└── README_IT_NEWS_CRAWLER.md  # 说明文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pip3 install -r requirements.txt
```

或手动安装：

```bash
pip3 install requests beautifulsoup4 lxml
```

### 2. 运行测试

```bash
python3 test_crawler.py
```

### 3. 运行完整爬虫

```bash
python3 it_news_crawler.py
```

## 📊 热度算法

新闻热度分数计算公式：

```
热度分数 = 浏览量权重(40%) + 评论数权重(30%) + 点赞数权重(20%) + 时间新鲜度权重(10%)
```

- **浏览量**: 标准化到10分制，1万浏览量 = 1分
- **评论数**: 标准化到10分制，100评论 = 1分  
- **点赞数**: 标准化到10分制，1000点赞 = 1分
- **时间新鲜度**: 24小时内的新闻获得更高分数

## 🎯 支持的新闻源

| 新闻源 | 网站 | 状态 | 特色 |
|--------|------|------|------|
| 36氪 | 36kr.com | ✅ | 创业投资资讯 |
| 虎嗅网 | huxiu.com | ✅ | 科技商业分析 |
| InfoQ | infoq.cn | ✅ | 技术开发资讯 |
| CSDN | csdn.net | ✅ | 开发者社区 |
| IT之家 | ithome.com | ✅ | 数码科技新闻 |

## 🔧 配置说明

在 `crawler_config.py` 中可以调整以下参数：

### 基础配置
```python
CRAWLER_CONFIG = {
    'timeout': 10,              # 请求超时时间
    'retry_times': 3,           # 重试次数
    'delay_between_requests': 1, # 请求间隔
    'max_news_per_source': 20,  # 每个源的新闻数量限制
}
```

### 热度权重
```python
'heat_weights': {
    'view_count': 0.4,      # 浏览量权重
    'comment_count': 0.3,   # 评论数权重
    'like_count': 0.2,      # 点赞数权重
    'time_freshness': 0.1   # 时间新鲜度权重
}
```

### 新闻源开关
```python
NEWS_SOURCES = {
    '36kr': {'enabled': True, 'priority': 1},
    'huxiu': {'enabled': True, 'priority': 2},
    # ...
}
```

## 📤 输出格式

### JSON格式输出
```json
{
  "crawl_time": "2025-10-24 10:55:55",
  "total_count": 50,
  "top_hot_news": [
    {
      "rank": 1,
      "title": "OpenAI发布GPT-5，性能提升显著",
      "url": "https://example.com/news/1",
      "source": "36氪",
      "publish_time": "2025-10-24 10:00:00",
      "summary": "OpenAI正式发布了GPT-5模型...",
      "heat_score": 3.90,
      "stats": {
        "view_count": 15000,
        "comment_count": 300,
        "like_count": 1200
      }
    }
  ]
}
```

### 控制台输出
```
🔥 今日IT行业热门新闻 TOP 10
================================================================================
🏆 第 1 名 (热度: 3.90)
📰 标题: OpenAI发布GPT-5，性能提升显著
🔗 链接: https://example.com/news/1
📺 来源: 36氪
⏰ 时间: 2025-10-24 10:00:00
📝 摘要: OpenAI正式发布了GPT-5模型...
📊 统计: 浏览 15000 | 评论 300 | 点赞 1200
```

## 🛠️ 高级功能

### 1. 自定义爬虫类

```python
from it_news_crawler import ITNewsCrawler

crawler = ITNewsCrawler()

# 爬取特定源
news_36kr = crawler.crawl_36kr()

# 获取热门新闻
top_news = crawler.get_top_hot_news(limit=5)

# 保存数据
crawler.save_to_json("my_news.json")
```

### 2. 批量处理

```python
# 爬取所有源
all_news = crawler.crawl_all_sources()

# 按热度排序
sorted_news = sorted(all_news, key=lambda x: x.heat_score, reverse=True)

# 筛选特定来源
csdn_news = [news for news in all_news if news.source == "CSDN"]
```

### 3. 数据分析

```python
# 统计各源新闻数量
from collections import Counter
source_count = Counter([news.source for news in all_news])

# 计算平均热度
avg_heat = sum([news.heat_score for news in all_news]) / len(all_news)
```

## 🔍 使用示例

### 基础使用
```python
#!/usr/bin/env python3
from it_news_crawler import ITNewsCrawler

# 创建爬虫实例
crawler = ITNewsCrawler()

# 爬取并显示热门新闻
crawler.crawl_all_sources()
crawler.print_top_news(10)

# 保存结果
crawler.save_to_json()
```

### 定制化使用
```python
#!/usr/bin/env python3
from it_news_crawler import ITNewsCrawler
import json

crawler = ITNewsCrawler()

# 只爬取36氪和虎嗅
news_36kr = crawler.crawl_36kr()
news_huxiu = crawler.crawl_huxiu()

# 合并并排序
all_news = news_36kr + news_huxiu
top_5 = sorted(all_news, key=lambda x: x.heat_score, reverse=True)[:5]

# 自定义输出
for i, news in enumerate(top_5, 1):
    print(f"{i}. {news.title} (热度: {news.heat_score:.2f})")
```

## ⚠️ 注意事项

1. **请求频率**: 为避免被反爬虫机制拦截，程序在请求间设置了延时
2. **网站变更**: 目标网站结构可能会变化，需要定期更新爬虫代码
3. **法律合规**: 请确保爬取行为符合网站的robots.txt和使用条款
4. **数据准确性**: 由于网站反爬虫机制，部分数据可能使用默认值

## 🐛 故障排除

### 常见问题

1. **ModuleNotFoundError**: 
   ```bash
   pip3 install requests beautifulsoup4 lxml
   ```

2. **网络超时**:
   - 检查网络连接
   - 增加 `timeout` 配置值
   - 使用代理（在配置中设置）

3. **爬取失败**:
   - 检查目标网站是否可访问
   - 更新User-Agent字符串
   - 检查网站结构是否有变化

### 调试模式

启用详细日志：
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 更新日志

### v1.0.0 (2025-10-24)
- ✅ 实现多源新闻爬取
- ✅ 智能热度算法
- ✅ JSON数据输出
- ✅ 完善的错误处理
- ✅ 配置文件支持

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱: [your-email@example.com]

---

⭐ 如果这个项目对你有帮助，请给个星星支持一下！