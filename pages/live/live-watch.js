// 观看直播页面（观众端）
const { LiveAPI } = require('../../utils/live-api.js');
const LIVE_CONFIG = require('../../config/live-config.js');

Page({
  data: {
    // 直播间信息
    roomId: '',
    roomInfo: {
      id: '',
      name: '',
      description: '',
      category: '',
      cover: '',
      anchor: {
        id: '',
        name: '',
        avatar: '',
        level: 1
      },
      status: 'live' // live, offline, replay
    },
    
    // 播放配置
    playUrl: '',
    playerConfig: {
      mode: 'live',
      orientation: 'vertical',
      muted: false,
      minCache: 1,
      maxCache: 3,
      backgroundColor: '#000000'
    },
    
    // 播放状态
    isPlaying: false,
    isLoading: true,
    isFullscreen: false,
    
    // 统计信息
    stats: {
      viewerCount: 0,
      likes: 0,
      duration: 0
    },
    
    // 聊天系统
    messages: [],
    newMessage: '',
    showChat: true,
    chatHeight: 300,
    
    // 礼物系统
    gifts: [
      { id: 1, name: '点赞', icon: '👍', price: 0, color: '#ff4757' },
      { id: 2, name: '鲜花', icon: '🌹', price: 10, color: '#ff6b7a' },
      { id: 3, name: '掌声', icon: '👏', price: 50, color: '#ffa502' },
      { id: 4, name: '火箭', icon: '🚀', price: 100, color: '#3742fa' },
      { id: 5, name: '皇冠', icon: '👑', price: 500, color: '#f39c12' }
    ],
    showGiftPanel: false,
    
    // 用户信息
    userInfo: {
      id: '',
      name: '',
      avatar: ''
    },
    
    // 控制面板
    showControls: true,
    controlsTimer: null,
    
    // 弹幕
    danmakuList: [],
    showDanmaku: true
  },

  onLoad: function (options) {
    const { roomId, roomName } = options;
    this.setData({ 
      roomId,
      'roomInfo.name': roomName || '直播间'
    });
    
    this.liveAPI = new LiveAPI();
    this.initPage();
  },

  onShow: function () {
    this.startStatsTimer();
  },

  onHide: function () {
    this.stopStatsTimer();
  },

  onUnload: function () {
    this.leaveRoom();
    this.stopStatsTimer();
  },

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      // 获取用户信息
      await this.getUserInfo();
      
      // 加载直播间信息
      await this.loadRoomInfo();
      
      // 进入直播间
      await this.joinRoom();
      
      // 获取播放地址
      await this.getPlayUrl();
      
      // 加载聊天记录
      await this.loadChatMessages();
      
    } catch (error) {
      console.error('Init page error:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {
        id: 'user_' + Date.now(),
        name: '游客' + Math.floor(Math.random() * 1000),
        avatar: '/images/default-avatar.jpg'
      };
      
      this.setData({ userInfo });
    } catch (error) {
      console.error('Get user info error:', error);
    }
  },

  /**
   * 加载直播间信息
   */
  async loadRoomInfo() {
    try {
      // 这里应该调用API获取直播间详细信息
      // 模拟数据
      const roomInfo = {
        id: this.data.roomId,
        name: this.data.roomInfo.name,
        description: '欢迎来到我的直播间',
        category: '娱乐',
        cover: '/images/live-cover.jpg',
        anchor: {
          id: 'anchor_123',
          name: '主播小明',
          avatar: '/images/anchor-avatar.jpg',
          level: 15
        },
        status: 'live'
      };
      
      this.setData({ roomInfo });
    } catch (error) {
      console.error('Load room info error:', error);
    }
  },

  /**
   * 进入直播间
   */
  async joinRoom() {
    try {
      const result = await this.liveAPI.joinRoom(this.data.roomId, this.data.userInfo);
      if (result.success) {
        console.log('Join room success');
      }
    } catch (error) {
      console.error('Join room error:', error);
    }
  },

  /**
   * 离开直播间
   */
  async leaveRoom() {
    try {
      await this.liveAPI.leaveRoom(this.data.roomId, this.data.userInfo.id);
    } catch (error) {
      console.error('Leave room error:', error);
    }
  },

  /**
   * 获取播放地址
   */
  async getPlayUrl() {
    try {
      const result = await this.liveAPI.getPullUrl(this.data.roomId);
      if (result.success) {
        this.setData({
          playUrl: result.data.playUrl,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Get play url error:', error);
      this.setData({ isLoading: false });
    }
  },

  /**
   * 播放器状态变化
   */
  onPlayerStateChange: function (e) {
    console.log('Player state change:', e.detail);
    const { code, message } = e.detail;
    
    switch (code) {
      case 2001: // 连接成功
        this.setData({ isPlaying: true });
        break;
      case 2002: // 开始播放
        console.log('开始播放');
        break;
      case 2003: // 网络接收到首个视频数据包
        console.log('接收到视频数据');
        break;
      case -2301: // 网络连接断开
        this.handlePlayError('网络连接断开');
        break;
      case -2302: // 网络连接失败
        this.handlePlayError('网络连接失败');
        break;
    }
  },

  /**
   * 处理播放错误
   */
  handlePlayError: function (message) {
    wx.showModal({
      title: '播放异常',
      content: message + '，是否重新连接？',
      success: (res) => {
        if (res.confirm) {
          this.reconnectPlayer();
        }
      }
    });
  },

  /**
   * 重连播放器
   */
  reconnectPlayer: function () {
    this.setData({ isLoading: true });
    setTimeout(() => {
      this.getPlayUrl();
    }, 1000);
  },

  /**
   * 全屏变化
   */
  onFullscreenChange: function (e) {
    this.setData({
      isFullscreen: e.detail.fullScreen
    });
  },

  /**
   * 播放器网络状态
   */
  onNetStatus: function (e) {
    // 可以在这里处理网络状态信息
    console.log('Net status:', e.detail);
  },

  /**
   * 加载聊天消息
   */
  async loadChatMessages() {
    try {
      const result = await this.liveAPI.getMessages(this.data.roomId, {
        limit: 50
      });
      
      if (result.success) {
        this.setData({
          messages: result.data.messages || []
        });
      }
    } catch (error) {
      console.error('Load chat messages error:', error);
    }
  },

  /**
   * 发送聊天消息
   */
  async sendMessage() {
    const message = this.data.newMessage.trim();
    if (!message) return;

    const newMsg = {
      id: Date.now(),
      type: 'text',
      content: message,
      user: this.data.userInfo,
      timestamp: Date.now()
    };

    // 添加到本地消息列表
    this.setData({
      messages: [...this.data.messages, newMsg],
      newMessage: ''
    });

    // 发送到服务器
    try {
      await this.liveAPI.sendMessage(this.data.roomId, newMsg);
    } catch (error) {
      console.error('Send message error:', error);
    }
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
   * 发送礼物
   */
  sendGift: function (e) {
    const gift = e.currentTarget.dataset.gift;
    
    if (gift.price > 0) {
      // 这里应该调用支付接口
      wx.showModal({
        title: '发送礼物',
        content: `确定花费 ${gift.price} 金币发送 ${gift.name}？`,
        success: (res) => {
          if (res.confirm) {
            this.processSendGift(gift);
          }
        }
      });
    } else {
      this.processSendGift(gift);
    }
  },

  /**
   * 处理发送礼物
   */
  async processSendGift(gift) {
    const giftMsg = {
      id: Date.now(),
      type: 'gift',
      gift: gift,
      user: this.data.userInfo,
      timestamp: Date.now()
    };

    // 添加到消息列表
    this.setData({
      messages: [...this.data.messages, giftMsg]
    });

    // 显示礼物动画
    this.showGiftAnimation(gift);

    // 发送到服务器
    try {
      await this.liveAPI.sendMessage(this.data.roomId, giftMsg);
      
      // 更新点赞数
      if (gift.id === 1) {
        this.setData({
          'stats.likes': this.data.stats.likes + 1
        });
      }
    } catch (error) {
      console.error('Send gift error:', error);
    }
  },

  /**
   * 显示礼物动画
   */
  showGiftAnimation: function (gift) {
    // 创建礼物动画元素
    const animation = wx.createAnimation({
      duration: 2000,
      timingFunction: 'ease-out'
    });

    // 这里可以实现更复杂的礼物动画效果
    console.log('Show gift animation:', gift);
  },

  /**
   * 切换礼物面板
   */
  toggleGiftPanel: function () {
    this.setData({
      showGiftPanel: !this.data.showGiftPanel
    });
  },

  /**
   * 切换聊天显示
   */
  toggleChat: function () {
    this.setData({
      showChat: !this.data.showChat
    });
  },

  /**
   * 切换弹幕显示
   */
  toggleDanmaku: function () {
    this.setData({
      showDanmaku: !this.data.showDanmaku
    });
  },

  /**
   * 切换静音
   */
  toggleMute: function () {
    this.setData({
      'playerConfig.muted': !this.data.playerConfig.muted
    });
  },

  /**
   * 显示/隐藏控制面板
   */
  toggleControls: function () {
    this.setData({
      showControls: !this.data.showControls
    });

    // 自动隐藏控制面板
    if (this.data.showControls) {
      this.autoHideControls();
    }
  },

  /**
   * 自动隐藏控制面板
   */
  autoHideControls: function () {
    if (this.data.controlsTimer) {
      clearTimeout(this.data.controlsTimer);
    }

    const timer = setTimeout(() => {
      this.setData({ showControls: false });
    }, 3000);

    this.setData({ controlsTimer: timer });
  },

  /**
   * 启动统计定时器
   */
  startStatsTimer: function () {
    this.statsTimer = setInterval(() => {
      this.updateStats();
    }, 5000);
  },

  /**
   * 停止统计定时器
   */
  stopStatsTimer: function () {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  },

  /**
   * 更新统计信息
   */
  async updateStats() {
    try {
      // 模拟统计数据更新
      const viewerCount = Math.floor(Math.random() * 50) + this.data.stats.viewerCount;
      
      this.setData({
        'stats.viewerCount': Math.max(viewerCount, this.data.stats.viewerCount),
        'stats.duration': this.data.stats.duration + 5
      });
    } catch (error) {
      console.error('Update stats error:', error);
    }
  },

  /**
   * 分享直播间
   */
  onShareAppMessage: function () {
    return {
      title: `正在观看 ${this.data.roomInfo.anchor.name} 的直播`,
      path: `/pages/live/live-watch?roomId=${this.data.roomId}&roomName=${this.data.roomInfo.name}`,
      imageUrl: this.data.roomInfo.cover
    };
  },

  /**
   * 关注主播
   */
  followAnchor: function () {
    wx.showToast({
      title: '关注成功',
      icon: 'success'
    });
  },

  /**
   * 格式化数字
   */
  formatNumber: function (num) {
    if (num < 1000) {
      return num.toString();
    } else if (num < 10000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return (num / 10000).toFixed(1) + 'w';
    }
  },

  /**
   * 格式化时长
   */
  formatDuration: function (seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
});