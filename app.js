App({
  onLaunch() {
    // Demonstrate local storage capability
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // Login
    wx.login({
      success: res => {
        // Send res.code to backend to exchange for openId, sessionKey, unionId
      }
    })
  },
  
  globalData: {
    userInfo: null,
    bestScore: 0
  },
  
  // Get best score
  getBestScore() {
    try {
      const score = wx.getStorageSync('bestScore') || 0
      this.globalData.bestScore = score
      return score
    } catch (e) {
      return 0
    }
  },
  
  // Save best score
  setBestScore(score) {
    try {
      if (score > this.globalData.bestScore) {
        this.globalData.bestScore = score
        wx.setStorageSync('bestScore', score)
      }
    } catch (e) {
      console.error('Failed to save score', e)
    }
  }
})