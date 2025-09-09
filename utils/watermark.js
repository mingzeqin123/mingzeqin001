/**
 * 图片水印处理工具类
 * 支持文字水印和图片水印
 */
class WatermarkProcessor {
  constructor() {
    this.canvas = null
    this.ctx = null
  }

  /**
   * 初始化Canvas
   * @param {string} canvasId - Canvas ID
   * @param {number} width - Canvas宽度
   * @param {number} height - Canvas高度
   */
  initCanvas(canvasId, width, height) {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery()
      query.select(`#${canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            this.canvas = res[0].node
            this.ctx = this.canvas.getContext('2d')
            
            // 设置Canvas尺寸
            const dpr = wx.getSystemInfoSync().pixelRatio
            this.canvas.width = width * dpr
            this.canvas.height = height * dpr
            this.ctx.scale(dpr, dpr)
            
            resolve()
          } else {
            reject(new Error('Canvas初始化失败'))
          }
        })
    })
  }

  /**
   * 加载图片
   * @param {string} imagePath - 图片路径
   */
  loadImage(imagePath) {
    return new Promise((resolve, reject) => {
      const img = this.canvas.createImage()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = imagePath
    })
  }

  /**
   * 绘制背景图片
   * @param {Object} img - 图片对象
   * @param {number} width - 绘制宽度
   * @param {number} height - 绘制高度
   */
  drawBackgroundImage(img, width, height) {
    this.ctx.clearRect(0, 0, width, height)
    this.ctx.drawImage(img, 0, 0, width, height)
  }

  /**
   * 添加文字水印
   * @param {Object} options - 水印配置
   * @param {string} options.text - 水印文字
   * @param {number} options.x - X坐标
   * @param {number} options.y - Y坐标
   * @param {string} options.font - 字体样式
   * @param {string} options.color - 文字颜色
   * @param {number} options.opacity - 透明度 (0-1)
   * @param {number} options.angle - 旋转角度
   * @param {string} options.align - 文字对齐方式
   */
  addTextWatermark(options) {
    const {
      text,
      x = 0,
      y = 0,
      font = '16px Arial',
      color = '#ffffff',
      opacity = 0.8,
      angle = 0,
      align = 'left'
    } = options

    this.ctx.save()
    
    // 设置透明度
    this.ctx.globalAlpha = opacity
    
    // 设置字体
    this.ctx.font = font
    this.ctx.fillStyle = color
    this.ctx.textAlign = align
    
    // 旋转
    if (angle !== 0) {
      this.ctx.translate(x, y)
      this.ctx.rotate(angle * Math.PI / 180)
      this.ctx.fillText(text, 0, 0)
    } else {
      this.ctx.fillText(text, x, y)
    }
    
    this.ctx.restore()
  }

  /**
   * 添加图片水印
   * @param {Object} options - 水印配置
   * @param {string} options.imagePath - 水印图片路径
   * @param {number} options.x - X坐标
   * @param {number} options.y - Y坐标
   * @param {number} options.width - 水印宽度
   * @param {number} options.height - 水印高度
   * @param {number} options.opacity - 透明度 (0-1)
   * @param {number} options.angle - 旋转角度
   */
  async addImageWatermark(options) {
    const {
      imagePath,
      x = 0,
      y = 0,
      width = 50,
      height = 50,
      opacity = 0.8,
      angle = 0
    } = options

    try {
      const watermarkImg = await this.loadImage(imagePath)
      
      this.ctx.save()
      
      // 设置透明度
      this.ctx.globalAlpha = opacity
      
      // 旋转
      if (angle !== 0) {
        this.ctx.translate(x + width / 2, y + height / 2)
        this.ctx.rotate(angle * Math.PI / 180)
        this.ctx.drawImage(watermarkImg, -width / 2, -height / 2, width, height)
      } else {
        this.ctx.drawImage(watermarkImg, x, y, width, height)
      }
      
      this.ctx.restore()
    } catch (error) {
      console.error('添加图片水印失败:', error)
      throw error
    }
  }

  /**
   * 添加重复水印（平铺效果）
   * @param {Object} options - 水印配置
   * @param {string} options.text - 水印文字
   * @param {number} options.spacingX - X轴间距
   * @param {number} options.spacingY - Y轴间距
   * @param {string} options.font - 字体样式
   * @param {string} options.color - 文字颜色
   * @param {number} options.opacity - 透明度
   * @param {number} options.angle - 旋转角度
   */
  addRepeatingWatermark(options) {
    const {
      text,
      spacingX = 100,
      spacingY = 100,
      font = '16px Arial',
      color = '#ffffff',
      opacity = 0.3,
      angle = -45
    } = options

    this.ctx.save()
    this.ctx.globalAlpha = opacity
    this.ctx.font = font
    this.ctx.fillStyle = color
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    const canvasWidth = this.canvas.width / wx.getSystemInfoSync().pixelRatio
    const canvasHeight = this.canvas.height / wx.getSystemInfoSync().pixelRatio

    // 计算需要绘制的行列数
    const cols = Math.ceil(canvasWidth / spacingX) + 1
    const rows = Math.ceil(canvasHeight / spacingY) + 1

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacingX
        const y = row * spacingY

        if (angle !== 0) {
          this.ctx.save()
          this.ctx.translate(x, y)
          this.ctx.rotate(angle * Math.PI / 180)
          this.ctx.fillText(text, 0, 0)
          this.ctx.restore()
        } else {
          this.ctx.fillText(text, x, y)
        }
      }
    }

    this.ctx.restore()
  }

  /**
   * 导出Canvas为图片
   * @param {string} fileType - 文件类型 ('png' | 'jpg')
   * @param {number} quality - 图片质量 (0-1, 仅对jpg有效)
   */
  exportToImage(fileType = 'png', quality = 0.8) {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        fileType: fileType,
        quality: quality,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * 保存图片到相册
   * @param {string} filePath - 图片路径
   */
  saveToAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: filePath,
        success: () => {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          resolve()
        },
        fail: (error) => {
          if (error.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要授权保存图片到相册',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting()
                }
              }
            })
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'error'
            })
          }
          reject(error)
        }
      })
    })
  }

  /**
   * 获取图片信息
   * @param {string} imagePath - 图片路径
   */
  getImageInfo(imagePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imagePath,
        success: (res) => {
          resolve({
            width: res.width,
            height: res.height,
            path: res.path
          })
        },
        fail: reject
      })
    })
  }
}

module.exports = WatermarkProcessor