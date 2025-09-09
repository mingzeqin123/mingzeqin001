/**
 * 图片水印工具类
 * 支持文字水印和图片水印
 */
class WatermarkUtil {
  /**
   * 添加文字水印
   * @param {string} imagePath - 原图片路径
   * @param {Object} options - 水印配置
   * @param {string} options.text - 水印文字
   * @param {number} options.x - 水印x坐标 (0-1之间的比例，或具体像素值)
   * @param {number} options.y - 水印y坐标 (0-1之间的比例，或具体像素值)
   * @param {string} options.color - 文字颜色，默认白色
   * @param {number} options.fontSize - 字体大小，默认20
   * @param {string} options.fontFamily - 字体，默认Arial
   * @param {number} options.opacity - 透明度 (0-1)，默认0.8
   * @param {string} options.position - 预设位置：'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
   * @returns {Promise<string>} 返回添加水印后的图片临时路径
   */
  static addTextWatermark(imagePath, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        text = '水印',
        color = '#FFFFFF',
        fontSize = 20,
        fontFamily = 'Arial',
        opacity = 0.8,
        position = 'bottom-right'
      } = options;

      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          const { width, height } = imageInfo;
          
          // 创建canvas上下文
          const canvasId = `watermark-canvas-${Date.now()}`;
          const ctx = wx.createCanvasContext(canvasId);
          
          // 绘制原图
          ctx.drawImage(imagePath, 0, 0, width, height);
          
          // 设置文字样式
          ctx.setFontSize(fontSize);
          ctx.setFillStyle(color);
          ctx.setGlobalAlpha(opacity);
          
          // 计算水印位置
          const { x, y } = this._calculateTextPosition(width, height, text, fontSize, position, options);
          
          // 绘制文字水印
          ctx.fillText(text, x, y);
          
          // 绘制到canvas
          ctx.draw(false, () => {
            // 导出图片
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
   * 添加图片水印
   * @param {string} imagePath - 原图片路径
   * @param {string} watermarkPath - 水印图片路径
   * @param {Object} options - 水印配置
   * @param {number} options.width - 水印宽度
   * @param {number} options.height - 水印高度
   * @param {number} options.x - 水印x坐标
   * @param {number} options.y - 水印y坐标
   * @param {number} options.opacity - 透明度 (0-1)，默认0.8
   * @param {string} options.position - 预设位置
   * @returns {Promise<string>} 返回添加水印后的图片临时路径
   */
  static addImageWatermark(imagePath, watermarkPath, options = {}) {
    return new Promise((resolve, reject) => {
      const { opacity = 0.8, position = 'bottom-right' } = options;

      // 获取原图信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          const { width: imgWidth, height: imgHeight } = imageInfo;
          
          // 获取水印图信息
          wx.getImageInfo({
            src: watermarkPath,
            success: (watermarkInfo) => {
              const { width: wmWidth, height: wmHeight } = watermarkInfo;
              
              // 创建canvas上下文
              const canvasId = `watermark-canvas-${Date.now()}`;
              const ctx = wx.createCanvasContext(canvasId);
              
              // 绘制原图
              ctx.drawImage(imagePath, 0, 0, imgWidth, imgHeight);
              
              // 设置透明度
              ctx.setGlobalAlpha(opacity);
              
              // 计算水印位置和大小
              const watermarkConfig = this._calculateImagePosition(
                imgWidth, imgHeight, wmWidth, wmHeight, position, options
              );
              
              // 绘制水印图片
              ctx.drawImage(
                watermarkPath,
                watermarkConfig.x,
                watermarkConfig.y,
                watermarkConfig.width,
                watermarkConfig.height
              );
              
              // 绘制到canvas
              ctx.draw(false, () => {
                // 导出图片
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
   * 批量添加水印
   * @param {Array} imagePaths - 图片路径数组
   * @param {Object} watermarkConfig - 水印配置
   * @param {string} watermarkConfig.type - 水印类型：'text' 或 'image'
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise<Array>} 返回处理后的图片路径数组
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
          
          // 继续处理下一张
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
   * 计算文字水印位置
   * @private
   */
  static _calculateTextPosition(imgWidth, imgHeight, text, fontSize, position, options) {
    let x = options.x;
    let y = options.y;
    
    // 如果已经指定了具体坐标
    if (x !== undefined && y !== undefined) {
      // 如果是比例值 (0-1)，转换为像素值
      if (x <= 1) x = x * imgWidth;
      if (y <= 1) y = y * imgHeight;
      return { x, y };
    }
    
    // 使用预设位置
    const padding = 20;
    const textWidth = text.length * fontSize * 0.6; // 估算文字宽度
    
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
   * 计算图片水印位置和大小
   * @private
   */
  static _calculateImagePosition(imgWidth, imgHeight, wmWidth, wmHeight, position, options) {
    let x = options.x;
    let y = options.y;
    let width = options.width || wmWidth * 0.2; // 默认为原图20%大小
    let height = options.height || wmHeight * 0.2;
    
    // 保持宽高比
    if (options.width && !options.height) {
      height = (options.width / wmWidth) * wmHeight;
    } else if (options.height && !options.width) {
      width = (options.height / wmHeight) * wmWidth;
    }
    
    // 如果已经指定了具体坐标
    if (x !== undefined && y !== undefined) {
      if (x <= 1) x = x * imgWidth;
      if (y <= 1) y = y * imgHeight;
      return { x, y, width, height };
    }
    
    // 使用预设位置
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