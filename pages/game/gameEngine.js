// pages/game/gameEngine.js
import * as THREE from './libs/three.min.js'
import Player from './player.js'
import Block from './block.js'
import { lerp, easeOutQuart } from './utils.js'
import { BlockPool, poolManager } from './objectPool.js'
import { performanceOptimizer, renderOptimizer } from './performanceOptimizer.js'

class GameEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    
    // 游戏状态
    this.isRunning = false
    this.isPaused = false
    this.score = 0
    this.gameState = 'waiting' // waiting, charging, jumping, falling
    
    // 蓄力相关
    this.chargingStartTime = 0
    this.maxChargingTime = 2000 // 最大蓄力时间2秒
    this.currentPower = 0
    
    // 回调函数
    this.onScoreChange = null
    this.onGameOver = null
    this.onPowerChange = null
    
    // 初始化Three.js场景
    this.initScene()
    this.initLighting()
    this.initCamera()
    
    // 初始化游戏对象
    this.initGameObjects()
    
    // 绑定渲染循环
    this.render = this.render.bind(this)
  }
  
  // 初始化场景
  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB) // 天蓝色背景
    
    // 添加雾效
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200)
    
    // WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: this.ctx,
      antialias: true,
      alpha: false
    })
    this.renderer.setSize(this.canvas.width, this.canvas.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }
  
  // 初始化光照
  initLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)
    
    // 方向光（太阳光）
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(10, 20, 10)
    this.directionalLight.castShadow = true
    
    // 设置阴影参数
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.1
    this.directionalLight.shadow.camera.far = 100
    this.directionalLight.shadow.camera.left = -20
    this.directionalLight.shadow.camera.right = 20
    this.directionalLight.shadow.camera.top = 20
    this.directionalLight.shadow.camera.bottom = -20
    
    this.scene.add(this.directionalLight)
  }
  
  // 初始化相机
  initCamera() {
    const aspect = this.canvas.width / this.canvas.height
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    
    // 设置相机初始位置
    this.camera.position.set(0, 8, 8)
    this.camera.lookAt(0, 0, 0)
    
    // 相机跟随参数
    this.cameraTarget = new THREE.Vector3(0, 0, 0)
    this.cameraOffset = new THREE.Vector3(0, 8, 8)
  }
  
  // 初始化游戏对象
  initGameObjects() {
    // 创建玩家
    this.player = new Player(this.scene)
    
    // 创建方块对象池
    this.blockPool = new BlockPool(this.scene, 20)
    poolManager.registerPool('blocks', this.blockPool)
    
    // 创建方块数组
    this.blocks = []
    this.currentBlockIndex = 0
    
    // 创建初始方块
    this.createInitialBlocks()
  }
  
  // 创建初始方块
  createInitialBlocks() {
    // 起始方块
    const startBlock = this.blockPool.createBlock(0, 0, 0, 'start')
    this.blocks.push(startBlock)
    
    // 生成前几个方块
    for (let i = 1; i < 5; i++) {
      this.generateNextBlock()
    }
    
    // 玩家站在第一个方块上
    this.player.setPosition(0, 1, 0)
  }
  
  // 生成下一个方块
  generateNextBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1]
    
    // 随机生成下一个方块的位置
    const distance = 3 + Math.random() * 4 // 距离3-7之间
    const angle = (Math.random() - 0.5) * Math.PI * 0.6 // 角度范围
    
    const x = lastBlock.position.x + Math.sin(angle) * distance
    const z = lastBlock.position.z + Math.cos(angle) * distance
    
    // 随机方块类型
    const types = ['normal', 'small', 'tall', 'special']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const newBlock = this.blockPool.createBlock(x, 0, z, type)
    this.blocks.push(newBlock)
  }
  
  // 开始游戏
  startGame() {
    this.isRunning = true
    this.gameState = 'waiting'
    this.score = 0
    this.currentBlockIndex = 0
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score)
    }
  }
  
  // 重新开始游戏
  restart() {
    // 回收现有方块到对象池
    this.blocks.forEach(block => this.blockPool.recycleBlock(block))
    this.blocks = []
    this.currentBlockIndex = 0
    this.score = 0
    
    // 重置玩家
    this.player.reset()
    
    // 重新创建方块
    this.createInitialBlocks()
    
    // 重置相机
    this.cameraTarget.set(0, 0, 0)
    
    // 开始游戏
    this.startGame()
  }
  
  // 开始蓄力
  startCharging() {
    if (this.gameState !== 'waiting') return
    
    this.gameState = 'charging'
    this.chargingStartTime = Date.now()
    this.currentPower = 0
    
    // 开始蓄力动画
    this.player.startCharging()
  }
  
  // 跳跃
  jump() {
    if (this.gameState !== 'charging') return
    
    const chargingTime = Date.now() - this.chargingStartTime
    const power = Math.min(chargingTime / this.maxChargingTime, 1)
    
    this.gameState = 'jumping'
    this.currentPower = 0
    
    if (this.onPowerChange) {
      this.onPowerChange(0)
    }
    
    // 计算跳跃参数
    const jumpDistance = 2 + power * 6 // 跳跃距离2-8
    const jumpHeight = 1 + power * 3   // 跳跃高度1-4
    
    // 执行跳跃
    this.player.jump(jumpDistance, jumpHeight, () => {
      this.checkLanding()
    })
  }
  
  // 检查落地 - 优化版本，只检查附近的方块
  checkLanding() {
    const playerPos = this.player.position
    let landedBlock = null
    let minDistance = Infinity
    
    // 只检查当前方块附近的几个方块，而不是所有方块
    const checkRange = 3
    const startIndex = Math.max(0, this.currentBlockIndex - 1)
    const endIndex = Math.min(this.blocks.length, this.currentBlockIndex + checkRange)
    
    for (let i = startIndex; i < endIndex; i++) {
      const block = this.blocks[i]
      if (!block) continue
      
      // 使用平方距离避免开方运算
      const dx = playerPos.x - block.position.x
      const dz = playerPos.z - block.position.z
      const distanceSquared = dx * dx + dz * dz
      
      if (distanceSquared < minDistance) {
        minDistance = distanceSquared
        landedBlock = { block, index: i }
      }
    }
    
    // 判断是否成功落地（使用平方距离比较）
    const landingThresholdSquared = 1.5 * 1.5
    if (landedBlock && minDistance < landingThresholdSquared) {
      this.handleSuccessfulLanding(landedBlock.index, Math.sqrt(minDistance))
    } else {
      this.handleGameOver()
    }
  }
  
  // 处理成功落地
  handleSuccessfulLanding(blockIndex, distance) {
    this.gameState = 'waiting'
    
    // 计算得分
    let points = 1
    if (distance < 0.3) {
      points = 5 // 完美落地
      this.player.showPerfectEffect()
    } else if (distance < 0.8) {
      points = 3 // 良好落地
    }
    
    this.score += points
    this.currentBlockIndex = blockIndex
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score)
    }
    
    // 更新相机目标
    const targetBlock = this.blocks[blockIndex]
    this.cameraTarget.copy(targetBlock.position)
    
    // 生成新方块
    if (this.blocks.length - blockIndex < 3) {
      this.generateNextBlock()
    }
    
    // 清理远处的方块
    this.cleanupDistantBlocks()
  }
  
  // 处理游戏结束
  handleGameOver() {
    this.gameState = 'falling'
    this.isRunning = false
    
    // 播放坠落动画
    this.player.fall(() => {
      if (this.onGameOver) {
        this.onGameOver()
      }
    })
  }
  
  // 清理远处的方块 - 优化版本
  cleanupDistantBlocks() {
    const keepDistanceSquared = 20 * 20
    const playerPos = this.player.position
    const blocksToRemove = []
    
    // 找到需要移除的方块
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i]
      if (!block) continue
      
      const dx = playerPos.x - block.position.x
      const dz = playerPos.z - block.position.z
      const distanceSquared = dx * dx + dz * dz
      
      if (distanceSquared > keepDistanceSquared && i < this.currentBlockIndex - 2) {
        blocksToRemove.push(i)
      }
    }
    
    // 从后往前移除，避免索引问题
    for (let i = blocksToRemove.length - 1; i >= 0; i--) {
      const index = blocksToRemove[i]
      this.blockPool.recycleBlock(this.blocks[index])
      this.blocks.splice(index, 1)
    }
  }
  
  // 更新游戏逻辑 - 优化版本
  update(deltaTime) {
    if (!this.isRunning && this.gameState !== 'falling') return
    
    // 更新性能优化器
    performanceOptimizer.update()
    
    // 更新蓄力
    if (this.gameState === 'charging') {
      const chargingTime = Date.now() - this.chargingStartTime
      this.currentPower = Math.min((chargingTime / this.maxChargingTime) * 100, 100)
      
      if (this.onPowerChange) {
        this.onPowerChange(this.currentPower)
      }
    }
    
    // 更新玩家
    this.player.update(deltaTime)
    
    // 根据性能设置动态调整更新范围
    const settings = performanceOptimizer.getOptimizationSettings()
    const updateRange = settings.updateRange
    const startIndex = Math.max(0, this.currentBlockIndex - 2)
    const endIndex = Math.min(this.blocks.length, this.currentBlockIndex + updateRange)
    
    for (let i = startIndex; i < endIndex; i++) {
      const block = this.blocks[i]
      if (block) {
        block.update(deltaTime)
      }
    }
    
    // 更新相机
    this.updateCamera(deltaTime)
  }
  
  // 更新相机
  updateCamera(deltaTime) {
    // 平滑跟随目标
    this.camera.position.x = lerp(this.camera.position.x, this.cameraTarget.x + this.cameraOffset.x, deltaTime * 2)
    this.camera.position.z = lerp(this.camera.position.z, this.cameraTarget.z + this.cameraOffset.z, deltaTime * 2)
    
    // 相机始终看向玩家
    this.camera.lookAt(this.player.position.x, this.player.position.y, this.player.position.z)
  }
  
  // 渲染循环
  render(timestamp) {
    if (this.isPaused) {
      requestAnimationFrame(this.render)
      return
    }
    
    const deltaTime = (timestamp - (this.lastTime || timestamp)) / 1000
    this.lastTime = timestamp
    
    // 更新游戏逻辑
    this.update(deltaTime)
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera)
    
    // 继续渲染循环
    requestAnimationFrame(this.render)
  }
  
  // 开始渲染
  start() {
    requestAnimationFrame(this.render)
  }
  
  // 暂停游戏
  pause() {
    this.isPaused = true
  }
  
  // 恢复游戏
  resume() {
    this.isPaused = false
  }
  
  // 销毁游戏
  destroy() {
    this.isRunning = false
    this.isPaused = true
    
    // 清理资源
    this.blocks.forEach(block => block.destroy())
    this.player.destroy()
    
    if (this.renderer) {
      this.renderer.dispose()
    }
  }
}

export default GameEngine