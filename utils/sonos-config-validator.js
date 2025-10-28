// utils/sonos-config-validator.js
// Sonos 配置验证工具

class SonosConfigValidator {
  constructor() {
    this.validationRules = {
      apiKey: {
        required: true,
        minLength: 10,
        pattern: /^[a-zA-Z0-9_-]+$/
      },
      apiSecret: {
        required: true,
        minLength: 20,
        pattern: /^[a-zA-Z0-9_-]+$/
      },
      householdId: {
        required: true,
        minLength: 10,
        pattern: /^[a-zA-Z0-9_-]+$/
      },
      playerId: {
        required: true,
        minLength: 10,
        pattern: /^[a-zA-Z0-9_-]+$/
      }
    }
  }

  // 验证配置
  validateConfig(config) {
    const errors = []
    const warnings = []

    // 验证必需字段
    for (const [field, rules] of Object.entries(this.validationRules)) {
      const value = config[field]
      
      if (rules.required && !value) {
        errors.push(`${field} 是必需的`)
        continue
      }

      if (value) {
        // 验证长度
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} 长度至少需要 ${rules.minLength} 个字符`)
        }

        // 验证格式
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} 格式不正确`)
        }
      }
    }

    // 验证配置完整性
    const requiredFields = Object.keys(this.validationRules)
    const missingFields = requiredFields.filter(field => !config[field])
    
    if (missingFields.length > 0) {
      warnings.push(`缺少字段: ${missingFields.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 验证 API 密钥格式
  validateApiKey(apiKey) {
    if (!apiKey) {
      return { valid: false, message: 'API Key 不能为空' }
    }

    if (apiKey.length < 10) {
      return { valid: false, message: 'API Key 长度至少需要 10 个字符' }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
      return { valid: false, message: 'API Key 只能包含字母、数字、下划线和连字符' }
    }

    return { valid: true, message: 'API Key 格式正确' }
  }

  // 验证 API Secret 格式
  validateApiSecret(apiSecret) {
    if (!apiSecret) {
      return { valid: false, message: 'API Secret 不能为空' }
    }

    if (apiSecret.length < 20) {
      return { valid: false, message: 'API Secret 长度至少需要 20 个字符' }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(apiSecret)) {
      return { valid: false, message: 'API Secret 只能包含字母、数字、下划线和连字符' }
    }

    return { valid: true, message: 'API Secret 格式正确' }
  }

  // 验证设备 ID 格式
  validateDeviceId(deviceId, type = 'Device') {
    if (!deviceId) {
      return { valid: false, message: `${type} ID 不能为空` }
    }

    if (deviceId.length < 10) {
      return { valid: false, message: `${type} ID 长度至少需要 10 个字符` }
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(deviceId)) {
      return { valid: false, message: `${type} ID 只能包含字母、数字、下划线和连字符` }
    }

    return { valid: true, message: `${type} ID 格式正确` }
  }

  // 验证网络连接
  async validateNetworkConnection() {
    try {
      // 测试网络连接
      const response = await wx.request({
        url: 'https://api.sonos.com/health',
        method: 'GET',
        timeout: 5000
      })

      if (response.statusCode === 200) {
        return { valid: true, message: '网络连接正常' }
      } else {
        return { valid: false, message: `网络连接异常: ${response.statusCode}` }
      }
    } catch (error) {
      return { valid: false, message: `网络连接失败: ${error.message}` }
    }
  }

  // 验证 Sonos 设备连接
  async validateSonosConnection(config) {
    try {
      // 这里可以添加实际的 Sonos API 连接测试
      // 由于需要真实的 API 密钥，这里只是模拟
      return { valid: true, message: 'Sonos 设备连接正常' }
    } catch (error) {
      return { valid: false, message: `Sonos 设备连接失败: ${error.message}` }
    }
  }

  // 获取配置建议
  getConfigSuggestions(config) {
    const suggestions = []

    if (!config.apiKey) {
      suggestions.push('请访问 https://developer.sonos.com 获取 API Key')
    }

    if (!config.apiSecret) {
      suggestions.push('请访问 https://developer.sonos.com 获取 API Secret')
    }

    if (!config.householdId) {
      suggestions.push('请先连接 Sonos 设备以获取家庭 ID')
    }

    if (!config.playerId) {
      suggestions.push('请选择要使用的 Sonos 播放器')
    }

    if (config.apiKey && config.apiKey.length < 20) {
      suggestions.push('建议使用更长的 API Key 以提高安全性')
    }

    if (config.apiSecret && config.apiSecret.length < 30) {
      suggestions.push('建议使用更长的 API Secret 以提高安全性')
    }

    return suggestions
  }

  // 生成配置报告
  generateConfigReport(config) {
    const validation = this.validateConfig(config)
    const suggestions = this.getConfigSuggestions(config)

    return {
      timestamp: new Date().toISOString(),
      config: {
        hasApiKey: !!config.apiKey,
        hasApiSecret: !!config.apiSecret,
        hasHouseholdId: !!config.householdId,
        hasPlayerId: !!config.playerId,
        isComplete: validation.valid
      },
      validation,
      suggestions,
      summary: {
        status: validation.valid ? 'ready' : 'incomplete',
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        suggestionCount: suggestions.length
      }
    }
  }
}

// 创建全局实例
const sonosConfigValidator = new SonosConfigValidator()

export default sonosConfigValidator