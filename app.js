App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })

    // 初始化直播系统
    this.initLiveSystem()
  },
  
  globalData: {
    userInfo: null,
    bestScore: 0,
    // 直播系统全局数据
    liveSystem: {
      isInitialized: false,
      currentRoom: null,
      userRole: null, // 'anchor' | 'viewer' | null
      networkQuality: 'unknown'
    }
  },
  
  // 获取最高分
  getBestScore() {
    try {
      const score = wx.getStorageSync('bestScore') || 0
      this.globalData.bestScore = score
      return score
    } catch (e) {
      return 0
    }
  },
  
  // 保存最高分
  setBestScore(score) {
    try {
      if (score > this.globalData.bestScore) {
        this.globalData.bestScore = score
        wx.setStorageSync('bestScore', score)
      }
    } catch (e) {
      console.error('保存分数失败', e)
    }
  },

  // 初始化直播系统
  async initLiveSystem() {
    try {
      const { NeteaseSDK } = require('./utils/live-api.js')
      const { checkNetworkStatus, getDeviceInfo } = require('./utils/live-utils.js')
      
      // 检查网络状态
      const hasNetwork = await checkNetworkStatus()
      if (!hasNetwork) {
        console.warn('网络连接异常，直播功能可能受限')
        return
      }

      // 获取设备信息
      const deviceInfo = await getDeviceInfo()
      console.log('设备信息:', deviceInfo)

      // 初始化网易云SDK
      const sdk = new NeteaseSDK()
      const result = await sdk.initialize()
      
      if (result.success) {
        this.globalData.liveSystem.isInitialized = true
        console.log('直播系统初始化成功')
      } else {
        console.error('直播系统初始化失败:', result.message)
      }
    } catch (error) {
      console.error('直播系统初始化异常:', error)
    }
  },

  // 设置当前直播间
  setCurrentRoom(roomInfo) {
    this.globalData.liveSystem.currentRoom = roomInfo
  },

  // 获取当前直播间
  getCurrentRoom() {
    return this.globalData.liveSystem.currentRoom
  },

  // 设置用户角色
  setUserRole(role) {
    this.globalData.liveSystem.userRole = role
  },

  // 获取用户角色
  getUserRole() {
    return this.globalData.liveSystem.userRole
  },

  // 设置网络质量
  setNetworkQuality(quality) {
    this.globalData.liveSystem.networkQuality = quality
  },

  // 获取网络质量
  getNetworkQuality() {
    return this.globalData.liveSystem.networkQuality
  },

  // 检查直播系统是否可用
  isLiveSystemAvailable() {
    return this.globalData.liveSystem.isInitialized
  }
})