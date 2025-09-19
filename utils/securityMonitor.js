/**
 * 安全监控系统
 * 提供实时监控、告警和日志记录功能
 */

const fs = require('fs')
const path = require('path')

class SecurityMonitor {
  constructor(options = {}) {
    this.config = {
      // 监控配置
      enableMetrics: options.enableMetrics !== false,
      enableAlerts: options.enableAlerts !== false,
      enableLogging: options.enableLogging !== false,
      
      // 告警阈值
      alertThresholds: {
        highRequestRate: options.highRequestRate || 1000, // 每分钟请求数
        highErrorRate: options.highErrorRate || 0.1, // 错误率
        highAnomalyRate: options.highAnomalyRate || 0.05, // 异常率
        highBanRate: options.highBanRate || 10, // 每分钟封禁数
        highResponseTime: options.highResponseTime || 5000, // 响应时间（毫秒）
        lowSuccessRate: options.lowSuccessRate || 0.8 // 成功率
      },
      
      // 告警渠道
      alertChannels: options.alertChannels || ['console'],
      webhookUrl: options.webhookUrl || null,
      
      // 日志配置
      logConfig: {
        enableConsole: options.enableConsole !== false,
        enableFile: options.enableFile || false,
        logFile: options.logFile || './logs/security.log',
        logLevel: options.logLevel || 'info',
        logFormat: options.logFormat || 'json',
        maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
        maxFiles: options.maxFiles || 5,
        enableRotation: options.enableRotation !== false
      },
      
      // 监控间隔
      monitoringInterval: options.monitoringInterval || 60000, // 1分钟
      
      // 数据保留时间
      dataRetention: options.dataRetention || 7 * 24 * 3600000 // 7天
    }
    
    // 指标存储
    this.metrics = {
      requests: {
        total: 0,
        allowed: 0,
        blocked: 0,
        errors: 0
      },
      rateLimits: {
        ipLimited: 0,
        userLimited: 0,
        deviceLimited: 0
      },
      bans: {
        ipBans: 0,
        userBans: 0,
        deviceBans: 0
      },
      anomalies: {
        detected: 0,
        frequency: 0,
        endpoint: 0,
        timePattern: 0,
        userAgent: 0,
        geo: 0
      },
      responseTime: {
        total: 0,
        count: 0,
        max: 0,
        min: Infinity
      }
    }
    
    // 时间窗口数据
    this.timeWindows = {
      requests: [],
      errors: [],
      bans: [],
      anomalies: []
    }
    
    // 告警状态
    this.alertStates = new Map()
    
    // 日志文件句柄
    this.logFileHandle = null
    
    // 监控定时器
    this.monitoringTimer = null
    
    // 初始化
    this.initialize()
  }

  /**
   * 初始化监控系统
   */
  initialize() {
    // 创建日志目录
    if (this.config.logConfig.enableFile) {
      const logDir = path.dirname(this.config.logConfig.logFile)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
    }
    
    // 启动监控定时器
    if (this.config.enableMetrics) {
      this.startMonitoring()
    }
  }

