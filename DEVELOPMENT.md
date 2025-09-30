# Development Guide

This document provides detailed development guide and technical specifications for the Jump Jump mini-game.

## 🏗️ Architecture Design

### Overall Architecture
```
┌─────────────────┐
│   WeChat Mini   │
│   Program       │
│   (WXML/WXSS)   │
├─────────────────┤
│   Game Page     │
│   (game.js)     │
├─────────────────┤
│   Game Engine   │
│  (gameEngine.js) │
├─────────────────┤
│   Game Objects  │
│ Player & Block   │
├─────────────────┤
│   Three.js      │
│   Render Engine │
├─────────────────┤
│   WebGL API     │
└─────────────────┘
```

### Module Division

1. **Presentation Layer** (`game.wxml`, `game.wxss`)
   - UI layout
   - User interaction handling
   - Status display

2. **Control Layer** (`game.js`)
   - Page lifecycle management
   - User input handling
   - Game state management

3. **Logic Layer** (`gameEngine.js`)
   - Core game logic
   - Physics simulation
   - Collision detection
   - Scene management

4. **Data Layer** (`player.js`, `block.js`)
   - Game object definitions
   - Property and behavior encapsulation
   - Animations and effects

5. **Utility Layer** (`utils.js`)
   - Common utility functions
   - Mathematical calculations
   - Storage management

## 🎮 Game Loop

### Main Loop Structure
```javascript
function gameLoop(timestamp) {
  // 1. Calculate time delta
  const deltaTime = (timestamp - lastTime) / 1000
  
  // 2. Update game logic
  updateGameLogic(deltaTime)
  
  // 3. Render scene
  renderScene()
  
  // 4. Request next frame
  requestAnimationFrame(gameLoop)
}
```

### Update Order
1. **Input Processing**: Detect user touch input
2. **Physics Update**: Update position, velocity, collision
3. **Animation Update**: Interpolation calculation, easing functions
4. **Camera Update**: Follow target, smooth movement
5. **UI Update**: Score, status display

## 🎯 Core System Details

### 1. Jump System

#### Power Charging Mechanism
```javascript
// Start charging
startCharging() {
  this.chargingStartTime = Date.now()
  this.gameState = 'charging'
}

// Calculate power value
updatePower() {
  const elapsed = Date.now() - this.chargingStartTime
  const power = Math.min(elapsed / this.maxChargingTime, 1)
  return power
}
```

#### Jump Calculation
```javascript
// Jump parameter calculation
calculateJump(power) {
  const distance = 2 + power * 6  // Distance: 2-8
  const height = 1 + power * 3    // Height: 1-4
  const duration = 800           // Duration
  return { distance, height, duration }
}
```

#### Trajectory Simulation
```javascript
// Parabolic motion
updateJumpTrajectory(progress) {
  // Horizontal movement (linear)
  const x = lerp(startX, endX, progress)
  const z = lerp(startZ, endZ, progress)
  
  // Vertical movement (parabolic)
  const jumpProgress = progress * 2
  let heightMultiplier
  if (jumpProgress <= 1) {
    heightMultiplier = easeOutQuart(jumpProgress)
  } else {
    heightMultiplier = 1 - easeInQuart(jumpProgress - 1)
  }
  
  const y = startY + jumpHeight * heightMultiplier
  return { x, y, z }
}
```

### 2. Collision Detection System

#### Circular Collision Detection
```javascript
checkCollision(player, block) {
  const distance = Math.sqrt(
    Math.pow(player.x - block.x, 2) +
    Math.pow(player.z - block.z, 2)
  )
  
  const radius = block.getRadius()
  return distance <= radius
}
```

#### Landing Judgment
```javascript
checkLanding() {
  let closestBlock = null
  let minDistance = Infinity
  
  this.blocks.forEach(block => {
    const distance = this.getDistance2D(this.player, block)
    if (distance < minDistance) {
      minDistance = distance
      closestBlock = block
    }
  })
  
  // Determine if landing is successful
  if (minDistance < 1.5) {
    return this.handleLanding(closestBlock, minDistance)
  } else {
    return this.handleGameOver()
  }
}
```

### 3. Block Generation System

