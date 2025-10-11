# OSS批量文件上传工具

这是一个用于批量上传文件到阿里云OSS（Object Storage Service）的Python工具，支持自动识别文件后缀和MIME类型。

## 功能特性

- 🚀 **批量上传**: 支持同时上传多个文件或整个目录
- 🔍 **自动检测**: 自动识别文件扩展名和MIME类型
- 📁 **目录遍历**: 递归遍历目录中的所有文件
- 🎯 **文件过滤**: 支持按文件扩展名过滤
- 🔄 **重试机制**: 上传失败时自动重试
- 📊 **进度显示**: 实时显示上传进度
- 📝 **详细日志**: 记录详细的上传日志
- ⚙️ **灵活配置**: 支持自定义上传前缀和配置

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

1. 复制并修改配置文件 `oss_config.json`:

```json
{
    "access_key_id": "your_access_key_id",
    "access_key_secret": "your_access_key_secret", 
    "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
    "bucket_name": "your_bucket_name",
    "upload_prefix": "uploads/",
    "overwrite": false,
    "max_retries": 3,
    "chunk_size": 8192
}
```

### 配置说明

- `access_key_id`: 阿里云AccessKey ID
- `access_key_secret`: 阿里云AccessKey Secret
- `endpoint`: OSS服务端点（根据你的区域选择）
- `bucket_name`: 存储桶名称
- `upload_prefix`: 上传文件的前缀路径
- `overwrite`: 是否覆盖已存在的文件
- `max_retries`: 最大重试次数
- `chunk_size`: 分块大小（字节）

## 使用方法

### 1. 命令行使用

#### 上传指定文件
```bash
python oss_uploader.py --files file1.txt file2.jpg file3.pdf
```

#### 上传整个目录
```bash
python oss_uploader.py --directory /path/to/directory
```

#### 只上传特定类型的文件
```bash
python oss_uploader.py --directory /path/to/directory --extensions .jpg .png .gif
```

#### 自定义上传前缀
```bash
python oss_uploader.py --files file1.txt --prefix "documents/2024/"
```

#### 查看帮助
```bash
python oss_uploader.py --help
```

### 2. 编程使用

```python
from oss_uploader import OSSUploader

# 创建上传器
uploader = OSSUploader("oss_config.json")

# 上传指定文件
files = ["file1.txt", "file2.jpg", "file3.pdf"]
results = uploader.upload_files(files, custom_prefix="my-files/")

# 上传整个目录
results = uploader.upload_directory(
    "/path/to/directory", 
    custom_prefix="backup/",
    file_extensions=['.txt', '.jpg', '.pdf']
)

# 检查结果
for file_path, success in results.items():
    print(f"{file_path}: {'成功' if success else '失败'}")
```

## 支持的文件类型

工具自动识别以下文件类型：

### 图片文件
- `.jpg`, `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.bmp` → `image/bmp`
- `.webp` → `image/webp`
- `.svg` → `image/svg+xml`

### 文档文件
- `.pdf` → `application/pdf`
- `.doc` → `application/msword`
- `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `.xls` → `application/vnd.ms-excel`
- `.xlsx` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `.ppt` → `application/vnd.ms-powerpoint`
- `.pptx` → `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### 文本文件
- `.txt` → `text/plain`
- `.csv` → `text/csv`
- `.json` → `application/json`
- `.xml` → `application/xml`
- `.html` → `text/html`
- `.css` → `text/css`
- `.js` → `application/javascript`
- `.md` → `text/markdown`

### 压缩文件
- `.zip` → `application/zip`
- `.rar` → `application/x-rar-compressed`
- `.7z` → `application/x-7z-compressed`

### 音视频文件
- `.mp4` → `video/mp4`
- `.avi` → `video/x-msvideo`
- `.mov` → `video/quicktime`
- `.mp3` → `audio/mpeg`
- `.wav` → `audio/wav`
- `.flac` → `audio/flac`

### 编程文件
- `.py` → `text/x-python`
- `.java` → `text/x-java-source`
- `.cpp` → `text/x-c++src`
- `.c` → `text/x-c`
- `.h` → `text/x-c`

## 文件命名规则

上传到OSS的文件会按照以下规则命名：

```
{upload_prefix}{timestamp}_{original_filename}
```

例如：
- 原始文件: `document.pdf`
- 上传前缀: `files/`
- 最终OSS键名: `files/20241201_143022_document.pdf`

## 日志

工具会生成详细的日志文件 `oss_upload.log`，包含：
- 上传进度信息
- 文件类型检测结果
- 成功/失败状态
- 错误信息

## 示例

运行示例代码：

```bash
python upload_example.py
```

这将演示：
1. 文件类型自动检测
2. 上传指定文件
3. 上传整个目录

## 注意事项

1. 确保阿里云OSS存储桶已创建并有正确的访问权限
2. 配置文件中的AccessKey需要有OSS的读写权限
3. 大文件上传可能需要较长时间，请耐心等待
4. 建议在上传前先测试小文件
5. 如果遇到权限问题，请检查AccessKey和存储桶权限设置

## 错误处理

工具包含完善的错误处理机制：
- 自动重试失败的上传
- 详细的错误日志记录
- 跳过不存在的文件
- 处理网络异常和权限问题

## 许可证

本项目使用MIT许可证。