// pages/game/animationManager.js
import { lerp, easeOutQuart, easeInQuart, easeInOutCubic } from './utils.js'

/**
 * 动画管理器
 * 统一管理所有动画，提高性能
 */
export class AnimationManager {
  constructor() {
    this.animations = new Map()
    this.animationId = 0
    this.isRunning = false
    this.lastTime = 0
  }

  /**
   * 创建动画
   * @param {Object} config - 动画配置
   * @param {number} config.duration - 动画持续时间（毫秒）
   * @param {Function} config.easing - 缓动函数
   * @param {Function} config.onUpdate - 更新回调
   * @param {Function} config.onComplete - 完成回调
   * @param {boolean} config.loop - 是否循环
   * @param {number} config.delay - 延迟时间（毫秒）
   * @returns {number} 动画ID
   */
  createAnimation(config) {
    const id = ++this.animationId
    const animation = {
      id,
      startTime: Date.now() + (config.delay || 0),
      duration: config.duration,
      easing: config.easing || (t => t),
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      loop: config.loop || false,
      isActive: true,
      progress: 0
    }
    
    this.animations.set(id, animation)
    
    if (!this.isRunning) {
      this.start()
    }
    
    return id
  }

  /**
   * 创建属性动画
   * @param {Object} target - 目标对象
   * @param {string} property - 属性名
   * @param {number} from - 起始值
   * @param {number} to - 结束值
   * @param {number} duration - 持续时间
   * @param {Function} easing - 缓动函数
   * @param {Function} onComplete - 完成回调
   * @returns {number} 动画ID
   */
  animateProperty(target, property, from, to, duration, easing, onComplete) {
    return this.createAnimation({
      duration,
      easing: easing || easeOutQuart,
      onUpdate: (progress) => {
        const value = lerp(from, to, progress)
        target[property] = value
      },
      onComplete
    })
  }

  /**
   * 创建位置动画
   * @param {Object} target - 目标对象
   * @param {Object} from - 起始位置 {x, y, z}
   * @param {Object} to - 结束位置 {x, y, z}
   * @param {number} duration - 持续时间
   * @param {Function} easing - 缓动函数
   * @param {Function} onComplete - 完成回调
   * @returns {number} 动画ID
   */
  animatePosition(target, from, to, duration, easing, onComplete) {
    return this.createAnimation({
      duration,
      easing: easing || easeOutQuart,
      onUpdate: (progress) => {
        if (target.position) {
          target.position.x = lerp(from.x, to.x, progress)
          target.position.y = lerp(from.y, to.y, progress)
          target.position.z = lerp(from.z, to.z, progress)
        }
      },
      onComplete
    })
  }

  /**
   * 创建旋转动画
   * @param {Object} target - 目标对象
   * @param {Object} from - 起始旋转 {x, y, z}
   * @param {Object} to - 结束旋转 {x, y, z}
   * @param {number} duration - 持续时间
   * @param {Function} easing - 缓动函数
   * @param {Function} onComplete - 完成回调
   * @returns {number} 动画ID
   */
  animateRotation(target, from, to, duration, easing, onComplete) {
    return this.createAnimation({
      duration,
      easing: easing || easeOutQuart,
      onUpdate: (progress) => {
        if (target.rotation) {
          target.rotation.x = lerp(from.x, to.x, progress)
          target.rotation.y = lerp(from.y, to.y, progress)
          target.rotation.z = lerp(from.z, to.z, progress)
        }
      },
      onComplete
    })
  }

  /**
   * 创建缩放动画
   * @param {Object} target - 目标对象
   * @param {Object} from - 起始缩放 {x, y, z}
   * @param {Object} to - 结束缩放 {x, y, z}
   * @param {number} duration - 持续时间
   * @param {Function} easing - 缓动函数
   * @param {Function} onComplete - 完成回调
   * @returns {number} 动画ID
   */
  animateScale(target, from, to, duration, easing, onComplete) {
    return this.createAnimation({
      duration,
      easing: easing || easeOutQuart,
      onUpdate: (progress) => {
        if (target.scale) {
          target.scale.x = lerp(from.x, to.x, progress)
          target.scale.y = lerp(from.y, to.y, progress)
          target.scale.z = lerp(from.z, to.z, progress)
        }
      },
      onComplete
    })
  }

