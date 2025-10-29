// 直播页面逻辑
const app = getApp()

Page({
  data: {
    // 直播状态
    isLive: false,
    isPushing: false,
    isWatching: false,
    
    // 直播信息
    liveInfo: {
      title: '',
      cover: '',
      streamUrl: '',
      pushUrl: '',
      roomId: '',
      viewerCount: 0
    },
    
    // 用户信息
    userInfo: {
      nickname: '',
      avatar: '',
      isHost: false
    },
    
    // 弹幕列表
    danmakuList: [],
    
    // 礼物列表
    giftList: [],
    
    // 直播控制
    cameraPosition: 'front',
    isMuted: false,
    isFlashOn: false,
    
    // 推流器实例
    livePusher: null,
    
    // 播放器实例
    livePlayer: null
  },

  onLoad(options) {
    const { roomId, mode = 'watch' } = options
    this.setData({
      'liveInfo.roomId': roomId,
      'userInfo.isHost': mode === 'push'
    })
    
    this.initLiveSystem()
  },

  onShow() {
    this.getUserInfo()
  },

  onUnload() {
    this.cleanup()
  },

  // 初始化直播系统
  initLiveSystem() {
    if (this.data.userInfo.isHost) {
      this.initPusher()
    } else {
      this.initPlayer()
    }
    this.initWebSocket()
  },

  // 初始化推流器
  initPusher() {
    const livePusher = wx.createLivePusherContext('livePusher', this)
    this.setData({ livePusher })
    
    // 监听推流状态
    livePusher.on('statechange', (res) => {
      console.log('推流状态变化:', res)
      this.handlePusherStateChange(res)
    })
    
    livePusher.on('netstatus', (res) => {
      console.log('网络状态:', res)
    })
  },

  // 初始化播放器
  initPlayer() {
    const livePlayer = wx.createLivePlayerContext('livePlayer', this)
    this.setData({ livePlayer })
    
    // 监听播放状态
    livePlayer.on('statechange', (res) => {
      console.log('播放状态变化:', res)
      this.handlePlayerStateChange(res)
    })
  },

  // 初始化WebSocket连接
  initWebSocket() {
    const wsUrl = `wss://your-domain.com/ws/live/${this.data.liveInfo.roomId}`
    const socketTask = wx.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket连接成功')
      },
      fail: (err) => {
        console.error('WebSocket连接失败:', err)
      }
    })

    socketTask.onOpen(() => {
      console.log('WebSocket已连接')
      this.setData({ socketTask })
    })

    socketTask.onMessage((res) => {
      const data = JSON.parse(res.data)
      this.handleWebSocketMessage(data)
    })

    socketTask.onClose(() => {
      console.log('WebSocket连接关闭')
    })

    socketTask.onError((err) => {
      console.error('WebSocket错误:', err)
    })
  },

  // 开始直播
  startLive() {
    if (!this.data.liveInfo.title) {
      wx.showToast({
        title: '请输入直播标题',
        icon: 'none'
      })
      return
    }

    // 获取推流地址
    this.getPushUrl()
  },

  // 获取推流地址
  getPushUrl() {
    wx.request({
      url: 'https://your-api.com/live/push-url',
      method: 'POST',
      data: {
        roomId: this.data.liveInfo.roomId,
        title: this.data.liveInfo.title
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({
            'liveInfo.pushUrl': res.data.data.pushUrl,
            'liveInfo.streamUrl': res.data.data.streamUrl
          })
          this.startPush()
        } else {
          wx.showToast({
            title: res.data.message || '获取推流地址失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('获取推流地址失败:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  // 开始推流
  startPush() {
    const { livePusher, liveInfo } = this.data
    
    livePusher.start({
      url: liveInfo.pushUrl,
      success: () => {
        console.log('推流开始成功')
        this.setData({ isPushing: true, isLive: true })
        this.notifyLiveStart()
      },
      fail: (err) => {
        console.error('推流开始失败:', err)
        wx.showToast({
          title: '推流失败',
          icon: 'none'
        })
      }
    })
  },

  // 停止直播
  stopLive() {
    const { livePusher } = this.data
    
    livePusher.stop({
      success: () => {
        console.log('推流停止成功')
        this.setData({ isPushing: false, isLive: false })
        this.notifyLiveStop()
      },
      fail: (err) => {
        console.error('推流停止失败:', err)
      }
    })
  },

  // 开始观看
  startWatch() {
    const { livePlayer, liveInfo } = this.data
    
    livePlayer.play({
      url: liveInfo.streamUrl,
      success: () => {
        console.log('开始观看直播')
        this.setData({ isWatching: true })
      },
      fail: (err) => {
        console.error('观看失败:', err)
        wx.showToast({
          title: '观看失败',
          icon: 'none'
        })
      }
    })
  },

  // 停止观看
  stopWatch() {
    const { livePlayer } = this.data
    
    livePlayer.stop({
      success: () => {
        console.log('停止观看')
        this.setData({ isWatching: false })
      }
    })
  },

  // 发送弹幕
  sendDanmaku() {
    const content = this.data.danmakuInput
    if (!content.trim()) return

    const danmaku = {
      id: Date.now(),
      content: content.trim(),
      user: this.data.userInfo.nickname,
      avatar: this.data.userInfo.avatar,
      timestamp: Date.now(),
      color: this.getRandomColor()
    }

    // 发送到服务器
    this.sendWebSocketMessage({
      type: 'danmaku',
      data: danmaku
    })

    // 添加到本地列表
    this.addDanmaku(danmaku)
    this.setData({ danmakuInput: '' })
  },

  // 发送礼物
  sendGift(giftId) {
    const gift = this.data.giftList.find(g => g.id === giftId)
    if (!gift) return

    const giftData = {
      id: Date.now(),
      giftId: gift.id,
      giftName: gift.name,
      giftValue: gift.value,
      user: this.data.userInfo.nickname,
      avatar: this.data.userInfo.avatar,
      timestamp: Date.now()
    }

    // 发送到服务器
    this.sendWebSocketMessage({
      type: 'gift',
      data: giftData
    })

    // 显示礼物动画
    this.showGiftAnimation(giftData)
  },

  // 切换摄像头
  switchCamera() {
    const { livePusher, cameraPosition } = this.data
    const newPosition = cameraPosition === 'front' ? 'back' : 'front'
    
    livePusher.switchCamera({
      success: () => {
        this.setData({ cameraPosition: newPosition })
      }
    })
  },

  // 切换静音
  toggleMute() {
    const { livePusher, isMuted } = this.data
    const newMuted = !isMuted
    
    livePusher.toggleMute({
      success: () => {
        this.setData({ isMuted: newMuted })
      }
    })
  },

  // 切换闪光灯
  toggleFlash() {
    const { livePusher, isFlashOn } = this.data
    const newFlashOn = !isFlashOn
    
    livePusher.toggleFlash({
      success: () => {
        this.setData({ isFlashOn: newFlashOn })
      }
    })
  },

  // 处理推流状态变化
  handlePusherStateChange(res) {
    const { code, message } = res.detail
    
    switch (code) {
      case 1001:
        // 连接成功
        break
      case 1002:
        // 连接服务器失败
        wx.showToast({
          title: '连接服务器失败',
          icon: 'none'
        })
        break
      case 1003:
        // 推流开始
        break
      case 1004:
        // 推流结束
        this.setData({ isPushing: false, isLive: false })
        break
      case 1007:
        // 推流中断
        wx.showToast({
          title: '推流中断',
          icon: 'none'
        })
        break
    }
  },

  // 处理播放状态变化
  handlePlayerStateChange(res) {
    const { code, message } = res.detail
    
    switch (code) {
      case 2001:
        // 连接成功
        break
      case 2002:
        // 连接服务器失败
        wx.showToast({
          title: '连接服务器失败',
          icon: 'none'
        })
        break
      case 2003:
        // 播放开始
        break
      case 2004:
        // 播放结束
        this.setData({ isWatching: false })
        break
      case 2007:
        // 播放中断
        wx.showToast({
          title: '播放中断',
          icon: 'none'
        })
        break
    }
  },

  // 处理WebSocket消息
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'danmaku':
        this.addDanmaku(data.data)
        break
      case 'gift':
        this.showGiftAnimation(data.data)
        break
      case 'viewer_count':
        this.setData({
          'liveInfo.viewerCount': data.data.count
        })
        break
      case 'live_start':
        this.handleLiveStart(data.data)
        break
      case 'live_stop':
        this.handleLiveStop(data.data)
        break
    }
  },

  // 发送WebSocket消息
  sendWebSocketMessage(message) {
    const { socketTask } = this.data
    if (socketTask) {
      socketTask.send({
        data: JSON.stringify(message)
      })
    }
  },

  // 添加弹幕
  addDanmaku(danmaku) {
    const danmakuList = [...this.data.danmakuList, danmaku]
    // 限制弹幕数量，避免内存溢出
    if (danmakuList.length > 100) {
      danmakuList.splice(0, danmakuList.length - 100)
    }
    this.setData({ danmakuList })
  },

  // 显示礼物动画
  showGiftAnimation(giftData) {
    // 实现礼物动画逻辑
    console.log('显示礼物动画:', giftData)
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    } else {
      // 获取用户信息
      wx.getUserProfile({
        desc: '用于直播身份显示',
        success: (res) => {
          this.setData({ userInfo: res.userInfo })
          wx.setStorageSync('userInfo', res.userInfo)
        }
      })
    }
  },

  // 获取随机颜色
  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    return colors[Math.floor(Math.random() * colors.length)]
  },

  // 清理资源
  cleanup() {
    const { livePusher, livePlayer, socketTask } = this.data
    
    if (livePusher && this.data.isPushing) {
      livePusher.stop()
    }
    
    if (livePlayer && this.data.isWatching) {
      livePlayer.stop()
    }
    
    if (socketTask) {
      socketTask.close()
    }
  },

  // 通知直播开始
  notifyLiveStart() {
    this.sendWebSocketMessage({
      type: 'live_start',
      data: {
        roomId: this.data.liveInfo.roomId,
        title: this.data.liveInfo.title,
        host: this.data.userInfo.nickname
      }
    })
  },

  // 通知直播停止
  notifyLiveStop() {
    this.sendWebSocketMessage({
      type: 'live_stop',
      data: {
        roomId: this.data.liveInfo.roomId
      }
    })
  },

  // 处理直播开始
  handleLiveStart(data) {
    if (!this.data.userInfo.isHost) {
      this.startWatch()
    }
  },

  // 处理直播停止
  handleLiveStop(data) {
    if (!this.data.userInfo.isHost) {
      this.stopWatch()
      wx.showToast({
        title: '直播已结束',
        icon: 'none'
      })
    }
  },

  // 输入弹幕内容
  onDanmakuInput(e) {
    this.setData({
      danmakuInput: e.detail.value
    })
  },

  // 输入直播标题
  onTitleInput(e) {
    this.setData({
      'liveInfo.title': e.detail.value
    })
  },

  // 选择礼物
  onGiftSelect(e) {
    const giftId = e.currentTarget.dataset.giftId
    this.sendGift(giftId)
  }
})