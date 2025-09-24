# Base64文件类型检测器

一个用于根据base64编码数据判断原始文件类型的Python工具。

## 功能特点

- 🔍 **智能检测**: 通过分析文件头魔数（文件签名）准确识别文件类型
- 📁 **广泛支持**: 支持50+种常见文件格式，包括图片、文档、音频、视频等
- 🛡️ **错误处理**: 完善的错误处理机制，处理无效base64数据
- 📊 **详细分析**: 提供文件大小、文件头信息、MIME类型等详细信息
- 🚀 **易于使用**: 简单的API接口，支持命令行和编程调用

## 支持的文件类型

### 图片格式
- JPEG, PNG, GIF, BMP, WEBP, TIFF, ICO, SVG

### 文档格式  
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

### 压缩文件
- ZIP, RAR, 7Z, TAR, GZIP

### 音频格式
- MP3, WAV, FLAC, OGG, AAC

### 视频格式
- MP4, AVI, MOV, WMV, FLV, MKV

### 文本格式
- TXT, XML, HTML, CSS

### 可执行文件
- EXE, ELF, MACHO

### 其他格式
- SQLITE, SWF, PSD, EPS

## 安装和使用

### 基本使用

```python
from file_type_detector import FileTypeDetector

# 检测文件类型
base64_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
file_type, message, details = FileTypeDetector.detect_file_type(base64_data)

print(f"文件类型: {file_type}")
print(f"详细信息: {details}")
```

### 详细分析

```python
# 获取详细分析结果
detailed_result = FileTypeDetector.analyze_base64_detailed(base64_data)
print(detailed_result)
```

### 命令行使用

```bash
# 检测文件类型
python file_type_detector.py "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

# 查看支持的文件类型
python file_type_detector.py --supported-types
```

### 运行测试

```bash
# 运行测试示例
python test_file_detector.py
```

## API参考

### FileTypeDetector类

#### detect_file_type(base64_data: str) -> Tuple[Optional[str], str, Dict]

检测base64数据的文件类型。

**参数:**
- `base64_data`: base64编码的字符串

**返回:**
- `file_type`: 检测到的文件类型，如果未检测到则返回None
- `message`: 检测结果消息
- `details`: 详细信息字典，包含文件大小、文件头等信息

#### analyze_base64_detailed(base64_data: str) -> Dict

对base64数据进行详细分析。

**参数:**
- `base64_data`: base64编码的字符串

**返回:**
- 包含详细分析结果的字典

#### get_supported_types() -> list

获取支持的文件类型列表。

**返回:**
- 支持的文件类型列表

## 工作原理

该工具通过分析文件的"魔数"（Magic Number）来识别文件类型。魔数是文件开头的特定字节序列，每种文件格式都有其独特的魔数。

例如：
- JPEG文件以 `FF D8 FF` 开头
- PNG文件以 `89 50 4E 47 0D 0A 1A 0A` 开头
- PDF文件以 `25 50 44 46` (%PDF) 开头

## 示例输出

```
检测结果: 检测到文件类型: PNG
详细信息: {
    'file_size': 95,
    'header_hex': '89504E470D0A1A0A0000000D4948445200000001',
    'is_valid_base64': True,
    'binary_data_length': 95
}
```

## 注意事项

1. 该工具只能检测有明确文件头魔数的文件类型
2. 某些文件格式可能没有固定的文件头，检测可能不准确
3. 对于文本文件，工具会尝试通过内容分析来判断
4. 无效的base64数据会被正确识别并报告错误

## 许可证

MIT License