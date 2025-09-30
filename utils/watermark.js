/**
 * Image watermark utility class
 * Supports text watermarks and image watermarks
 */
class WatermarkUtil {
  /**
   * Add text watermark
   * @param {string} imagePath - Original image path
   * @param {Object} options - Watermark configuration
   * @param {string} options.text - Watermark text
   * @param {number} options.x - Watermark x coordinate (ratio between 0-1, or specific pixel value)
   * @param {number} options.y - Watermark y coordinate (ratio between 0-1, or specific pixel value)
   * @param {string} options.color - Text color, default white
   * @param {number} options.fontSize - Font size, default 20
   * @param {string} options.fontFamily - Font family, default Arial
   * @param {number} options.opacity - Opacity (0-1), default 0.8
   * @param {string} options.position - Preset position: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
   * @returns {Promise<string>} Returns temporary path of image with watermark added
   */
  static addTextWatermark(imagePath, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        text = 'Watermark',
        color = '#FFFFFF',
        fontSize = 20,
        fontFamily = 'Arial',
        opacity = 0.8,
        position = 'bottom-right'
      } = options;

      // Get image information
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          const { width, height } = imageInfo;
          
          // Create canvas context
          const canvasId = `watermark-canvas-${Date.now()}`;
          const ctx = wx.createCanvasContext(canvasId);
          
          // Draw original image
          ctx.drawImage(imagePath, 0, 0, width, height);
          
          // Set text style
          ctx.setFontSize(fontSize);
          ctx.setFillStyle(color);
          ctx.setGlobalAlpha(opacity);
          
          // Calculate watermark position
          const { x, y } = this._calculateTextPosition(width, height, text, fontSize, position, options);
          
          // Draw text watermark
          ctx.fillText(text, x, y);
          
