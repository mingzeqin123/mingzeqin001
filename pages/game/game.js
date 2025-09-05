// game.js
Page({
  data: {
    score: 0,
    gameOver: false,
    gameStarted: false,
    isNewRecord: false
  },

  onLoad() {
    this.initGame()
  },

  onUnload() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
    }
  },

  initGame() {
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.screenWidth = res.windowWidth
        this.screenHeight = res.windowHeight
        
        // 初始化画布
        this.ctx = wx.createCanvasContext('gameCanvas', this)
        
        // 游戏参数
        this.gameData = {
          player: {
            x: 100,
            y: this.screenHeight - 200,
            width: 30,
            height: 30,
            vx: 0,
            vy: 0,
            onGround: false,
            jumpPower: 0,
            animationFrame: 0,
            direction: 1 // 1为右，-1为左
          },
          platforms: [],
          camera: {
            x: 0,
            y: 0
          },
          gravity: 0.8,
          jumpPower: 0,
          maxJumpPower: 15,
          charging: false,
          gameSpeed: 2,
          particles: [], // 粒子效果
          backgroundOffset: 0
        }
        
        // 创建初始平台
        this.createInitialPlatforms()
        this.startGameLoop()
      }
    })
  },

  createInitialPlatforms() {
    const platforms = []
    const platformWidth = 100
    const platformHeight = 20
    
    // 创建起始平台
    platforms.push({
      x: 50,
      y: this.screenHeight - 50,
      width: 150,
      height: platformHeight,
      type: 'start'
    })
    
    // 创建后续平台
    for (let i = 1; i < 20; i++) {
      const x = 200 + i * 200 + Math.random() * 100 - 50
      const y = this.screenHeight - 50 - i * 30
      platforms.push({
        x: x,
        y: y,
        width: platformWidth + Math.random() * 50,
        height: platformHeight,
        type: 'normal'
      })
    }
    
    this.gameData.platforms = platforms
  },

  startGameLoop() {
    this.gameTimer = setInterval(() => {
      this.updateGame()
      this.drawGame()
    }, 1000 / 60) // 60 FPS
  },

  updateGame() {
    if (this.data.gameOver) return
    
    const player = this.gameData.player
    const platforms = this.gameData.platforms
    
    // 更新玩家位置
    player.x += player.vx
    player.y += player.vy
    
    // 更新动画帧
    player.animationFrame += 0.2
    
    // 应用重力
    if (!player.onGround) {
      player.vy += this.gameData.gravity
    }
    
    // 检查平台碰撞
    player.onGround = false
    for (let platform of platforms) {
      if (this.checkCollision(player, platform)) {
        if (player.vy > 0 && player.y < platform.y) {
          player.y = platform.y - player.height
          player.vy = 0
          player.onGround = true
          player.vx = 0
          
          // 着陆时创建粒子效果
          this.createLandingParticles(player.x + player.width/2, player.y + player.height)
        }
      }
    }
    
    // 检查是否掉出屏幕
    if (player.y > this.screenHeight) {
      this.gameOver()
      return
    }
    
    // 更新相机位置
    this.gameData.camera.x = player.x - this.screenWidth / 2
    this.gameData.camera.y = player.y - this.screenHeight / 2
    
    // 更新背景偏移
    this.gameData.backgroundOffset += 0.5
    
    // 更新粒子
    this.updateParticles()
    
    // 生成新平台
    this.generateNewPlatforms()
    
    // 移除旧平台
    this.removeOldPlatforms()
  },

  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  },

  generateNewPlatforms() {
    const platforms = this.gameData.platforms
    const lastPlatform = platforms[platforms.length - 1]
    
    if (lastPlatform && lastPlatform.x < this.gameData.player.x + this.screenWidth) {
      const x = lastPlatform.x + 150 + Math.random() * 100
      const y = lastPlatform.y - 20 - Math.random() * 40
      platforms.push({
        x: x,
        y: y,
        width: 80 + Math.random() * 60,
        height: 20,
        type: 'normal'
      })
    }
  },

  removeOldPlatforms() {
    const platforms = this.gameData.platforms
    const cameraX = this.gameData.camera.x
    
    for (let i = platforms.length - 1; i >= 0; i--) {
      if (platforms[i].x + platforms[i].width < cameraX - 100) {
        platforms.splice(i, 1)
      }
    }
  },

  jump() {
    if (this.data.gameOver) return
    
    if (!this.data.gameStarted) {
      this.setData({ gameStarted: true })
    }
    
    const player = this.gameData.player
    
    if (player.onGround) {
      // 计算跳跃力度
      const jumpPower = Math.min(15, 8 + Math.random() * 7)
      player.vy = -jumpPower
      player.onGround = false
      
      // 创建跳跃粒子效果
      this.createJumpParticles(player.x + player.width/2, player.y + player.height)
      
      // 增加分数
      this.setData({
        score: this.data.score + 1
      })
    }
  },

  createJumpParticles(x, y) {
    const particles = this.gameData.particles
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 30,
        maxLife: 30,
        color: `hsl(${Math.random() * 60 + 20}, 70%, 60%)`
      })
    }
  },

  createLandingParticles(x, y) {
    const particles = this.gameData.particles
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 2,
        life: 20,
        maxLife: 20,
        color: `hsl(${Math.random() * 30 + 30}, 80%, 50%)`
      })
    }
  },

  updateParticles() {
    const particles = this.gameData.particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.2 // 重力
      particle.life--
      
      if (particle.life <= 0) {
        particles.splice(i, 1)
      }
    }
  },

  gameOver() {
    this.setData({ gameOver: true })
    
    if (this.gameTimer) {
      clearInterval(this.gameTimer)
    }
    
    // 检查是否创造新纪录
    const highScore = wx.getStorageSync('highScore') || 0
    if (this.data.score > highScore) {
      wx.setStorageSync('highScore', this.data.score)
      this.setData({ isNewRecord: true })
    }
  },

  drawGame() {
    if (!this.ctx) return
    
    const ctx = this.ctx
    const camera = this.gameData.camera
    const player = this.gameData.player
    const platforms = this.gameData.platforms
    const particles = this.gameData.particles
    
    // 清空画布
    ctx.clearRect(0, 0, this.screenWidth, this.screenHeight)
    
    // 绘制渐变背景
    this.drawBackground(ctx)
    
    // 绘制云朵
    this.drawClouds(ctx, camera)
    
    // 绘制平台
    ctx.setFillStyle('#8B4513')
    for (let platform of platforms) {
      const x = platform.x - camera.x
      const y = platform.y - camera.y
      
      if (x > -50 && x < this.screenWidth + 50) {
        // 绘制平台阴影
        ctx.setFillStyle('rgba(0, 0, 0, 0.2)')
        ctx.fillRect(x + 3, y + 3, platform.width, platform.height)
        
        // 绘制平台主体
        ctx.setFillStyle('#8B4513')
        ctx.fillRect(x, y, platform.width, platform.height)
        
        // 绘制平台边框
        ctx.setStrokeStyle('#654321')
        ctx.setLineWidth(2)
        ctx.strokeRect(x, y, platform.width, platform.height)
        
        // 绘制平台纹理
        ctx.setStrokeStyle('#A0522D')
        ctx.setLineWidth(1)
        for (let i = 0; i < platform.width; i += 20) {
          ctx.beginPath()
          ctx.moveTo(x + i, y)
          ctx.lineTo(x + i, y + platform.height)
          ctx.stroke()
        }
      }
    }
    
    // 绘制粒子效果
    this.drawParticles(ctx, camera)
    
    // 绘制玩家
    this.drawPlayer(ctx, camera, player)
    
    ctx.draw()
  },

  drawBackground(ctx) {
    // 天空渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, this.screenHeight)
    gradient.addColorStop(0, '#87CEEB')
    gradient.addColorStop(1, '#98FB98')
    ctx.setFillStyle(gradient)
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight)
  },

  drawClouds(ctx, camera) {
    ctx.setFillStyle('rgba(255, 255, 255, 0.8)')
    const cloudOffset = this.gameData.backgroundOffset * 0.3
    
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 + cloudOffset) % (this.screenWidth + 100) - 50
      const y = 50 + i * 30
      this.drawCloud(ctx, x, y)
    }
  },

  drawCloud(ctx, x, y) {
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2)
    ctx.arc(x + 25, y, 30, 0, Math.PI * 2)
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2)
    ctx.arc(x + 25, y - 20, 25, 0, Math.PI * 2)
    ctx.fill()
  },

  drawParticles(ctx, camera) {
    const particles = this.gameData.particles
    for (let particle of particles) {
      const x = particle.x - camera.x
      const y = particle.y - camera.y
      
      if (x > -10 && x < this.screenWidth + 10 && y > -10 && y < this.screenHeight + 10) {
        const alpha = particle.life / particle.maxLife
        ctx.setFillStyle(particle.color.replace('hsl', 'hsla').replace(')', `, ${alpha})`))
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  },

  drawPlayer(ctx, camera, player) {
    const playerX = player.x - camera.x
    const playerY = player.y - camera.y
    
    // 玩家阴影
    ctx.setFillStyle('rgba(0, 0, 0, 0.3)')
    ctx.fillRect(playerX + 2, playerY + 2, player.width, player.height)
    
    // 玩家主体
    ctx.setFillStyle('#FF6B6B')
    ctx.fillRect(playerX, playerY, player.width, player.height)
    
    // 玩家边框
    ctx.setStrokeStyle('#E55A5A')
    ctx.setLineWidth(2)
    ctx.strokeRect(playerX, playerY, player.width, player.height)
    
    // 绘制玩家眼睛
    ctx.setFillStyle('#000')
    const eyeOffset = Math.sin(player.animationFrame) * 2
    ctx.fillRect(playerX + 5, playerY + 5 + eyeOffset, 5, 5)
    ctx.fillRect(playerX + 20, playerY + 5 + eyeOffset, 5, 5)
    
    // 绘制玩家嘴巴
    ctx.setFillStyle('#000')
    if (player.onGround) {
      // 微笑
      ctx.beginPath()
      ctx.arc(playerX + 15, playerY + 20, 8, 0, Math.PI)
      ctx.stroke()
    } else {
      // 惊讶
      ctx.fillRect(playerX + 12, playerY + 20, 6, 3)
    }
  },

  restartGame() {
    this.setData({
      score: 0,
      gameOver: false,
      gameStarted: false,
      isNewRecord: false
    })
    
    this.initGame()
  },

  goHome() {
    wx.navigateBack()
  }
})