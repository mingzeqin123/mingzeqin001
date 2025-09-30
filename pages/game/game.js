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
    // Get best score
    this.setData({
      bestScore: getApp().getBestScore()
    })
    
    // Initialize game engine
    this.initGame()
  },

  onShow() {
    // Resume game when page is shown
    if (this.gameEngine) {
      this.gameEngine.resume()
    }
  },

  onHide() {
    // Pause game when page is hidden
    if (this.gameEngine) {
      this.gameEngine.pause()
    }
  },

  onUnload() {
    // Clean up resources when page is unloaded
    if (this.gameEngine) {
      this.gameEngine.destroy()
    }
  },

  // Initialize game
  initGame() {
    const query = wx.createSelectorQuery()
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('webgl')
        
        // Set canvas size
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.viewport(0, 0, canvas.width, canvas.height)

        // Initialize game engine
        this.gameEngine = new GameEngine(canvas, ctx)
        
        // Bind game events
        this.gameEngine.onScoreChange = (score) => {
          this.setData({ score })
        }
        
        this.gameEngine.onGameOver = () => {
          this.handleGameOver()
        }
        
        this.gameEngine.onPowerChange = (power) => {
          this.setData({ power })
        }

        // Start render loop
        this.gameEngine.start()
      })
  },

  // Start game
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

  // Restart game
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

  // Handle game over
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
    
    // Vibration feedback
    wx.vibrateShort({
      type: 'heavy'
    })
  },

  // Share score
  shareScore() {
    const { score } = this.data
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // Touch start
  onTouchStart(e) {
    if (this.data.gameState !== 'playing') return
    
    this.setData({ isPressing: true })
    
    if (this.gameEngine) {
      this.gameEngine.startCharging()
    }
  },

  // Touch move
  onTouchMove(e) {
    // Prevent page scrolling
    e.preventDefault()
  },

  // Touch end
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

  // Share to friends
  onShareAppMessage() {
    const { score } = this.data
    return {
      title: `I scored ${score} points in Jump Jump, come challenge me!`,
      path: '/pages/game/game',
      imageUrl: '/images/share.png'
    }
  },

  // Share to Moments
  onShareTimeline() {
    const { score } = this.data
    return {
      title: `Jump Jump Challenge: ${score} points!`,
      query: 'from=timeline',
      imageUrl: '/images/share.png'
    }
  }
})