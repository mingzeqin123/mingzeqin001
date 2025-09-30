// pages/game/gameEngine.js
import * as THREE from './libs/three.min.js'
import Player from './player.js'
import Block from './block.js'
import { lerp, easeOutQuart } from './utils.js'

class GameEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    
    // Game state
    this.isRunning = false
    this.isPaused = false
    this.score = 0
    this.gameState = 'waiting' // waiting, charging, jumping, falling
    
    // Charging related
    this.chargingStartTime = 0
    this.maxChargingTime = 2000 // Maximum charging time 2 seconds
    this.currentPower = 0
    
    // Callback functions
    this.onScoreChange = null
    this.onGameOver = null
    this.onPowerChange = null
    
    // Initialize Three.js scene
    this.initScene()
    this.initLighting()
    this.initCamera()
    
    // Initialize game objects
    this.initGameObjects()
    
    // Bind render loop
    this.render = this.render.bind(this)
  }
  
  // Initialize scene
  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87CEEB) // Sky blue background
    
    // Add fog effect
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200)
    
    // WebGL renderer
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
  
  // Initialize lighting
  initLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)
    
    // Directional light (sunlight)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(10, 20, 10)
    this.directionalLight.castShadow = true
    
    // Set shadow parameters
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
  
  // Initialize camera
  initCamera() {
    const aspect = this.canvas.width / this.canvas.height
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    
    // Set camera initial position
    this.camera.position.set(0, 8, 8)
    this.camera.lookAt(0, 0, 0)
    
    // Camera follow parameters
    this.cameraTarget = new THREE.Vector3(0, 0, 0)
    this.cameraOffset = new THREE.Vector3(0, 8, 8)
  }
  
  // 初始化游戏对象
  initGameObjects() {
    // Create player
    this.player = new Player(this.scene)
    
    // Create blocks array
    this.blocks = []
    this.currentBlockIndex = 0
    
    // Create initial blocks
    this.createInitialBlocks()
  }
  
  // Create initial blocks
  createInitialBlocks() {
    // Starting block
    const startBlock = new Block(this.scene, 0, 0, 0, 'start')
    this.blocks.push(startBlock)
    
    // Generate first few blocks
    for (let i = 1; i < 5; i++) {
      this.generateNextBlock()
    }
    
    // Player stands on first block
    this.player.setPosition(0, 1, 0)
  }
  
  // Generate next block
  generateNextBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1]
    
    // Randomly generate next block position
    const distance = 3 + Math.random() * 4 // Distance between 3-7
    const angle = (Math.random() - 0.5) * Math.PI * 0.6 // Angle range
    
    const x = lastBlock.position.x + Math.sin(angle) * distance
    const z = lastBlock.position.z + Math.cos(angle) * distance
    
    // Random block type
    const types = ['normal', 'small', 'tall', 'special']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const newBlock = new Block(this.scene, x, 0, z, type)
    this.blocks.push(newBlock)
  }
  
  // Start game
  startGame() {
    this.isRunning = true
    this.gameState = 'waiting'
    this.score = 0
    this.currentBlockIndex = 0
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score)
    }
  }
  
  // Restart game
  restart() {
    // Clear existing blocks
    this.blocks.forEach(block => block.destroy())
    this.blocks = []
    this.currentBlockIndex = 0
    this.score = 0
    
    // Reset player
    this.player.reset()
    
    // Recreate blocks
    this.createInitialBlocks()
    
    // Reset camera
    this.cameraTarget.set(0, 0, 0)
    
    // Start game
    this.startGame()
  }
  
  // Start charging
  startCharging() {
    if (this.gameState !== 'waiting') return
    
    this.gameState = 'charging'
    this.chargingStartTime = Date.now()
    this.currentPower = 0
    
    // Start charging动画
    this.player.startCharging()
  }
  
  // Jump
  jump() {
    if (this.gameState !== 'charging') return
    
    const chargingTime = Date.now() - this.chargingStartTime
    const power = Math.min(chargingTime / this.maxChargingTime, 1)
    
    this.gameState = 'jumping'
    this.currentPower = 0
    
    if (this.onPowerChange) {
      this.onPowerChange(0)
    }
    
    // Calculate jump parameters
    const jumpDistance = 2 + power * 6 // Jump distance 2-8
    const jumpHeight = 1 + power * 3   // Jump高度1-4
    
    // Execute jump
    this.player.jump(jumpDistance, jumpHeight, () => {
      this.checkLanding()
    })
  }
  
  // Check landing
  checkLanding() {
    const playerPos = this.player.position
    let landedBlock = null
    let minDistance = Infinity
    
    // Check distance to all blocks
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
    
    // Determine if landing is successful
    if (landedBlock && minDistance < 1.5) {
      this.handleSuccessfulLanding(landedBlock.index, minDistance)
    } else {
      this.handleGameOver()
    }
  }
  
  // Handle successful landing
  handleSuccessfulLanding(blockIndex, distance) {
    this.gameState = 'waiting'
    
    // Calculate score
    let points = 1
    if (distance < 0.3) {
      points = 5 // Perfect landing
      this.player.showPerfectEffect()
    } else if (distance < 0.8) {
      points = 3 // Good landing
    }
    
    this.score += points
    this.currentBlockIndex = blockIndex
    
    if (this.onScoreChange) {
      this.onScoreChange(this.score)
    }
    
    // Update camera target
    const targetBlock = this.blocks[blockIndex]
    this.cameraTarget.copy(targetBlock.position)
    
    // Generate new block
    if (this.blocks.length - blockIndex < 3) {
      this.generateNextBlock()
    }
    
    // Clean up distant blocks
    this.cleanupDistantBlocks()
  }
  
  // Handle game over
  handleGameOver() {
    this.gameState = 'falling'
    this.isRunning = false
    
    // Play fall animation
    this.player.fall(() => {
      if (this.onGameOver) {
        this.onGameOver()
      }
    })
  }
  
  // Clean up distant blocks
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
  
  // Update game logic
  update(deltaTime) {
    if (!this.isRunning && this.gameState !== 'falling') return
    
    // Update charging
    if (this.gameState === 'charging') {
      const chargingTime = Date.now() - this.chargingStartTime
      this.currentPower = Math.min((chargingTime / this.maxChargingTime) * 100, 100)
      
      if (this.onPowerChange) {
        this.onPowerChange(this.currentPower)
      }
    }
    
    // Update player
    this.player.update(deltaTime)
    
    // Update blocks
    this.blocks.forEach(block => {
      block.update(deltaTime)
    })
    
    // Update camera
    this.updateCamera(deltaTime)
  }
  
  // Update camera
  updateCamera(deltaTime) {
    // Smooth follow target
    this.camera.position.x = lerp(this.camera.position.x, this.cameraTarget.x + this.cameraOffset.x, deltaTime * 2)
    this.camera.position.z = lerp(this.camera.position.z, this.cameraTarget.z + this.cameraOffset.z, deltaTime * 2)
    
    // Camera always looks at player
    this.camera.lookAt(this.player.position.x, this.player.position.y, this.player.position.z)
  }
  
  // Render loop
  render(timestamp) {
    if (this.isPaused) {
      requestAnimationFrame(this.render)
      return
    }
    
    const deltaTime = (timestamp - (this.lastTime || timestamp)) / 1000
    this.lastTime = timestamp
    
    // Update game logic
    this.update(deltaTime)
    
    // Render scene
    this.renderer.render(this.scene, this.camera)
    
    // Continue render loop
    requestAnimationFrame(this.render)
  }
  
  // Start rendering
  start() {
    requestAnimationFrame(this.render)
  }
  
  // Pause game
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