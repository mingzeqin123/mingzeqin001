/**
 * @file 方块实体（不同类型外观/动画/碰撞参数）
 */
import * as THREE from './libs/three.min.js'

/**
 * 方块类型
 * @typedef {'start'|'normal'|'small'|'tall'|'special'} BlockType
 */

/**
 * 游戏方块类。
 * 负责：创建不同类型方块模型、入场动画、装饰动画、碰撞半径/高度提供。
 */
class Block {
  /**
   * @param {THREE.Scene} scene - Three.js 场景
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {BlockType} [type='normal']
   */
  constructor(scene, x, y, z, type = 'normal') {
    this.scene = scene
    this.position = new THREE.Vector3(x, y, z)
    /** @type {BlockType} */
    this.type = type
    
    // 创建方块模型
    this.createModel()
  }
  
  /**
   * 创建方块模型并加入场景，随后播放入场动画。
   * @returns {void}
   */
  createModel() {
    this.group = new THREE.Group()
    
    // 根据类型创建不同的方块
    switch (this.type) {
      case 'start':
        this.createStartBlock()
        break
      case 'small':
        this.createSmallBlock()
        break
      case 'tall':
        this.createTallBlock()
        break
      case 'special':
        this.createSpecialBlock()
        break
      default:
        this.createNormalBlock()
    }
    
    // 设置位置
    this.group.position.copy(this.position)
    this.scene.add(this.group)
    
    // 添加入场动画
    this.playEntranceAnimation()
  }
  
  /**
   * 创建普通方块（带顶部装饰）。
   * @returns {void}
   */
  createNormalBlock() {
    const geometry = new THREE.CylinderGeometry(1, 1, 0.5, 8)
    const material = new THREE.MeshLambertMaterial({ 
      color: this.getRandomColor()
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.25
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // 添加顶部装饰
    this.addTopDecoration()
  }
  
  /**
   * 创建起始方块（带发光效果）。
   * @returns {void}
   */
  createStartBlock() {
    const geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 8)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4a90e2
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.3
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // 添加发光效果
    this.addGlowEffect()
  }
  
  /**
   * 创建小方块（更小的半径）。
   * @returns {void}
   */
  createSmallBlock() {
    const geometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 6)
    const material = new THREE.MeshLambertMaterial({ 
      color: this.getRandomColor()
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.2
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
  }
  
  /**
   * 创建高方块（更高的平台）。
   * @returns {void}
   */
  createTallBlock() {
    const geometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 6)
    const material = new THREE.MeshLambertMaterial({ 
      color: this.getRandomColor()
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.75
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // 添加顶部平台
    const topGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 6)
    const topMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff
    })
    
    const topMesh = new THREE.Mesh(topGeometry, topMaterial)
    topMesh.position.y = 1.55
    topMesh.castShadow = true
    topMesh.receiveShadow = true
    
    this.group.add(topMesh)
  }
  
  /**
   * 创建特殊方块（带旋转装饰，可能带额外加分）。
   * @returns {void}
   */
  createSpecialBlock() {
    // 主体
    const geometry = new THREE.CylinderGeometry(1, 1, 0.5, 8)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffd700
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.y = 0.25
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    
    this.group.add(this.mesh)
    
    // 添加旋转的装饰
    this.addRotatingDecoration()
    
    // 特殊方块有额外分数
    this.bonusPoints = 5
  }
  
