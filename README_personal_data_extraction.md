# 个人信息提取工具

从1GB+大文件中高效提取手机号、地址、人名等个人信息的Python工具。

## 功能特点

- **内存高效**: 使用流式处理，支持任意大小的文件
- **智能识别**: 支持多种格式的手机号、中文姓名、地址
- **高性能**: 优化的正则表达式和批量处理
- **结果导出**: 自动去重并保存为分类文件
- **进度显示**: 实时显示处理进度和统计信息

## 支持的数据格式

### 手机号
- 标准11位: `13812345678`
- 带空格: `138 1234 5678`
- 带横线: `138-1234-5678`
- 带国际区号: `+86 13812345678`

### 中文姓名
- 2-4个汉字的姓名
- 带标签的姓名: `姓名: 张三`、`客户: 李四`

### 地址
- 完整地址: `北京市海淀区中关村大街1号`
- 带标签地址: `地址: 上海市浦东新区...`
- 邮编+地址: `100000 北京市...`

## 安装和使用

### 1. 环境要求
```bash
Python 3.6+
```

### 2. 基本使用
```bash
# 处理大文件
python extract_personal_data.py your_large_file.txt

# 指定输出目录
python extract_personal_data.py your_large_file.txt -o results

# 调整读取块大小(适用于超大文件)
python extract_personal_data.py your_large_file.txt -c 16384
```

### 3. 生成测试数据
```bash
# 生成10MB测试文件
python create_test_data.py

# 在Python中自定义大小
python -c "from create_test_data import generate_test_data; generate_test_data('big_test.txt', 100)"
```

## 输出结果

处理完成后，会在指定目录生成以下文件：

```
extracted_data/
├── phones.txt          # 提取的手机号(已去重)
├── names.txt           # 提取的姓名(已去重)  
├── addresses.txt       # 提取的地址(已去重)
└── statistics.json     # 处理统计信息
```

## 性能优化

### 内存使用
- 流式处理，内存占用恒定(约几MB)
- 支持任意大小文件，包括TB级别

### 处理速度
- 典型速度: 10,000-50,000 行/秒
- 1GB文件通常在几分钟内完成
- 可通过调整chunk_size优化

### 建议设置
```bash
# 对于SSD存储的大文件
python extract_personal_data.py file.txt -c 32768

# 对于机械硬盘
python extract_personal_data.py file.txt -c 8192

# 对于网络存储
python extract_personal_data.py file.txt -c 4096
```

## 示例输出

```
开始处理文件: large_data.txt
文件大小: 1.25 GB
进度: 25.0% - 已处理 250000 行
进度: 50.0% - 已处理 500000 行
进度: 75.0% - 已处理 750000 行
进度: 100.0% - 已处理 1000000 行
文件处理完成，耗时: 45.67 秒

==================================================
数据提取摘要
==================================================
处理行数: 1,000,000
处理时间: 45.67 秒
处理速度: 21,897 行/秒

找到手机号: 15,234 个唯一号码
找到姓名: 8,567 个唯一姓名  
找到地址: 12,890 个唯一地址

手机号示例:
  13812345678
  15987654321
  18612345678

姓名示例:
  张三
  李四
  王五

地址示例:
  北京市海淀区中关村大街1号...
  上海市浦东新区陆家嘴金融中心...
  广东省深圳市南山区科技园...

结果已保存到: extracted_data/
- 手机号: extracted_data/phones.txt (15,234 个)
- 姓名: extracted_data/names.txt (8,567 个)
- 地址: extracted_data/addresses.txt (12,890 个)
- 统计: extracted_data/statistics.json
```

## 自定义和扩展

### 修改正则表达式
可以在 `PersonalDataExtractor` 类中修改正则表达式模式：

```python
# 添加新的手机号格式
self.phone_patterns.append(r'新的手机号正则')

# 添加新的姓名格式  
self.name_patterns.append(r'新的姓名正则')

# 添加新的地址格式
self.address_patterns.append(r'新的地址正则')
```

### 过滤和验证
可以添加自定义的过滤逻辑：

```python
def is_valid_name(self, name):
    # 自定义姓名验证逻辑
    return len(name) >= 2 and name not in ['测试', '系统']
```

## 注意事项

1. **隐私保护**: 请确保有权限处理相关个人信息
2. **数据安全**: 处理敏感数据时注意文件权限和存储安全
3. **准确性**: 正则表达式可能产生误匹配，建议人工复核重要结果
4. **编码**: 默认使用UTF-8编码，如遇到编码问题请调整

## 故障排除

### 常见问题

**Q: 内存不足错误**
A: 减小chunk_size参数，如 `-c 4096`

**Q: 处理速度慢**  
A: 增大chunk_size参数，如 `-c 32768`

**Q: 编码错误**
A: 检查文件编码，工具会自动忽略编码错误

**Q: 提取结果不准确**
A: 调整正则表达式模式或添加自定义过滤逻辑

## 技术支持

如有问题或建议，请检查：
1. Python版本是否为3.6+
2. 文件路径是否正确
3. 是否有足够的磁盘空间存储结果
4. 文件权限是否正确