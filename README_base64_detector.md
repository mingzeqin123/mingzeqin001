# Base64 文件类型检测器

这是一个用于检测 Base64 编码字符串原始文件类型的工具集。通过分析解码后的文件头部字节（Magic Bytes）来判断原始文件的类型。

## 功能特点

- 🔍 **自动检测** - 支持50+种常见文件格式
- 🌐 **多种使用方式** - Python脚本、Web界面、命令行
- 📊 **详细信息** - 提供文件类型、MIME类型、文件大小等
- 🎯 **高准确性** - 基于文件签名（Magic Bytes）进行检测
- 🔧 **易于集成** - 简单的API接口

## 支持的文件类型

### 图片格式
- JPEG, PNG, GIF, BMP, WebP, ICO, CUR, SVG

### 文档格式  
- PDF, DOC, DOCX, XLSX, PPTX, XML, HTML, JSON, TXT

### 压缩格式
- ZIP, GZIP, RAR, 7Z, XZ, BZIP2

### 音频格式
- MP3, OGG, FLAC, WAV

### 视频格式
- MP4, FLV, MKV, AVI

### 可执行文件
- EXE, ELF, Mach-O, Java Class

## 使用方法

### 1. Python 脚本使用

#### 基本用法
```python
from base64_file_detector import analyze_base64_file

# 分析 Base64 字符串
base64_string = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
result = analyze_base64_file(base64_string)

print(f"文件类型: {result['detected_file_type']}")
print(f"MIME类型: {result['mime_type']}")
print(f"文件大小: {result['file_size_bytes']} 字节")
```

#### 命令行使用
```bash
# 直接分析 Base64 字符串
python base64_file_detector.py "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB..."

# 运行演示
python demo_base64_detector.py demo

# 交互模式
python demo_base64_detector.py interactive
```

### 2. Web 界面使用

打开 `web_demo.html` 文件，可以：
- 直接粘贴 Base64 字符串进行分析
- 选择本地文件自动转换为 Base64 并分析
- 使用内置的示例数据进行测试

### 3. API 接口

```python
from base64_file_detector import Base64FileDetector

detector = Base64FileDetector()

# 解码 Base64
decoded_data = detector.decode_base64(base64_string)

# 检测文件类型
file_type, info = detector.detect_file_type(base64_string)

# 获取 MIME 类型
mime_type = detector.get_mime_type(file_type)
```

## 返回结果格式

```json
{
  "detected_file_type": "png",
  "mime_type": "image/png",
  "file_size_bytes": 95,
  "first_bytes_hex": "89504e470d0a1a0a0000000d49484452",
  "detected_signatures": [
    {
      "signature": "89504e470d0a1a0a",
      "file_type": "png"
    }
  ],
  "error": null
}
```

## 工作原理

1. **Base64 解码** - 将 Base64 字符串解码为二进制数据
2. **魔数检测** - 检查文件头部的特征字节序列（Magic Bytes）
3. **特殊处理** - 对某些复杂格式进行额外的内容分析
4. **类型判断** - 根据检测结果确定最可能的文件类型

## 文件结构

```
├── base64_file_detector.py    # 核心检测模块
├── demo_base64_detector.py    # 演示和测试脚本
├── web_demo.html              # Web界面
└── README_base64_detector.md  # 使用说明
```

## 示例

### PNG 图片
```
输入: iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==
结果: PNG 图片 (image/png)
```

### PDF 文档  
```
输入: JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2Jq
结果: PDF 文档 (application/pdf)
```

### JSON 数据
```
输入: eyJuYW1lIjogInRlc3QiLCAidHlwZSI6ICJkZW1vIiwgInZhbHVlIjogMTIzfQ==
结果: JSON 文件 (application/json)
```

## 注意事项

1. **数据URI支持** - 支持 `data:image/png;base64,xxx` 格式
2. **大文件限制** - Web界面限制10MB以内的文件
3. **编码格式** - 输入必须是有效的 Base64 编码
4. **准确性** - 基于文件头部特征，对于某些格式可能需要更多内容才能准确识别

## 扩展支持

如需添加新的文件格式支持，可以在 `FILE_SIGNATURES` 字典中添加对应的魔数：

```python
FILE_SIGNATURES = {
    b'\x新的魔数': 'new_format',
    # ...
}
```

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。