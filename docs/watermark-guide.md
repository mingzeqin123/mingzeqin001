# 图片水印功能使用指南

本项目为微信小程序添加了完整的图片水印功能，支持文字水印和图片水印，可以单张处理或批量处理。

## 功能特性

### 🎨 文字水印
- ✅ 自定义水印文字内容
- ✅ 可调节字体大小、颜色、透明度
- ✅ 支持多种预设位置（左上、右上、左下、右下、居中）
- ✅ 支持自定义精确坐标定位
- ✅ 字体样式可配置

### 🖼️ 图片水印
- ✅ 支持任意图片作为水印
- ✅ 可调节水印大小和透明度
- ✅ 支持多种预设位置
- ✅ 支持自定义精确坐标定位
- ✅ 自动保持图片比例

### 🚀 批量处理
- ✅ 支持一次处理多张图片
- ✅ 实时显示处理进度
- ✅ 批量保存到相册
- ✅ 错误处理和重试机制

### 🤖 AWS 智能识别（新）
- ✅ 一键调用 AWS Rekognition 获取图片标签
- ✅ 自动提取图片中文字
- ✅ 可选敏感内容识别，辅助内容安全合规
- ✅ 识别结果在页面内直观展示，可随时清空

## 文件结构

```
├── utils/
│   └── watermark.js          # 水印工具类（核心功能）
├── config/
│   └── aws.js                # AWS Rekognition 配置
├── pages/
│   └── watermark/
│       ├── watermark.js      # 水印页面逻辑
│       ├── watermark.wxml    # 页面模板
│       ├── watermark.wxss    # 页面样式
│       └── watermark.json    # 页面配置
├── examples/
│   └── watermark-examples.js # 使用示例
├── serverless/
│   └── rekognitionProxy.js   # Lambda 代理示例
└── docs/
    └── watermark-guide.md    # 本文档
```

## 快速开始

### 1. 导入工具类

```javascript
const WatermarkUtil = require('../../utils/watermark.js');
```

### 2. 添加文字水印

```javascript
// 基础用法
const result = await WatermarkUtil.addTextWatermark('/path/to/image.jpg', {
  text: '我的水印',
  position: 'bottom-right'
});

// 高级配置
const result = await WatermarkUtil.addTextWatermark('/path/to/image.jpg', {
  text: '© 2024 版权所有',
  fontSize: 24,
  color: '#FFFFFF',
  opacity: 0.8,
  position: 'bottom-right'
});
```

### 3. 添加图片水印

```javascript
const result = await WatermarkUtil.addImageWatermark(
  '/path/to/image.jpg',           // 原图路径
  '/path/to/watermark.png',       // 水印图片路径
  {
    width: 100,
    height: 100,
    opacity: 0.6,
    position: 'top-right'
  }
);
```

### 4. 批量处理

```javascript
const results = await WatermarkUtil.batchAddWatermark(
  ['/path/to/image1.jpg', '/path/to/image2.jpg'],  // 图片数组
  {
    type: 'text',
    text: '批量水印',
    position: 'bottom-right'
  },
  (progress) => {
    console.log(`进度: ${progress.completed}/${progress.total}`);
  }
);
```

## AWS Rekognition 对接指南

> 通过 AWS AI Rekognition，可在添加水印前完成图片标签、文字和敏感内容识别，帮助内容审核与智能水印策略。

### 1. 部署代理服务
1. 拷贝 `serverless/rekognitionProxy.js` 至自己的代码仓库
2. 在同目录执行 `npm install @aws-sdk/client-rekognition`
3. 将该脚本部署为 AWS Lambda（Node.js 18.x），绑定具备 Rekognition 调用权限的 IAM 角色
4. 使用 API Gateway 创建 HTTPS 接口，并启用 CORS

### 2. 配置小程序端
编辑 `config/aws.js`：
```javascript
module.exports = {
  rekognition: {
    endpoint: 'https://{api_id}.execute-api.{region}.amazonaws.com/prod/rekognition',
    apiKey: '',
    region: 'ap-southeast-1',
    defaultFeatures: {
      detectLabels: true,
      detectText: true,
      detectModerationLabels: false
    },
    requestTimeout: 20000
  }
};
```

### 3. 调用示例
`pages/watermark/watermark.js` 已内置 `analyzeWithAWS`，若需要在其它页面自定义调用，可参考：
```javascript
const RekognitionService = require('../../utils/awsRekognition.js');

async function analyze(imagePath) {
  const result = await RekognitionService.analyzeImage(imagePath, {
    detectLabels: true,
    detectText: true,
    detectModerationLabels: false,
    maxLabels: 15,
    minConfidence: 65
  });

  console.log(result.labels, result.textDetections);
}
```

识别结果会以标签列表、文字列表及敏感内容提示形式展示在 UI 中，支持一键清空。

## API 文档

### WatermarkUtil.addTextWatermark(imagePath, options)

添加文字水印到图片