#### Random Generation Algorithm
```javascript
generateNextBlock() {
  const lastBlock = this.blocks[this.blocks.length - 1]
  
  // Generate position parameters
  const distance = 3 + Math.random() * 4      // Distance 3-7
  const angle = (Math.random() - 0.5) * Math.PI * 0.6  // Angle range
  
  // Calculate coordinates
  const x = lastBlock.x + Math.sin(angle) * distance
  const z = lastBlock.z + Math.cos(angle) * distance
  
  // Random type
  const type = this.getRandomBlockType()
  
  return new Block(this.scene, x, 0, z, type)
}
```

#### Difficulty Progression
```javascript
getDifficultyMultiplier() {
  const score = this.score
  
  // Increase difficulty every 10 points
  const difficultyLevel = Math.floor(score / 10)
  
  // Increase block spacing
  const distanceMultiplier = 1 + difficultyLevel * 0.1
  
  // Increase small block probability
  const smallBlockChance = Math.min(0.3 + difficultyLevel * 0.05, 0.6)
  
  return { distanceMultiplier, smallBlockChance }
}
```

### 4. Animation System

#### Easing Function Application
```javascript
// Quartic ease-out - for jump ascent
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

// Quartic ease-in - for jump descent
function easeInQuart(t) {
  return t * t * t * t
}

// Linear interpolation - for position transitions
function lerp(start, end, factor) {
  return start + (end - start) * factor
}
```

#### Camera Following
```javascript
updateCamera(deltaTime) {
  const target = this.player.position
  const offset = new THREE.Vector3(0, 8, 8)
  
  // Smooth following
  this.camera.position.x = lerp(
    this.camera.position.x, 
    target.x + offset.x, 
    deltaTime * 2
  )
  
  this.camera.position.z = lerp(
    this.camera.position.z, 
    target.z + offset.z, 
    deltaTime * 2
  )
  
  // Always look at player
  this.camera.lookAt(target)
}
```

## 🎨 Visual Effects Implementation

### 1. Materials and Lighting

#### Material Configuration
```javascript
// Lambert material - suitable for game style
const material = new THREE.MeshLambertMaterial({
  color: 0x4a90e2,
  transparent: false,
  opacity: 1.0
})

// Special effect material
const glowMaterial = new THREE.MeshLambertMaterial({
  color: 0x87ceeb,
  transparent: true,
  opacity: 0.3
})
```

#### Lighting Setup
```javascript
// Ambient light - overall illumination
const ambientLight = new THREE.AmbientLight(0x404040, 0.4)

// Directional light - main light source
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 20, 10)
directionalLight.castShadow = true

// Shadow configuration
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 100
```

### 2. Particle Effects

#### Perfect Landing Effect
```javascript
createPerfectLandingEffect() {
  const particleCount = 20
  const particles = []
  
  for (let i = 0; i < particleCount; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.05),
      new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
      })
    )
    
    // Set initial position
    const angle = (i / particleCount) * Math.PI * 2
    particle.position.set(
      this.position.x + Math.cos(angle) * 0.5,
      this.position.y + 0.5,
      this.position.z + Math.sin(angle) * 0.5
    )
    
    particles.push(particle)
    this.scene.add(particle)
  }
  
  // Animate particles
  this.animateParticles(particles)
}
```

### 3. Animation Transitions

#### Block Entrance Animation
```javascript
playEntranceAnimation() {
  // Initial state
  this.group.position.y = this.targetY - 2
  this.group.scale.set(0.1, 0.1, 0.1)
  
  const duration = 500
  const startTime = Date.now()
  
  const animate = () => {
    const progress = Math.min((Date.now() - startTime) / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    // Position animation
    this.group.position.y = (this.targetY - 2) + easeProgress * 2
    
    // Scale animation
    this.group.scale.setScalar(0.1 + easeProgress * 0.9)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  animate()
}
```

## 🔧 Performance Optimization Strategies

### 1. Object Pool Management

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    
    // Pre-create objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  get() {
    if (this.pool.length > 0) {
      return this.pool.pop()
    } else {
      return this.createFn()
    }
  }
  
  release(obj) {
    this.resetFn(obj)
    this.pool.push(obj)
  }
}

// Usage example
const blockPool = new ObjectPool(
  () => new Block(),
  (block) => block.reset(),
  5
)
```

### 2. Render Optimization

```javascript
// Frustum culling
function frustumCull(camera, objects) {
  const frustum = new THREE.Frustum()
  const matrix = new THREE.Matrix4()
  
  matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(matrix)
  
  return objects.filter(obj => frustum.intersectsObject(obj))
}

