// pages/game/gameEngine.js
import * as THREE from './libs/three.min.js'
import Player from './player.js'
import Block from './block.js'
import { lerp, clamp } from './utils.js'

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

    // OpenClaw 人类行为模拟
    this.humanSimulationEnabled = false
    this.simulationProfile = {
      reactionTimeMin: 180,
      reactionTimeMax: 520,
      hesitationChance: 0.2,
      hesitationExtraMin: 120,
      hesitationExtraMax: 320,
      powerError: 0.08,
      directionErrorDeg: 6,
      mistakeChance: 0.1
    }
    this.simulationDecisionTimer = null
    this.simulationJumpTimer = null
    this.pendingSimulationPlan = null
    
    // 回调函数
    this.onScoreChange = null
    this.onGameOver = null
    this.onPowerChange = null
    this.onChargingStateChange = null
    
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
    
    // 创建方块数组
    this.blocks = []
    this.currentBlockIndex = 0
    
    // 创建初始方块
    this.createInitialBlocks()
  }
  
  // 创建初始方块
  createInitialBlocks() {
    // 起始方块
    const startBlock = new Block(this.scene, 0, 0, 0, 'start')
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
    
    const newBlock = new Block(this.scene, x, 0, z, type)
    this.blocks.push(newBlock)
  }
  
  // 开始游戏
  startGame() {
    this.clearSimulationTimers()
    this.isRunning = true
    this.gameState = 'waiting'
    this.score = 0
    this.currentBlockIndex = 0
    this.pendingSimulationPlan = null
    this.notifyChargingState(false)
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score)
    }

    if (this.humanSimulationEnabled) {
      this.scheduleSimulatedAction()
    }
  }
  
  // 重新开始游戏
  restart() {
    this.clearSimulationTimers()

    // 清理现有方块
    this.blocks.forEach(block => block.destroy())
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
    this.notifyChargingState(true)
  }
  
  // 跳跃
  jump() {
    if (this.gameState !== 'charging') return
    
    const simulationPlan = this.pendingSimulationPlan
    this.pendingSimulationPlan = null

    const chargingTime = Date.now() - this.chargingStartTime
    const power = clamp((chargingTime / this.maxChargingTime) + (simulationPlan ? simulationPlan.powerOffset : 0), 0, 1)
    
    this.gameState = 'jumping'
    this.currentPower = 0
    this.notifyChargingState(false)
    
    if (this.onPowerChange) {
      this.onPowerChange(0)
    }
    
    // 计算跳跃参数
    const jumpDistance = 2 + power * 6 // 跳跃距离2-8
    const jumpHeight = 1 + power * 3   // 跳跃高度1-4
    const jumpDirection = this.calculateJumpDirection(simulationPlan)
    
    // 执行跳跃
    this.player.jump(jumpDistance, jumpHeight, jumpDirection, () => {
      this.checkLanding()
    })
  }
  
  // 检查落地
  checkLanding() {
    const playerPos = this.player.position
    let landedBlock = null
    let minDistance = Infinity
    
    // 检查与所有方块的距离
    this.blocks.forEach((block, index) => {
      const distance = Math.sqrt(
        Math.pow(playerPos.x - block.position.x, 2) +
        Math.pow(playerPos.z - block.position.z, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        landedBlock = { block, index }
      }
    })
    
    // 判断是否成功落地：必须向前推进到后续方块，且落在方块半径内
    const landingRadius = landedBlock ? landedBlock.block.getRadius() : 0
    const hasProgress = landedBlock ? landedBlock.index > this.currentBlockIndex : false
    if (landedBlock && hasProgress && minDistance <= landingRadius) {
      this.handleSuccessfulLanding(landedBlock.index, minDistance)
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
    targetBlock.playLandingEffect()
    
    // 生成新方块
    if (this.blocks.length - blockIndex < 3) {
      this.generateNextBlock()
    }
    
    // 清理远处的方块
    this.cleanupDistantBlocks()
    const normalizedIndex = this.blocks.indexOf(targetBlock)
    this.currentBlockIndex = normalizedIndex >= 0 ? normalizedIndex : Math.max(0, this.blocks.length - 1)

    if (this.humanSimulationEnabled) {
      this.scheduleSimulatedAction()
    }
  }
  
  // 处理游戏结束
  handleGameOver() {
    this.clearSimulationTimers()
    this.pendingSimulationPlan = null
    this.gameState = 'falling'
    this.isRunning = false
    this.notifyChargingState(false)
    
    // 播放坠落动画
    this.player.fall(() => {
      if (this.onGameOver) {
        this.onGameOver()
      }
    })
  }
  
  // 清理远处的方块
  cleanupDistantBlocks() {
    const keepDistance = 20
    const playerPos = this.player.position
    
    this.blocks = this.blocks.filter((block, index) => {
      const distance = Math.sqrt(
        Math.pow(playerPos.x - block.position.x, 2) +
        Math.pow(playerPos.z - block.position.z, 2)
      )
      
      if (distance > keepDistance && index < this.currentBlockIndex - 2) {
        block.destroy()
        return false
      }
      return true
    })
  }
  
  // 更新游戏逻辑
  update(deltaTime) {
    if (!this.isRunning && this.gameState !== 'falling') return
    
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
    
    // 更新方块
    this.blocks.forEach(block => {
      block.update(deltaTime)
    })
    
    // 更新相机
    this.updateCamera(deltaTime)

    // OpenClaw 人类行为模拟：在等待状态自动执行下一次蓄力与跳跃
    if (
      this.humanSimulationEnabled &&
      !this.isPaused &&
      this.isRunning &&
      this.gameState === 'waiting' &&
      !this.simulationDecisionTimer &&
      !this.simulationJumpTimer
    ) {
      this.scheduleSimulatedAction()
    }
  }

  // 开启/关闭 OpenClaw 人类行为模拟
  setHumanSimulationEnabled(enabled) {
    this.humanSimulationEnabled = !!enabled
    this.clearSimulationTimers()
    this.pendingSimulationPlan = null
    this.notifyChargingState(false)

    if (this.humanSimulationEnabled && this.isRunning && this.gameState === 'waiting') {
      this.scheduleSimulatedAction()
    }
  }

  // 更新模拟参数
  setHumanSimulationProfile(profile = {}) {
    this.simulationProfile = {
      ...this.simulationProfile,
      ...profile
    }
  }

  // 计划下一次模拟操作
  scheduleSimulatedAction(delayOverride = null) {
    if (!this.humanSimulationEnabled || !this.isRunning || this.gameState !== 'waiting') return

    const baseDelay = delayOverride === null
      ? this.getRandomInRange(this.simulationProfile.reactionTimeMin, this.simulationProfile.reactionTimeMax)
      : delayOverride

    let delay = baseDelay
    if (Math.random() < this.simulationProfile.hesitationChance) {
      delay += this.getRandomInRange(
        this.simulationProfile.hesitationExtraMin,
        this.simulationProfile.hesitationExtraMax
      )
    }

    this.simulationDecisionTimer = setTimeout(() => {
      this.simulationDecisionTimer = null
      this.performSimulatedAction()
    }, delay)
  }

  // 执行一次模拟蓄力与跳跃
  performSimulatedAction() {
    if (!this.humanSimulationEnabled || !this.isRunning || this.isPaused || this.gameState !== 'waiting') return

    this.pendingSimulationPlan = this.buildSimulationPlan()
    if (!this.pendingSimulationPlan) return

    this.startCharging()
    this.simulationJumpTimer = setTimeout(() => {
      this.simulationJumpTimer = null
      if (this.gameState === 'charging') {
        this.jump()
      }
    }, this.pendingSimulationPlan.holdTime)
  }

  // 构建人类化的跳跃决策
  buildSimulationPlan() {
    const currentBlock = this.blocks[this.currentBlockIndex]
    const nextBlock = this.blocks[this.currentBlockIndex + 1]
    if (!currentBlock || !nextBlock) return null

    const dx = nextBlock.position.x - currentBlock.position.x
    const dz = nextBlock.position.z - currentBlock.position.z
    const targetDistance = Math.sqrt(dx * dx + dz * dz)

    // 反推理论蓄力值：distance = 2 + power * 6
    const idealPower = clamp((targetDistance - 2) / 6, 0, 1)
    const baseError = this.getRandomInRange(-this.simulationProfile.powerError, this.simulationProfile.powerError)
    const fatigueError = (Math.random() - 0.5) * Math.min(this.score * 0.003, 0.08)
    let powerOffset = baseError + fatigueError

    // 偶尔出现明显失误，模拟真实玩家
    if (Math.random() < this.simulationProfile.mistakeChance) {
      powerOffset += Math.random() < 0.5 ? -0.12 : 0.12
    }

    const simulatedPower = clamp(idealPower + powerOffset, 0, 1)
    const holdTime = clamp(simulatedPower * this.maxChargingTime, 80, this.maxChargingTime)
    const directionErrorRad = this.getRandomInRange(
      -this.simulationProfile.directionErrorDeg,
      this.simulationProfile.directionErrorDeg
    ) * Math.PI / 180

    return {
      holdTime,
      directionErrorRad,
      powerOffset: 0
    }
  }

  // 计算跳跃方向（默认朝向下一个方块）
  calculateJumpDirection(simulationPlan = null) {
    const currentBlock = this.blocks[this.currentBlockIndex]
    const nextBlock = this.blocks[this.currentBlockIndex + 1]
    if (!currentBlock || !nextBlock) {
      return new THREE.Vector3(0, 0, 1)
    }

    const direction = new THREE.Vector3(
      nextBlock.position.x - currentBlock.position.x,
      0,
      nextBlock.position.z - currentBlock.position.z
    )

    if (direction.lengthSq() < 1e-6) {
      direction.set(0, 0, 1)
    } else {
      direction.normalize()
    }

    if (simulationPlan && simulationPlan.directionErrorRad) {
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), simulationPlan.directionErrorRad)
      direction.normalize()
    }

    return direction
  }

  // 随机工具
  getRandomInRange(min, max) {
    return Math.random() * (max - min) + min
  }

  // 通知页面层蓄力状态
  notifyChargingState(isCharging) {
    if (this.onChargingStateChange) {
      this.onChargingStateChange(isCharging)
    }
  }

  // 清理模拟计时器
  clearSimulationTimers() {
    if (this.simulationDecisionTimer) {
      clearTimeout(this.simulationDecisionTimer)
      this.simulationDecisionTimer = null
    }
    if (this.simulationJumpTimer) {
      clearTimeout(this.simulationJumpTimer)
      this.simulationJumpTimer = null
    }
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
    this.clearSimulationTimers()
    this.notifyChargingState(false)
  }
  
  // 恢复游戏
  resume() {
    this.isPaused = false
    if (this.humanSimulationEnabled && this.isRunning && this.gameState === 'waiting') {
      this.scheduleSimulatedAction()
    }
  }
  
  // 销毁游戏
  destroy() {
    this.isRunning = false
    this.isPaused = true
    this.clearSimulationTimers()
    
    // 清理资源
    this.blocks.forEach(block => block.destroy())
    this.player.destroy()
    
    if (this.renderer) {
      this.renderer.dispose()
    }
  }
}

export default GameEngine