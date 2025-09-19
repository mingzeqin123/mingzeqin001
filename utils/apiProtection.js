/**
 * API防护包装器
 * 为微信小程序API提供统一的安全防护
 */

const SecurityMiddleware = require('./securityMiddleware')
const SecurityMonitor = require('./securityMonitor')
const securityConfig = require('./securityConfig')

class APIProtection {
  constructor() {
    // 初始化安全中间件
    this.securityMiddleware = new SecurityMiddleware(securityConfig.get('security'))
    
    // 初始化监控系统
    this.monitor = new SecurityMonitor(securityConfig.get('monitoring'))
    
    // 绑定配置变更监听器
    securityConfig.addConfigChangeListener((path, oldValue, newValue) => {
      this.handleConfigChange(path, oldValue, newValue)
    })
  }

  /**
   * 包装API函数，添加安全防护
   * @param {Function} apiFunction - 原始API函数
   * @param {Object} options - 配置选项
   * @returns {Function} 包装后的API函数
   */
  wrapAPI(apiFunction, options = {}) {
    return async (requestInfo) => {
      const startTime = Date.now()
      
      try {
        // 1. 安全验证
        const securityResult = await this.securityMiddleware.processRequest(requestInfo)
        
        if (!securityResult.allowed) {
          // 记录被阻止的请求
          this.monitor.recordRequest(requestInfo, securityResult, Date.now() - startTime)
          
          // 返回错误响应
          return this.createErrorResponse(securityResult)
        }
        
        // 2. 执行原始API函数
        const result = await apiFunction(requestInfo)
        
        // 3. 记录成功的请求
        this.monitor.recordRequest(requestInfo, securityResult, Date.now() - startTime)
        
        // 4. 添加安全头
        if (result && typeof result === 'object') {
          result.securityInfo = {
            securityLevel: securityResult.securityLevel,
            warnings: securityResult.warnings,
            processingTime: Date.now() - startTime
          }
        }
        
        return result
        
      } catch (error) {
        // 记录错误
        this.monitor.recordError('API execution error', error, requestInfo)
        
        // 返回错误响应
        return this.createErrorResponse({
          allowed: false,
          reason: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        })
      }
    }
  }

  /**
   * 创建受保护的API端点
   * @param {string} endpoint - 端点路径
   * @param {Function} handler - 处理函数
   * @param {Object} options - 配置选项
   * @returns {Function} 受保护的API函数
   */
  createProtectedEndpoint(endpoint, handler, options = {}) {
    // 获取端点特定配置
    const endpointConfig = securityConfig.getEndpointConfig(endpoint)
    
    // 合并配置
    const finalOptions = {
      ...endpointConfig,
      ...options
    }
    
    return async (requestInfo) => {
      const startTime = Date.now()
      
      try {
        // 1. 安全验证
        const securityResult = await this.securityMiddleware.processRequest({
          ...requestInfo,
          endpoint
        })
        
        if (!securityResult.allowed) {
          this.monitor.recordRequest(requestInfo, securityResult, Date.now() - startTime)
          return this.createErrorResponse(securityResult)
        }
        
        // 2. 执行处理函数
        const result = await handler(requestInfo)
        
        // 3. 记录请求
        this.monitor.recordRequest(requestInfo, securityResult, Date.now() - startTime)
        
        // 4. 添加安全信息
        if (result && typeof result === 'object') {
          result.securityInfo = {
            securityLevel: securityResult.securityLevel,
            warnings: securityResult.warnings,
            processingTime: Date.now() - startTime,
            endpoint
          }
        }
        
        return result
        
      } catch (error) {
        this.monitor.recordError(`API endpoint error: ${endpoint}`, error, requestInfo)
        return this.createErrorResponse({
          allowed: false,
          reason: 'INTERNAL_ERROR',
          message: '服务器内部错误'
        })
      }
    }
  }

  /**
   * 创建错误响应
   * @param {Object} securityResult - 安全验证结果
   * @returns {Object} 错误响应
   */
  createErrorResponse(securityResult) {
    const response = {
      success: false,
      error: {
        code: securityResult.reason,
        message: securityResult.message,
        securityLevel: securityResult.securityLevel || 'BLOCKED'
      }
    }
    
    if (securityResult.retryAfter > 0) {
      response.error.retryAfter = securityResult.retryAfter
    }
    
    return response
  }

  /**
   * 处理配置变更
   * @param {string} path - 配置路径
   * @param {*} oldValue - 旧值
   * @param {*} newValue - 新值
   */
  handleConfigChange(path, oldValue, newValue) {
    // 重新初始化安全中间件
    if (path.startsWith('security.') || path === 'security') {
      this.securityMiddleware.destroy()
      this.securityMiddleware = new SecurityMiddleware(securityConfig.get('security'))
    }
    
    // 重新初始化监控系统
    if (path.startsWith('monitoring.') || path === 'monitoring') {
      this.monitor.destroy()
      this.monitor = new SecurityMonitor(securityConfig.get('monitoring'))
    }
  }

  /**
   * 获取安全统计信息
   * @returns {Object} 统计信息
   */
  getSecurityStats() {
    return {
      middleware: this.securityMiddleware.getSecurityStats(),
      monitor: this.monitor.getMetrics(),
      realTime: this.monitor.getRealTimeStats()
    }
  }

  /**
   * 手动封禁
   * @param {string} type - 封禁类型 (ip, user, device)
   * @param {string} identifier - 标识符
   * @param {string} reason - 封禁原因
   * @param {number} duration - 封禁时长（毫秒）
   */
  ban(type, identifier, reason, duration) {
    switch (type) {
      case 'ip':
        this.securityMiddleware.banIP(identifier, reason, duration)
        break
      case 'user':
        this.securityMiddleware.banUser(identifier, reason, duration)
        break
      case 'device':
        this.securityMiddleware.banDevice(identifier, reason, duration)
        break
    }
    
    this.monitor.recordBan(type, identifier, reason)
  }

  /**
   * 解除封禁
   * @param {string} type - 封禁类型
   * @param {string} identifier - 标识符
   */
  unban(type, identifier) {
    switch (type) {
      case 'ip':
        this.securityMiddleware.removeFromBlacklist(identifier)
        break
      case 'user':
        // 用户封禁解除需要重新实现
        break
      case 'device':
        // 设备封禁解除需要重新实现
        break
    }
  }

  /**
   * 销毁API防护
   */
  destroy() {
    this.securityMiddleware.destroy()
    this.monitor.destroy()
  }
}

// 创建全局API防护实例
const apiProtection = new APIProtection()

module.exports = apiProtection