// LOD system
function updateLOD(camera, objects) {
  objects.forEach(obj => {
    const distance = camera.position.distanceTo(obj.position)
    
    if (distance > 50) {
      obj.visible = false
    } else if (distance > 20) {
      obj.material = lowDetailMaterial
    } else {
      obj.material = highDetailMaterial
    }
  })
}
```

### 3. Memory Management

```javascript
// Resource cleanup
function cleanup() {
  // Clean up geometry
  geometry.dispose()
  
  // Clean up material
  material.dispose()
  
  // Clean up texture
  if (material.map) {
    material.map.dispose()
  }
  
  // Remove from scene
  scene.remove(mesh)
}

// Periodic garbage collection
setInterval(() => {
  // Clean up distant blocks
  this.cleanupDistantBlocks()
  
  // Force garbage collection (development only)
  if (typeof wx !== 'undefined' && wx.triggerGC) {
    wx.triggerGC()
  }
}, 5000)
```

## 🐛 Debugging Techniques

### 1. Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = 0
  }
  
  update() {
    this.frameCount++
    const currentTime = performance.now()
    
    if (this.frameCount % 60 === 0) {
      const deltaTime = currentTime - this.lastTime
      this.fps = Math.round(60000 / deltaTime)
      this.lastTime = currentTime
      
      console.log(`FPS: ${this.fps}`)
    }
  }
}
```

### 2. Visual Debugging

```javascript
// Show collision bounds
function showCollisionBounds(objects) {
  objects.forEach(obj => {
    const helper = new THREE.BoxHelper(obj, 0xff0000)
    scene.add(helper)
  })
}

// Show jump trajectory
function showJumpTrajectory(start, end, height) {
  const points = []
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const pos = calculateJumpPosition(start, end, height, t)
    points.push(new THREE.Vector3(pos.x, pos.y, pos.z))
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: 0x00ff00 })
  const line = new THREE.Line(geometry, material)
  scene.add(line)
}
```

### 3. Logging System

```javascript
class Logger {
  static levels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  }
  
  static currentLevel = Logger.levels.INFO
  
  static log(level, message, ...args) {
    if (level >= Logger.currentLevel) {
      const levelName = Object.keys(Logger.levels)[level]
      console.log(`[${levelName}] ${message}`, ...args)
    }
  }
  
  static debug(message, ...args) {
    Logger.log(Logger.levels.DEBUG, message, ...args)
  }
  
  static info(message, ...args) {
    Logger.log(Logger.levels.INFO, message, ...args)
  }
  
  static warn(message, ...args) {
    Logger.log(Logger.levels.WARN, message, ...args)
  }
  
  static error(message, ...args) {
    Logger.log(Logger.levels.ERROR, message, ...args)
  }
}
```

## 📱 Mini Program Specific Handling

### 1. Canvas Adaptation

```javascript
// Get device pixel ratio
const dpr = wx.getSystemInfoSync().pixelRatio

// Set Canvas size
canvas.width = canvasWidth * dpr
canvas.height = canvasHeight * dpr

// Set WebGL viewport
gl.viewport(0, 0, canvas.width, canvas.height)
```

### 2. Memory Limit Handling

```javascript
// Listen for memory warnings
wx.onMemoryWarning(() => {
  console.warn('Insufficient memory, starting resource cleanup')
  
  // Clean up unnecessary resources
  this.cleanupResources()
  
  // Reduce quality
  this.reduceQuality()
  
  // Force garbage collection
  wx.triggerGC()
})
```

### 3. Lifecycle Management

```javascript
// Resume game when page is shown
onShow() {
  if (this.gameEngine) {
    this.gameEngine.resume()
  }
}

// Pause game when page is hidden
onHide() {
  if (this.gameEngine) {
    this.gameEngine.pause()
  }
}

// Clean up resources when page is unloaded
onUnload() {
  if (this.gameEngine) {
    this.gameEngine.destroy()
  }
}
```

## 🔄 Version Iteration Plan

### v1.1.0 Planned Features
- [ ] Complete sound system
- [ ] More block types
- [ ] Item system
- [ ] Achievement system

### v1.2.0 Planned Features
- [ ] Multiplayer battle mode
- [ ] Leaderboard system
- [ ] Skin system
- [ ] Level mode

### v2.0.0 Planned Features
- [ ] Physics engine upgrade
- [ ] More complex scenes
- [ ] Weather system
- [ ] Dynamic lighting

---

This development guide covers the core technical implementation of the Jump Jump game and can help developers understand and extend game functionality.