          // Draw to canvas
          ctx.draw(false, () => {
            // Export image
            wx.canvasToTempFilePath({
              canvasId: canvasId,
              success: (res) => {
                resolve(res.tempFilePath);
              },
              fail: reject
            });
          });
        },
        fail: reject
      });
    });
  }

  /**
   * Add image watermark
   * @param {string} imagePath - Original image path
   * @param {string} watermarkPath - Watermark image path
   * @param {Object} options - Watermark configuration
   * @param {number} options.width - Watermark width
   * @param {number} options.height - Watermark height
   * @param {number} options.x - Watermark x coordinate
   * @param {number} options.y - Watermark y coordinate
   * @param {number} options.opacity - Opacity (0-1), default 0.8
   * @param {string} options.position - Preset position
   * @returns {Promise<string>} Returns temporary path of image with watermark added
   */
  static addImageWatermark(imagePath, watermarkPath, options = {}) {
    return new Promise((resolve, reject) => {
      const { opacity = 0.8, position = 'bottom-right' } = options;

      // Get original image information
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          const { width: imgWidth, height: imgHeight } = imageInfo;
          
          // Get watermark image information
          wx.getImageInfo({
            src: watermarkPath,
            success: (watermarkInfo) => {
              const { width: wmWidth, height: wmHeight } = watermarkInfo;
              
              // Create canvas context
              const canvasId = `watermark-canvas-${Date.now()}`;
              const ctx = wx.createCanvasContext(canvasId);
              
              // Draw original image
              ctx.drawImage(imagePath, 0, 0, imgWidth, imgHeight);
              
              // Set opacity
              ctx.setGlobalAlpha(opacity);
              
              // Calculate watermark position and size
              const watermarkConfig = this._calculateImagePosition(
                imgWidth, imgHeight, wmWidth, wmHeight, position, options
              );
              
              // Draw watermark image
              ctx.drawImage(
                watermarkPath,
                watermarkConfig.x,
                watermarkConfig.y,
                watermarkConfig.width,
                watermarkConfig.height
              );
              
              // Draw to canvas
              ctx.draw(false, () => {
                // Export image
                wx.canvasToTempFilePath({
                  canvasId: canvasId,
                  success: (res) => {
                    resolve(res.tempFilePath);
                  },
                  fail: reject
                });
              });
            },
            fail: reject
          });
        },
        fail: reject
      });
    });
  }

  /**
   * Batch add watermarks
   * @param {Array} imagePaths - Array of image paths
   * @param {Object} watermarkConfig - Watermark configuration
   * @param {string} watermarkConfig.type - Watermark type: 'text' or 'image'
   * @param {Function} progressCallback - Progress callback function
   * @returns {Promise<Array>} Returns array of processed image paths
   */
  static batchAddWatermark(imagePaths, watermarkConfig, progressCallback) {
    return new Promise((resolve, reject) => {
      const results = [];
      let completed = 0;
      
      const processNext = async () => {
        if (completed >= imagePaths.length) {
          resolve(results);
          return;
        }
        
        const imagePath = imagePaths[completed];
        try {
          let result;
          if (watermarkConfig.type === 'text') {
            result = await this.addTextWatermark(imagePath, watermarkConfig);
          } else if (watermarkConfig.type === 'image') {
            result = await this.addImageWatermark(imagePath, watermarkConfig.watermarkPath, watermarkConfig);
          }
          
          results.push({
            original: imagePath,
            watermarked: result,
            success: true
          });
          
          completed++;
          
          if (progressCallback) {
            progressCallback({
              completed,
              total: imagePaths.length,
              progress: completed / imagePaths.length
            });
          }
          
          // Continue processing next image
          setTimeout(processNext, 100);
          
        } catch (error) {
          results.push({
            original: imagePath,
            watermarked: null,
            success: false,
            error
          });
          
          completed++;
          setTimeout(processNext, 100);
        }
      };
      
      processNext();
    });
  }

  /**
   * Calculate text watermark position
   * @private
   */
  static _calculateTextPosition(imgWidth, imgHeight, text, fontSize, position, options) {
    let x = options.x;
    let y = options.y;
    
    // If specific coordinates are already specified
    if (x !== undefined && y !== undefined) {
      // If ratio value (0-1), convert to pixel value
      if (x <= 1) x = x * imgWidth;
      if (y <= 1) y = y * imgHeight;
      return { x, y };
    }
    
    // Use preset position
    const padding = 20;
    const textWidth = text.length * fontSize * 0.6; // Estimate text width
    
    switch (position) {
      case 'top-left':
        x = padding;
        y = fontSize + padding;
        break;
      case 'top-right':
        x = imgWidth - textWidth - padding;
        y = fontSize + padding;
        break;
      case 'bottom-left':
        x = padding;
        y = imgHeight - padding;
        break;
      case 'bottom-right':
        x = imgWidth - textWidth - padding;
        y = imgHeight - padding;
        break;
      case 'center':
        x = (imgWidth - textWidth) / 2;
        y = imgHeight / 2;
        break;
      default:
        x = imgWidth - textWidth - padding;
        y = imgHeight - padding;
    }
    
    return { x, y };
  }

  /**
   * Calculate image watermark position and size
   * @private
   */
  static _calculateImagePosition(imgWidth, imgHeight, wmWidth, wmHeight, position, options) {
    let x = options.x;
    let y = options.y;
    let width = options.width || wmWidth * 0.2; // Default to 20% of original image size
    let height = options.height || wmHeight * 0.2;
    
    // Maintain aspect ratio
    if (options.width && !options.height) {
      height = (options.width / wmWidth) * wmHeight;
    } else if (options.height && !options.width) {
      width = (options.height / wmHeight) * wmWidth;
    }
    
    // If specific coordinates are already specified
    if (x !== undefined && y !== undefined) {
      if (x <= 1) x = x * imgWidth;
      if (y <= 1) y = y * imgHeight;
      return { x, y, width, height };
    }
    
    // Use preset position
    const padding = 20;
    
    switch (position) {
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'top-right':
        x = imgWidth - width - padding;
        y = padding;
        break;
      case 'bottom-left':
        x = padding;
        y = imgHeight - height - padding;
        break;
      case 'bottom-right':
        x = imgWidth - width - padding;
        y = imgHeight - height - padding;
        break;
      case 'center':
        x = (imgWidth - width) / 2;
        y = (imgHeight - height) / 2;
        break;
      default:
        x = imgWidth - width - padding;
        y = imgHeight - height - padding;
    }
    
    return { x, y, width, height };
  }
}

module.exports = WatermarkUtil;