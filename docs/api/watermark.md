<a name="WatermarkUtil"></a>

## WatermarkUtil
图片水印工具类
支持文字水印和图片水印

**Kind**: global class  

* [WatermarkUtil](#WatermarkUtil)
    * [.addTextWatermark(imagePath, options)](#WatermarkUtil.addTextWatermark) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.addImageWatermark(imagePath, watermarkPath, options)](#WatermarkUtil.addImageWatermark) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.batchAddWatermark(imagePaths, watermarkConfig, progressCallback)](#WatermarkUtil.batchAddWatermark) ⇒ <code>Promise.&lt;Array&gt;</code>

<a name="WatermarkUtil.addTextWatermark"></a>

### WatermarkUtil.addTextWatermark(imagePath, options) ⇒ <code>Promise.&lt;string&gt;</code>
添加文字水印

**Kind**: static method of [<code>WatermarkUtil</code>](#WatermarkUtil)  
**Returns**: <code>Promise.&lt;string&gt;</code> - 返回添加水印后的图片临时路径  

| Param | Type | Description |
| --- | --- | --- |
| imagePath | <code>string</code> | 原图片路径 |
| options | <code>Object</code> | 水印配置 |
| options.text | <code>string</code> | 水印文字 |
| options.x | <code>number</code> | 水印x坐标 (0-1之间的比例，或具体像素值) |
| options.y | <code>number</code> | 水印y坐标 (0-1之间的比例，或具体像素值) |
| options.color | <code>string</code> | 文字颜色，默认白色 |
| options.fontSize | <code>number</code> | 字体大小，默认20 |
| options.fontFamily | <code>string</code> | 字体，默认Arial |
| options.opacity | <code>number</code> | 透明度 (0-1)，默认0.8 |
| options.position | <code>string</code> | 预设位置：'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center' |

<a name="WatermarkUtil.addImageWatermark"></a>

### WatermarkUtil.addImageWatermark(imagePath, watermarkPath, options) ⇒ <code>Promise.&lt;string&gt;</code>
添加图片水印

**Kind**: static method of [<code>WatermarkUtil</code>](#WatermarkUtil)  
**Returns**: <code>Promise.&lt;string&gt;</code> - 返回添加水印后的图片临时路径  

| Param | Type | Description |
| --- | --- | --- |
| imagePath | <code>string</code> | 原图片路径 |
| watermarkPath | <code>string</code> | 水印图片路径 |
| options | <code>Object</code> | 水印配置 |
| options.width | <code>number</code> | 水印宽度 |
| options.height | <code>number</code> | 水印高度 |
| options.x | <code>number</code> | 水印x坐标 |
| options.y | <code>number</code> | 水印y坐标 |
| options.opacity | <code>number</code> | 透明度 (0-1)，默认0.8 |
| options.position | <code>string</code> | 预设位置 |

<a name="WatermarkUtil.batchAddWatermark"></a>

### WatermarkUtil.batchAddWatermark(imagePaths, watermarkConfig, progressCallback) ⇒ <code>Promise.&lt;Array&gt;</code>
批量添加水印

**Kind**: static method of [<code>WatermarkUtil</code>](#WatermarkUtil)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - 返回处理后的图片路径数组  

| Param | Type | Description |
| --- | --- | --- |
| imagePaths | <code>Array</code> | 图片路径数组 |
| watermarkConfig | <code>Object</code> | 水印配置 |
| watermarkConfig.type | <code>string</code> | 水印类型：'text' 或 'image' |
| progressCallback | <code>function</code> | 进度回调函数 |

