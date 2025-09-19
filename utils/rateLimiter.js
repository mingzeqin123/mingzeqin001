/**
 * 接口限流工具类
 * 防止用户恶意刷接口
 */

class RateLimiter {
  constructor(options = {}) {
    // 默认配置
    this.config = {
      // 时间窗口（毫秒）
      windowMs: options.windowMs || 60000, // 1分钟
      // 最大请求次数
      maxRequests: options.maxRequests || 60, // 每分钟60次
      // 滑动窗口大小
      windowSize: options.windowSize || 10, // 10个时间片
      // 是否启用IP限制
      enableIPLimit: options.enableIPLimit !== false,
      // 是否启用用户限制
      enableUserLimit: options.enableUserLimit !== false,
      // 是否启用设备指纹限制
      enableDeviceLimit: options.enableDeviceLimit !== false,
      // 黑名单IP列表
      blacklistIPs: options.blacklistIPs || [],
      // 白名单IP列表
      whitelistIPs: options.whitelistIPs || [],
      // 是否启用滑动窗口
      enableSlidingWindow: options.enableSlidingWindow !== false
    }
    
    // 存储请求记录
    this.requests = new Map()
    // 存储IP黑名单
    this.blacklist = new Set(this.config.blacklistIPs)
    // 存储IP白名单
    this.whitelist = new Set(this.config.whitelistIPs)
    // 存储设备指纹
    this.deviceFingerprints = new Map()
    
    // 清理过期数据的定时器
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.windowMs / 2)
  }

  /**
   * 检查请求是否被允许
   * @param {Object} requestInfo - 请求信息
   * @param {string} requestInfo.ip - 客户端IP
   * @param {string} requestInfo.userId - 用户ID（可选）
   * @param {string} requestInfo.deviceId - 设备ID（可选）
   * @param {string} requestInfo.endpoint - 接口端点
   * @returns {Object} 检查结果
   */
  checkRequest(requestInfo) {
    const { ip, userId, deviceId, endpoint } = requestInfo
    const now = Date.now()
    
    // 检查IP黑名单
    if (this.blacklist.has(ip)) {
      return {
        allowed: false,
        reason: 'IP_BLACKLISTED',
        message: 'IP地址已被封禁'
      }
    }
    
    // 白名单IP直接通过
    if (this.whitelist.has(ip)) {
      return {
        allowed: true,
        reason: 'IP_WHITELISTED',
        message: 'IP地址在白名单中'
      }
    }
    
    // 检查IP限制
    if (this.config.enableIPLimit) {
      const ipResult = this.checkRateLimit(ip, 'ip', now)
      if (!ipResult.allowed) {
        return {
          allowed: false,
          reason: 'IP_RATE_LIMITED',
          message: `IP请求过于频繁，请${Math.ceil(ipResult.retryAfter / 1000)}秒后重试`,
          retryAfter: ipResult.retryAfter
        }
      }
    }
    
    // 检查用户限制
    if (this.config.enableUserLimit && userId) {
      const userResult = this.checkRateLimit(userId, 'user', now)
      if (!userResult.allowed) {
        return {
          allowed: false,
          reason: 'USER_RATE_LIMITED',
          message: `用户请求过于频繁，请${Math.ceil(userResult.retryAfter / 1000)}秒后重试`,
          retryAfter: userResult.retryAfter
        }
      }
    }
    
    // 检查设备限制
    if (this.config.enableDeviceLimit && deviceId) {
      const deviceResult = this.checkRateLimit(deviceId, 'device', now)
      if (!deviceResult.allowed) {
        return {
          allowed: false,
          reason: 'DEVICE_RATE_LIMITED',
          message: `设备请求过于频繁，请${Math.ceil(deviceResult.retryAfter / 1000)}秒后重试`,
          retryAfter: deviceResult.retryAfter
        }
      }
    }
    
    // 记录请求
    this.recordRequest(ip, userId, deviceId, endpoint, now)
    
    return {
      allowed: true,
      reason: 'ALLOWED',
      message: '请求通过'
    }
  }

  /**
   * 检查速率限制
   * @param {string} identifier - 标识符（IP、用户ID或设备ID）
   * @param {string} type - 类型（ip、user、device）
   * @param {number} now - 当前时间戳
   * @returns {Object} 检查结果
   */
  checkRateLimit(identifier, type, now) {
    const key = `${type}:${identifier}`
    const requests = this.requests.get(key) || []
    
    if (this.config.enableSlidingWindow) {
      return this.checkSlidingWindow(requests, now)
    } else {
      return this.checkFixedWindow(requests, now)
    }
  }

  /**
   * 固定时间窗口检查
   * @param {Array} requests - 请求记录
   * @param {number} now - 当前时间戳
   * @returns {Object} 检查结果
   */
  checkFixedWindow(requests, now) {
    const windowStart = now - this.config.windowMs
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...recentRequests)
      const retryAfter = oldestRequest + this.config.windowMs - now
      
      return {
        allowed: false,
        retryAfter: Math.max(retryAfter, 1000) // 至少1秒
      }
    }
    
    return { allowed: true }
  }

  /**
   * 滑动窗口检查
   * @param {Array} requests - 请求记录
   * @param {number} now - 当前时间戳
   * @returns {Object} 检查结果
   */
  checkSlidingWindow(requests, now) {
    const windowStart = now - this.config.windowMs
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= this.config.maxRequests) {
      // 计算需要等待的时间
      const sortedRequests = recentRequests.sort((a, b) => a - b)
      const oldestRequest = sortedRequests[0]
      const retryAfter = oldestRequest + this.config.windowMs - now
      
      return {
        allowed: false,
        retryAfter: Math.max(retryAfter, 1000)
      }
    }
    
    return { allowed: true }
  }

  /**
   * 记录请求
   * @param {string} ip - IP地址
   * @param {string} userId - 用户ID
   * @param {string} deviceId - 设备ID
   * @param {string} endpoint - 接口端点
   * @param {number} timestamp - 时间戳
   */
  recordRequest(ip, userId, deviceId, endpoint, timestamp) {
    // 记录IP请求
    if (this.config.enableIPLimit) {
      this.addRequest(`ip:${ip}`, timestamp)
    }
    
    // 记录用户请求
    if (this.config.enableUserLimit && userId) {
      this.addRequest(`user:${userId}`, timestamp)
    }
    
    // 记录设备请求
    if (this.config.enableDeviceLimit && deviceId) {
      this.addRequest(`device:${deviceId}`, timestamp)
    }
  }

  /**
   * 添加请求记录
   * @param {string} key - 键
   * @param {number} timestamp - 时间戳
   */
  addRequest(key, timestamp) {
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const requests = this.requests.get(key)
    requests.push(timestamp)
    
    // 保持记录数量在合理范围内
    if (requests.length > this.config.maxRequests * 2) {
      requests.splice(0, requests.length - this.config.maxRequests)
    }
  }

  /**
   * 清理过期数据
   */
  cleanup() {
    const now = Date.now()
    const cutoff = now - this.config.windowMs * 2
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > cutoff)
      
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }

  /**
   * 添加IP到黑名单
   * @param {string} ip - IP地址
   */
  addToBlacklist(ip) {
    this.blacklist.add(ip)
  }

  /**
   * 从黑名单移除IP
   * @param {string} ip - IP地址
   */
  removeFromBlacklist(ip) {
    this.blacklist.delete(ip)
  }

  /**
   * 添加IP到白名单
   * @param {string} ip - IP地址
   */
  addToWhitelist(ip) {
    this.whitelist.add(ip)
  }

  /**
   * 从白名单移除IP
   * @param {string} ip - IP地址
   */
  removeFromWhitelist(ip) {
    this.whitelist.delete(ip)
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stats = {
      totalRequests: 0,
      uniqueIPs: 0,
      uniqueUsers: 0,
      uniqueDevices: 0,
      blacklistedIPs: this.blacklist.size,
      whitelistedIPs: this.whitelist.size
    }
    
    for (const [key, requests] of this.requests.entries()) {
      stats.totalRequests += requests.length
      
      if (key.startsWith('ip:')) {
        stats.uniqueIPs++
      } else if (key.startsWith('user:')) {
        stats.uniqueUsers++
      } else if (key.startsWith('device:')) {
        stats.uniqueDevices++
      }
    }
    
    return stats
  }

  /**
   * 销毁限流器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.requests.clear()
    this.blacklist.clear()
    this.whitelist.clear()
  }
}

module.exports = RateLimiter