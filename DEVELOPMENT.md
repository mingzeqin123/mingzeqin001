# 开发指南

本文档提供跳一跳小游戏的详细开发指南和技术说明。

## 🏗️ 架构设计

### 整体架构
```
┌─────────────────┐
│   微信小程序     │
│   (WXML/WXSS)   │
├─────────────────┤
│   游戏页面       │
│   (game.js)     │
├─────────────────┤
│   游戏引擎       │
│  (gameEngine.js) │
├─────────────────┤
│   游戏对象       │
│ Player & Block   │
├─────────────────┤
│   Three.js      │
│   渲染引擎       │
├─────────────────┤
│   WebGL API     │
└─────────────────┘
```

### 模块划分

1. **表现层** (`game.wxml`, `game.wxss`)
   - UI界面布局
   - 用户交互处理
   - 状态显示

2. **控制层** (`game.js`)
   - 页面生命周期管理
   - 用户输入处理
   - 游戏状态管理

3. **逻辑层** (`gameEngine.js`)
   - 游戏核心逻辑
   - 物理模拟
   - 碰撞检测
   - 场景管理

4. **数据层** (`player.js`, `block.js`)
   - 游戏对象定义
   - 属性和行为封装
   - 动画和效果

5. **工具层** (`utils.js`)
   - 通用工具函数
   - 数学计算
   - 存储管理

## 🎮 游戏循环

### 主循环结构
```javascript
function gameLoop(timestamp) {
  // 1. 计算时间差
  const deltaTime = (timestamp - lastTime) / 1000
  
  // 2. 更新游戏逻辑
  updateGameLogic(deltaTime)
  
  // 3. 渲染场景
  renderScene()
  
  // 4. 请求下一帧
  requestAnimationFrame(gameLoop)
}
```

### 更新顺序
1. **输入处理**：检测用户触摸输入
2. **物理更新**：更新位置、速度、碰撞
3. **动画更新**：插值计算、缓动函数
4. **相机更新**：跟随目标、平滑移动
5. **UI更新**：分数、状态显示

## 🎯 核心系统详解

### 1. 跳跃系统

#### 蓄力机制
```javascript
// 蓄力开始
startCharging() {
  this.chargingStartTime = Date.now()
  this.gameState = 'charging'
}

// 计算蓄力值
updatePower() {
  const elapsed = Date.now() - this.chargingStartTime
  const power = Math.min(elapsed / this.maxChargingTime, 1)
  return power
}
```

#### 跳跃计算
```javascript
// 跳跃参数计算
calculateJump(power) {
  const distance = 2 + power * 6  // 距离：2-8
  const height = 1 + power * 3    // 高度：1-4
  const duration = 800           // 持续时间
  return { distance, height, duration }
}
```

#### 轨迹模拟
```javascript
// 抛物线运动
updateJumpTrajectory(progress) {
  // 水平移动（线性）
  const x = lerp(startX, endX, progress)
  const z = lerp(startZ, endZ, progress)
  
  // 垂直移动（抛物线）
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

### 2. 碰撞检测系统

#### 圆形碰撞检测
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

#### 落地判断
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
  
  // 判断是否成功落地
  if (minDistance < 1.5) {
    return this.handleLanding(closestBlock, minDistance)
  } else {
    return this.handleGameOver()
  }
}
```

### 3. 方块生成系统

#### 随机生成算法
```javascript
generateNextBlock() {
  const lastBlock = this.blocks[this.blocks.length - 1]
  
  // 生成位置参数
  const distance = 3 + Math.random() * 4      // 距离3-7
  const angle = (Math.random() - 0.5) * Math.PI * 0.6  // 角度范围
  
  // 计算坐标
  const x = lastBlock.x + Math.sin(angle) * distance
  const z = lastBlock.z + Math.cos(angle) * distance
  
  // 随机类型
  const type = this.getRandomBlockType()
  
  return new Block(this.scene, x, 0, z, type)
}
```

#### 难度递增
```javascript
getDifficultyMultiplier() {
  const score = this.score
  
  // 每10分增加一点难度
  const difficultyLevel = Math.floor(score / 10)
  
  // 增加方块间距
  const distanceMultiplier = 1 + difficultyLevel * 0.1
  
  // 增加小方块概率
  const smallBlockChance = Math.min(0.3 + difficultyLevel * 0.05, 0.6)
  
  return { distanceMultiplier, smallBlockChance }
}
```

### 4. 动画系统

#### 缓动函数应用
```javascript
// 四次方缓出 - 用于跳跃上升
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4)
}

// 四次方缓入 - 用于跳跃下降
function easeInQuart(t) {
  return t * t * t * t
}

// 线性插值 - 用于位置过渡
function lerp(start, end, factor) {
  return start + (end - start) * factor
}
```

#### 相机跟随
```javascript
updateCamera(deltaTime) {
  const target = this.player.position
  const offset = new THREE.Vector3(0, 8, 8)
  
  // 平滑跟随
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
  
  // 始终看向玩家
  this.camera.lookAt(target)
}
```

## 🎨 视觉效果实现

### 1. 材质和光照

