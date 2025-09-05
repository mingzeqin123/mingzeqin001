// index.js
Page({
  data: {
    highScore: 0
  },

  onLoad() {
    // 获取最高分
    const highScore = wx.getStorageSync('highScore') || 0
    this.setData({
      highScore: highScore
    })
  },

  startGame() {
    wx.navigateTo({
      url: '/pages/game/game'
    })
  }
})