  /**
   * 创建序列动画
   * @param {Array} animations - 动画配置数组
   * @param {Function} onComplete - 完成回调
   * @returns {number} 动画ID
   */
  createSequence(animations, onComplete) {
    let currentIndex = 0
    let currentAnimationId = null
    
    const playNext = () => {
      if (currentIndex >= animations.length) {
        if (onComplete) onComplete()
        return
      }
      
      const config = animations[currentIndex]
      currentAnimationId = this.createAnimation({
        ...config,
        onComplete: () => {
          currentIndex++
          playNext()
        }
      })
    }
    
    playNext()
    return currentAnimationId
  }

  /**
   * 创建并行动画
   * @param {Array} animations - 动画配置数组
   * @param {Function} onComplete - 完成回调
   * @returns {Array} 动画ID数组
   */
  createParallel(animations, onComplete) {
    const animationIds = []
    let completedCount = 0
    
    animations.forEach(config => {
      const id = this.createAnimation({
        ...config,
        onComplete: () => {
          completedCount++
          if (completedCount === animations.length && onComplete) {
            onComplete()
          }
        }
      })
      animationIds.push(id)
    })
    
    return animationIds
  }

  /**
   * 停止动画
   * @param {number} id - 动画ID
   */
  stopAnimation(id) {
    const animation = this.animations.get(id)
    if (animation) {
      animation.isActive = false
      this.animations.delete(id)
    }
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations() {
    this.animations.clear()
    this.isRunning = false
  }

  /**
   * 暂停动画
   * @param {number} id - 动画ID
   */
  pauseAnimation(id) {
    const animation = this.animations.get(id)
    if (animation) {
      animation.isPaused = true
    }
  }

  /**
   * 恢复动画
   * @param {number} id - 动画ID
   */
  resumeAnimation(id) {
    const animation = this.animations.get(id)
    if (animation) {
      animation.isPaused = false
    }
  }

  /**
   * 开始动画循环
   */
  start() {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTime = Date.now()
    this.update()
  }

  /**
   * 停止动画循环
   */
  stop() {
    this.isRunning = false
  }

  /**
   * 更新动画
   */
  update() {
    if (!this.isRunning) return
    
    const currentTime = Date.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    const toRemove = []
    
    this.animations.forEach((animation, id) => {
      if (!animation.isActive || animation.isPaused) return
      
      const elapsed = currentTime - animation.startTime
      const progress = Math.min(elapsed / animation.duration, 1)
      
      animation.progress = progress
      
      if (animation.onUpdate) {
        animation.onUpdate(progress)
      }
      
      if (progress >= 1) {
        if (animation.loop) {
          // 重新开始循环
          animation.startTime = currentTime
        } else {
          // 动画完成
          if (animation.onComplete) {
            animation.onComplete()
          }
          toRemove.push(id)
        }
      }
    })
    
    // 移除完成的动画
    toRemove.forEach(id => this.animations.delete(id))
    
    // 如果没有动画了，停止更新
    if (this.animations.size === 0) {
      this.isRunning = false
      return
    }
    
    // 继续下一帧
    requestAnimationFrame(() => this.update())
  }

  /**
   * 获取动画状态
   */
  getAnimationStatus(id) {
    const animation = this.animations.get(id)
    if (!animation) return null
    
    return {
      id: animation.id,
      progress: animation.progress,
      isActive: animation.isActive,
      isPaused: animation.isPaused,
      duration: animation.duration,
      elapsed: Date.now() - animation.startTime
    }
  }

  /**
   * 获取所有动画状态
   */
  getAllAnimationsStatus() {
    const status = {}
    this.animations.forEach((animation, id) => {
      status[id] = this.getAnimationStatus(id)
    })
    return status
  }
}

// 导出单例
export const animationManager = new AnimationManager()