# 中国行政区划信息爬虫

这是一个用于获取中国全国各地行政区划信息的Python爬虫工具集，包含多个版本以适应不同需求和环境。

## 📁 项目文件结构

```
├── china_administrative_crawler.py     # 完整版爬虫（需要外部依赖）
├── simple_china_crawler.py            # 简化版爬虫（仅使用标准库）
├── enhanced_china_crawler.py          # 增强版爬虫（包含更多数据）
├── requirements.txt                    # Python依赖文件
└── README.md                          # 使用说明
```

## 🚀 功能特点

- 🏛️ **权威数据源**：基于国家统计局等官方数据
- 📊 **多级区划**：支持省、市、区县三级行政区划信息
- 💾 **多种格式**：支持JSON和CSV两种数据格式输出
- 🛡️ **环境适应**：提供不同版本适应各种运行环境
- 📝 **详细日志**：完整的运行过程日志记录
- 🔄 **数据完整**：包含34个省级行政区的详细信息

## 📋 爬虫版本说明

### 1. 完整版 (`china_administrative_crawler.py`)
- **特点**：功能最全面，支持网络爬取
- **依赖**：需要安装 requests、beautifulsoup4 等
- **适用**：有完整Python环境的服务器

### 2. 简化版 (`simple_china_crawler.py`) 
- **特点**：仅使用Python标准库，无外部依赖
- **数据**：包含预定义的行政区划数据
- **适用**：受限环境或快速部署

### 3. 增强版 (`enhanced_china_crawler.py`)
- **特点**：数据最完整，包含34个省级行政区
- **统计**：详细的数据统计和分析功能
- **适用**：需要完整数据的应用场景

## 📊 数据字段说明

每条行政区划记录包含以下字段：

- `level`: 行政级别（省、市、区县）
- `code`: 6位行政区划代码
- `name`: 行政区划名称
- `type`: 行政区类型（直辖市、省、自治区、特别行政区等）
- `parent_code`: 上级行政区划代码
- `parent_name`: 上级行政区划名称
- `full_path`: 完整路径（如：广东省/深圳市/南山区）

## 🔧 安装和使用

### 环境要求
- Python 3.6+

### 安装依赖（完整版需要）
```bash
pip install -r requirements.txt
```

### 使用方法

#### 1. 简化版（推荐新手）
```bash
python3 simple_china_crawler.py
```

#### 2. 增强版（推荐使用）
```bash
python3 enhanced_china_crawler.py
```

#### 3. 完整版（需要网络环境）
```bash
python3 china_administrative_crawler.py
```

### 程序化使用示例
```python
from enhanced_china_crawler import EnhancedChinaAdministrativeCrawler

# 创建爬虫实例
crawler = EnhancedChinaAdministrativeCrawler()

# 运行爬虫
crawler.run()

# 获取数据
data = crawler.get_comprehensive_data()
```

## 📄 输出文件

运行后会生成以下文件：

### 简化版输出
- `china_administrative_divisions.json`: JSON格式数据
- `china_administrative_divisions.csv`: CSV格式数据
- `crawler.log`: 运行日志

### 增强版输出
- `enhanced_china_administrative_divisions.json`: 完整JSON数据
- `enhanced_china_administrative_divisions.csv`: 完整CSV数据
- `enhanced_crawler.log`: 详细日志

## 📈 数据统计（增强版）

增强版爬虫包含以下数据：
- **省级行政区**: 34个（包括23个省、5个自治区、4个直辖市、2个特别行政区）
- **地级市**: 25个主要城市
- **市辖区**: 21个主要区县
- **总计**: 80条记录

## 💡 数据示例

### JSON格式
```json
[
  {
    "level": "省",
    "code": "440000",
    "name": "广东省",
    "type": "省",
    "parent_code": "",
    "parent_name": "中华人民共和国",
    "full_path": "广东省"
  },
  {
    "level": "市",
    "code": "440300",
    "name": "深圳市",
    "type": "地级市",
    "parent_code": "440000",
    "parent_name": "广东省",
    "full_path": "广东省/深圳市"
  },
  {
    "level": "区县",
    "code": "440305",
    "name": "南山区",
    "type": "市辖区",
    "parent_code": "440300",
    "parent_name": "深圳市",
    "full_path": "广东省/深圳市/南山区"
  }
]
```

## ⚠️ 注意事项

1. **环境选择**：根据你的运行环境选择合适的爬虫版本
2. **数据时效性**：行政区划信息可能会有变更，建议定期更新
3. **合规使用**：请遵守相关法律法规和网站使用条款
4. **编码问题**：程序已处理中文编码，如有问题请检查系统编码设置

## 🔍 技术架构

- **核心语言**: Python 3.6+
- **数据处理**: JSON, CSV
- **日志系统**: Python logging
- **编码支持**: UTF-8
- **网络请求**: urllib (标准库) / requests (完整版)
- **HTML解析**: html.parser (标准库) / BeautifulSoup4 (完整版)

## 🚨 故障排除

### 常见问题

1. **导入错误**
   - 检查Python版本是否为3.6+
   - 确认文件路径正确

2. **权限问题**
   - 确保有文件写入权限
   - 检查磁盘空间

3. **编码问题**
   - 确保终端支持UTF-8编码
   - 检查系统编码设置

## 📝 更新日志

- **v1.2.0**: 增加增强版爬虫，包含34个省级行政区完整数据
- **v1.1.0**: 添加简化版爬虫，支持无依赖运行
- **v1.0.0**: 初始版本，基础爬虫功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

### 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件反馈

---

**感谢使用中国行政区划信息爬虫工具！** 🇨🇳