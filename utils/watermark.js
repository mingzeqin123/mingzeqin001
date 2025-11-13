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
            ctx.setTextBaseline('top');
            ctx.setTextAlign('left');
            ctx.setGlobalAlpha(opacity);
            
            // 绘制文字水印（支持多种布局形态）
            this._renderTextLayout(ctx, {
              imgWidth: width,
              imgHeight: height,
              text,
              fontSize,
              position,
              options
            });
            
            // 恢复全局透明度
            ctx.setGlobalAlpha(1);
          
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
              
              // 绘制水印图片（支持多种布局形态）
              this._renderImageLayout(ctx, {
                imgWidth,
                imgHeight,
                watermarkPath,
                baseConfig: watermarkConfig,
                options
              });
              
              // 恢复透明度
              ctx.setGlobalAlpha(1);
              
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
  
  /**
   * 绘制文本水印布局
   * @private
   */
  static _renderTextLayout(ctx, { imgWidth, imgHeight, text, fontSize, position, options }) {
    const layout = options.layout || 'single';
    let rotationRad = 0;
    if (options.rotation !== undefined) {
      rotationRad = (options.rotation * Math.PI) / 180;
    } else if (layout === 'diagonal') {
      rotationRad = Math.PI / 4;
    }
    
    const drawText = (x, y, overrideRotation) => {
      ctx.save();
      ctx.translate(x, y);
      const rad = overrideRotation !== undefined ? overrideRotation : rotationRad;
      if (rad !== 0) {
        ctx.rotate(rad);
      }
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };
    
    if (layout === 'custom' && Array.isArray(options.customPositions) && options.customPositions.length) {
      options.customPositions.forEach((config) => {
        const px = this._resolveRelativeValue(config.x, imgWidth);
        const py = this._resolveRelativeValue(config.y, imgHeight);
        const customRotation = config.rotation !== undefined
          ? (config.rotation * Math.PI) / 180
          : rotationRad;
        if (!isNaN(px) && !isNaN(py)) {
          drawText(px, py, customRotation);
        }
      });
      return;
    }
    
    if (layout === 'single') {
      const { x, y } = this._calculateTextPosition(imgWidth, imgHeight, text, fontSize, position, options);
      drawText(x, y);
      return;
    }
    
    // 平铺/对角线布局
    const defaultSpacingX = Math.max(imgWidth / 3, text.length * fontSize * 1.2);
    const defaultSpacingY = Math.max(imgHeight / 3, fontSize * 2);
    let spacingX = this._resolveRelativeValue(
      options.spacingX,
      imgWidth,
      defaultSpacingX
    );
    let spacingY = this._resolveRelativeValue(
      options.spacingY,
      imgHeight,
      defaultSpacingY
    );
    if (!spacingX || spacingX <= 0) spacingX = defaultSpacingX;
    if (!spacingY || spacingY <= 0) spacingY = defaultSpacingY;
    const offsetX = this._resolveRelativeValue(
      options.offsetX,
      imgWidth,
      spacingX / 2
    );
    const offsetY = this._resolveRelativeValue(
      options.offsetY,
      imgHeight,
      spacingY / 2
    );
    
    const cols = Math.ceil(imgWidth / spacingX) + 4;
    const rows = Math.ceil(imgHeight / spacingY) + 4;
    const startX = offsetX - (cols / 2) * spacingX;
    const startY = offsetY - (rows / 2) * spacingY;
    const diagonalShift = spacingX / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let x = startX + col * spacingX;
        let y = startY + row * spacingY;
        
        if (layout === 'diagonal') {
          x += (row % 2) * diagonalShift;
        }
        
        drawText(x, y);
      }
    }
  }
  
  /**
   * 绘制图片水印布局
   * @private
   */
  static _renderImageLayout(ctx, { imgWidth, imgHeight, watermarkPath, baseConfig, options }) {
    const layout = options.layout || 'single';
    let rotationRad = 0;
    if (options.rotation !== undefined) {
      rotationRad = (options.rotation * Math.PI) / 180;
    } else if (layout === 'diagonal') {
      rotationRad = Math.PI / 4;
    }
    
    const drawImage = (x, y, width, height, overrideRotation) => {
      ctx.save();
      const cx = x + width / 2;
      const cy = y + height / 2;
      ctx.translate(cx, cy);
      const rad = overrideRotation !== undefined ? overrideRotation : rotationRad;
      if (rad !== 0) {
        ctx.rotate(rad);
      }
      ctx.drawImage(watermarkPath, -width / 2, -height / 2, width, height);
      ctx.restore();
    };
    
    if (layout === 'custom' && Array.isArray(options.customPositions) && options.customPositions.length) {
      options.customPositions.forEach((config) => {
        const px = this._resolveRelativeValue(config.x, imgWidth);
        const py = this._resolveRelativeValue(config.y, imgHeight);
        const customRotation = config.rotation !== undefined
          ? (config.rotation * Math.PI) / 180
          : rotationRad;
        const width = config.width !== undefined
          ? this._resolveRelativeValue(config.width, imgWidth)
          : baseConfig.width;
        const height = config.height !== undefined
          ? this._resolveRelativeValue(config.height, imgHeight)
          : baseConfig.height;
        if (!isNaN(px) && !isNaN(py)) {
          drawImage(px, py, width, height, customRotation);
        }
      });
      return;
    }
    
    if (layout === 'single') {
      drawImage(baseConfig.x, baseConfig.y, baseConfig.width, baseConfig.height);
      return;
    }
    
    const defaultSpacingX = Math.max(baseConfig.width * 2, imgWidth / 3);
    const defaultSpacingY = Math.max(baseConfig.height * 2, imgHeight / 3);
    let spacingX = this._resolveRelativeValue(
      options.spacingX,
      imgWidth,
      defaultSpacingX
    );
    let spacingY = this._resolveRelativeValue(
      options.spacingY,
      imgHeight,
      defaultSpacingY
    );
    if (!spacingX || spacingX <= 0) spacingX = defaultSpacingX;
    if (!spacingY || spacingY <= 0) spacingY = defaultSpacingY;
    const offsetX = this._resolveRelativeValue(
      options.offsetX,
      imgWidth,
      spacingX / 2
    );
    const offsetY = this._resolveRelativeValue(
      options.offsetY,
      imgHeight,
      spacingY / 2
    );
    
    const cols = Math.ceil(imgWidth / spacingX) + 4;
    const rows = Math.ceil(imgHeight / spacingY) + 4;
    const startX = offsetX - (cols / 2) * spacingX;
    const startY = offsetY - (rows / 2) * spacingY;
    const diagonalShift = spacingX / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let x = startX + col * spacingX;
        let y = startY + row * spacingY;
        
        if (layout === 'diagonal') {
          x += (row % 2) * diagonalShift;
        }
        
        drawImage(x, y, baseConfig.width, baseConfig.height);
      }
    }
  }
  
  /**
   * 工具方法：处理比例/像素值
   * @private
   */
  static _resolveRelativeValue(value, reference, defaultValue) {
    if (value === undefined || value === null || value === '') {
      return defaultValue !== undefined ? defaultValue : 0;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        value = parsed;
      }
    }
    if (typeof value === 'number' && Math.abs(value) <= 1) {
      return value * reference;
    }
    return value;
  }
}

module.exports = WatermarkUtil;
