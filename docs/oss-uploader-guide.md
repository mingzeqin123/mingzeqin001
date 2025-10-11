# OSS批量上传工具

这是一个功能强大的阿里云OSS批量上传工具，支持自动文件类型识别、并发上传、进度监控等功能。

## 特性

- ✅ **自动文件类型识别**: 支持50+种常见文件格式的MIME类型自动识别
- ✅ **批量上传**: 支持单个文件、多个文件或整个目录的批量上传
- ✅ **并发控制**: 可配置的并发上传数量，提高上传效率
- ✅ **重试机制**: 自动重试失败的上传，提高成功率
- ✅ **进度监控**: 实时上传进度回调
- ✅ **目录结构**: 自动按文件类型和日期组织OSS目录结构
- ✅ **错误处理**: 完善的错误处理和日志记录
- ✅ **文件过滤**: 支持文件大小、类型过滤

## 安装依赖

```bash
npm install ali-oss mime-types
```

## 快速开始

### 1. 基本配置

```javascript
const OSSUploader = require('./utils/ossUploader')

// OSS配置
const ossConfig = {
  region: 'oss-cn-beijing',
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  bucket: 'your-bucket-name'
}

// 创建上传器实例
const uploader = new OSSUploader(ossConfig)
```

### 2. 上传单个文件

```javascript
// 添加单个文件到上传队列
uploader.addFiles('/path/to/your/file.jpg')

// 开始上传
const result = await uploader.startUpload()
console.log('上传结果:', result)
```

### 3. 批量上传多个文件

```javascript
// 添加多个文件
const files = [
  '/path/to/file1.jpg',
  '/path/to/file2.pdf', 
  '/path/to/file3.mp4'
]

uploader.addFiles(files)

// 带进度监控的上传
await uploader.startUpload(
  // 进度回调
  (progress) => {
    console.log(`上传进度: ${progress.progress}% (${progress.completed}/${progress.total})`)
  },
  // 完成回调
  (result) => {
    console.log('上传完成:', result)
  }
)
```

### 4. 上传整个目录

```javascript
// 上传目录中的所有文件
uploader.addDirectory('/path/to/directory', {
  recursive: true, // 递归扫描子目录
  includePattern: /\.(jpg|png|pdf|mp4)$/i, // 只上传指定类型文件
  excludePattern: /node_modules/, // 排除某些目录
  maxSize: 100 * 1024 * 1024 // 最大文件大小 100MB
})

await uploader.startUpload()
```

### 5. 自定义上传选项

```javascript
const uploadOptions = {
  prefix: 'uploads', // OSS路径前缀
  useCategory: true, // 按文件类型分类
  useDate: true, // 按日期分类
  preserveStructure: false, // 保持原有目录结构
  customKeyGenerator: (fileInfo) => {
    // 自定义文件路径生成器
    return `custom/${fileInfo.category}/${fileInfo.basename}`
  }
}

uploader.addFiles(files, uploadOptions)
```

## API 文档

### 构造函数

```javascript
new OSSUploader(config)
```

- `config`: OSS配置对象，包含region、accessKeyId、accessKeySecret、bucket等

### 主要方法

#### addFiles(files, options)
添加文件到上传队列
- `files`: 文件路径或文件路径数组
- `options`: 上传选项对象

#### addDirectory(dirPath, options)
添加目录中的文件到上传队列
- `dirPath`: 目录路径
- `options`: 扫描和上传选项

#### startUpload(progressCallback, completeCallback)
开始批量上传
- `progressCallback`: 进度回调函数
- `completeCallback`: 完成回调函数
- 返回: Promise，解析为上传结果

#### detectFileType(filePath)
自动识别文件类型
- `filePath`: 文件路径
- 返回: 文件信息对象

#### getQueueStatus()
获取当前队列状态

#### clearQueue()
清空上传队列

#### setConcurrency(concurrency)
设置并发上传数量

## 支持的文件类型

工具自动识别以下文件类型：

### 图片格式
- JPG/JPEG, PNG, GIF, WebP, BMP, SVG, ICO

### 音频格式  
- MP3, WAV, OGG, AAC, FLAC

### 视频格式
- MP4, AVI, MOV, WMV, FLV, WebM

### 文档格式
- PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, RTF

### 压缩文件
- ZIP, RAR, 7Z, TAR, GZ

### 代码文件
- JS, CSS, HTML, JSON, XML, YAML

## 目录结构

默认情况下，上传的文件会按以下结构组织：

```
bucket/
├── prefix/           # 自定义前缀(可选)
│   ├── image/        # 图片文件
│   │   └── 2024/01/15/
│   ├── video/        # 视频文件  
│   │   └── 2024/01/15/
│   ├── document/     # 文档文件
│   │   └── 2024/01/15/
│   └── other/        # 其他文件
│       └── 2024/01/15/
```

## 错误处理

```javascript
try {
  const result = await uploader.startUpload()
  
  // 检查失败的文件
  const failedFiles = result.files.filter(f => f.status === 'failed')
  if (failedFiles.length > 0) {
    console.log('以下文件上传失败:')
    failedFiles.forEach(f => {
      console.log(`- ${f.filePath}: ${f.error}`)
    })
  }
  
} catch (error) {
  console.error('批量上传出错:', error.message)
}
```

## 高级用法

### 自定义MIME类型

```javascript
// 扩展支持的文件类型
uploader.mimeTypeMap['.custom'] = 'application/custom'
```

### 动态进度显示

```javascript
let lastProgress = 0
await uploader.startUpload((progress) => {
  if (progress.progress - lastProgress >= 5) { // 每5%显示一次
    console.log(`📤 上传进度: ${progress.progress}%`)
    console.log(`   成功: ${progress.succeeded}, 失败: ${progress.failed}`)
    lastProgress = Math.floor(progress.progress / 5) * 5
  }
})
```

### 批量重命名

```javascript
const options = {
  customKeyGenerator: (fileInfo) => {
    const timestamp = new Date().toISOString().slice(0, 10)
    return `backup/${timestamp}/${fileInfo.basename}`
  }
}
```

## 注意事项

1. 确保OSS配置信息正确且有相应权限
2. 大文件上传建议调整并发数量避免超时
3. 建议在生产环境中添加更详细的日志记录
4. 注意OSS存储费用，避免上传过多重复文件

## 许可证

MIT License