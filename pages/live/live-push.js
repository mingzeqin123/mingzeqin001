// 直播推流页面（主播端）
const { LiveAPI, NeteaseSDK } = require('../../utils/live-api.js');
const LIVE_CONFIG = require('../../config/live-config.js');

Page({
  data: {
    // 推流状态
    isLiving: false,
    isPreparing: false,
    pushUrl: '',
    streamName: '',
    
    // 推流配置
    pushConfig: {
      mode: 'HD',
      orientation: 'vertical',
      beauty: 5,
      whiteness: 5,
      muted: false,
      enableCamera: true,
      devicePosition: 'front'
    },
    
    // 直播间信息
    roomInfo: {
      name: '',
      description: '',
      category: 'entertainment',
      cover: ''
    },
    
    // 统计信息
    stats: {
      viewerCount: 0,
      duration: 0,
      likes: 0
    },
    
    // 聊天消息
    messages: [],
    newMessage: '',
    
    // 控制面板
    showControls: true,
    showSettings: false,
    showChat: true,
    
    // 美颜设置
    beautySettings: {
      beauty: 5,
      whiteness: 5,
      ruddy: 5,
      filter: 'natural'
    },
    
    // 可用滤镜
    filters: [
      { id: 'natural', name: '自然', active: true },
      { id: 'fresh', name: '清新', active: false },
      { id: 'warm', name: '温暖', active: false },
      { id: 'cool', name: '冷调', active: false }
    ]
  },

  onLoad: function (options) {
    this.liveAPI = new LiveAPI();
    this.neteaseSDK = new NeteaseSDK();
    this.initSDK();
    this.setupTimer();
  },

  onUnload: function () {
    this.stopLive();
    this.clearTimer();
  },

  /**
   * 初始化SDK
   */
  async initSDK() {
    try {
      const result = await this.neteaseSDK.initialize();
      if (!result.success) {
        wx.showToast({
          title: 'SDK初始化失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('SDK init error:', error);
    }
  },

  /**
   * 设置定时器
   */
  setupTimer() {
    this.durationTimer = null;
    this.statsTimer = null;
  },

  /**
   * 清除定时器
   */
  clearTimer() {
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  },

  /**
   * 开始直播
   */
  async startLive() {
    if (this.data.isPreparing || this.data.isLiving) return;

    // 检查直播间信息
    if (!this.data.roomInfo.name.trim()) {
      wx.showToast({
        title: '请输入直播间名称',
        icon: 'none'
      });
      return;
    }

    this.setData({ isPreparing: true });

    try {
      // 1. 创建直播间
      const roomResult = await this.liveAPI.createRoom(this.data.roomInfo);
      if (!roomResult.success) {
        throw new Error('创建直播间失败');
      }

      // 2. 创建推流
      const streamResult = await this.neteaseSDK.createStream({
        roomId: roomResult.data.roomId,
        ...LIVE_CONFIG.netease.streaming
      });

      if (!streamResult.success) {
        throw new Error('创建推流失败');
      }

      // 3. 开始推流
      this.setData({
        pushUrl: streamResult.pushUrl,
        streamName: streamResult.streamName,
        isLiving: true,
        isPreparing: false
      });

      // 4. 启动定时器
      this.startTimers();

      wx.showToast({
        title: '直播已开始',
        icon: 'success'
      });

    } catch (error) {
      console.error('Start live error:', error);
      this.setData({ isPreparing: false });
      wx.showToast({
        title: error.message || '开始直播失败',
        icon: 'error'
      });
    }
  },

  /**
   * 停止直播
   */
  async stopLive() {
    if (!this.data.isLiving) return;

    wx.showModal({
      title: '确认停止直播',
      content: '停止后观众将无法继续观看',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 停止推流
            await this.neteaseSDK.stopStream(this.data.streamName);
            
            this.setData({
              isLiving: false,
              pushUrl: '',
              streamName: ''
            });

            // 清除定时器
            this.clearTimer();

            wx.showToast({
              title: '直播已结束',
              icon: 'success'
            });

            // 返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);

          } catch (error) {
            console.error('Stop live error:', error);
            wx.showToast({
              title: '停止直播失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  /**
   * 启动定时器
   */
  startTimers() {
    // 直播时长计时器
    this.durationTimer = setInterval(() => {
      this.setData({
        'stats.duration': this.data.stats.duration + 1
      });
    }, 1000);

    // 统计信息更新定时器
    this.statsTimer = setInterval(() => {
      this.updateStats();
    }, 5000);
  },

  /**
   * 更新统计信息
   */
  async updateStats() {
    try {
      // 这里应该调用API获取实时统计信息
      // 模拟数据更新
      const viewerCount = Math.floor(Math.random() * 100) + this.data.stats.viewerCount;
      const likes = Math.floor(Math.random() * 10) + this.data.stats.likes;
      
      this.setData({
        'stats.viewerCount': Math.max(viewerCount, this.data.stats.viewerCount),
        'stats.likes': Math.max(likes, this.data.stats.likes)
      });
    } catch (error) {
      console.error('Update stats error:', error);
    }
  },

  /**
   * 推流状态变化
   */
  onPushStateChange: function (e) {
    console.log('Push state change:', e.detail);
    const { code, message } = e.detail;
    
    switch (code) {
      case 1007: // 开始连接推流服务器
        console.log('开始连接推流服务器');
        break;
      case 1003: // 打开摄像头成功
        console.log('打开摄像头成功');
        break;
      case 1005: // 推流连接成功
        console.log('推流连接成功');
        break;
      case -1307: // 推流连接断开
        console.log('推流连接断开');
        this.handlePushError('推流连接断开');
        break;
      case -1308: // 推流连接失败
        console.log('推流连接失败');
        this.handlePushError('推流连接失败');
        break;
    }
  },

  /**
   * 处理推流错误
   */
  handlePushError: function (message) {
    wx.showModal({
      title: '推流异常',
      content: message + '，是否重新连接？',
      success: (res) => {
        if (res.confirm) {
          this.reconnectPush();
        } else {
          this.stopLive();
        }
      }
    });
  },

  /**
   * 重连推流
   */
  reconnectPush: function () {
    // 重新开始推流逻辑
    console.log('重连推流');
  },

  /**
   * 切换摄像头
   */
  switchCamera: function () {
    const newPosition = this.data.pushConfig.devicePosition === 'front' ? 'back' : 'front';
    this.setData({
      'pushConfig.devicePosition': newPosition
    });
  },

  /**
   * 切换静音
   */
  toggleMute: function () {
    this.setData({
      'pushConfig.muted': !this.data.pushConfig.muted
    });
  },

  /**
   * 切换摄像头开关
   */
  toggleCamera: function () {
    this.setData({
      'pushConfig.enableCamera': !this.data.pushConfig.enableCamera
    });
  },

  /**
   * 显示/隐藏控制面板
   */
  toggleControls: function () {
    this.setData({
      showControls: !this.data.showControls
    });
  },

  /**
   * 显示/隐藏设置面板
   */
  toggleSettings: function () {
    this.setData({
      showSettings: !this.data.showSettings
    });
  },

  /**
   * 显示/隐藏聊天
   */
  toggleChat: function () {
    this.setData({
      showChat: !this.data.showChat
    });
  },

  /**
   * 美颜设置改变
   */
  onBeautyChange: function (e) {
    const { type } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`beautySettings.${type}`]: value,
      [`pushConfig.${type}`]: value
    });
  },

  /**
   * 滤镜选择
   */
  onFilterSelect: function (e) {
    const filterId = e.currentTarget.dataset.id;
    const filters = this.data.filters.map(filter => ({
      ...filter,
      active: filter.id === filterId
    }));
    
    this.setData({ 
      filters,
      'beautySettings.filter': filterId
    });
  },

  /**
   * 直播间信息输入
   */
  onRoomInfoInput: function (e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`roomInfo.${field}`]: value
    });
  },

  /**
   * 发送聊天消息
   */
  sendMessage: function () {
    const message = this.data.newMessage.trim();
    if (!message) return;

    // 添加到消息列表
    const newMsg = {
      id: Date.now(),
      type: 'text',
      content: message,
      user: {
        id: 'anchor',
        name: '主播',
        avatar: '/images/anchor-avatar.jpg'
      },
      timestamp: Date.now()
    };

    this.setData({
      messages: [...this.data.messages, newMsg],
      newMessage: ''
    });

    // 发送到服务器
    this.liveAPI.sendMessage(this.data.roomInfo.id, newMsg);
  },

  /**
   * 消息输入
   */
  onMessageInput: function (e) {
    this.setData({
      newMessage: e.detail.value
    });
  },

  /**
   * 格式化时长
   */
  formatDuration: function (seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
});