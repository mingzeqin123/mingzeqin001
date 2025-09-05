// pages/game/game.js
import GameEngine from './gameEngine.js'

Page({
  data: {
    score: 0,
    bestScore: 0,
    gameState: 'start', // start, playing, over
    isPressing: false,
    power: 0,
    isNewRecord: false
  },

  onLoad() {
    // 获取最高分
    this.setData({
      bestScore: getApp().getBestScore()
    })
    
    // 初始化游戏引擎
    this.initGame()
  },

  onShow() {
    // 页面显示时恢复游戏
    if (this.gameEngine) {
      this.gameEngine.resume()
    }
  },

  onHide() {
    // 页面隐藏时暂停游戏
    if (this.gameEngine) {
      this.gameEngine.pause()
    }
  },

  onUnload() {
    // 页面卸载时清理资源
    if (this.gameEngine) {
      this.gameEngine.destroy()
    }
  },

  // 初始化游戏
  initGame() {
    const query = wx.createSelectorQuery()
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('webgl')
        
        // 设置画布大小
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.viewport(0, 0, canvas.width, canvas.height)

        // 初始化游戏引擎
        this.gameEngine = new GameEngine(canvas, ctx)
        
        // 绑定游戏事件
        this.gameEngine.onScoreChange = (score) => {
          this.setData({ score })
        }
        
        this.gameEngine.onGameOver = () => {
          this.handleGameOver()
        }
        
        this.gameEngine.onPowerChange = (power) => {
          this.setData({ power })
        }

        // 开始渲染循环
        this.gameEngine.start()
      })
  },

  // 开始游戏
  startGame() {
    this.setData({
      gameState: 'playing',
      score: 0,
      isNewRecord: false
    })
    
    if (this.gameEngine) {
      this.gameEngine.startGame()
    }
  },

  // 重新开始游戏
  restartGame() {
    this.setData({
      gameState: 'playing',
      score: 0,
      isNewRecord: false
    })
    
    if (this.gameEngine) {
      this.gameEngine.restart()
    }
  },

  // 游戏结束处理
  handleGameOver() {
    const { score, bestScore } = this.data
    let isNewRecord = false
    
    if (score > bestScore) {
      isNewRecord = true
      getApp().setBestScore(score)
      this.setData({ bestScore: score })
    }
    
    this.setData({
      gameState: 'over',
      isNewRecord
    })
    
    // 震动反馈
    wx.vibrateShort({
      type: 'heavy'
    })
  },

  // 分享成绩
  shareScore() {
    const { score } = this.data
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 触摸开始
  onTouchStart(e) {
    if (this.data.gameState !== 'playing') return
    
    this.setData({ isPressing: true })
    
    if (this.gameEngine) {
      this.gameEngine.startCharging()
    }
  },

  // 触摸移动
  onTouchMove(e) {
    // 防止页面滚动
    e.preventDefault()
  },

  // 触摸结束
  onTouchEnd(e) {
    if (this.data.gameState !== 'playing') return
    
    this.setData({ 
      isPressing: false,
      power: 0
    })
    
    if (this.gameEngine) {
      this.gameEngine.jump()
    }
  },

  // 分享给朋友
  onShareAppMessage() {
    const { score } = this.data
    return {
      title: `我在跳一跳中获得了${score}分，快来挑战吧！`,
      path: '/pages/game/game',
      imageUrl: '/images/share.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { score } = this.data
    return {
      title: `跳一跳挑战：${score}分！`,
      query: 'from=timeline',
      imageUrl: '/images/share.png'
    }
  }
})