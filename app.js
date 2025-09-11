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
    
    // 初始化开票系统
    this.initInvoiceSystem()
  },
  
  globalData: {
    userInfo: null,
    bestScore: 0,
    // 开票系统相关数据
    invoiceConfig: {
      initialized: false,
      apiAvailable: true
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
  
  // 初始化开票系统
  initInvoiceSystem() {
    try {
      const config = require('./config/invoiceConfig.js')
      this.globalData.invoiceConfig = {
        ...this.globalData.invoiceConfig,
        initialized: true,
        version: config.CLIENT_VERSION,
        environment: config.ENV
      }
      console.log('开票系统初始化成功')
    } catch (e) {
      console.error('开票系统初始化失败', e)
      this.globalData.invoiceConfig.apiAvailable = false
    }
  },
  
  // 获取开票系统状态
  getInvoiceSystemStatus() {
    return this.globalData.invoiceConfig
  }
})