**参数:**
- `imagePath` (string): 原图片路径
- `options` (object): 配置选项
  - `text` (string): 水印文字，默认 '水印'
  - `x` (number): X坐标，0-1为比例，>1为像素值
  - `y` (number): Y坐标，0-1为比例，>1为像素值
  - `position` (string): 预设位置，可选值：
    - 'top-left' - 左上角
    - 'top-right' - 右上角
    - 'bottom-left' - 左下角
    - 'bottom-right' - 右下角（默认）
    - 'center' - 居中
  - `fontSize` (number): 字体大小，默认 20
  - `color` (string): 文字颜色，默认 '#FFFFFF'
  - `opacity` (number): 透明度 0-1，默认 0.8
  - `fontFamily` (string): 字体，默认 'Arial'

**返回值:** Promise&lt;string&gt; - 处理后的图片临时路径

### WatermarkUtil.addImageWatermark(imagePath, watermarkPath, options)

添加图片水印到图片

**参数:**
- `imagePath` (string): 原图片路径
- `watermarkPath` (string): 水印图片路径
- `options` (object): 配置选项
  - `width` (number): 水印宽度
  - `height` (number): 水印高度
  - `x` (number): X坐标
  - `y` (number): Y坐标
  - `position` (string): 预设位置（同文字水印）
  - `opacity` (number): 透明度 0-1，默认 0.8

**返回值:** Promise&lt;string&gt; - 处理后的图片临时路径

### WatermarkUtil.batchAddWatermark(imagePaths, config, progressCallback)

批量添加水印

**参数:**
- `imagePaths` (Array&lt;string&gt;): 图片路径数组
- `config` (object): 水印配置
  - `type` (string): 水印类型，'text' 或 'image'
  - 其他配置项同单张处理
- `progressCallback` (function): 进度回调函数
  - 参数: `{completed, total, progress}`

**返回值:** Promise&lt;Array&gt; - 处理结果数组

## 在页面中使用

### 1. 页面配置

在 `app.json` 中添加页面路由：

```json
{
  "pages": [
    "pages/watermark/watermark"
  ]
}
```

### 2. 页面跳转

```javascript
// 跳转到水印页面
wx.navigateTo({
  url: '/pages/watermark/watermark'
});
```

### 3. 在其他页面中集成

```javascript
Page({
  data: {
    selectedImage: '',
    watermarkedImage: ''
  },

  async addWatermark() {
    const WatermarkUtil = require('../../utils/watermark.js');
    
    try {
      const result = await WatermarkUtil.addTextWatermark(this.data.selectedImage, {
        text: '我的水印',
        position: 'bottom-right'
      });
      
      this.setData({
        watermarkedImage: result
      });
      
      wx.showToast({
        title: '水印添加成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('添加水印失败:', error);
    }
  }
});
```

## 最佳实践

### 1. 性能优化

```javascript
// 批量处理时控制并发数量
const batchSize = 5;
for (let i = 0; i < imagePaths.length; i += batchSize) {
  const batch = imagePaths.slice(i, i + batchSize);
  await WatermarkUtil.batchAddWatermark(batch, config);
}
```

### 2. 错误处理

```javascript
try {
  const result = await WatermarkUtil.addTextWatermark(imagePath, options);
  // 处理成功
} catch (error) {
  console.error('水印处理失败:', error);
  wx.showToast({
    title: '处理失败，请重试',
    icon: 'error'
  });
}
```

### 3. 内存管理

```javascript
// 及时清理临时文件
wx.removeSavedFile({
  filePath: tempFilePath,
  success: () => {
    console.log('临时文件清理成功');
  }
});
```

## 注意事项

1. **Canvas限制**: 小程序Canvas有尺寸限制，超大图片可能需要压缩处理
2. **临时文件**: 处理后的图片为临时文件，需要及时保存到相册或服务器
3. **权限申请**: 保存到相册需要用户授权 `scope.writePhotosAlbum`
4. **性能考虑**: 批量处理大量图片时注意内存使用和处理时间
5. **图片格式**: 支持常见格式（jpg, png, gif等），建议使用jpg格式以获得更好的性能

## 常见问题

### Q: 水印位置不准确怎么办？
A: 可以使用自定义坐标 `x` 和 `y` 参数进行精确定位。

### Q: 如何实现半透明效果？
A: 通过调整 `opacity` 参数（0-1之间的值）来控制透明度。

### Q: 批量处理失败怎么办？
A: 检查图片路径是否正确，以及是否有足够的存储空间。

### Q: 如何自定义字体？
A: 通过 `fontFamily` 参数设置，但需要确保小程序支持该字体。

## 更新日志

- **v1.0.0** (2024-12-19)
  - ✅ 实现基础文字水印功能
  - ✅ 实现图片水印功能
  - ✅ 支持批量处理
  - ✅ 完整的UI界面
  - ✅ 详细的使用文档

## 技术支持

如有问题或建议，请通过以下方式联系：

- 📧 Email: support@example.com
- 💬 微信群: 扫描二维码加入
- 📱 QQ群: 123456789

---

*本文档最后更新时间: 2024-12-19*