# Image Watermark Feature Usage Guide

This project adds complete image watermark functionality to WeChat Mini Programs, supporting text watermarks and image watermarks, with single image processing or batch processing capabilities.

## Features

### 🎨 Text Watermarks
- ✅ Custom watermark text content
- ✅ Adjustable font size, color, and opacity
- ✅ Multiple preset positions (top-left, top-right, bottom-left, bottom-right, center)
- ✅ Custom precise coordinate positioning support
- ✅ Configurable font styles

### 🖼️ Image Watermarks
- ✅ Support any image as watermark
- ✅ Adjustable watermark size and opacity
- ✅ Multiple preset positions support
- ✅ Custom precise coordinate positioning support
- ✅ Automatic image ratio preservation

### 🚀 Batch Processing
- ✅ Process multiple images at once
- ✅ Real-time processing progress display
- ✅ Batch save to album
- ✅ Error handling and retry mechanism

## File Structure

```
├── utils/
│   └── watermark.js          # Watermark utility class (core functionality)
├── pages/
│   └── watermark/
│       ├── watermark.js      # Watermark page logic
│       ├── watermark.wxml    # Page template
│       ├── watermark.wxss    # Page styles
│       └── watermark.json    # Page configuration
├── examples/
│   └── watermark-examples.js # Usage examples
└── docs/
    └── watermark-guide.md    # This document
```

## Quick Start

### 1. Import Utility Class

```javascript
const WatermarkUtil = require('../../utils/watermark.js');
```

### 2. Add Text Watermark

```javascript
// Basic usage
const result = await WatermarkUtil.addTextWatermark('/path/to/image.jpg', {
  text: 'My Watermark',
  position: 'bottom-right'
});

// Advanced configuration
const result = await WatermarkUtil.addTextWatermark('/path/to/image.jpg', {
  text: '© 2024 All Rights Reserved',
  fontSize: 24,
  color: '#FFFFFF',
  opacity: 0.8,
  position: 'bottom-right'
});
```

### 3. Add Image Watermark

```javascript
const result = await WatermarkUtil.addImageWatermark(
  '/path/to/image.jpg',           // Original image path
  '/path/to/watermark.png',       // Watermark image path
  {
    width: 100,
    height: 100,
    opacity: 0.6,
    position: 'top-right'
  }
);
```

### 4. Batch Processing

```javascript
const results = await WatermarkUtil.batchAddWatermark(
  ['/path/to/image1.jpg', '/path/to/image2.jpg'],  // Image array
  {
    type: 'text',
    text: 'Batch Watermark',
    position: 'bottom-right'
  },
  (progress) => {
    console.log(`Progress: ${progress.completed}/${progress.total}`);
  }
);
```

## API Documentation

### WatermarkUtil.addTextWatermark(imagePath, options)

Add text watermark to image

**Parameters:**
- `imagePath` (string): Original image path
- `options` (object): Configuration options
  - `text` (string): Watermark text, default 'Watermark'
  - `x` (number): X coordinate, 0-1 for ratio, >1 for pixel value
  - `y` (number): Y coordinate, 0-1 for ratio, >1 for pixel value
  - `position` (string): Preset position, optional values:
    - 'top-left' - Top left corner
    - 'top-right' - Top right corner
    - 'bottom-left' - Bottom left corner
    - 'bottom-right' - Bottom right corner (default)
    - 'center' - Center
  - `fontSize` (number): Font size, default 20
  - `color` (string): Text color, default '#FFFFFF'
  - `opacity` (number): Opacity 0-1, default 0.8
  - `fontFamily` (string): Font family, default 'Arial'

**Return Value:** Promise&lt;string&gt; - Processed image temporary path

### WatermarkUtil.addImageWatermark(imagePath, watermarkPath, options)

Add image watermark to image

**Parameters:**
- `imagePath` (string): Original image path
- `watermarkPath` (string): Watermark image path
- `options` (object): Configuration options
  - `width` (number): Watermark width
  - `height` (number): Watermark height
  - `x` (number): X coordinate
  - `y` (number): Y coordinate
  - `position` (string): Preset position (same as text watermark)
  - `opacity` (number): Opacity 0-1, default 0.8

**Return Value:** Promise&lt;string&gt; - Processed image temporary path

### WatermarkUtil.batchAddWatermark(imagePaths, config, progressCallback)

Batch add watermarks

**Parameters:**
- `imagePaths` (Array&lt;string&gt;): Image path array
- `config` (object): Watermark configuration
  - `type` (string): Watermark type, 'text' or 'image'
  - Other configuration items same as single processing
- `progressCallback` (function): Progress callback function
  - Parameter: `{completed, total, progress}`

**Return Value:** Promise&lt;Array&gt; - Processing result array

## Usage in Pages

### 1. Page Configuration

Add page route in `app.json`:

```json
{
  "pages": [
    "pages/watermark/watermark"
  ]
}
```

### 2. Page Navigation

```javascript
// Navigate to watermark page
wx.navigateTo({
  url: '/pages/watermark/watermark'
});
```

### 3. Integration in Other Pages

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
        text: 'My Watermark',
        position: 'bottom-right'
      });
      
      this.setData({
        watermarkedImage: result
      });
      
      wx.showToast({
        title: 'Watermark added successfully',
        icon: 'success'
      });
    } catch (error) {
      console.error('Failed to add watermark:', error);
    }
  }
});
```

## Best Practices

### 1. Performance Optimization

```javascript
// Control concurrency when batch processing
const batchSize = 5;
for (let i = 0; i < imagePaths.length; i += batchSize) {
  const batch = imagePaths.slice(i, i + batchSize);
  await WatermarkUtil.batchAddWatermark(batch, config);
}
```

### 2. Error Handling

```javascript
try {
  const result = await WatermarkUtil.addTextWatermark(imagePath, options);
  // Processing successful
} catch (error) {
  console.error('Watermark processing failed:', error);
  wx.showToast({
    title: 'Processing failed, please try again',
    icon: 'error'
  });
}
```

### 3. Memory Management

```javascript
// Clean up temporary files promptly
wx.removeSavedFile({
  filePath: tempFilePath,
  success: () => {
    console.log('Temporary file cleaned up successfully');
  }
});
```

## Notes

1. **Canvas Limitations**: Mini Program Canvas has size limitations, very large images may need compression
2. **Temporary Files**: Processed images are temporary files, need to be saved to album or server promptly
3. **Permission Request**: Saving to album requires user authorization `scope.writePhotosAlbum`
4. **Performance Considerations**: Pay attention to memory usage and processing time when batch processing many images
5. **Image Formats**: Supports common formats (jpg, png, gif, etc.), recommend jpg format for better performance

## Common Issues

### Q: What if watermark position is inaccurate?
A: Use custom coordinates `x` and `y` parameters for precise positioning.

### Q: How to achieve semi-transparent effects?
A: Control transparency by adjusting the `opacity` parameter (value between 0-1).

### Q: What to do if batch processing fails?
A: Check if image paths are correct and if there's sufficient storage space.

### Q: How to customize fonts?
A: Set through `fontFamily` parameter, but ensure the mini program supports that font.

## Update Log

- **v1.0.0** (2024-12-19)
  - ✅ Implemented basic text watermark functionality
  - ✅ Implemented image watermark functionality
  - ✅ Support for batch processing
  - ✅ Complete UI interface
  - ✅ Detailed usage documentation

## Technical Support

For questions or suggestions, please contact us through:

- 📧 Email: support@example.com
- 💬 WeChat Group: Scan QR code to join
- 📱 QQ Group: 123456789

---

*This document was last updated: 2024-12-19*