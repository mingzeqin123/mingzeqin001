// pages/game/objectPool.js
import Block from './block.js'

/**
 * 对象池管理器
 * 用于减少频繁创建和销毁对象造成的GC压力
 */
export class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.pool = []
    this.activeObjects = new Set()
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn())
    }
  }
  
  // 获取对象
  get(...args) {
    let obj
    if (this.pool.length > 0) {
      obj = this.pool.pop()
    } else {
      obj = this.createFn()
    }
    
    // 重置对象状态
    if (this.resetFn) {
      this.resetFn(obj, ...args)
    }
    
    this.activeObjects.add(obj)
    return obj
  }
  
  // 回收对象
  release(obj) {
    if (this.activeObjects.has(obj)) {
      this.activeObjects.delete(obj)
      this.pool.push(obj)
    }
  }
  
  // 清空池
  clear() {
    this.pool.length = 0
    this.activeObjects.clear()
  }
  
  // 获取池状态
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeObjects.size,
      totalCreated: this.pool.length + this.activeObjects.size
    }
  }
}

/**
 * 方块对象池
 */
export class BlockPool extends ObjectPool {
  constructor(scene, initialSize = 20) {
    super(
      () => new Block(scene, 0, 0, 0, 'normal'),
      (block, x, y, z, type) => {
        block.reset(x, y, z, type)
      },
      initialSize
    )
    this.scene = scene
  }
  
  // 创建方块
  createBlock(x, y, z, type) {
    return this.get(x, y, z, type)
  }
  
  // 回收方块
  recycleBlock(block) {
    this.release(block)
  }
}

/**
 * 粒子效果对象池
 */
export class ParticlePool extends ObjectPool {
  constructor(scene, initialSize = 50) {
    super(
      () => this.createParticle(),
      (particle, x, y, z, color) => {
        particle.reset(x, y, z, color)
      },
      initialSize
    )
    this.scene = scene
  }
  
  createParticle() {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4)
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    })
    const particle = new THREE.Mesh(geometry, material)
    particle.visible = false
    this.scene.add(particle)
    return particle
  }
  
  // 创建粒子效果
  createParticleEffect(x, y, z, color, count = 20) {
    const particles = []
    for (let i = 0; i < count; i++) {
      const particle = this.get(x, y, z, color)
      particle.visible = true
      particles.push(particle)
    }
    return particles
  }
  
  // 回收粒子效果
  recycleParticleEffect(particles) {
    particles.forEach(particle => {
      particle.visible = false
      this.release(particle)
    })
  }
}

/**
 * 动画对象池
 */
export class AnimationPool extends ObjectPool {
  constructor(initialSize = 30) {
    super(
      () => ({
        startTime: 0,
        duration: 0,
        startValue: 0,
        endValue: 0,
        currentValue: 0,
        easing: null,
        onUpdate: null,
        onComplete: null,
        isActive: false
      }),
      (anim, startValue, endValue, duration, easing, onUpdate, onComplete) => {
        anim.startTime = Date.now()
        anim.duration = duration
        anim.startValue = startValue
        anim.endValue = endValue
        anim.currentValue = startValue
        anim.easing = easing || (t => t)
        anim.onUpdate = onUpdate
        anim.onComplete = onComplete
        anim.isActive = true
      }
    )
  }
  
  // 创建动画
  createAnimation(startValue, endValue, duration, easing, onUpdate, onComplete) {
    return this.get(startValue, endValue, duration, easing, onUpdate, onComplete)
  }
  
  // 更新所有活跃动画
  updateAnimations(deltaTime) {
    const currentTime = Date.now()
    const toRemove = []
    
    this.activeObjects.forEach(anim => {
      if (!anim.isActive) return
      
      const elapsed = currentTime - anim.startTime
      const progress = Math.min(elapsed / anim.duration, 1)
      const easedProgress = anim.easing(progress)
      
      anim.currentValue = anim.startValue + (anim.endValue - anim.startValue) * easedProgress
      
      if (anim.onUpdate) {
        anim.onUpdate(anim.currentValue, progress)
      }
      
      if (progress >= 1) {
        anim.isActive = false
        if (anim.onComplete) {
          anim.onComplete()
        }
        toRemove.push(anim)
      }
    })
    
    // 回收完成的动画
    toRemove.forEach(anim => this.release(anim))
  }
}

/**
 * 全局对象池管理器
 */
export class PoolManager {
  constructor() {
    this.pools = new Map()
  }
  
  // 注册对象池
  registerPool(name, pool) {
    this.pools.set(name, pool)
  }
  
  // 获取对象池
  getPool(name) {
    return this.pools.get(name)
  }
  
  // 清空所有池
  clearAllPools() {
    this.pools.forEach(pool => pool.clear())
  }
  
  // 获取所有池的状态
  getAllStats() {
    const stats = {}
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getStats()
    })
    return stats
  }
}

// 导出单例
export const poolManager = new PoolManager()