// pages/game/utils.js

// 线性插值 - 优化版本
export function lerp(start, end, factor) {
  // 添加边界检查以提高性能
  if (factor <= 0) return start
  if (factor >= 1) return end
  return start + (end - start) * factor
}

// 缓动函数 - 四次方缓出 - 优化版本
export function easeOutQuart(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const oneMinusT = 1 - t
  return 1 - oneMinusT * oneMinusT * oneMinusT * oneMinusT
}

// 缓动函数 - 四次方缓入 - 优化版本
export function easeInQuart(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t * t * t * t
}

// 缓动函数 - 三次方缓入缓出
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// 移除了未使用的弹性和反弹缓动函数以减少代码复杂度

// 角度转弧度
export function degToRad(degrees) {
  return degrees * (Math.PI / 180)
}

// 弧度转角度
export function radToDeg(radians) {
  return radians * (180 / Math.PI)
}

// 限制数值范围
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// 随机数生成
export function random(min, max) {
  return Math.random() * (max - min) + min
}

// 随机整数生成
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 计算两点距离 - 优化版本
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

// 计算平方距离（避免开方运算）
export function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

// 计算三维平方距离（避免开方运算）
export function distance3DSquared(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const dz = z2 - z1
  return dx * dx + dy * dy + dz * dz
}

// 向量归一化
export function normalize(x, y) {
  const length = Math.sqrt(x * x + y * y)
  if (length === 0) return { x: 0, y: 0 }
  return { x: x / length, y: y / length }
}

// 向量点积
export function dotProduct(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2
}

// 向量叉积
export function crossProduct(x1, y1, x2, y2) {
  return x1 * y2 - y1 * x2
}

// 平滑步长函数
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

// 噪声函数（简单版）
export function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

// 颜色相关工具
export const ColorUtils = {
  // HSL转RGB
  hslToRgb(h, s, l) {
    h /= 360
    s /= 100
    l /= 100
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    let r, g, b
    
    if (s === 0) {
      r = g = b = l // 灰色
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  },
  
  // RGB转十六进制
  rgbToHex(r, g, b) {
    return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  },
  
  // 生成随机颜色
  randomColor() {
    return Math.floor(Math.random() * 16777215)
  },
  
  // 颜色插值
  lerpColor(color1, color2, factor) {
    const r1 = (color1 >> 16) & 0xff
    const g1 = (color1 >> 8) & 0xff
    const b1 = color1 & 0xff
    
    const r2 = (color2 >> 16) & 0xff
    const g2 = (color2 >> 8) & 0xff
    const b2 = color2 & 0xff
    
    const r = Math.round(lerp(r1, r2, factor))
    const g = Math.round(lerp(g1, g2, factor))
    const b = Math.round(lerp(b1, b2, factor))
    
    return (r << 16) | (g << 8) | b
  }
}

// 性能监控工具
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = 0
    this.frameTime = 0
  }
  
  update() {
    const currentTime = performance.now()
    this.frameTime = currentTime - this.lastTime
    this.lastTime = currentTime
    
    this.frameCount++
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / this.frameTime)
    }
  }
  
  getFPS() {
    return this.fps
  }
  
  getFrameTime() {
    return this.frameTime
  }
}

// 本地存储工具
export const StorageUtils = {
  // 设置数据
  set(key, value) {
    try {
      wx.setStorageSync(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },
  
  // 获取数据
  get(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key)
      return value ? JSON.parse(value) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },
  
  // 删除数据
  remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  },
  
  // 清空所有数据
  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (e) {
      console.error('Storage clear error:', e)
      return false
    }
  }
}

// 音效管理工具
export class AudioManager {
  constructor() {
    this.sounds = new Map()
    this.musicEnabled = true
    this.soundEnabled = true
  }
  
  // 加载音效
  loadSound(name, url) {
    try {
      const audio = wx.createInnerAudioContext()
      audio.src = url
      this.sounds.set(name, audio)
      return true
    } catch (e) {
      console.error('Audio load error:', e)
      return false
    }
  }
  
  // 播放音效
  playSound(name, volume = 1) {
    if (!this.soundEnabled) return
    
    const audio = this.sounds.get(name)
    if (audio) {
      audio.volume = volume
      audio.play()
    }
  }
  
  // 停止音效
  stopSound(name) {
    const audio = this.sounds.get(name)
    if (audio) {
      audio.stop()
    }
  }
  
  // 设置音效开关
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled
  }
  
  // 设置音乐开关
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled
  }
  
  // 销毁所有音效
  destroy() {
    this.sounds.forEach(audio => {
      audio.destroy()
    })
    this.sounds.clear()
  }
}

// 触摸手势识别
export class GestureRecognizer {
  constructor() {
    this.startX = 0
    this.startY = 0
    this.startTime = 0
    this.isPressed = false
  }
  
  onTouchStart(x, y) {
    this.startX = x
    this.startY = y
    this.startTime = Date.now()
    this.isPressed = true
  }
  
  onTouchEnd(x, y) {
    if (!this.isPressed) return null
    
    const deltaX = x - this.startX
    const deltaY = y - this.startY
    const deltaTime = Date.now() - this.startTime
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    this.isPressed = false
    
    // 判断手势类型
    if (deltaTime < 200 && distance < 10) {
      return { type: 'tap', x, y }
    } else if (deltaTime > 500 && distance < 20) {
      return { type: 'longPress', x, y, duration: deltaTime }
    } else if (distance > 50) {
      const angle = Math.atan2(deltaY, deltaX)
      return { 
        type: 'swipe', 
        direction: this.getSwipeDirection(angle),
        distance,
        deltaX,
        deltaY
      }
    }
    
    return null
  }
  
  getSwipeDirection(angle) {
    const degrees = angle * 180 / Math.PI
    if (degrees >= -45 && degrees < 45) return 'right'
    if (degrees >= 45 && degrees < 135) return 'down'
    if (degrees >= 135 || degrees < -135) return 'left'
    return 'up'
  }
}