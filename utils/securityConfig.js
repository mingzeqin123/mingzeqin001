/**
 * 安全配置管理系统
 * 提供灵活的配置管理和动态调整功能
 */

class SecurityConfig {
  constructor() {
    // 默认配置
    this.defaultConfig = {
      // 限流配置
      rateLimit: {
        windowMs: 60000, // 1分钟
        maxRequests: 60, // 每分钟60次
        windowSize: 10, // 滑动窗口大小
        enableIPLimit: true,
        enableUserLimit: true,
        enableDeviceLimit: true,
        enableSlidingWindow: true,
        blacklistIPs: [],
        whitelistIPs: []
      },
      
      // 请求追踪配置
      tracking: {
        analysisWindow: 300000, // 5分钟
        anomalyThreshold: 0.8,
        patternWindow: 3600000, // 1小时
        enableBehaviorAnalysis: true,
        enableAnomalyDetection: true,
        enableGeoAnalysis: true,
        maxRecords: 10000
      },
      
      // 安全中间件配置
      security: {
        enableRateLimit: true,
        enableRequestTracking: true,
        enableIPValidation: true,
        enableUserAgentValidation: true,
        enableRefererValidation: false,
        enableRequestSizeLimit: true,
        enableResponseTimeMonitoring: true,
        enableAutoBan: true,
        banThreshold: 10,
        banDuration: 3600000, // 1小时
        enableLogging: true,
        logLevel: 'info',
        maxRequestSize: 10 * 1024 * 1024, // 10MB
        allowedDomains: [],
        suspiciousIPs: []
      },
      
      // 接口特定配置
      endpoints: {
        // 默认配置
        default: {
          rateLimit: {
            windowMs: 60000,
            maxRequests: 60
          },
          security: {
            enableRateLimit: true,
            enableRequestTracking: true,
            enableAutoBan: true
          }
        },
        
        // 登录接口配置
        '/api/login': {
          rateLimit: {
            windowMs: 300000, // 5分钟
            maxRequests: 5 // 5分钟内最多5次登录尝试
          },
          security: {
            enableRateLimit: true,
            enableRequestTracking: true,
            enableAutoBan: true,
            banThreshold: 3 // 3次失败就封禁
          }
        },
        
        // 注册接口配置
        '/api/register': {
          rateLimit: {
            windowMs: 3600000, // 1小时
            maxRequests: 3 // 1小时内最多3次注册
          },
          security: {
            enableRateLimit: true,
            enableRequestTracking: true,
            enableAutoBan: true,
            banThreshold: 2
          }
        },
        
        // 游戏接口配置
        '/api/game': {
          rateLimit: {
            windowMs: 60000,
            maxRequests: 120 // 游戏接口允许更高频率
          },
          security: {
            enableRateLimit: true,
            enableRequestTracking: true,
            enableAutoBan: false // 游戏接口不自动封禁
          }
        },
        
        // 上传接口配置
        '/api/upload': {
          rateLimit: {
            windowMs: 300000, // 5分钟
            maxRequests: 10
          },
          security: {
            enableRateLimit: true,
            enableRequestTracking: true,
            enableRequestSizeLimit: true,
            maxRequestSize: 50 * 1024 * 1024, // 50MB
            enableAutoBan: true,
            banThreshold: 5
          }
        }
      },
      
      // 监控配置
      monitoring: {
        enableMetrics: true,
        enableAlerts: true,
        alertThresholds: {
          highRequestRate: 1000, // 每分钟1000次请求
          highErrorRate: 0.1, // 10%错误率
          highAnomalyRate: 0.05, // 5%异常率
          highBanRate: 10 // 每分钟10次封禁
        },
        alertChannels: ['console', 'webhook'],
        webhookUrl: null
      },
      
      // 日志配置
      logging: {
        enableConsole: true,
        enableFile: false,
        logFile: './logs/security.log',
        logLevel: 'info',
        logFormat: 'json',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        enableRotation: true
      }
    }
    
    // 当前配置
    this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig))
    
    // 配置变更监听器
    this.configChangeListeners = []
    
    // 配置验证规则
    this.validationRules = {
      rateLimit: {
        windowMs: { type: 'number', min: 1000, max: 3600000 },
        maxRequests: { type: 'number', min: 1, max: 10000 },
        windowSize: { type: 'number', min: 1, max: 100 }
      },
      security: {
        banThreshold: { type: 'number', min: 1, max: 1000 },
        banDuration: { type: 'number', min: 60000, max: 86400000 },
        maxRequestSize: { type: 'number', min: 1024, max: 100 * 1024 * 1024 }
      }
    }
  }

  /**
   * 获取配置
   * @param {string} path - 配置路径，如 'rateLimit.windowMs'
   * @param {*} defaultValue - 默认值
   * @returns {*} 配置值
   */
  get(path, defaultValue = null) {
    const keys = path.split('.')
    let current = this.currentConfig
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return defaultValue
      }
    }
    
    return current
  }

  /**
   * 设置配置
   * @param {string} path - 配置路径
   * @param {*} value - 配置值
   * @param {boolean} validate - 是否验证配置
   * @returns {boolean} 是否设置成功
   */
  set(path, value, validate = true) {
    if (validate && !this.validateConfigValue(path, value)) {
      return false
    }
    
    const keys = path.split('.')
    const lastKey = keys.pop()
    let current = this.currentConfig
    
    // 创建嵌套对象
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }
    
    const oldValue = current[lastKey]
    current[lastKey] = value
    
    // 触发配置变更事件
    this.notifyConfigChange(path, oldValue, value)
    
    return true
  }

  /**
   * 批量设置配置
   * @param {Object} configs - 配置对象
   * @param {boolean} validate - 是否验证配置
   * @returns {Object} 设置结果
   */
  setMultiple(configs, validate = true) {
    const results = {}
    
    for (const [path, value] of Object.entries(configs)) {
      results[path] = this.set(path, value, validate)
    }
    
    return results
  }

  /**
   * 获取接口特定配置
   * @param {string} endpoint - 接口端点
   * @returns {Object} 接口配置
   */
  getEndpointConfig(endpoint) {
    const endpointConfig = this.get(`endpoints.${endpoint}`) || {}
    const defaultConfig = this.get('endpoints.default') || {}
    
    // 合并配置，接口特定配置优先
    return this.mergeConfigs(defaultConfig, endpointConfig)
  }

  /**
   * 设置接口特定配置
   * @param {string} endpoint - 接口端点
   * @param {Object} config - 配置对象
   * @returns {boolean} 是否设置成功
   */
  setEndpointConfig(endpoint, config) {
    return this.set(`endpoints.${endpoint}`, config)
  }

  /**
   * 重置配置为默认值
   * @param {string} path - 配置路径，为空则重置所有配置
   */
  reset(path = null) {
    if (path) {
      const keys = path.split('.')
      const lastKey = keys.pop()
      let current = this.currentConfig
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key]
        } else {
          return
        }
      }
      
      if (current && lastKey in current) {
        const defaultValue = this.getDefaultValue(path)
        if (defaultValue !== null) {
          current[lastKey] = defaultValue
          this.notifyConfigChange(path, current[lastKey], defaultValue)
        }
      }
    } else {
      this.currentConfig = JSON.parse(JSON.stringify(this.defaultConfig))
      this.notifyConfigChange('*', null, this.currentConfig)
    }
  }

  /**
   * 验证配置值
   * @param {string} path - 配置路径
   * @param {*} value - 配置值
   * @returns {boolean} 是否有效
   */
  validateConfigValue(path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    
    // 查找验证规则
    let rules = this.validationRules
    for (const key of keys) {
      if (rules && rules[key]) {
        rules = rules[key]
      } else {
        return true // 没有验证规则，认为有效
      }
    }
    
    const rule = rules[lastKey]
    if (!rule) {
      return true // 没有验证规则，认为有效
    }
    
    // 类型验证
    if (rule.type && typeof value !== rule.type) {
      return false
    }
    
    // 数值范围验证
    if (rule.min !== undefined && value < rule.min) {
      return false
    }
    
    if (rule.max !== undefined && value > rule.max) {
      return false
    }
    
    // 枚举值验证
    if (rule.enum && !rule.enum.includes(value)) {
      return false
    }
    
    // 正则表达式验证
    if (rule.pattern && !rule.pattern.test(value)) {
      return false
    }
    
    return true
  }

  /**
   * 获取默认值
   * @param {string} path - 配置路径
   * @returns {*} 默认值
   */
  getDefaultValue(path) {
    const keys = path.split('.')
    let current = this.defaultConfig
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return null
      }
    }
    
    return current
  }

  /**
   * 合并配置对象
   * @param {Object} defaultConfig - 默认配置
   * @param {Object} specificConfig - 特定配置
   * @returns {Object} 合并后的配置
   */
  mergeConfigs(defaultConfig, specificConfig) {
    const result = { ...defaultConfig }
    
    for (const [key, value] of Object.entries(specificConfig)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.mergeConfigs(result[key] || {}, value)
      } else {
        result[key] = value
      }
    }
    
    return result
  }

  /**
   * 添加配置变更监听器
   * @param {Function} listener - 监听器函数
   */
  addConfigChangeListener(listener) {
    this.configChangeListeners.push(listener)
  }

  /**
   * 移除配置变更监听器
   * @param {Function} listener - 监听器函数
   */
  removeConfigChangeListener(listener) {
    const index = this.configChangeListeners.indexOf(listener)
    if (index > -1) {
      this.configChangeListeners.splice(index, 1)
    }
  }

  /**
   * 通知配置变更
   * @param {string} path - 配置路径
   * @param {*} oldValue - 旧值
   * @param {*} newValue - 新值
   */
  notifyConfigChange(path, oldValue, newValue) {
    for (const listener of this.configChangeListeners) {
      try {
        listener(path, oldValue, newValue)
      } catch (error) {
        console.error('Config change listener error:', error)
      }
    }
  }

  /**
   * 导出配置
   * @param {string} path - 配置路径，为空则导出所有配置
   * @returns {Object} 配置对象
   */
  export(path = null) {
    if (path) {
      return this.get(path)
    } else {
      return JSON.parse(JSON.stringify(this.currentConfig))
    }
  }

  /**
   * 导入配置
   * @param {Object} config - 配置对象
   * @param {boolean} validate - 是否验证配置
   * @returns {Object} 导入结果
   */
  import(config, validate = true) {
    const results = {}
    
    if (validate) {
      // 验证所有配置
      for (const [section, sectionConfig] of Object.entries(config)) {
        if (typeof sectionConfig === 'object' && sectionConfig !== null) {
          for (const [key, value] of Object.entries(sectionConfig)) {
            const path = `${section}.${key}`
            results[path] = this.validateConfigValue(path, value)
          }
        }
      }
      
      // 如果有验证失败，不导入配置
      if (Object.values(results).some(result => !result)) {
        return { success: false, errors: results }
      }
    }
    
    // 导入配置
    this.currentConfig = this.mergeConfigs(this.currentConfig, config)
    this.notifyConfigChange('*', null, this.currentConfig)
    
    return { success: true }
  }

  /**
   * 获取配置统计信息
   * @returns {Object} 统计信息
   */
  getConfigStats() {
    const stats = {
      totalSections: Object.keys(this.currentConfig).length,
      totalEndpoints: Object.keys(this.currentConfig.endpoints || {}).length,
      listenersCount: this.configChangeListeners.length,
      lastModified: new Date().toISOString()
    }
    
    return stats
  }

  /**
   * 热重载配置
   * @param {Object} newConfig - 新配置
   * @returns {boolean} 是否重载成功
   */
  hotReload(newConfig) {
    try {
      const oldConfig = this.export()
      const importResult = this.import(newConfig, true)
      
      if (importResult.success) {
        this.notifyConfigChange('*', oldConfig, this.currentConfig)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Hot reload failed:', error)
      return false
    }
  }
}

// 创建全局配置实例
const securityConfig = new SecurityConfig()

module.exports = securityConfig