/**
 * 安全中间件
 * 集成多种防护策略，提供统一的接口安全保护
 */

const RateLimiter = require('./rateLimiter')
const RequestTracker = require('./requestTracker')

class SecurityMiddleware {
  constructor(options = {}) {
    this.config = {
      // 是否启用限流
      enableRateLimit: options.enableRateLimit !== false,
      // 是否启用行为追踪
      enableRequestTracking: options.enableRequestTracking !== false,
      // 是否启用IP验证
      enableIPValidation: options.enableIPValidation !== false,
      // 是否启用User-Agent验证
      enableUserAgentValidation: options.enableUserAgentValidation !== false,
      // 是否启用Referer验证
      enableRefererValidation: options.enableRefererValidation !== false,
      // 是否启用请求大小限制
      enableRequestSizeLimit: options.enableRequestSizeLimit !== false,
      // 是否启用响应时间监控
      enableResponseTimeMonitoring: options.enableResponseTimeMonitoring !== false,
      // 是否启用自动封禁
      enableAutoBan: options.enableAutoBan !== false,
      // 封禁阈值
      banThreshold: options.banThreshold || 10,
      // 封禁持续时间（毫秒）
      banDuration: options.banDuration || 3600000, // 1小时
      // 是否启用日志记录
      enableLogging: options.enableLogging !== false,
      // 日志级别
      logLevel: options.logLevel || 'info'
    }
    
    // 初始化限流器
    this.rateLimiter = this.config.enableRateLimit ? new RateLimiter(options.rateLimit) : null
    
    // 初始化请求追踪器
    this.requestTracker = this.config.enableRequestTracking ? new RequestTracker(options.tracking) : null
    
    // 封禁列表
    this.bannedIPs = new Map()
    this.bannedUsers = new Map()
    this.bannedDevices = new Map()
    
    // 可疑行为计数器
    this.suspiciousCounters = new Map()
    
    // 清理封禁列表的定时器
    this.cleanupInterval = setInterval(() => {
      this.cleanupBans()
    }, 60000) // 每分钟清理一次
  }

  /**
   * 中间件主函数
   * @param {Object} requestInfo - 请求信息
   * @returns {Promise<Object>} 处理结果
   */
  async processRequest(requestInfo) {
    const startTime = Date.now()
    const result = {
      allowed: true,
      reason: 'ALLOWED',
      message: '请求通过',
      securityLevel: 'NORMAL',
      warnings: [],
      retryAfter: 0
    }
    
    try {
      // 1. 基础验证
      const basicValidation = this.validateBasicInfo(requestInfo)
      if (!basicValidation.valid) {
        return this.createRejectedResult('BASIC_VALIDATION_FAILED', basicValidation.message)
      }
      
      // 2. 检查封禁状态
      const banCheck = this.checkBanStatus(requestInfo)
      if (!banCheck.allowed) {
        return this.createRejectedResult('BANNED', banCheck.message)
      }
      
      // 3. IP验证
      if (this.config.enableIPValidation) {
        const ipValidation = this.validateIP(requestInfo.ip)
        if (!ipValidation.valid) {
          result.warnings.push(ipValidation.message)
          this.recordSuspiciousActivity(requestInfo.ip, 'INVALID_IP')
        }
      }
      
      // 4. User-Agent验证
      if (this.config.enableUserAgentValidation) {
        const uaValidation = this.validateUserAgent(requestInfo.userAgent)
        if (!uaValidation.valid) {
          result.warnings.push(uaValidation.message)
          this.recordSuspiciousActivity(requestInfo.ip, 'SUSPICIOUS_UA')
        }
      }
      
      // 5. Referer验证
      if (this.config.enableRefererValidation) {
        const refererValidation = this.validateReferer(requestInfo.referer)
        if (!refererValidation.valid) {
          result.warnings.push(refererValidation.message)
          this.recordSuspiciousActivity(requestInfo.ip, 'SUSPICIOUS_REFERER')
        }
      }
      
      // 6. 请求大小验证
      if (this.config.enableRequestSizeLimit) {
        const sizeValidation = this.validateRequestSize(requestInfo.requestSize)
        if (!sizeValidation.valid) {
          return this.createRejectedResult('REQUEST_TOO_LARGE', sizeValidation.message)
        }
      }
      
      // 7. 限流检查
      if (this.rateLimiter) {
        const rateLimitResult = this.rateLimiter.checkRequest(requestInfo)
        if (!rateLimitResult.allowed) {
          this.recordSuspiciousActivity(requestInfo.ip, 'RATE_LIMITED')
          return this.createRejectedResult(rateLimitResult.reason, rateLimitResult.message, rateLimitResult.retryAfter)
        }
      }
      
      // 8. 行为分析
      if (this.requestTracker) {
        const trackingResult = this.requestTracker.recordRequest({
          ...requestInfo,
          responseTime: Date.now() - startTime
        })
        
        if (trackingResult.isAnomaly) {
          result.warnings.push('检测到异常行为模式')
          this.recordSuspiciousActivity(requestInfo.ip, 'ANOMALY_DETECTED')
        }
      }
      
      // 9. 安全等级评估
      result.securityLevel = this.assessSecurityLevel(requestInfo, result.warnings)
      
      // 10. 自动封禁检查
      if (this.config.enableAutoBan) {
        this.checkAutoBan(requestInfo.ip, requestInfo.userId, requestInfo.deviceId)
      }
      
      // 11. 记录日志
      if (this.config.enableLogging) {
        this.logRequest(requestInfo, result, Date.now() - startTime)
      }
      
      return result
      
    } catch (error) {
      this.logError('Security middleware error', error, requestInfo)
      return this.createRejectedResult('INTERNAL_ERROR', '安全验证服务暂时不可用')
    }
  }

