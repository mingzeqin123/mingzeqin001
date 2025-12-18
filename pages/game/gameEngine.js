/**
 * @file 游戏引擎核心（3D 跳一跳）
 *
 * 说明：
 * - 负责 Three.js 场景/相机/渲染器初始化与渲染循环
 * - 管理游戏状态机（waiting/charging/jumping/falling）
 * - 负责方块生成、落点判定、计分与相机跟随
 */
import * as THREE from './libs/three.min.js'
import Player from './player.js'
import Block from './block.js'
import { lerp, easeOutQuart } from './utils.js'

/**
 * 分数变化回调
 * @callback ScoreChangeCallback
 * @param {number} score - 当前累计分数
 */

/**
 * 游戏结束回调
 * @callback GameOverCallback
 */

/**
 * 蓄力值变化回调
 * @callback PowerChangeCallback
 * @param {number} power - 蓄力百分比（0-100）
 */

/**
 * 游戏状态
 * @typedef {'waiting'|'charging'|'jumping'|'falling'} GameState
 */

/**
 * 游戏引擎（小游戏逻辑层 + 渲染层的封装）。
 */
class GameEngine {
  /**
   * @param {Object} canvas - 小程序 Canvas 节点（来自 selectorQuery fields({ node: true })）
   * @param {WebGLRenderingContext} ctx - WebGL 上下文（canvas.getContext('webgl')）
   */
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    
    // 游戏状态
    this.isRunning = false
    this.isPaused = false
    this.score = 0
    /** @type {GameState} */
    this.gameState = 'waiting' // waiting, charging, jumping, falling
    
    // 蓄力相关
    this.chargingStartTime = 0
    this.maxChargingTime = 2000 // 最大蓄力时间2秒
    this.currentPower = 0
    
    // 回调函数
    /** @type {ScoreChangeCallback | null} */
    this.onScoreChange = null
    /** @type {GameOverCallback | null} */
    this.onGameOver = null
    /** @type {PowerChangeCallback | null} */
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
  
  /**
   * 初始化 Three.js 场景与渲染器。
   * @returns {void}
   */
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
  
  /**
   * 初始化环境光/方向光与阴影参数。
   * @returns {void}
   */
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
  
  /**
   * 初始化透视相机与相机跟随参数。
   * @returns {void}
   */
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
  
  /**
   * 初始化玩家与方块列表等游戏对象。
   * @returns {void}
   */
  initGameObjects() {
    // 创建玩家
    this.player = new Player(this.scene)
    
    // 创建方块数组
    this.blocks = []
    this.currentBlockIndex = 0
    
    // 创建初始方块
    this.createInitialBlocks()
  }
  
  /**
   * 创建起始方块与前若干个方块，并将玩家放到起点。
   * @returns {void}
   */
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
  
  /**
   * 基于上一个方块随机生成下一个方块并加入列表。
   * @returns {void}
   */
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
  
  /**
   * 开始一局游戏：重置分数与状态，并触发分数回调。
   * @returns {void}
   */
  startGame() {
    this.isRunning = true
    this.gameState = 'waiting'
    this.score = 0
    this.currentBlockIndex = 0
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score)
    }
  }
  
  /**
   * 重新开始：清理场景中旧方块、重置玩家与相机，再开始游戏。
   * @returns {void}
   */
  restart() {
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
  
  /**
   * 进入蓄力状态并触发玩家蓄力动画。
   * @returns {void}
   */
  startCharging() {
    if (this.gameState !== 'waiting') return
    
    this.gameState = 'charging'
    this.chargingStartTime = Date.now()
    this.currentPower = 0
    
    // 开始蓄力动画
    this.player.startCharging()
  }
  
  /**
   * 根据蓄力时长计算跳跃参数并执行跳跃。
   * 跳跃完成后会进行落点判定并计分/结束游戏。
   * @returns {void}
   */
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
  
  /**
   * 判定玩家落在哪个方块附近，并根据距离判定成功或失败。
   * @returns {void}
   */
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
    
    // 判断是否成功落地
    if (landedBlock && minDistance < 1.5) {
      this.handleSuccessfulLanding(landedBlock.index, minDistance)
    } else {
      this.handleGameOver()
    }
  }
  
  /**
   * 成功落地处理：计算得分、更新相机目标、生成新方块并清理远处方块。
   * @param {number} blockIndex - 落地方块索引
   * @param {number} distance - 玩家中心到方块中心的二维距离
   * @returns {void}
   */
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
  
  /**
   * 失败处理：进入 falling 状态并播放玩家坠落动画，结束后触发回调。
   * @returns {void}
   */
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
  
  /**
   * 清理距离玩家过远且已不可能回到的历史方块，释放资源。
   * @returns {void}
   */
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
  
  /**
   * 每帧更新：蓄力进度、玩家/方块动画、相机跟随。
   * @param {number} deltaTime - 帧间隔（秒）
   * @returns {void}
   */
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
  }
  
  /**
   * 平滑更新相机位置，并保持看向玩家。
   * @param {number} deltaTime - 帧间隔（秒）
   * @returns {void}
   */
  updateCamera(deltaTime) {
    // 平滑跟随目标
    this.camera.position.x = lerp(this.camera.position.x, this.cameraTarget.x + this.cameraOffset.x, deltaTime * 2)
    this.camera.position.z = lerp(this.camera.position.z, this.cameraTarget.z + this.cameraOffset.z, deltaTime * 2)
    
    // 相机始终看向玩家
    this.camera.lookAt(this.player.position.x, this.player.position.y, this.player.position.z)
  }
  
  /**
   * 渲染循环回调（requestAnimationFrame）。
   * @param {number} timestamp - 高精度时间戳（毫秒）
   * @returns {void}
   */
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
  
  /**
   * 启动渲染循环（不会自动开始一局，需要调用 startGame）。
   * @returns {void}
   */
  start() {
    requestAnimationFrame(this.render)
  }
  
  /**
   * 暂停渲染更新（仍然保持 rAF 循环，但早返回）。
   * @returns {void}
   */
  pause() {
    this.isPaused = true
  }
  
  /**
   * 恢复渲染更新。
   * @returns {void}
   */
  resume() {
    this.isPaused = false
  }
  
  /**
   * 销毁并释放场景资源（方块/玩家/渲染器）。
   * @returns {void}
   */
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