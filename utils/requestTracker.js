/**
 * 请求追踪器
 * 记录和分析用户请求行为模式，检测异常行为
 */

class RequestTracker {
  constructor(options = {}) {
    this.config = {
      // 行为分析时间窗口（毫秒）
      analysisWindow: options.analysisWindow || 300000, // 5分钟
      // 异常行为检测阈值
      anomalyThreshold: options.anomalyThreshold || 0.8,
      // 请求模式分析窗口
      patternWindow: options.patternWindow || 3600000, // 1小时
      // 是否启用行为分析
      enableBehaviorAnalysis: options.enableBehaviorAnalysis !== false,
      // 是否启用异常检测
      enableAnomalyDetection: options.enableAnomalyDetection !== false,
      // 是否启用地理位置分析
      enableGeoAnalysis: options.enableGeoAnalysis !== false,
      // 最大存储记录数
      maxRecords: options.maxRecords || 10000
    }
    
    // 请求记录存储
    this.requests = new Map()
    // 用户行为模式
    this.userPatterns = new Map()
    // 异常行为记录
    this.anomalies = new Map()
    // 地理位置记录
    this.geoData = new Map()
    
    // 清理过期数据
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.analysisWindow / 2)
  }

  /**
   * 记录请求
   * @param {Object} requestInfo - 请求信息
   */
  recordRequest(requestInfo) {
    const {
      ip,
      userId,
      deviceId,
      endpoint,
      userAgent,
      referer,
      timestamp = Date.now(),
      responseTime,
      statusCode,
      geoLocation,
      requestSize,
      responseSize
    } = requestInfo

    const requestId = this.generateRequestId()
    const record = {
      id: requestId,
      ip,
      userId,
      deviceId,
      endpoint,
      userAgent,
      referer,
      timestamp,
      responseTime,
      statusCode,
      geoLocation,
      requestSize,
      responseSize,
      isAnomaly: false
    }

    // 存储请求记录
    this.storeRequest(record)
    
    // 更新用户行为模式
    if (this.config.enableBehaviorAnalysis) {
      this.updateUserPattern(record)
    }
    
    // 检测异常行为
    if (this.config.enableAnomalyDetection) {
      const isAnomaly = this.detectAnomaly(record)
      if (isAnomaly) {
        record.isAnomaly = true
        this.recordAnomaly(record)
      }
    }
    
    // 记录地理位置信息
    if (this.config.enableGeoAnalysis && geoLocation) {
      this.recordGeoLocation(ip, geoLocation)
    }

    return record
  }

  /**
   * 存储请求记录
   * @param {Object} record - 请求记录
   */
  storeRequest(record) {
    const key = record.ip
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const requests = this.requests.get(key)
    requests.push(record)
    
    // 保持记录数量在限制范围内
    if (requests.length > this.config.maxRecords) {
      requests.splice(0, requests.length - this.config.maxRecords)
    }
  }

  /**
   * 更新用户行为模式
   * @param {Object} record - 请求记录
   */
  updateUserPattern(record) {
    const { ip, userId, deviceId, endpoint, timestamp } = record
    const userKey = userId || deviceId || ip
    
    if (!this.userPatterns.has(userKey)) {
      this.userPatterns.set(userKey, {
        totalRequests: 0,
        endpoints: new Map(),
        timePatterns: [],
        requestSizes: [],
        responseTimes: [],
        userAgents: new Set(),
        lastActivity: timestamp,
        firstSeen: timestamp
      })
    }
    
    const pattern = this.userPatterns.get(userKey)
    pattern.totalRequests++
    pattern.lastActivity = timestamp
    
    // 记录端点访问模式
    if (!pattern.endpoints.has(endpoint)) {
      pattern.endpoints.set(endpoint, 0)
    }
    pattern.endpoints.set(endpoint, pattern.endpoints.get(endpoint) + 1)
    
    // 记录时间模式
    const hour = new Date(timestamp).getHours()
    pattern.timePatterns.push(hour)
    
    // 记录请求大小
    if (record.requestSize) {
      pattern.requestSizes.push(record.requestSize)
    }
    
    // 记录响应时间
    if (record.responseTime) {
      pattern.responseTimes.push(record.responseTime)
    }
    
    // 记录User-Agent
    if (record.userAgent) {
      pattern.userAgents.add(record.userAgent)
    }
  }

  /**
   * 检测异常行为
   * @param {Object} record - 请求记录
   * @returns {boolean} 是否为异常行为
   */
  detectAnomaly(record) {
    const { ip, userId, deviceId, endpoint, timestamp } = record
    const userKey = userId || deviceId || ip
    
    // 检查请求频率异常
    if (this.detectFrequencyAnomaly(userKey, timestamp)) {
      return true
    }
    
    // 检查端点访问异常
    if (this.detectEndpointAnomaly(userKey, endpoint)) {
      return true
    }
    
    // 检查时间模式异常
    if (this.detectTimePatternAnomaly(userKey, timestamp)) {
      return true
    }
    
    // 检查User-Agent异常
    if (this.detectUserAgentAnomaly(userKey, record.userAgent)) {
      return true
    }
    
    // 检查地理位置异常
    if (this.detectGeoAnomaly(ip, record.geoLocation)) {
      return true
    }
    
    return false
  }

  /**
   * 检测频率异常
   * @param {string} userKey - 用户标识
   * @param {number} timestamp - 时间戳
   * @returns {boolean} 是否异常
   */
  detectFrequencyAnomaly(userKey, timestamp) {
    const windowStart = timestamp - this.config.analysisWindow
    const userRequests = this.getUserRequests(userKey, windowStart)
    
    if (userRequests.length === 0) return false
    
    // 计算请求频率
    const frequency = userRequests.length / (this.config.analysisWindow / 60000) // 每分钟请求数
    
    // 获取历史平均频率
    const pattern = this.userPatterns.get(userKey)
    if (!pattern) return false
    
    const historicalFrequency = this.calculateHistoricalFrequency(userKey)
    
    // 如果当前频率超过历史平均频率的3倍，认为是异常
    return frequency > historicalFrequency * 3
  }

  /**
   * 检测端点访问异常
   * @param {string} userKey - 用户标识
   * @param {string} endpoint - 端点
   * @returns {boolean} 是否异常
   */
  detectEndpointAnomaly(userKey, endpoint) {
    const pattern = this.userPatterns.get(userKey)
    if (!pattern) return false
    
    const endpointCount = pattern.endpoints.get(endpoint) || 0
    const totalRequests = pattern.totalRequests
    
    // 如果某个端点的访问比例超过50%，可能是异常
    const endpointRatio = endpointCount / totalRequests
    return endpointRatio > 0.5
  }

  /**
   * 检测时间模式异常
   * @param {string} userKey - 用户标识
   * @param {number} timestamp - 时间戳
   * @returns {boolean} 是否异常
   */
  detectTimePatternAnomaly(userKey, timestamp) {
    const pattern = this.userPatterns.get(userKey)
    if (!pattern || pattern.timePatterns.length < 10) return false
    
    const currentHour = new Date(timestamp).getHours()
    const hourCounts = new Array(24).fill(0)
    
    // 统计历史时间模式
    pattern.timePatterns.forEach(hour => {
      hourCounts[hour]++
    })
    
    // 计算当前时间的历史访问概率
    const totalPatterns = pattern.timePatterns.length
    const currentHourProbability = hourCounts[currentHour] / totalPatterns
    
    // 如果当前时间的访问概率很低，可能是异常
    return currentHourProbability < 0.05
  }

  /**
   * 检测User-Agent异常
   * @param {string} userKey - 用户标识
   * @param {string} userAgent - User-Agent
   * @returns {boolean} 是否异常
   */
  detectUserAgentAnomaly(userKey, userAgent) {
    const pattern = this.userPatterns.get(userKey)
    if (!pattern || !userAgent) return false
    
    // 如果User-Agent与历史记录差异很大，可能是异常
    const hasSimilarUA = Array.from(pattern.userAgents).some(ua => 
      this.calculateStringSimilarity(ua, userAgent) > 0.8
    )
    
    return !hasSimilarUA && pattern.userAgents.size > 3
  }

  /**
   * 检测地理位置异常
   * @param {string} ip - IP地址
   * @param {Object} geoLocation - 地理位置信息
   * @returns {boolean} 是否异常
   */
  detectGeoAnomaly(ip, geoLocation) {
    if (!geoLocation) return false
    
    const geoKey = `${geoLocation.country}-${geoLocation.region}-${geoLocation.city}`
    const existingGeo = this.geoData.get(ip)
    
    if (!existingGeo) {
      this.geoData.set(ip, geoKey)
      return false
    }
    
    // 如果地理位置发生巨大变化，可能是异常
    return existingGeo !== geoKey
  }

  /**
   * 记录异常行为
   * @param {Object} record - 异常记录
   */
  recordAnomaly(record) {
    const key = record.ip
    if (!this.anomalies.has(key)) {
      this.anomalies.set(key, [])
    }
    
    const anomalies = this.anomalies.get(key)
    anomalies.push({
      ...record,
      detectedAt: Date.now()
    })
    
    // 保持异常记录数量
    if (anomalies.length > 100) {
      anomalies.splice(0, anomalies.length - 100)
    }
  }

  /**
   * 记录地理位置
   * @param {string} ip - IP地址
   * @param {Object} geoLocation - 地理位置信息
   */
  recordGeoLocation(ip, geoLocation) {
    this.geoData.set(ip, {
      ...geoLocation,
      lastSeen: Date.now()
    })
  }

  /**
   * 获取用户请求记录
   * @param {string} userKey - 用户标识
   * @param {number} since - 开始时间
   * @returns {Array} 请求记录
   */
  getUserRequests(userKey, since) {
    const allRequests = []
    
    for (const requests of this.requests.values()) {
      allRequests.push(...requests.filter(req => {
        const reqUserKey = req.userId || req.deviceId || req.ip
        return reqUserKey === userKey && req.timestamp >= since
      }))
    }
    
    return allRequests.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * 计算历史平均频率
   * @param {string} userKey - 用户标识
   * @returns {number} 平均频率
   */
  calculateHistoricalFrequency(userKey) {
    const pattern = this.userPatterns.get(userKey)
    if (!pattern) return 0
    
    const timeSpan = pattern.lastActivity - pattern.firstSeen
    if (timeSpan === 0) return 0
    
    return pattern.totalRequests / (timeSpan / 60000) // 每分钟请求数
  }

  /**
   * 计算字符串相似度
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} 相似度（0-1）
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0
    if (str1 === str2) return 1
    
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1
    
    const editDistance = this.calculateEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * 计算编辑距离
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} 编辑距离
   */
  calculateEditDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * 生成请求ID
   * @returns {string} 请求ID
   */
  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取异常行为统计
   * @returns {Object} 异常统计
   */
  getAnomalyStats() {
    const stats = {
      totalAnomalies: 0,
      anomaliesByIP: new Map(),
      anomaliesByType: new Map(),
      recentAnomalies: []
    }
    
    for (const [ip, anomalies] of this.anomalies.entries()) {
      stats.totalAnomalies += anomalies.length
      stats.anomaliesByIP.set(ip, anomalies.length)
      
      anomalies.forEach(anomaly => {
        const type = this.classifyAnomaly(anomaly)
        const count = stats.anomaliesByType.get(type) || 0
        stats.anomaliesByType.set(type, count + 1)
        
        if (anomaly.detectedAt > Date.now() - 3600000) { // 最近1小时
          stats.recentAnomalies.push(anomaly)
        }
      })
    }
    
    return stats
  }

  /**
   * 分类异常行为
   * @param {Object} anomaly - 异常记录
   * @returns {string} 异常类型
   */
  classifyAnomaly(anomaly) {
    // 根据异常特征分类
    if (anomaly.frequency > 100) return 'HIGH_FREQUENCY'
    if (anomaly.endpointRatio > 0.8) return 'SINGLE_ENDPOINT'
    if (anomaly.timePattern) return 'UNUSUAL_TIME'
    if (anomaly.userAgent) return 'SUSPICIOUS_UA'
    if (anomaly.geoLocation) return 'GEO_ANOMALY'
    return 'UNKNOWN'
  }

  /**
   * 清理过期数据
   */
  cleanup() {
    const now = Date.now()
    const cutoff = now - this.config.patternWindow
    
    // 清理请求记录
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(req => req.timestamp > cutoff)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
    
    // 清理异常记录
    for (const [key, anomalies] of this.anomalies.entries()) {
      const validAnomalies = anomalies.filter(anomaly => anomaly.detectedAt > cutoff)
      if (validAnomalies.length === 0) {
        this.anomalies.delete(key)
      } else {
        this.anomalies.set(key, validAnomalies)
      }
    }
  }

  /**
   * 销毁追踪器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.requests.clear()
    this.userPatterns.clear()
    this.anomalies.clear()
    this.geoData.clear()
  }
}

module.exports = RequestTracker