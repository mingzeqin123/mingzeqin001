/**
 * @file 玩家角色（跳跃/蓄力/坠落与简单特效）
 */
import * as THREE from './libs/three.min.js'
import { lerp, easeOutQuart, easeInQuart } from './utils.js'

/**
 * 动画完成回调
 * @callback AnimationCompleteCallback
 */

/**
 * 玩家角色类。
 * 负责：创建玩家模型、维护位置、执行蓄力/跳跃/坠落动画与特效。
 */
class Player {
  /**
   * @param {THREE.Scene} scene - Three.js 场景
   */
  constructor(scene) {
    this.scene = scene
    this.position = new THREE.Vector3(0, 1, 0)
    
    // 动画状态
    this.isJumping = false
    this.isCharging = false
    this.jumpStartTime = 0
    this.jumpDuration = 0
    this.jumpStartPos = new THREE.Vector3()
    this.jumpEndPos = new THREE.Vector3()
    this.jumpHeight = 0
    
    // 创建玩家模型
    this.createModel()
  }
  
  /**
   * 创建玩家模型并加入场景。
   * @returns {void}
   */
  createModel() {
    // 创建玩家组
    this.group = new THREE.Group()
    
    // 身体（圆柱体）
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8)
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.body.position.y = 0.4
    this.body.castShadow = true
    this.group.add(this.body)
    
