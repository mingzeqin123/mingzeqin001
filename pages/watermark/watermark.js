// pages/watermark/watermark.js
const WatermarkUtil = require('../../utils/watermark.js');

Page({
  data: {
    selectedImage: '',
    watermarkType: 'text', // 'text' 或 'image'
    layoutOptions: [
      { label: '单个', value: 'single' },
      { label: '平铺', value: 'grid' },
      { label: '对角线', value: 'diagonal' }
    ],
    textLayoutIndex: 0,
    imageLayoutIndex: 0,
    textConfig: {
      text: '水印文字',
      color: '#FFFFFF',
      fontSize: 20,
      opacity: 0.8,
      position: 'bottom-right',
      layout: 'single',
      rotation: 0,
      spacingX: 200,
      spacingY: 200
    },
    imageConfig: {
      watermarkImage: '',
      opacity: 0.8,
      position: 'bottom-right',
      width: 100,
      height: 100,
      layout: 'single',
      rotation: 0,
      spacingX: 220,
      spacingY: 220
    },
    processedImage: '',
    processing: false,
    batchMode: false,
    selectedImages: [],
    batchProgress: 0
  },

  onLoad: function (options) {
    console.log('水印页面加载');
  },

  // 选择要添加水印的图片
  selectImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          selectedImage: res.tempFilePaths[0],
          processedImage: '' // 清空之前的结果
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        });
      }
    });
  },

  // 批量选择图片
  selectBatchImages: function() {
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          selectedImages: res.tempFilePaths,
          batchMode: true
        });
        wx.showToast({
          title: `已选择${res.tempFilePaths.length}张图片`,
          icon: 'success'
        });
      }
    });
  },

  // 选择水印图片
  selectWatermarkImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          'imageConfig.watermarkImage': res.tempFilePaths[0]
        });
      }
    });
  },

  // 切换水印类型
  onWatermarkTypeChange: function(e) {
    this.setData({
      watermarkType: e.detail.value
    });
  },

  // 文字水印配置变更
  onTextChange: function(e) {
    this.setData({
      'textConfig.text': e.detail.value
    });
  },

  onColorChange: function(e) {
    this.setData({
      'textConfig.color': e.detail.value
    });
  },

  onFontSizeChange: function(e) {
    this.setData({
      'textConfig.fontSize': parseInt(e.detail.value)
    });
  },

  onOpacityChange: function(e) {
    this.setData({
      'textConfig.opacity': e.detail.value / 100
    });
  },

  onPositionChange: function(e) {
    this.setData({
      'textConfig.position': e.detail.value
    });
  },
  
  onTextLayoutChange: function(e) {
    const index = parseInt(e.detail.value, 10) || 0;
    const option = this.data.layoutOptions[index];
    if (!option) return;
    
    const updates = {
      textLayoutIndex: index,
      'textConfig.layout': option.value
    };
    if (option.value === 'diagonal' && this.data.textConfig.rotation === 0) {
      updates['textConfig.rotation'] = 45;
    }
    this.setData(updates);
  },
  
  onTextRotationChange: function(e) {
    const value = parseInt(e.detail.value, 10);
    if (Number.isNaN(value)) return;
    this.setData({
      'textConfig.rotation': value
    });
  },
  
  onTextSpacingChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseInt(e.detail.value, 10);
    if (!field || Number.isNaN(value)) return;
    this.setData({
      [`textConfig.${field}`]: value
    });
  },

  // 图片水印配置变更
  onImageOpacityChange: function(e) {
    this.setData({
      'imageConfig.opacity': e.detail.value / 100
    });
  },

  onImagePositionChange: function(e) {
    this.setData({
      'imageConfig.position': e.detail.value
    });
  },
  
  onImageLayoutChange: function(e) {
    const index = parseInt(e.detail.value, 10) || 0;
    const option = this.data.layoutOptions[index];
    if (!option) return;
    
    const updates = {
      imageLayoutIndex: index,
      'imageConfig.layout': option.value
    };
    if (option.value === 'diagonal' && this.data.imageConfig.rotation === 0) {
      updates['imageConfig.rotation'] = 45;
    }
    this.setData(updates);
  },
  
  onImageRotationChange: function(e) {
    const value = parseInt(e.detail.value, 10);
    if (Number.isNaN(value)) return;
    this.setData({
      'imageConfig.rotation': value
    });
  },
  
  onImageSpacingChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = parseInt(e.detail.value, 10);
    if (!field || Number.isNaN(value)) return;
    this.setData({
      [`imageConfig.${field}`]: value
    });
  },

  onWatermarkSizeChange: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`imageConfig.${field}`]: parseInt(e.detail.value)
    });
  },

  // 添加水印
  addWatermark: function() {
    if (!this.data.selectedImage) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'error'
      });
      return;
    }

    if (this.data.watermarkType === 'image' && !this.data.imageConfig.watermarkImage) {
      wx.showToast({
        title: '请选择水印图片',
        icon: 'error'
      });
      return;
    }

    this.setData({ processing: true });

    wx.showLoading({
      title: '添加水印中...'
    });

    const promise = this.data.watermarkType === 'text' 
      ? WatermarkUtil.addTextWatermark(this.data.selectedImage, this.data.textConfig)
      : WatermarkUtil.addImageWatermark(
          this.data.selectedImage, 
          this.data.imageConfig.watermarkImage, 
          this.data.imageConfig
        );

    promise.then((result) => {
      this.setData({
        processedImage: result,
        processing: false
      });
      wx.hideLoading();
      wx.showToast({
        title: '水印添加成功',
        icon: 'success'
      });
    }).catch((error) => {
      console.error('添加水印失败:', error);
      this.setData({ processing: false });
      wx.hideLoading();
      wx.showToast({
        title: '添加水印失败',
        icon: 'error'
      });
    });
  },

  // 批量添加水印
  batchAddWatermark: function() {
    if (this.data.selectedImages.length === 0) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'error'
      });
      return;
    }

    this.setData({ processing: true, batchProgress: 0 });

    wx.showLoading({
      title: '批量处理中...'
    });

    const config = {
      type: this.data.watermarkType,
      ...(this.data.watermarkType === 'text' ? this.data.textConfig : {
        ...this.data.imageConfig,
        watermarkPath: this.data.imageConfig.watermarkImage
      })
    };

    WatermarkUtil.batchAddWatermark(
      this.data.selectedImages,
      config,
      (progress) => {
        this.setData({
          batchProgress: Math.round(progress.progress * 100)
        });
        wx.showLoading({
          title: `处理中 ${progress.completed}/${progress.total}`
        });
      }
    ).then((results) => {
      this.setData({ processing: false });
      wx.hideLoading();
      
      const successCount = results.filter(r => r.success).length;
      wx.showModal({
        title: '批量处理完成',
        content: `成功处理 ${successCount}/${results.length} 张图片`,
        showCancel: false,
        success: () => {
          // 可以在这里处理结果，比如保存到相册
          this.saveBatchResults(results.filter(r => r.success));
        }
      });
    }).catch((error) => {
      console.error('批量处理失败:', error);
      this.setData({ processing: false });
      wx.hideLoading();
      wx.showToast({
        title: '批量处理失败',
        icon: 'error'
      });
    });
  },

  // 保存批量处理结果
  saveBatchResults: function(results) {
    wx.showModal({
      title: '保存图片',
      content: `是否将 ${results.length} 张处理后的图片保存到相册？`,
      success: (res) => {
        if (res.confirm) {
          this.saveImagesToAlbum(results.map(r => r.watermarked));
        }
      }
    });
  },

  // 保存图片到相册
  saveToAlbum: function() {
    if (!this.data.processedImage) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'error'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.processedImage,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (error) => {
        if (error.errMsg.includes('auth')) {
          wx.showModal({
            title: '需要授权',
            content: '需要获取保存图片到相册的权限',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          });
        }
      }
    });
  },

  // 批量保存图片到相册
  saveImagesToAlbum: function(imagePaths) {
    let saved = 0;
    const total = imagePaths.length;
    
    wx.showLoading({
      title: `保存中 0/${total}`
    });

    const saveNext = () => {
      if (saved >= total) {
        wx.hideLoading();
        wx.showToast({
          title: `已保存${saved}张图片`,
          icon: 'success'
        });
        return;
      }

      wx.saveImageToPhotosAlbum({
        filePath: imagePaths[saved],
        success: () => {
          saved++;
          wx.showLoading({
            title: `保存中 ${saved}/${total}`
          });
          setTimeout(saveNext, 500);
        },
        fail: () => {
          saved++;
          setTimeout(saveNext, 500);
        }
      });
    };

    saveNext();
  },

  // 预览图片
  previewImage: function(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },

  // 重置
  reset: function() {
    this.setData({
      selectedImage: '',
      processedImage: '',
      selectedImages: [],
      batchMode: false,
      batchProgress: 0
    });
  }
});