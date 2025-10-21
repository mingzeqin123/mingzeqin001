# 大文件个人信息提取工具

这是一个用于从大文件中提取手机号、地址、人名等个人信息的Python工具。

## 功能特点

- **大文件支持**: 支持处理GB级别的大文件，使用流式处理避免内存溢出
- **多种数据提取**: 
  - 手机号：支持中国11位手机号格式，包括各种分隔符
  - 地址：基于关键词匹配识别地址信息
  - 人名：使用jieba分词和姓名库识别中文人名
- **进度显示**: 实时显示处理进度
- **多格式输出**: 支持JSON和CSV格式输出
- **统计信息**: 提供详细的提取统计信息

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 基本用法

```bash
python extract_personal_data.py your_large_file.txt
```

### 高级用法

```bash
# 指定输出目录
python extract_personal_data.py your_large_file.txt --output my_results

# 调整处理块大小（默认1MB）
python extract_personal_data.py your_large_file.txt --chunk-size 2097152

# 查看帮助
python extract_personal_data.py --help
```

## 输出文件

程序会在指定的输出目录中生成以下文件：

- `extracted_data.json`: 所有提取数据的JSON格式
- `phones.csv`: 提取的手机号列表
- `addresses.csv`: 提取的地址列表
- `names.csv`: 提取的人名列表
- `statistics.txt`: 提取统计信息

## 支持的手机号格式

- 标准11位：`13812345678`
- 带分隔符：`138-1234-5678`, `138 1234 5678`, `138.1234.5678`
- 带国际区号：`+86 13812345678`, `+86-13812345678`
- 带括号：`(13812345678)`

## 地址识别

程序会识别包含以下关键词的地址信息：
- 行政区划：省、市、区、县、镇、乡、街道等
- 具体地址：路、街、巷、号、小区、广场等
- 方位词：东、西、南、北、中、内、外等
- 中国主要省市名称

## 人名识别

程序会识别包含以下特征的中文人名：
- 常见姓氏
- 2-4个字符长度
- 纯中文字符
- 通过jieba分词验证

## 性能优化

- 使用流式处理，内存占用低
- 支持自定义处理块大小
- 实时进度显示
- 错误处理机制

## 注意事项

1. 确保文件编码为UTF-8
2. 大文件处理可能需要较长时间
3. 提取结果可能存在误识别，建议人工验证
4. 程序会自动忽略无法解码的字符

## 示例

```python
from extract_personal_data import PersonalDataExtractor

# 创建提取器实例
extractor = PersonalDataExtractor()

# 处理文件
results = extractor.process_file('large_file.txt')

# 查看结果
print(f"提取到 {len(results['phones'])} 个手机号")
print(f"提取到 {len(results['addresses'])} 个地址")
print(f"提取到 {len(results['names'])} 个人名")
```

## 许可证

MIT License