  /**
   * 添加顶部装饰小球。
   * @returns {void}
   */
  addTopDecoration() {
    const decorations = []
    const decorationCount = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < decorationCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8)
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xffffff
      })
      
      const decoration = new THREE.Mesh(geometry, material)
      const angle = (i / decorationCount) * Math.PI * 2
      decoration.position.set(
        Math.cos(angle) * 0.7,
        0.55,
        Math.sin(angle) * 0.7
      )
      
      this.group.add(decoration)
      decorations.push(decoration)
    }
    
    this.decorations = decorations
  }
  
  /**
   * 添加发光环效果（起始方块使用）。
   * @returns {void}
   */
  addGlowEffect() {
    const glowGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.1, 16)
    const glowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.3
    })
    
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    this.glowMesh.position.y = 0.05
    
    this.group.add(this.glowMesh)
  }
  
  /**
   * 添加旋转装饰（特殊方块使用）。
   * @returns {void}
   */
  addRotatingDecoration() {
    const geometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xff6b6b
    })
    
    this.rotatingDecoration = new THREE.Mesh(geometry, material)
    this.rotatingDecoration.position.y = 0.8
    this.rotatingDecoration.rotation.x = Math.PI / 2
    
    this.group.add(this.rotatingDecoration)
  }
  
  /**
   * 随机选择方块颜色。
   * @returns {number} 颜色（0xRRGGBB）
   */
  getRandomColor() {
    const colors = [
      0xff6b6b, // 红色
      0x4ecdc4, // 青色
      0x45b7d1, // 蓝色
      0x96ceb4, // 绿色
      0xffeaa7, // 黄色
      0xdda0dd, // 紫色
      0xffa07a, // 橙色
      0x98d8c8  // 薄荷绿
    ]
    
    return colors[Math.floor(Math.random() * colors.length)]
  }
  
  /**
   * 方块入场动画：从下方升起并缩放到正常大小。
   * @returns {void}
   */
  playEntranceAnimation() {
    // 从下方升起
    this.group.position.y = this.position.y - 2
    this.group.scale.set(0.1, 0.1, 0.1)
    
    const startTime = Date.now()
    const duration = 500
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 使用缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      this.group.position.y = (this.position.y - 2) + easeProgress * 2
      this.group.scale.setScalar(0.1 + easeProgress * 0.9)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.group.position.copy(this.position)
        this.group.scale.set(1, 1, 1)
      }
    }
    
    animate()
  }
  
  /**
   * 落地反馈：轻微震动。
   * @returns {void}
   */
  playLandingEffect() {
    // 方块轻微震动
    const originalY = this.group.position.y
    const startTime = Date.now()
    const duration = 200
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      
      if (progress < 1) {
        const intensity = (1 - progress) * 0.1
        this.group.position.y = originalY + Math.sin(elapsed * 0.05) * intensity
        requestAnimationFrame(animate)
      } else {
        this.group.position.y = originalY
      }
    }
    
    animate()
  }
  
  /**
   * 每帧更新方块装饰动画。
   * @param {number} deltaTime - 帧间隔（秒）
   * @returns {void}
   */
  update(deltaTime) {
    const time = Date.now() * 0.001
    
    // 旋转装饰动画
    if (this.rotatingDecoration) {
      this.rotatingDecoration.rotation.z += deltaTime * 2
    }
    
    // 发光效果动画
    if (this.glowMesh) {
      this.glowMesh.material.opacity = 0.2 + Math.sin(time * 2) * 0.1
      this.glowMesh.rotation.y += deltaTime
    }
    
    // 装饰品动画
    if (this.decorations) {
      this.decorations.forEach((decoration, index) => {
        decoration.position.y = 0.55 + Math.sin(time * 3 + index) * 0.05
      })
    }
    
    // 特殊方块的整体旋转
    if (this.type === 'special') {
      this.group.rotation.y += deltaTime * 0.5
    }
  }
  
  /**
   * 获取方块高度（用于落地/碰撞判定）。
   * @returns {number}
   */
  getHeight() {
    switch (this.type) {
      case 'start':
        return 0.6
      case 'small':
        return 0.4
      case 'tall':
        return 1.5
      default:
        return 0.5
    }
  }
  
  /**
   * 获取方块半径（用于落地/碰撞判定）。
   * @returns {number}
   */
  getRadius() {
    switch (this.type) {
      case 'start':
        return 1.2
      case 'small':
        return 0.6
      case 'tall':
        return 0.8
      default:
        return 1.0
    }
  }
  
  /**
   * 从场景中移除方块模型。
   * @returns {void}
   */
  destroy() {
    if (this.group && this.scene) {
      this.scene.remove(this.group)
    }
  }
}

export default Block