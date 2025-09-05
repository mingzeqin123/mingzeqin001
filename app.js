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
  },
  
  globalData: {
    userInfo: null,
    bestScore: 0
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
  }
})