  /**
   * 基础信息验证
   * @param {Object} requestInfo - 请求信息
   * @returns {Object} 验证结果
   */
  validateBasicInfo(requestInfo) {
    if (!requestInfo.ip) {
      return { valid: false, message: '缺少IP地址' }
    }
    
    if (!requestInfo.endpoint) {
      return { valid: false, message: '缺少接口端点' }
    }
    
    if (!this.isValidIP(requestInfo.ip)) {
      return { valid: false, message: '无效的IP地址格式' }
    }
    
    return { valid: true }
  }

  /**
   * 检查封禁状态
   * @param {Object} requestInfo - 请求信息
   * @returns {Object} 检查结果
   */
  checkBanStatus(requestInfo) {
    const { ip, userId, deviceId } = requestInfo
    
    // 检查IP封禁
    if (this.bannedIPs.has(ip)) {
      const banInfo = this.bannedIPs.get(ip)
      if (banInfo.expiresAt > Date.now()) {
        return {
          allowed: false,
          message: `IP地址已被封禁，解封时间：${new Date(banInfo.expiresAt).toLocaleString()}`
        }
      } else {
        this.bannedIPs.delete(ip)
      }
    }
    
    // 检查用户封禁
    if (userId && this.bannedUsers.has(userId)) {
      const banInfo = this.bannedUsers.get(userId)
      if (banInfo.expiresAt > Date.now()) {
        return {
          allowed: false,
          message: `用户已被封禁，解封时间：${new Date(banInfo.expiresAt).toLocaleString()}`
        }
      } else {
        this.bannedUsers.delete(userId)
      }
    }
    
    // 检查设备封禁
    if (deviceId && this.bannedDevices.has(deviceId)) {
      const banInfo = this.bannedDevices.get(deviceId)
      if (banInfo.expiresAt > Date.now()) {
        return {
          allowed: false,
          message: `设备已被封禁，解封时间：${new Date(banInfo.expiresAt).toLocaleString()}`
        }
      } else {
        this.bannedDevices.delete(deviceId)
      }
    }
    
    return { allowed: true }
  }

  /**
   * 验证IP地址
   * @param {string} ip - IP地址
   * @returns {Object} 验证结果
   */
  validateIP(ip) {
    if (!this.isValidIP(ip)) {
      return { valid: false, message: '无效的IP地址格式' }
    }
    
    // 检查是否为私有IP（如果是公开API，可能需要限制）
    if (this.isPrivateIP(ip)) {
      return { valid: true, message: '检测到私有IP地址' }
    }
    
    // 检查是否为可疑IP段
    if (this.isSuspiciousIP(ip)) {
      return { valid: false, message: '检测到可疑IP地址' }
    }
    
    return { valid: true }
  }

  /**
   * 验证User-Agent
   * @param {string} userAgent - User-Agent字符串
   * @returns {Object} 验证结果
   */
  validateUserAgent(userAgent) {
    if (!userAgent) {
      return { valid: false, message: '缺少User-Agent' }
    }
    
    // 检查User-Agent长度
    if (userAgent.length > 500) {
      return { valid: false, message: 'User-Agent过长' }
    }
    
    // 检查是否为常见爬虫
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ]
    
    for (const pattern of botPatterns) {
      if (pattern.test(userAgent)) {
        return { valid: false, message: '检测到爬虫User-Agent' }
      }
    }
    
