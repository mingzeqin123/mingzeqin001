// pages/game/performanceOptimizer.js
import { PerformanceMonitor } from './utils.js'

/**
 * 性能优化器
 * 动态调整游戏性能参数
 */
export class PerformanceOptimizer {
  constructor() {
    this.monitor = new PerformanceMonitor()
    this.qualityLevel = 'high' // high, medium, low
    this.adaptiveQuality = true
    this.frameRateTarget = 60
    this.frameRateHistory = []
    this.optimizationSettings = {
      high: {
        shadowMapSize: 2048,
        antialias: true,
        maxBlocks: 50,
        updateRange: 10,
        particleCount: 100
      },
      medium: {
        shadowMapSize: 1024,
        antialias: true,
        maxBlocks: 30,
        updateRange: 7,
        particleCount: 50
      },
      low: {
        shadowMapSize: 512,
        antialias: false,
        maxBlocks: 20,
        updateRange: 5,
        particleCount: 20
      }
    }
  }

  /**
   * 更新性能监控
   */
  update() {
    this.monitor.update()
    const fps = this.monitor.getFPS()
    const frameTime = this.monitor.getFrameTime()
    
    // 记录帧率历史
    this.frameRateHistory.push(fps)
    if (this.frameRateHistory.length > 60) {
      this.frameRateHistory.shift()
    }
    
    // 自适应质量调整
    if (this.adaptiveQuality) {
      this.adjustQualityLevel()
    }
  }

  /**
   * 调整质量等级
   */
  adjustQualityLevel() {
    if (this.frameRateHistory.length < 30) return
    
    const avgFps = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length
    
    if (avgFps < 30 && this.qualityLevel !== 'low') {
      this.setQualityLevel('low')
    } else if (avgFps < 45 && this.qualityLevel === 'high') {
      this.setQualityLevel('medium')
    } else if (avgFps > 55 && this.qualityLevel !== 'high') {
      this.setQualityLevel('high')
    }
  }

  /**
   * 设置质量等级
   */
  setQualityLevel(level) {
    if (this.qualityLevel === level) return
    
    this.qualityLevel = level
    console.log(`Quality level changed to: ${level}`)
    
    // 通知游戏引擎更新设置
    if (this.onQualityChange) {
      this.onQualityChange(this.optimizationSettings[level])
    }
  }

  /**
   * 获取当前优化设置
   */
  getOptimizationSettings() {
    return this.optimizationSettings[this.qualityLevel]
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    const avgFps = this.frameRateHistory.length > 0 
      ? this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length 
      : 0
    
    return {
      currentFps: this.monitor.getFPS(),
      averageFps: avgFps,
      frameTime: this.monitor.getFrameTime(),
      qualityLevel: this.qualityLevel,
      frameRateHistory: [...this.frameRateHistory]
    }
  }

  /**
   * 重置性能统计
   */
  resetStats() {
    this.frameRateHistory = []
    this.monitor = new PerformanceMonitor()
  }
}

/**
 * 渲染优化器
 */
export class RenderOptimizer {
  constructor() {
    this.frustumCulling = true
    this.occlusionCulling = false
    this.lodLevels = 3
    this.cullingDistance = 50
  }

  /**
   * 视锥体剔除
   */
  frustumCull(objects, camera) {
    if (!this.frustumCulling) return objects
    
    const frustum = new THREE.Frustum()
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix, 
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(matrix)
    
    return objects.filter(obj => {
      if (!obj.boundingBox) return true
      return frustum.intersectsBox(obj.boundingBox)
    })
  }

  /**
   * 距离剔除
   */
  distanceCull(objects, cameraPosition, maxDistance) {
    const distance = maxDistance || this.cullingDistance
    return objects.filter(obj => {
      const objDistance = cameraPosition.distanceTo(obj.position)
      return objDistance <= distance
    })
  }

  /**
   * LOD (Level of Detail) 优化
   */
  applyLOD(object, distance) {
    if (!object.lodLevels) return
    
    let lodLevel = 0
    if (distance > 20) lodLevel = 2
    else if (distance > 10) lodLevel = 1
    
    if (object.lodLevels[lodLevel]) {
      object.geometry = object.lodLevels[lodLevel].geometry
      object.material = object.lodLevels[lodLevel].material
    }
  }
}

/**
 * 内存优化器
 */
export class MemoryOptimizer {
  constructor() {
    this.textureCache = new Map()
    this.geometryCache = new Map()
    this.materialCache = new Map()
    this.maxCacheSize = 100
  }

  /**
   * 获取缓存的纹理
   */
  getCachedTexture(url) {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)
    }
    return null
  }

  /**
   * 缓存纹理
   */
  cacheTexture(url, texture) {
    if (this.textureCache.size >= this.maxCacheSize) {
      const firstKey = this.textureCache.keys().next().value
      this.textureCache.delete(firstKey)
    }
    this.textureCache.set(url, texture)
  }

  /**
   * 获取缓存的几何体
   */
  getCachedGeometry(type, params) {
    const key = `${type}_${JSON.stringify(params)}`
    return this.geometryCache.get(key)
  }

  /**
   * 缓存几何体
   */
  cacheGeometry(type, params, geometry) {
    const key = `${type}_${JSON.stringify(params)}`
    if (this.geometryCache.size >= this.maxCacheSize) {
      const firstKey = this.geometryCache.keys().next().value
      this.geometryCache.delete(firstKey)
    }
    this.geometryCache.set(key, geometry)
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.textureCache.clear()
    this.geometryCache.clear()
    this.materialCache.clear()
  }

  /**
   * 获取内存使用情况
   */
  getMemoryStats() {
    return {
      textureCacheSize: this.textureCache.size,
      geometryCacheSize: this.geometryCache.size,
      materialCacheSize: this.materialCache.size,
      totalCacheSize: this.textureCache.size + this.geometryCache.size + this.materialCache.size
    }
  }
}

// 导出单例
export const performanceOptimizer = new PerformanceOptimizer()
export const renderOptimizer = new RenderOptimizer()
export const memoryOptimizer = new MemoryOptimizer()