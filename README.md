# OSS批量上传工具安装和使用指南

## 快速安装

1. **安装依赖包**
```bash
npm install ali-oss mime-types
```

2. **配置OSS信息**
创建 `config/oss.config.js` 文件:
```javascript
module.exports = {
  region: 'oss-cn-beijing', // 你的OSS区域
  accessKeyId: 'your-access-key-id', // 替换为你的AccessKey ID
  accessKeySecret: 'your-access-key-secret', // 替换为你的AccessKey Secret
  bucket: 'your-bucket-name' // 替换为你的存储桶名称
}
```

3. **基本使用**
```javascript
const OSSUploader = require('./utils/ossUploader')
const ossConfig = require('./config/oss.config')

const uploader = new OSSUploader(ossConfig)

// 上传单个文件
uploader.addFiles('./my-file.jpg')
const result = await uploader.startUpload()
```

## 常用场景

### 场景1: 网站资源批量上传
```bash
# 上传网站所有静态资源
node -e "
const uploader = require('./utils/ossUploader');
const config = require('./config/oss.config');
const u = new uploader(config);
u.addDirectory('./assets', {recursive: true, prefix: 'website'});
u.startUpload();
"
```

### 场景2: 备份整个项目
```javascript
// backup-script.js
const uploader = new OSSUploader(config)

uploader.addDirectory('./', {
  recursive: true,
  excludePattern: /(node_modules|\.git|dist|build)/i,
  prefix: `backup/${new Date().toISOString().slice(0, 10)}`
})

await uploader.startUpload()
```

### 场景3: 图片批量处理上传
```javascript
const uploader = new OSSUploader(config)

// 只上传图片文件，按类型整理
uploader.addDirectory('./photos', {
  includePattern: /\.(jpg|jpeg|png|gif|webp)$/i,
  useCategory: true,
  prefix: 'gallery'
})
```

## 配置说明

### OSS配置参数
- `region`: OSS区域，如 'oss-cn-beijing'
- `accessKeyId`: 阿里云AccessKey ID  
- `accessKeySecret`: 阿里云AccessKey Secret
- `bucket`: OSS存储桶名称

### 上传选项参数
- `prefix`: OSS路径前缀
- `useCategory`: 是否按文件类型分类 (默认: true)
- `useDate`: 是否按日期分类 (默认: true) 
- `preserveStructure`: 是否保持原目录结构 (默认: false)
- `recursive`: 是否递归扫描子目录 (默认: true)
- `includePattern`: 包含文件的正则表达式
- `excludePattern`: 排除文件的正则表达式  
- `maxSize`: 最大文件大小限制（字节）

## 注意事项

1. **权限配置**: 确保OSS AccessKey有相应的读写权限
2. **网络环境**: 大文件上传建议在稳定网络环境下进行
3. **费用控制**: 注意OSS存储和流量费用，避免重复上传
4. **安全考虑**: 不要将AccessKey信息提交到代码仓库

## 故障排除

### 常见错误

1. **AccessDenied错误**
   - 检查AccessKey权限
   - 确认bucket名称正确

2. **文件不存在错误**
   - 检查文件路径是否正确
   - 确认文件是否存在

3. **网络超时**
   - 减少并发数量: `uploader.setConcurrency(2)`
   - 检查网络连接

4. **内存不足**
   - 分批上传大量文件
   - 避免同时上传过多大文件

### 获取帮助

- 查看详细文档: `docs/oss-uploader-guide.md`
- 运行示例: `node examples/oss-upload-examples.js`
- 检查代码: `utils/ossUploader.js`