    // 检查是否为空或异常短的User-Agent
    if (userAgent.length < 10) {
      return { valid: false, message: 'User-Agent异常短' }
    }
    
    return { valid: true }
  }

  /**
   * 验证Referer
   * @param {string} referer - Referer字符串
   * @returns {Object} 验证结果
   */
  validateReferer(referer) {
    if (!referer) {
      return { valid: true } // Referer是可选的
    }
    
    try {
      const url = new URL(referer)
      
      // 检查是否为允许的域名
      const allowedDomains = this.config.allowedDomains || []
      if (allowedDomains.length > 0 && !allowedDomains.includes(url.hostname)) {
        return { valid: false, message: 'Referer域名不在允许列表中' }
      }
      
      // 检查是否为可疑的Referer
      const suspiciousPatterns = [
        /javascript:/i, /data:/i, /file:/i,
        /localhost/i, /127\.0\.0\.1/i
      ]
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(referer)) {
          return { valid: false, message: '检测到可疑Referer' }
        }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, message: '无效的Referer格式' }
    }
  }

  /**
   * 验证请求大小
   * @param {number} requestSize - 请求大小（字节）
   * @returns {Object} 验证结果
   */
  validateRequestSize(requestSize) {
    if (!requestSize) {
      return { valid: true } // 请求大小未知，跳过验证
    }
    
    const maxSize = this.config.maxRequestSize || 10 * 1024 * 1024 // 默认10MB
    
    if (requestSize > maxSize) {
      return {
        valid: false,
        message: `请求大小超过限制（${Math.round(maxSize / 1024 / 1024)}MB）`
      }
    }
    
    return { valid: true }
  }

  /**
   * 记录可疑活动
   * @param {string} identifier - 标识符
   * @param {string} reason - 原因
   */
  recordSuspiciousActivity(identifier, reason) {
    const key = identifier
    if (!this.suspiciousCounters.has(key)) {
      this.suspiciousCounters.set(key, {
        count: 0,
        reasons: new Set(),
        firstSeen: Date.now(),
        lastSeen: Date.now()
      })
    }
    
    const counter = this.suspiciousCounters.get(key)
    counter.count++
    counter.reasons.add(reason)
    counter.lastSeen = Date.now()
  }

  /**
   * 检查自动封禁
   * @param {string} ip - IP地址
   * @param {string} userId - 用户ID
   * @param {string} deviceId - 设备ID
   */
  checkAutoBan(ip, userId, deviceId) {
    const ipCounter = this.suspiciousCounters.get(ip)
    if (ipCounter && ipCounter.count >= this.config.banThreshold) {
      this.banIP(ip, `自动封禁：${ipCounter.count}次可疑活动`)
    }
    
    if (userId) {
      const userCounter = this.suspiciousCounters.get(userId)
      if (userCounter && userCounter.count >= this.config.banThreshold) {
        this.banUser(userId, `自动封禁：${userCounter.count}次可疑活动`)
      }
    }
    
    if (deviceId) {
      const deviceCounter = this.suspiciousCounters.get(deviceId)
      if (deviceCounter && deviceCounter.count >= this.config.banThreshold) {
        this.banDevice(deviceId, `自动封禁：${deviceCounter.count}次可疑活动`)
      }
    }
  }

  /**
   * 封禁IP
   * @param {string} ip - IP地址
   * @param {string} reason - 封禁原因
   * @param {number} duration - 封禁时长（毫秒）
   */
  banIP(ip, reason, duration = this.config.banDuration) {
    this.bannedIPs.set(ip, {
      reason,
      bannedAt: Date.now(),
      expiresAt: Date.now() + duration
    })
    
    this.logSecurity('IP_BANNED', { ip, reason, duration })
  }

  /**
   * 封禁用户
   * @param {string} userId - 用户ID
   * @param {string} reason - 封禁原因
   * @param {number} duration - 封禁时长（毫秒）
   */
  banUser(userId, reason, duration = this.config.banDuration) {
    this.bannedUsers.set(userId, {
      reason,
      bannedAt: Date.now(),
      expiresAt: Date.now() + duration
    })
    
    this.logSecurity('USER_BANNED', { userId, reason, duration })
  }

  /**
   * 封禁设备
   * @param {string} deviceId - 设备ID
   * @param {string} reason - 封禁原因
   * @param {number} duration - 封禁时长（毫秒）
   */
  banDevice(deviceId, reason, duration = this.config.banDuration) {
    this.bannedDevices.set(deviceId, {
      reason,
      bannedAt: Date.now(),
      expiresAt: Date.now() + duration
    })
    
    this.logSecurity('DEVICE_BANNED', { deviceId, reason, duration })
  }

  /**
   * 评估安全等级
   * @param {Object} requestInfo - 请求信息
   * @param {Array} warnings - 警告列表
   * @returns {string} 安全等级
   */
  assessSecurityLevel(requestInfo, warnings) {
    if (warnings.length === 0) {
      return 'NORMAL'
    } else if (warnings.length <= 2) {
      return 'LOW_RISK'
    } else if (warnings.length <= 4) {
      return 'MEDIUM_RISK'
    } else {
      return 'HIGH_RISK'
    }
  }

  /**
   * 创建拒绝结果
   * @param {string} reason - 拒绝原因
   * @param {string} message - 拒绝消息
   * @param {number} retryAfter - 重试时间
   * @returns {Object} 拒绝结果
   */
  createRejectedResult(reason, message, retryAfter = 0) {
    return {
      allowed: false,
      reason,
      message,
      securityLevel: 'BLOCKED',
      retryAfter
    }
  }

  /**
   * 验证IP地址格式
   * @param {string} ip - IP地址
   * @returns {boolean} 是否有效
   */
  isValidIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  /**
   * 检查是否为私有IP
   * @param {string} ip - IP地址
   * @returns {boolean} 是否为私有IP
   */
  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./,
      /^127\./, /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/
    ]
    
    return privateRanges.some(range => range.test(ip))
  }

  /**
   * 检查是否为可疑IP
   * @param {string} ip - IP地址
   * @returns {boolean} 是否可疑
   */
  isSuspiciousIP(ip) {
    // 这里可以集成第三方IP信誉服务
    // 或者维护一个可疑IP列表
    const suspiciousIPs = this.config.suspiciousIPs || []
    return suspiciousIPs.includes(ip)
  }

  /**
   * 记录请求日志
   * @param {Object} requestInfo - 请求信息
   * @param {Object} result - 处理结果
   * @param {number} processingTime - 处理时间
   */
  logRequest(requestInfo, result, processingTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: requestInfo.ip,
      userId: requestInfo.userId,
      deviceId: requestInfo.deviceId,
      endpoint: requestInfo.endpoint,
      userAgent: requestInfo.userAgent,
      allowed: result.allowed,
      reason: result.reason,
      securityLevel: result.securityLevel,
      warnings: result.warnings,
      processingTime,
      retryAfter: result.retryAfter
    }
    
    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`)
  }

  /**
   * 记录安全事件
   * @param {string} event - 事件类型
   * @param {Object} data - 事件数据
   */
  logSecurity(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data
    }
    
    console.log(`[SECURITY_EVENT] ${JSON.stringify(logEntry)}`)
  }

  /**
   * 记录错误
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   */
  logError(message, error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error.message,
      stack: error.stack,
      context
    }
    
    console.error(`[SECURITY_ERROR] ${JSON.stringify(logEntry)}`)
  }

  /**
   * 清理过期封禁
   */
  cleanupBans() {
    const now = Date.now()
    
    // 清理IP封禁
    for (const [ip, banInfo] of this.bannedIPs.entries()) {
      if (banInfo.expiresAt <= now) {
        this.bannedIPs.delete(ip)
      }
    }
    
    // 清理用户封禁
    for (const [userId, banInfo] of this.bannedUsers.entries()) {
      if (banInfo.expiresAt <= now) {
        this.bannedUsers.delete(userId)
      }
    }
    
    // 清理设备封禁
    for (const [deviceId, banInfo] of this.bannedDevices.entries()) {
      if (banInfo.expiresAt <= now) {
        this.bannedDevices.delete(deviceId)
      }
    }
  }

  /**
   * 获取安全统计信息
   * @returns {Object} 统计信息
   */
  getSecurityStats() {
    const stats = {
      bannedIPs: this.bannedIPs.size,
      bannedUsers: this.bannedUsers.size,
      bannedDevices: this.bannedDevices.size,
      suspiciousActivities: this.suspiciousCounters.size,
      rateLimitStats: this.rateLimiter ? this.rateLimiter.getStats() : null,
      anomalyStats: this.requestTracker ? this.requestTracker.getAnomalyStats() : null
    }
    
    return stats
  }

  /**
   * 销毁中间件
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    if (this.rateLimiter) {
      this.rateLimiter.destroy()
    }
    
    if (this.requestTracker) {
      this.requestTracker.destroy()
    }
    
    this.bannedIPs.clear()
    this.bannedUsers.clear()
    this.bannedDevices.clear()
    this.suspiciousCounters.clear()
  }
}

module.exports = SecurityMiddleware