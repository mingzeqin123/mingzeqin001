const WatermarkProcessor = require('../../utils/watermark.js')

Page({
  data: {
    // 图片相关
    originalImage: '',
    processedImage: '',
    imageInfo: null,
    
    // 水印配置
    watermarkConfig: {
      text: '我的水印',
      fontSize: 16,
      color: '#ffffff',
      opacity: 0.8,
      angle: -45,
      x: 50,
      y: 50,
      type: 'text', // 'text' | 'image' | 'repeat'
      imagePath: ''
    },
    
    // UI状态
    showConfig: false,
    isProcessing: false,
    showPreview: false
  },

  onLoad() {
    this.watermarkProcessor = new WatermarkProcessor()
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const imagePath = res.tempFilePaths[0]
        this.setData({
          originalImage: imagePath,
          processedImage: '',
          showPreview: false
        })
        
        // 获取图片信息
        this.getImageInfo(imagePath)
      }
    })
  },

  /**
   * 获取图片信息
   */
  async getImageInfo(imagePath) {
    try {
      const imageInfo = await this.watermarkProcessor.getImageInfo(imagePath)
      this.setData({ imageInfo })
    } catch (error) {
      console.error('获取图片信息失败:', error)
      wx.showToast({
        title: '获取图片信息失败',
        icon: 'error'
      })
    }
  },

  /**
   * 显示/隐藏配置面板
   */
  toggleConfig() {
    this.setData({
      showConfig: !this.data.showConfig
    })
  },

  /**
   * 更新水印配置
   */
  updateWatermarkConfig(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    
    this.setData({
      [`watermarkConfig.${field}`]: value
    })
  },

  /**
   * 更新水印类型
   */
  updateWatermarkType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      'watermarkConfig.type': type
    })
  },

  /**
   * 选择水印图片
   */
  chooseWatermarkImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'watermarkConfig.imagePath': res.tempFilePaths[0]
        })
      }
    })
  },

  /**
   * 处理图片添加水印
   */
  async processImage() {
    if (!this.data.originalImage) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'error'
      })
      return
    }

    this.setData({ isProcessing: true })

    try {
      const { imageInfo, watermarkConfig } = this.data
      const { width, height } = imageInfo

      // 初始化Canvas
      await this.watermarkProcessor.initCanvas('watermarkCanvas', width, height)

      // 加载并绘制原图
      const originalImg = await this.watermarkProcessor.loadImage(this.data.originalImage)
      this.watermarkProcessor.drawBackgroundImage(originalImg, width, height)

      // 根据类型添加水印
      switch (watermarkConfig.type) {
        case 'text':
          this.watermarkProcessor.addTextWatermark({
            text: watermarkConfig.text,
            x: watermarkConfig.x,
            y: watermarkConfig.y,
            font: `${watermarkConfig.fontSize}px Arial`,
            color: watermarkConfig.color,
            opacity: watermarkConfig.opacity,
            angle: watermarkConfig.angle
          })
          break

        case 'image':
          if (watermarkConfig.imagePath) {
            await this.watermarkProcessor.addImageWatermark({
              imagePath: watermarkConfig.imagePath,
              x: watermarkConfig.x,
              y: watermarkConfig.y,
              width: 100,
              height: 100,
              opacity: watermarkConfig.opacity,
              angle: watermarkConfig.angle
            })
          }
          break

        case 'repeat':
          this.watermarkProcessor.addRepeatingWatermark({
            text: watermarkConfig.text,
            font: `${watermarkConfig.fontSize}px Arial`,
            color: watermarkConfig.color,
            opacity: watermarkConfig.opacity,
            angle: watermarkConfig.angle
          })
          break
      }

      // 导出处理后的图片
      const processedImagePath = await this.watermarkProcessor.exportToImage('png')
      
      this.setData({
        processedImage: processedImagePath,
        showPreview: true,
        isProcessing: false
      })

      wx.showToast({
        title: '处理完成',
        icon: 'success'
      })

    } catch (error) {
      console.error('图片处理失败:', error)
      this.setData({ isProcessing: false })
      wx.showToast({
        title: '处理失败',
        icon: 'error'
      })
    }
  },

  /**
   * 保存图片到相册
   */
  async saveImage() {
    if (!this.data.processedImage) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'error'
      })
      return
    }

    try {
      await this.watermarkProcessor.saveToAlbum(this.data.processedImage)
    } catch (error) {
      console.error('保存图片失败:', error)
    }
  },

  /**
   * 分享图片
   */
  shareImage() {
    if (!this.data.processedImage) {
      wx.showToast({
        title: '没有可分享的图片',
        icon: 'error'
      })
      return
    }

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  /**
   * 重置配置
   */
  resetConfig() {
    this.setData({
      watermarkConfig: {
        text: '我的水印',
        fontSize: 16,
        color: '#ffffff',
        opacity: 0.8,
        angle: -45,
        x: 50,
        y: 50,
        type: 'text',
        imagePath: ''
      }
    })
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const { type } = e.currentTarget.dataset
    const imagePath = type === 'original' ? this.data.originalImage : this.data.processedImage
    
    if (imagePath) {
      wx.previewImage({
        current: imagePath,
        urls: [imagePath]
      })
    }
  }
})