#### 材质配置
```javascript
// Lambert材质 - 适合游戏风格
const material = new THREE.MeshLambertMaterial({
  color: 0x4a90e2,
  transparent: false,
  opacity: 1.0
})

// 特殊效果材质
const glowMaterial = new THREE.MeshLambertMaterial({
  color: 0x87ceeb,
  transparent: true,
  opacity: 0.3
})
```

#### 光照设置
```javascript
// 环境光 - 整体照明
const ambientLight = new THREE.AmbientLight(0x404040, 0.4)

// 方向光 - 主要光源
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 20, 10)
directionalLight.castShadow = true

// 阴影配置
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.near = 0.1
directionalLight.shadow.camera.far = 100
```

### 2. 粒子效果

#### 完美落地效果
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
    
    // 设置初始位置
    const angle = (i / particleCount) * Math.PI * 2
    particle.position.set(
      this.position.x + Math.cos(angle) * 0.5,
      this.position.y + 0.5,
      this.position.z + Math.sin(angle) * 0.5
    )
    
    particles.push(particle)
    this.scene.add(particle)
  }
  
  // 动画粒子
  this.animateParticles(particles)
}
```

### 3. 动画过渡

#### 方块入场动画
```javascript
playEntranceAnimation() {
  // 初始状态
  this.group.position.y = this.targetY - 2
  this.group.scale.set(0.1, 0.1, 0.1)
  
  const duration = 500
  const startTime = Date.now()
  
  const animate = () => {
    const progress = Math.min((Date.now() - startTime) / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    // 位置动画
    this.group.position.y = (this.targetY - 2) + easeProgress * 2
    
    // 缩放动画
    this.group.scale.setScalar(0.1 + easeProgress * 0.9)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  animate()
}
```

## 🔧 性能优化策略

### 1. 对象池管理

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    
    // 预创建对象
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

// 使用示例
const blockPool = new ObjectPool(
  () => new Block(),
  (block) => block.reset(),
  5
)
```

### 2. 渲染优化

```javascript
// 视锥剔除
function frustumCull(camera, objects) {
  const frustum = new THREE.Frustum()
  const matrix = new THREE.Matrix4()
  
  matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  frustum.setFromProjectionMatrix(matrix)
  
  return objects.filter(obj => frustum.intersectsObject(obj))
}

// LOD系统
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

### 3. 内存管理

```javascript
// 资源清理
function cleanup() {
  // 清理几何体
  geometry.dispose()
  
  // 清理材质
  material.dispose()
  
  // 清理纹理
  if (material.map) {
    material.map.dispose()
  }
  
  // 从场景移除
  scene.remove(mesh)
}

// 定期垃圾回收
setInterval(() => {
  // 清理远离的方块
  this.cleanupDistantBlocks()
  
  // 强制垃圾回收（仅开发时使用）
  if (typeof wx !== 'undefined' && wx.triggerGC) {
    wx.triggerGC()
  }
}, 5000)
```

## 🐛 调试技巧

### 1. 性能监控

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

### 2. 可视化调试

```javascript
// 显示碰撞边界
function showCollisionBounds(objects) {
  objects.forEach(obj => {
    const helper = new THREE.BoxHelper(obj, 0xff0000)
    scene.add(helper)
  })
}

// 显示跳跃轨迹
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

### 3. 日志系统

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

## 📱 小程序特殊处理

### 1. Canvas适配

```javascript
// 获取设备像素比
const dpr = wx.getSystemInfoSync().pixelRatio

// 设置Canvas尺寸
canvas.width = canvasWidth * dpr
canvas.height = canvasHeight * dpr

// 设置WebGL视口
gl.viewport(0, 0, canvas.width, canvas.height)
```

### 2. 内存限制处理

```javascript
// 监听内存警告
wx.onMemoryWarning(() => {
  console.warn('内存不足，开始清理资源')
  
  // 清理不必要的资源
  this.cleanupResources()
  
  // 降低画质
  this.reduceQuality()
  
  // 强制垃圾回收
  wx.triggerGC()
})
```

### 3. 生命周期管理

```javascript
// 页面显示时恢复游戏
onShow() {
  if (this.gameEngine) {
    this.gameEngine.resume()
  }
}

// 页面隐藏时暂停游戏
onHide() {
  if (this.gameEngine) {
    this.gameEngine.pause()
  }
}

// 页面卸载时清理资源
onUnload() {
  if (this.gameEngine) {
    this.gameEngine.destroy()
  }
}
```

## 🔄 版本迭代计划

### v1.1.0 计划功能
- [ ] 音效系统完善
- [ ] 更多方块类型
- [ ] 道具系统
- [ ] 成就系统

### v1.2.0 计划功能
- [ ] 多人对战模式
- [ ] 排行榜系统
- [ ] 皮肤系统
- [ ] 关卡模式

### v2.0.0 计划功能
- [ ] 物理引擎升级
- [ ] 更复杂的场景
- [ ] 天气系统
- [ ] 动态光照

---

这份开发指南涵盖了跳一跳游戏的核心技术实现，可以帮助开发者理解和扩展游戏功能。