  /**
   * 记录请求
   * @param {Object} requestInfo - 请求信息
   * @param {Object} result - 处理结果
   * @param {number} processingTime - 处理时间
   */
  recordRequest(requestInfo, result, processingTime) {
    const timestamp = Date.now()
    
    // 更新基础指标
    this.metrics.requests.total++
    if (result.allowed) {
      this.metrics.requests.allowed++
    } else {
      this.metrics.requests.blocked++
    }
    
    // 记录响应时间
    if (processingTime !== undefined) {
      this.metrics.responseTime.total += processingTime
      this.metrics.responseTime.count++
      this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, processingTime)
      this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, processingTime)
    }
    
    // 记录时间窗口数据
    this.timeWindows.requests.push({
      timestamp,
      allowed: result.allowed,
      processingTime,
      ip: requestInfo.ip,
      endpoint: requestInfo.endpoint
    })
    
    // 记录日志
    if (this.config.enableLogging) {
      this.logRequest(requestInfo, result, processingTime)
    }
    
    // 检查告警
    if (this.config.enableAlerts) {
      this.checkAlerts()
    }
  }

  /**
   * 记录限流事件
   * @param {string} type - 限流类型
   * @param {string} identifier - 标识符
   * @param {Object} details - 详细信息
   */
  recordRateLimit(type, identifier, details = {}) {
    const timestamp = Date.now()
    
    // 更新限流指标
    switch (type) {
      case 'ip':
        this.metrics.rateLimits.ipLimited++
        break
      case 'user':
        this.metrics.rateLimits.userLimited++
        break
      case 'device':
        this.metrics.rateLimits.deviceLimited++
        break
    }
    
    // 记录日志
    if (this.config.enableLogging) {
      this.logRateLimit(type, identifier, details)
    }
  }

  /**
   * 记录封禁事件
   * @param {string} type - 封禁类型
   * @param {string} identifier - 标识符
   * @param {string} reason - 封禁原因
   * @param {Object} details - 详细信息
   */
  recordBan(type, identifier, reason, details = {}) {
    const timestamp = Date.now()
    
    // 更新封禁指标
    switch (type) {
      case 'ip':
        this.metrics.bans.ipBans++
        break
      case 'user':
        this.metrics.bans.userBans++
        break
      case 'device':
        this.metrics.bans.deviceBans++
        break
    }
    
    // 记录时间窗口数据
    this.timeWindows.bans.push({
      timestamp,
      type,
      identifier,
      reason
    })
    
    // 记录日志
    if (this.config.enableLogging) {
      this.logBan(type, identifier, reason, details)
    }
  }

  /**
   * 记录异常事件
   * @param {string} type - 异常类型
   * @param {Object} details - 详细信息
   */
  recordAnomaly(type, details = {}) {
    const timestamp = Date.now()
    
    // 更新异常指标
    this.metrics.anomalies.detected++
    if (this.metrics.anomalies[type] !== undefined) {
      this.metrics.anomalies[type]++
    }
    
    // 记录时间窗口数据
    this.timeWindows.anomalies.push({
      timestamp,
      type,
      details
    })
    
    // 记录日志
    if (this.config.enableLogging) {
      this.logAnomaly(type, details)
    }
  }

  /**
   * 记录错误
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   */
  recordError(message, error, context = {}) {
    const timestamp = Date.now()
    
    // 更新错误指标
    this.metrics.requests.errors++
    
    // 记录时间窗口数据
    this.timeWindows.errors.push({
      timestamp,
      message,
      error: error.message,
      context
    })
    
    // 记录日志
    if (this.config.enableLogging) {
      this.logError(message, error, context)
    }
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
      level: 'info',
      type: 'request',
      data: {
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
    }
    
    this.writeLog(logEntry)
  }

  /**
   * 记录限流日志
   * @param {string} type - 限流类型
   * @param {string} identifier - 标识符
   * @param {Object} details - 详细信息
   */
  logRateLimit(type, identifier, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      type: 'rate_limit',
      data: {
        type,
        identifier,
        details
      }
    }
    
    this.writeLog(logEntry)
  }

  /**
   * 记录封禁日志
   * @param {string} type - 封禁类型
   * @param {string} identifier - 标识符
   * @param {string} reason - 封禁原因
   * @param {Object} details - 详细信息
   */
  logBan(type, identifier, reason, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      type: 'ban',
      data: {
        type,
        identifier,
        reason,
        details
      }
    }
    
    this.writeLog(logEntry)
  }

  /**
   * 记录异常日志
   * @param {string} type - 异常类型
   * @param {Object} details - 详细信息
   */
  logAnomaly(type, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      type: 'anomaly',
      data: {
        type,
        details
      }
    }
    
    this.writeLog(logEntry)
  }

  /**
   * 记录错误日志
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   */
  logError(message, error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      type: 'error',
      data: {
        message,
        error: error.message,
        stack: error.stack,
        context
      }
    }
    
    this.writeLog(logEntry)
  }

  /**
   * 写入日志
   * @param {Object} logEntry - 日志条目
   */
  writeLog(logEntry) {
    // 控制台输出
    if (this.config.logConfig.enableConsole) {
      const level = logEntry.level.toUpperCase()
      const message = this.formatLogMessage(logEntry)
      console.log(`[${level}] ${message}`)
    }
    
    // 文件输出
    if (this.config.logConfig.enableFile) {
      this.writeLogToFile(logEntry)
    }
  }

  /**
   * 格式化日志消息
   * @param {Object} logEntry - 日志条目
   * @returns {string} 格式化的消息
   */
  formatLogMessage(logEntry) {
    if (this.config.logConfig.logFormat === 'json') {
      return JSON.stringify(logEntry)
    } else {
      const { timestamp, level, type, data } = logEntry
      return `${timestamp} [${level}] ${type}: ${JSON.stringify(data)}`
    }
  }

  /**
   * 写入日志文件
   * @param {Object} logEntry - 日志条目
   */
  writeLogToFile(logEntry) {
    try {
      const message = this.formatLogMessage(logEntry) + '\n'
      
      // 检查文件大小，必要时轮转
      if (this.config.logConfig.enableRotation) {
        this.rotateLogFileIfNeeded()
      }
      
      fs.appendFileSync(this.config.logConfig.logFile, message)
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }

  /**
   * 轮转日志文件
   */
  rotateLogFileIfNeeded() {
    try {
      if (fs.existsSync(this.config.logConfig.logFile)) {
        const stats = fs.statSync(this.config.logConfig.logFile)
        if (stats.size >= this.config.logConfig.maxFileSize) {
          // 轮转现有文件
          for (let i = this.config.logConfig.maxFiles - 1; i > 0; i--) {
            const oldFile = `${this.config.logConfig.logFile}.${i}`
            const newFile = `${this.config.logConfig.logFile}.${i + 1}`
            if (fs.existsSync(oldFile)) {
              fs.renameSync(oldFile, newFile)
            }
          }
          
          // 移动当前文件
          fs.renameSync(this.config.logConfig.logFile, `${this.config.logConfig.logFile}.1`)
        }
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error)
    }
  }

  /**
   * 启动监控
   */
  startMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
    }
    
    this.monitoringTimer = setInterval(() => {
      this.performMonitoring()
    }, this.config.monitoringInterval)
  }

  /**
   * 执行监控检查
   */
  performMonitoring() {
    // 清理过期数据
    this.cleanupExpiredData()
    
    // 检查告警
    if (this.config.enableAlerts) {
      this.checkAlerts()
    }
    
    // 记录监控指标
    this.recordMonitoringMetrics()
  }

  /**
   * 检查告警
   */
  checkAlerts() {
    const now = Date.now()
    const windowStart = now - this.config.monitoringInterval
    
    // 计算当前窗口的指标
    const currentRequests = this.timeWindows.requests.filter(r => r.timestamp >= windowStart)
    const currentErrors = this.timeWindows.errors.filter(e => e.timestamp >= windowStart)
    const currentBans = this.timeWindows.bans.filter(b => b.timestamp >= windowStart)
    const currentAnomalies = this.timeWindows.anomalies.filter(a => a.timestamp >= windowStart)
    
    // 检查请求频率告警
    const requestRate = currentRequests.length / (this.config.monitoringInterval / 60000)
    if (requestRate > this.config.alertThresholds.highRequestRate) {
      this.triggerAlert('HIGH_REQUEST_RATE', {
        currentRate: requestRate,
        threshold: this.config.alertThresholds.highRequestRate
      })
    }
    
    // 检查错误率告警
    const errorRate = currentErrors.length / Math.max(currentRequests.length, 1)
    if (errorRate > this.config.alertThresholds.highErrorRate) {
      this.triggerAlert('HIGH_ERROR_RATE', {
        currentRate: errorRate,
        threshold: this.config.alertThresholds.highErrorRate
      })
    }
    
    // 检查异常率告警
    const anomalyRate = currentAnomalies.length / Math.max(currentRequests.length, 1)
    if (anomalyRate > this.config.alertThresholds.highAnomalyRate) {
      this.triggerAlert('HIGH_ANOMALY_RATE', {
        currentRate: anomalyRate,
        threshold: this.config.alertThresholds.highAnomalyRate
      })
    }
    
    // 检查封禁率告警
    const banRate = currentBans.length / (this.config.monitoringInterval / 60000)
    if (banRate > this.config.alertThresholds.highBanRate) {
      this.triggerAlert('HIGH_BAN_RATE', {
        currentRate: banRate,
        threshold: this.config.alertThresholds.highBanRate
      })
    }
    
    // 检查响应时间告警
    const avgResponseTime = this.calculateAverageResponseTime(currentRequests)
    if (avgResponseTime > this.config.alertThresholds.highResponseTime) {
      this.triggerAlert('HIGH_RESPONSE_TIME', {
        currentTime: avgResponseTime,
        threshold: this.config.alertThresholds.highResponseTime
      })
    }
    
    // 检查成功率告警
    const successRate = currentRequests.filter(r => r.allowed).length / Math.max(currentRequests.length, 1)
    if (successRate < this.config.alertThresholds.lowSuccessRate) {
      this.triggerAlert('LOW_SUCCESS_RATE', {
        currentRate: successRate,
        threshold: this.config.alertThresholds.lowSuccessRate
      })
    }
  }

  /**
   * 触发告警
   * @param {string} alertType - 告警类型
   * @param {Object} data - 告警数据
   */
  triggerAlert(alertType, data) {
    const alertKey = `${alertType}_${Math.floor(Date.now() / this.config.monitoringInterval)}`
    
    // 防止重复告警
    if (this.alertStates.has(alertKey)) {
      return
    }
    
    this.alertStates.set(alertKey, true)
    
    const alert = {
      timestamp: new Date().toISOString(),
      type: alertType,
      data,
      severity: this.getAlertSeverity(alertType)
    }
    
    // 发送告警
    this.sendAlert(alert)
    
    // 记录告警日志
    if (this.config.enableLogging) {
      this.logAlert(alert)
    }
  }

  /**
   * 获取告警严重程度
   * @param {string} alertType - 告警类型
   * @returns {string} 严重程度
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'HIGH_REQUEST_RATE': 'warning',
      'HIGH_ERROR_RATE': 'error',
      'HIGH_ANOMALY_RATE': 'warning',
      'HIGH_BAN_RATE': 'error',
      'HIGH_RESPONSE_TIME': 'warning',
      'LOW_SUCCESS_RATE': 'error'
    }
    
    return severityMap[alertType] || 'info'
  }

  /**
   * 发送告警
   * @param {Object} alert - 告警信息
   */
  sendAlert(alert) {
    // 控制台告警
    if (this.config.alertChannels.includes('console')) {
      console.warn(`[ALERT] ${alert.type}: ${JSON.stringify(alert.data)}`)
    }
    
    // Webhook告警
    if (this.config.alertChannels.includes('webhook') && this.config.webhookUrl) {
      this.sendWebhookAlert(alert)
    }
  }

  /**
   * 发送Webhook告警
   * @param {Object} alert - 告警信息
   */
  async sendWebhookAlert(alert) {
    try {
      // 这里可以集成实际的HTTP客户端发送webhook
      console.log(`[WEBHOOK] Sending alert to ${this.config.webhookUrl}:`, alert)
    } catch (error) {
      console.error('Failed to send webhook alert:', error)
    }
  }

  /**
   * 记录告警日志
   * @param {Object} alert - 告警信息
   */
  logAlert(alert) {
    const logEntry = {
      timestamp: alert.timestamp,
      level: 'warn',
      type: 'alert',
      data: alert
    }
    
    this.writeLog(logEntry)
  }

  /**
   * 计算平均响应时间
   * @param {Array} requests - 请求列表
   * @returns {number} 平均响应时间
   */
  calculateAverageResponseTime(requests) {
    const validRequests = requests.filter(r => r.processingTime !== undefined)
    if (validRequests.length === 0) return 0
    
    const totalTime = validRequests.reduce((sum, r) => sum + r.processingTime, 0)
    return totalTime / validRequests.length
  }

  /**
   * 清理过期数据
   */
  cleanupExpiredData() {
    const now = Date.now()
    const cutoff = now - this.config.dataRetention
    
    // 清理时间窗口数据
    for (const [key, data] of Object.entries(this.timeWindows)) {
      this.timeWindows[key] = data.filter(item => item.timestamp > cutoff)
    }
    
    // 清理告警状态
    for (const [key, timestamp] of this.alertStates.entries()) {
      if (timestamp < cutoff) {
        this.alertStates.delete(key)
      }
    }
  }

  /**
   * 记录监控指标
   */
  recordMonitoringMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      timeWindows: {
        requests: this.timeWindows.requests.length,
        errors: this.timeWindows.errors.length,
        bans: this.timeWindows.bans.length,
        anomalies: this.timeWindows.anomalies.length
      }
    }
    
    if (this.config.enableLogging) {
      const logEntry = {
        timestamp: metrics.timestamp,
        level: 'info',
        type: 'metrics',
        data: metrics
      }
      
      this.writeLog(logEntry)
    }
  }

  /**
   * 获取监控指标
   * @returns {Object} 指标数据
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.count > 0 
      ? this.metrics.responseTime.total / this.metrics.responseTime.count 
      : 0
    
    return {
      ...this.metrics,
      responseTime: {
        ...this.metrics.responseTime,
        average: avgResponseTime
      }
    }
  }

  /**
   * 获取实时统计
   * @returns {Object} 实时统计
   */
  getRealTimeStats() {
    const now = Date.now()
    const windowStart = now - this.config.monitoringInterval
    
    const recentRequests = this.timeWindows.requests.filter(r => r.timestamp >= windowStart)
    const recentErrors = this.timeWindows.errors.filter(e => e.timestamp >= windowStart)
    const recentBans = this.timeWindows.bans.filter(b => b.timestamp >= windowStart)
    const recentAnomalies = this.timeWindows.anomalies.filter(a => a.timestamp >= windowStart)
    
    return {
      timestamp: new Date().toISOString(),
      window: {
        duration: this.config.monitoringInterval,
        start: new Date(windowStart).toISOString(),
        end: new Date(now).toISOString()
      },
      requests: {
        total: recentRequests.length,
        allowed: recentRequests.filter(r => r.allowed).length,
        blocked: recentRequests.filter(r => !r.allowed).length,
        rate: recentRequests.length / (this.config.monitoringInterval / 60000)
      },
      errors: {
        total: recentErrors.length,
        rate: recentErrors.length / Math.max(recentRequests.length, 1)
      },
      bans: {
        total: recentBans.length,
        rate: recentBans.length / (this.config.monitoringInterval / 60000)
      },
      anomalies: {
        total: recentAnomalies.length,
        rate: recentAnomalies.length / Math.max(recentRequests.length, 1)
      },
      responseTime: {
        average: this.calculateAverageResponseTime(recentRequests),
        max: Math.max(...recentRequests.map(r => r.processingTime || 0), 0),
        min: Math.min(...recentRequests.map(r => r.processingTime || Infinity), Infinity)
      }
    }
  }

  /**
   * 销毁监控系统
   */
  destroy() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
    }
    
    if (this.logFileHandle) {
      fs.closeSync(this.logFileHandle)
    }
  }
}

module.exports = SecurityMonitor