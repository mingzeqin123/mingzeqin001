// pages/watermark/watermark.js
const WatermarkUtil = require('../../utils/watermark.js');

Page({
  data: {
    selectedImage: '',
    watermarkType: 'text', // 'text' or 'image'
    textConfig: {
      text: 'Watermark Text',
      color: '#FFFFFF',
      fontSize: 20,
      opacity: 0.8,
      position: 'bottom-right'
    },
    imageConfig: {
      watermarkImage: '',
      opacity: 0.8,
      position: 'bottom-right',
      width: 100,
      height: 100
    },
    processedImage: '',
    processing: false,
    batchMode: false,
    selectedImages: [],
    batchProgress: 0
  },

  onLoad: function (options) {
    console.log('Watermark page loaded');
  },

  // Select image to add watermark to
  selectImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          selectedImage: res.tempFilePaths[0],
          processedImage: '' // Clear previous result
        });
      },
      fail: (err) => {
        wx.showToast({
          title: 'Failed to select image',
          icon: 'error'
        });
      }
    });
  },

  // Batch select images
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
          title: `Selected ${res.tempFilePaths.length} images`,
          icon: 'success'
        });
      }
    });
  },

  // Select watermark image
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

  // Switch watermark type
  onWatermarkTypeChange: function(e) {
    this.setData({
      watermarkType: e.detail.value
    });
  },

  // Text watermark configuration changes
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

  // Image watermark configuration changes
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

  onWatermarkSizeChange: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`imageConfig.${field}`]: parseInt(e.detail.value)
    });
  },

  // Add watermark
  addWatermark: function() {
    if (!this.data.selectedImage) {
      wx.showToast({
        title: 'Please select an image first',
        icon: 'error'
      });
      return;
    }

    if (this.data.watermarkType === 'image' && !this.data.imageConfig.watermarkImage) {
      wx.showToast({
        title: 'Please select a watermark image',
        icon: 'error'
      });
      return;
    }

    this.setData({ processing: true });

    wx.showLoading({
      title: 'Adding watermark...'
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
        title: 'Watermark added successfully',
        icon: 'success'
      });
    }).catch((error) => {
      console.error('Failed to add watermark:', error);
      this.setData({ processing: false });
      wx.hideLoading();
      wx.showToast({
        title: 'Failed to add watermark',
        icon: 'error'
      });
    });
  },

  // Batch add watermark
  batchAddWatermark: function() {
    if (this.data.selectedImages.length === 0) {
      wx.showToast({
        title: 'Please select images first',
        icon: 'error'
      });
      return;
    }

    this.setData({ processing: true, batchProgress: 0 });

    wx.showLoading({
      title: 'Batch processing...'
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
          title: `Processing ${progress.completed}/${progress.total}`
        });
      }
    ).then((results) => {
      this.setData({ processing: false });
      wx.hideLoading();
      
      const successCount = results.filter(r => r.success).length;
      wx.showModal({
        title: 'Batch Processing Complete',
        content: `Successfully processed ${successCount}/${results.length} images`,
        showCancel: false,
        success: () => {
          // Can process results here, such as saving to album
          this.saveBatchResults(results.filter(r => r.success));
        }
      });
    }).catch((error) => {
      console.error('Batch processing failed:', error);
      this.setData({ processing: false });
      wx.hideLoading();
      wx.showToast({
        title: 'Batch processing failed',
        icon: 'error'
      });
    });
  },

  // Save batch processing results
  saveBatchResults: function(results) {
    wx.showModal({
      title: 'Save Images',
      content: `Save ${results.length} processed images to album?`,
      success: (res) => {
        if (res.confirm) {
          this.saveImagesToAlbum(results.map(r => r.watermarked));
        }
      }
    });
  },

  // Save image to album
  saveToAlbum: function() {
    if (!this.data.processedImage) {
      wx.showToast({
        title: 'No image to save',
        icon: 'error'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.processedImage,
      success: () => {
        wx.showToast({
          title: 'Saved successfully',
          icon: 'success'
        });
      },
      fail: (error) => {
        if (error.errMsg.includes('auth')) {
          wx.showModal({
            title: 'Authorization Required',
            content: 'Need permission to save images to album',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: 'Save failed',
            icon: 'error'
          });
        }
      }
    });
  },

  // Batch save images to album
  saveImagesToAlbum: function(imagePaths) {
    let saved = 0;
    const total = imagePaths.length;
    
    wx.showLoading({
      title: `Saving 0/${total}`
    });

    const saveNext = () => {
      if (saved >= total) {
        wx.hideLoading();
        wx.showToast({
          title: `Saved ${saved} images`,
          icon: 'success'
        });
        return;
      }

      wx.saveImageToPhotosAlbum({
        filePath: imagePaths[saved],
        success: () => {
          saved++;
          wx.showLoading({
            title: `Saving ${saved}/${total}`
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

  // Preview image
  previewImage: function(e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      current: src,
      urls: [src]
    });
  },

  // Reset
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