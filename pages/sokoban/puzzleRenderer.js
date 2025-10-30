// pages/sokoban/puzzleRenderer.js
class PuzzleRenderer {
  constructor(canvasId, pageContext) {
    this.canvasId = canvasId
    this.pageContext = pageContext
    this.canvas = null
    this.ctx = null
    this.cellSize = 40
    this.puzzle = null
    this.currentState = null
  }

  // 初始化canvas
  async init() {
    return new Promise((resolve) => {
      const query = wx.createSelectorQuery().in(this.pageContext)
      query.select(`#${this.canvasId}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            this.canvas = res[0].node
            this.ctx = this.canvas.getContext('2d')
            
            const dpr = wx.getSystemInfoSync().pixelRatio
            this.canvas.width = res[0].width * dpr
            this.canvas.height = res[0].height * dpr
            this.ctx.scale(dpr, dpr)
            
            resolve()
          }
        })
    })
  }

  // 设置推箱子布局
  setPuzzle(puzzle) {
    this.puzzle = puzzle
    this.calculateCellSize()
  }

  // 计算合适的单元格大小
  calculateCellSize() {
    if (!this.puzzle || !this.canvas) return
    
    const canvasWidth = this.canvas.width / wx.getSystemInfoSync().pixelRatio
    const canvasHeight = this.canvas.height / wx.getSystemInfoSync().pixelRatio
    
    const cellWidth = Math.floor(canvasWidth / this.puzzle.cols)
    const cellHeight = Math.floor(canvasHeight / this.puzzle.rows)
    
    this.cellSize = Math.min(cellWidth, cellHeight, 50)
  }

  // 渲染当前状态
  renderState(state) {
    if (!this.puzzle || !this.ctx) return
    
    this.currentState = state
    this.clearCanvas()
    this.drawGrid()
    this.drawElements()
  }

  // 清空画布
  clearCanvas() {
    const canvasWidth = this.canvas.width / wx.getSystemInfoSync().pixelRatio
    const canvasHeight = this.canvas.height / wx.getSystemInfoSync().pixelRatio
    
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  // 绘制网格
  drawGrid() {
    this.ctx.strokeStyle = '#ddd'
    this.ctx.lineWidth = 1
    
    for (let row = 0; row <= this.puzzle.rows; row++) {
      const y = row * this.cellSize
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.puzzle.cols * this.cellSize, y)
      this.ctx.stroke()
    }
    
    for (let col = 0; col <= this.puzzle.cols; col++) {
      const x = col * this.cellSize
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.puzzle.rows * this.cellSize)
      this.ctx.stroke()
    }
  }

  // 绘制游戏元素
  drawElements() {
    // 绘制静态元素（墙壁、目标点）
    for (let row = 0; row < this.puzzle.rows; row++) {
      for (let col = 0; col < this.puzzle.cols; col++) {
        const cell = this.puzzle.grid[row][col]
        const x = col * this.cellSize
        const y = row * this.cellSize
        
        if (cell === '#') {
          this.drawWall(x, y)
        }
      }
    }
    
    // 绘制目标点
    if (this.puzzle.targets) {
      this.puzzle.targets.forEach(target => {
        this.drawTarget(target.x * this.cellSize, target.y * this.cellSize)
      })
    }
    
    // 绘制动态元素（箱子、玩家）
    if (this.currentState) {
      // 绘制箱子
      this.currentState.boxes.forEach(box => {
        const isOnTarget = this.puzzle.targets && 
          this.puzzle.targets.some(target => target.x === box.x && target.y === box.y)
        this.drawBox(box.x * this.cellSize, box.y * this.cellSize, isOnTarget)
      })
      
      // 绘制玩家
      this.drawPlayer(
        this.currentState.player.x * this.cellSize, 
        this.currentState.player.y * this.cellSize
      )
    }
  }

  // 绘制墙壁
  drawWall(x, y) {
    this.ctx.fillStyle = '#8B4513'
    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4)
    
    // 添加纹理效果
    this.ctx.fillStyle = '#A0522D'
    this.ctx.fillRect(x + 4, y + 4, this.cellSize - 8, 4)
    this.ctx.fillRect(x + 4, y + this.cellSize - 8, this.cellSize - 8, 4)
  }

  // 绘制目标点
  drawTarget(x, y) {
    const centerX = x + this.cellSize / 2
    const centerY = y + this.cellSize / 2
    const radius = this.cellSize / 4
    
    this.ctx.fillStyle = '#FFD700'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 添加光环效果
    this.ctx.strokeStyle = '#FFA500'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2)
    this.ctx.stroke()
  }

  // 绘制箱子
  drawBox(x, y, isOnTarget = false) {
    const boxColor = isOnTarget ? '#32CD32' : '#CD853F'
    const borderColor = isOnTarget ? '#228B22' : '#8B4513'
    
    this.ctx.fillStyle = boxColor
    this.ctx.fillRect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6)
    
    // 边框
    this.ctx.strokeStyle = borderColor
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6)
    
    // 添加3D效果
    this.ctx.fillStyle = isOnTarget ? '#90EE90' : '#DEB887'
    this.ctx.fillRect(x + 5, y + 5, this.cellSize - 12, 4)
    this.ctx.fillRect(x + 5, y + 5, 4, this.cellSize - 12)
  }

  // 绘制玩家
  drawPlayer(x, y) {
    const centerX = x + this.cellSize / 2
    const centerY = y + this.cellSize / 2
    const radius = this.cellSize / 3
    
    // 身体
    this.ctx.fillStyle = '#4169E1'
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 边框
    this.ctx.strokeStyle = '#191970'
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    
    // 眼睛
    this.ctx.fillStyle = 'white'
    this.ctx.beginPath()
    this.ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.beginPath()
    this.ctx.arc(centerX + radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 瞳孔
    this.ctx.fillStyle = 'black'
    this.ctx.beginPath()
    this.ctx.arc(centerX - radius/3, centerY - radius/3, radius/6, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.beginPath()
    this.ctx.arc(centerX + radius/3, centerY - radius/3, radius/6, 0, Math.PI * 2)
    this.ctx.fill()
  }

  // 获取点击位置对应的网格坐标
  getGridPosition(touchX, touchY) {
    const col = Math.floor(touchX / this.cellSize)
    const row = Math.floor(touchY / this.cellSize)
    
    if (row >= 0 && row < this.puzzle.rows && col >= 0 && col < this.puzzle.cols) {
      return { row, col }
    }
    
    return null
  }

  // 高亮显示路径
  highlightPath(path) {
    if (!path || path.length === 0) return
    
    this.ctx.strokeStyle = '#FF4500'
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([5, 5])
    
    this.ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const point = path[i]
      const x = point.x * this.cellSize + this.cellSize / 2
      const y = point.y * this.cellSize + this.cellSize / 2
      
      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  // 动画移动
  async animateMove(fromState, toState, duration = 500) {
    if (!fromState || !toState) return
    
    const startTime = Date.now()
    
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 插值计算中间状态
        const interpolatedState = this.interpolateStates(fromState, toState, progress)
        
        // 渲染中间状态
        this.renderState(interpolatedState)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      animate()
    })
  }

  // 状态插值
  interpolateStates(fromState, toState, progress) {
    const easeProgress = this.easeInOutCubic(progress)
    
    return {
      player: {
        x: fromState.player.x + (toState.player.x - fromState.player.x) * easeProgress,
        y: fromState.player.y + (toState.player.y - fromState.player.y) * easeProgress
      },
      boxes: fromState.boxes.map((fromBox, index) => {
        const toBox = toState.boxes[index]
        return {
          x: fromBox.x + (toBox.x - fromBox.x) * easeProgress,
          y: fromBox.y + (toBox.y - fromBox.y) * easeProgress
        }
      })
    }
  }

  // 缓动函数
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }
}

export default PuzzleRenderer