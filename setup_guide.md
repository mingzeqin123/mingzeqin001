# OSS批量文件上传工具 - 设置指南

## 快速开始

### 1. 安装依赖

```bash
pip3 install -r requirements.txt
```

### 2. 配置OSS连接

编辑 `oss_config.json` 文件，填入你的阿里云OSS配置信息：

```json
{
    "access_key_id": "你的AccessKey ID",
    "access_key_secret": "你的AccessKey Secret",
    "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
    "bucket_name": "你的存储桶名称",
    "upload_prefix": "uploads/",
    "overwrite": false,
    "max_retries": 3,
    "chunk_size": 8192
}
```

### 3. 获取阿里云OSS配置信息

1. 登录阿里云控制台
2. 进入对象存储OSS服务
3. 创建存储桶（如果还没有）
4. 在访问控制中创建AccessKey
5. 记录以下信息：
   - AccessKey ID
   - AccessKey Secret
   - 存储桶名称
   - 服务端点（根据你的区域选择）

### 4. 测试配置

```bash
python3 simple_test.py
```

## 使用示例

### 上传指定文件

```bash
python3 oss_uploader.py --files file1.txt file2.jpg file3.pdf
```

### 上传整个目录

```bash
python3 oss_uploader.py --directory /path/to/directory
```

### 只上传特定类型的文件

```bash
python3 oss_uploader.py --directory /path/to/directory --extensions .jpg .png .gif
```

### 使用自定义前缀

```bash
python3 oss_uploader.py --files file1.txt --prefix "documents/2024/"
```

### 查看帮助

```bash
python3 oss_uploader.py --help
```

## 编程使用

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

## 功能特性

- ✅ 批量上传文件到阿里云OSS
- ✅ 自动识别文件扩展名和MIME类型
- ✅ 支持递归遍历目录
- ✅ 按文件类型过滤
- ✅ 自动重试机制
- ✅ 实时进度显示
- ✅ 详细日志记录
- ✅ 灵活配置选项

## 支持的文件类型

工具自动识别50+种文件类型，包括：

- **图片**: jpg, png, gif, bmp, webp, svg
- **文档**: pdf, doc, docx, xls, xlsx, ppt, pptx
- **文本**: txt, csv, json, xml, html, css, js, md
- **压缩**: zip, rar, 7z
- **音视频**: mp4, avi, mov, mp3, wav, flac
- **编程**: py, java, cpp, c, h

## 故障排除

### 1. 依赖安装问题

如果遇到 `libmagic` 相关错误，工具会自动使用备用检测方法，不影响正常使用。

### 2. OSS权限问题

确保AccessKey有足够的权限：
- 存储桶的读写权限
- 对象的上传权限

### 3. 网络连接问题

检查网络连接和OSS端点配置是否正确。

### 4. 配置文件问题

确保JSON格式正确，所有必需字段都已填写。

## 日志文件

工具会生成 `oss_upload.log` 日志文件，包含详细的上传信息和错误记录。

## 许可证

MIT License