    // 头部（球体）
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffc107 })
    this.head = new THREE.Mesh(headGeometry, headMaterial)
    this.head.position.y = 1.05
    this.head.castShadow = true
    this.group.add(this.head)
    
    // 眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    this.leftEye.position.set(-0.1, 1.1, 0.2)
    this.group.add(this.leftEye)
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    this.rightEye.position.set(0.1, 1.1, 0.2)
    this.group.add(this.rightEye)
    
    // 嘴巴
    const mouthGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
    this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial)
    this.mouth.position.set(0, 0.95, 0.22)
    this.group.add(this.mouth)
    
    // 手臂
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6)
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
    
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial)
    this.leftArm.position.set(-0.45, 0.5, 0)
    this.leftArm.rotation.z = Math.PI / 6
    this.leftArm.castShadow = true
    this.group.add(this.leftArm)
    
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial)
    this.rightArm.position.set(0.45, 0.5, 0)
    this.rightArm.rotation.z = -Math.PI / 6
    this.rightArm.castShadow = true
    this.group.add(this.rightArm)
    
    // 腿部
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6)
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 })
    
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    this.leftLeg.position.set(-0.15, -0.2, 0)
    this.leftLeg.castShadow = true
    this.group.add(this.leftLeg)
    
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    this.rightLeg.position.set(0.15, -0.2, 0)
    this.rightLeg.castShadow = true
    this.group.add(this.rightLeg)
    
    // 设置初始位置
    this.group.position.copy(this.position)
    this.scene.add(this.group)
    
    // 保存原始比例和位置
    this.originalScale = this.group.scale.clone()
    this.originalBodyScale = this.body.scale.clone()
  }
  
  /**
   * 直接设置玩家位置（同时同步 Three.js Group）。
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {void}
   */
  setPosition(x, y, z) {
    this.position.set(x, y, z)
    this.group.position.copy(this.position)
  }
  
  /**
   * 进入蓄力状态（在 update 中驱动压缩/抖动动画）。
   * @returns {void}
   */
  startCharging() {
    this.isCharging = true
    this.chargingStartTime = Date.now()
  }
  
  /**
   * 执行一次跳跃动画（结束后调用回调）。
   *
   * 注意：当前实现会随机选择方向；如果要精确跳向下一个方块，
   * 应由外部传入目标方向/目标点来替换这里的随机角度逻辑。
   *
   * @param {number} distance - 跳跃水平距离
   * @param {number} height - 跳跃最高高度增量
   * @param {AnimationCompleteCallback} onComplete - 跳跃完成回调
   * @returns {void}
   */
  jump(distance, height, onComplete) {
    if (this.isJumping) return
    
    this.isJumping = true
    this.isCharging = false
    this.jumpStartTime = Date.now()
    this.jumpDuration = 800 // 跳跃持续时间
    this.jumpHeight = height
    this.onJumpComplete = onComplete
    
    // 计算跳跃起点和终点
    this.jumpStartPos.copy(this.position)
    
    // 计算跳跃方向（朝向最近的方块）
    const angle = Math.random() * Math.PI * 2 // 随机方向，实际应该根据最近方块计算
    this.jumpEndPos.set(
      this.position.x + Math.sin(angle) * distance,
      this.position.y,
      this.position.z + Math.cos(angle) * distance
    )
    
    // 播放跳跃音效（如果有的话）
    this.playJumpSound()
  }
  
  /**
   * 执行坠落动画（结束后调用回调）。
   * @param {AnimationCompleteCallback} onComplete
   * @returns {void}
   */
  fall(onComplete) {
    this.isFalling = true
    this.fallStartTime = Date.now()
    this.fallDuration = 2000
    this.fallStartPos = this.position.clone()
    this.onFallComplete = onComplete
  }
  
  /**
   * 完美落地效果：粒子 + 音效。
   * @returns {void}
   */
  showPerfectEffect() {
    // 创建粒子效果
    this.createParticleEffect()
    
    // 播放特殊音效
    this.playPerfectSound()
  }
  
  /**
   * 创建一次性粒子特效并播放。
   * @returns {void}
   */
  createParticleEffect() {
    const particleCount = 20
    const particles = new THREE.Group()
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4)
      const material = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
      })
      const particle = new THREE.Mesh(geometry, material)
      
      // 随机位置
      const angle = (i / particleCount) * Math.PI * 2
      particle.position.set(
        this.position.x + Math.cos(angle) * 0.5,
        this.position.y + 0.5,
        this.position.z + Math.sin(angle) * 0.5
      )
      
      particles.add(particle)
    }
    
    this.scene.add(particles)
    
    // 动画粒子
    const startTime = Date.now()
    const animateParticles = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / 1000
      
      if (progress < 1) {
        particles.children.forEach((particle, index) => {
          const angle = (index / particleCount) * Math.PI * 2
          particle.position.x = this.position.x + Math.cos(angle) * progress * 2
          particle.position.y = this.position.y + 0.5 + progress * 2
          particle.position.z = this.position.z + Math.sin(angle) * progress * 2
          particle.material.opacity = 1 - progress
        })
        requestAnimationFrame(animateParticles)
      } else {
        this.scene.remove(particles)
      }
    }
    
    animateParticles()
  }
  
  /**
   * 每帧更新：蓄力/跳跃/坠落动画与空闲微动画。
   * @param {number} deltaTime - 帧间隔（秒）
   * @returns {void}
   */
  update(deltaTime) {
    const currentTime = Date.now()
    
    // 蓄力动画
    if (this.isCharging) {
      const chargingTime = currentTime - this.chargingStartTime
      const intensity = Math.sin(chargingTime * 0.01) * 0.1 + 1
      
      // 身体压缩效果
      this.body.scale.y = this.originalBodyScale.y * (1 - intensity * 0.2)
      this.body.scale.x = this.originalBodyScale.x * (1 + intensity * 0.1)
      this.body.scale.z = this.originalBodyScale.z * (1 + intensity * 0.1)
      
      // 整体震动
      this.group.position.y = this.position.y + Math.sin(chargingTime * 0.02) * 0.02
    }
    
    // 跳跃动画
    if (this.isJumping) {
      const elapsed = currentTime - this.jumpStartTime
      const progress = Math.min(elapsed / this.jumpDuration, 1)
      
      if (progress < 1) {
        // 水平移动（线性）
        this.position.x = lerp(this.jumpStartPos.x, this.jumpEndPos.x, progress)
        this.position.z = lerp(this.jumpStartPos.z, this.jumpEndPos.z, progress)
        
        // 垂直移动（抛物线）
        const jumpProgress = progress * 2
        let heightMultiplier
        if (jumpProgress <= 1) {
          heightMultiplier = easeOutQuart(jumpProgress)
        } else {
          heightMultiplier = 1 - easeInQuart(jumpProgress - 1)
        }
        
        this.position.y = this.jumpStartPos.y + this.jumpHeight * heightMultiplier
        
        // 旋转动画
        this.group.rotation.x = progress * Math.PI * 2
        
        // 恢复身体形状
        this.body.scale.copy(this.originalBodyScale)
        
        this.group.position.copy(this.position)
      } else {
        // 跳跃结束
        this.isJumping = false
        this.group.rotation.x = 0
        this.position.copy(this.jumpEndPos)
        this.group.position.copy(this.position)
        
        if (this.onJumpComplete) {
          this.onJumpComplete()
        }
      }
    }
    
    // 坠落动画
    if (this.isFalling) {
      const elapsed = currentTime - this.fallStartTime
      const progress = Math.min(elapsed / this.fallDuration, 1)
      
      if (progress < 1) {
        // 加速下落
        this.position.y = this.fallStartPos.y - easeInQuart(progress) * 10
        
        // 旋转坠落
        this.group.rotation.x = progress * Math.PI * 4
        this.group.rotation.z = progress * Math.PI * 2
        
        this.group.position.copy(this.position)
      } else {
        this.isFalling = false
        if (this.onFallComplete) {
          this.onFallComplete()
        }
      }
    }
    
    // 空闲时的微动画
    if (!this.isJumping && !this.isCharging && !this.isFalling) {
      const time = currentTime * 0.002
      this.group.position.y = this.position.y + Math.sin(time) * 0.02
      
      // 眼睛眨动
      if (Math.random() < 0.01) {
        this.blink()
      }
    }
  }
  
  /**
   * 眨眼动画（一次性）。
   * @returns {void}
   */
  blink() {
    const originalScale = this.leftEye.scale.y
    this.leftEye.scale.y = 0.1
    this.rightEye.scale.y = 0.1
    
    setTimeout(() => {
      this.leftEye.scale.y = originalScale
      this.rightEye.scale.y = originalScale
    }, 100)
  }
  
  /**
   * 播放跳跃音效（预留：可接入小程序音效）。
   * @returns {void}
   */
  playJumpSound() {
    // 这里可以添加音效播放逻辑
    // wx.createInnerAudioContext() 等
  }
  
  /**
   * 播放完美落地音效（预留）。
   * @returns {void}
   */
  playPerfectSound() {
    // 这里可以添加特殊音效播放逻辑
  }
  
  /**
   * 重置玩家到初始状态（位置/旋转/缩放/动画标志位）。
   * @returns {void}
   */
  reset() {
    this.position.set(0, 1, 0)
    this.group.position.copy(this.position)
    this.group.rotation.set(0, 0, 0)
    this.group.scale.copy(this.originalScale)
    this.body.scale.copy(this.originalBodyScale)
    
    this.isJumping = false
    this.isCharging = false
    this.isFalling = false
  }
  
  /**
   * 从场景移除玩家模型（释放引用）。
   * @returns {void}
   */
  destroy() {
    if (this.group && this.scene) {
      this.scene.remove(this.group)
    }
  }
}

export default Player