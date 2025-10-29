// 直播房间管理页面
const { LiveAPI } = require('../../utils/live-api.js');
const LIVE_CONFIG = require('../../config/live-config.js');

Page({
  data: {
    // 房间信息
    roomInfo: {
      name: '',
      description: '',
      category: 'entertainment',
      cover: '',
      tags: [],
      isPrivate: false,
      password: '',
      maxAudience: 1000
    },
    
    // 分类列表
    categories: [
      { id: 'entertainment', name: '娱乐', icon: '🎭' },
      { id: 'game', name: '游戏', icon: '🎮' },
      { id: 'education', name: '教育', icon: '📚' },
      { id: 'life', name: '生活', icon: '🏠' },
      { id: 'music', name: '音乐', icon: '🎵' },
      { id: 'sports', name: '体育', icon: '⚽' },
      { id: 'tech', name: '科技', icon: '💻' },
      { id: 'other', name: '其他', icon: '📦' }
    ],
    
    // 标签列表
    availableTags: [
      '新人主播', '颜值', '才艺', '聊天', '游戏', '音乐', '舞蹈', 
      '美食', '旅行', '学习', '健身', '萌宠', '搞笑', '情感'
    ],
    
    // 封面图片
    coverImages: [
      '/images/live-cover-1.jpg',
      '/images/live-cover-2.jpg',
      '/images/live-cover-3.jpg',
      '/images/live-cover-4.jpg',
      '/images/live-cover-5.jpg',
      '/images/live-cover-6.jpg'
    ],
    
    // 表单状态
    formValid: false,
    isSubmitting: false,
    
    // 页面状态
    currentStep: 1,
    totalSteps: 3,
    
    // 高级设置
    advancedSettings: {
      enableRecord: true,
      enableReplay: false,
      enableDanmaku: true,
      enableGift: true,
      enableChat: true,
      bitrate: 1000,
      resolution: '720p',
      frameRate: 30
    }
  },

  onLoad: function (options) {
    this.liveAPI = new LiveAPI();
    this.validateForm();
  },

  /**
   * 表单验证
   */
  validateForm: function () {
    const { name, description, category } = this.data.roomInfo;
    const isValid = name.trim().length > 0 && 
                   description.trim().length > 0 && 
                   category.length > 0;
    
    this.setData({ formValid: isValid });
  },

  /**
   * 输入框变化
   */
  onInputChange: function (e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`roomInfo.${field}`]: value
    });
    
    this.validateForm();
  },

  /**
   * 分类选择
   */
  onCategorySelect: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      'roomInfo.category': category.id
    });
    this.validateForm();
  },

  /**
   * 标签选择
   */
  onTagToggle: function (e) {
    const tag = e.currentTarget.dataset.tag;
    const currentTags = this.data.roomInfo.tags;
    
    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter(t => t !== tag);
    } else {
      if (currentTags.length < 5) {
        newTags = [...currentTags, tag];
      } else {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({
      'roomInfo.tags': newTags
    });
  },

  /**
   * 封面选择
   */
  onCoverSelect: function (e) {
    const cover = e.currentTarget.dataset.cover;
    this.setData({
      'roomInfo.cover': cover
    });
  },

  /**
   * 自定义封面上传
   */
  onCustomCoverUpload: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 这里应该上传到服务器
        wx.showLoading({ title: '上传中...' });
        
        // 模拟上传
        setTimeout(() => {
          wx.hideLoading();
          this.setData({
            'roomInfo.cover': tempFilePath
          });
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        }, 2000);
      }
    });
  },

  /**
   * 私密房间切换
   */
  onPrivateToggle: function (e) {
    this.setData({
      'roomInfo.isPrivate': e.detail.value
    });
  },

  /**
   * 高级设置切换
   */
  onAdvancedSettingToggle: function (e) {
    const { setting } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`advancedSettings.${setting}`]: value
    });
  },

  /**
   * 高级设置滑块变化
   */
  onAdvancedSettingSlider: function (e) {
    const { setting } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`advancedSettings.${setting}`]: value
    });
  },

  /**
   * 分辨率选择
   */
  onResolutionSelect: function (e) {
    const resolution = e.currentTarget.dataset.resolution;
    this.setData({
      'advancedSettings.resolution': resolution
    });
  },

  /**
   * 下一步
   */
  nextStep: function () {
    if (this.data.currentStep < this.data.totalSteps) {
      this.setData({
        currentStep: this.data.currentStep + 1
      });
    }
  },

  /**
   * 上一步
   */
  prevStep: function () {
    if (this.data.currentStep > 1) {
      this.setData({
        currentStep: this.data.currentStep - 1
      });
    }
  },

  /**
   * 创建直播间
   */
  async createRoom() {
    if (!this.data.formValid || this.data.isSubmitting) {
      return;
    }

    this.setData({ isSubmitting: true });

    try {
      const roomData = {
        ...this.data.roomInfo,
        settings: this.data.advancedSettings
      };

      const result = await this.liveAPI.createRoom(roomData);
      
      if (result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });

        // 跳转到推流页面
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/live/live-push?roomId=${result.data.roomId}`
          });
        }, 1500);
      } else {
        throw new Error(result.message || '创建失败');
      }
    } catch (error) {
      console.error('Create room error:', error);
      wx.showToast({
        title: error.message || '创建失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 预览直播间
   */
  previewRoom: function () {
    const roomInfo = this.data.roomInfo;
    
    if (!roomInfo.name.trim()) {
      wx.showToast({
        title: '请输入房间名称',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/live/live-watch?preview=true&roomName=${roomInfo.name}&cover=${roomInfo.cover}`
    });
  },

  /**
   * 获取分类名称
   */
  getCategoryName: function (categoryId) {
    const category = this.data.categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  },

  /**
   * 获取分类图标
   */
  getCategoryIcon: function (categoryId) {
    const category = this.data.categories.find(cat => cat.id === categoryId);
    return category ? category.icon : '📦';
  },

  /**
   * 格式化文件大小
   */
  formatFileSize: function (bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 计算预估流量
   */
  calculateEstimatedTraffic: function () {
    const { bitrate, frameRate } = this.data.advancedSettings;
    const bytesPerSecond = (bitrate * 1024) / 8; // 转换为字节
    const bytesPerHour = bytesPerSecond * 3600;
    return this.formatFileSize(bytesPerHour);
  }
});