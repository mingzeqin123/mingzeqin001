# API安全防护指南

本文档介绍如何在微信小程序中实现接口安全防护，防止用户恶意刷接口。

## 功能特性

### 1. 接口限流
- **基于时间窗口的请求限制**：支持固定窗口和滑动窗口两种模式
- **多维度限流**：支持IP、用户ID、设备ID三个维度的限流
- **灵活配置**：可以为不同接口设置不同的限流参数
- **黑白名单**：支持IP黑白名单机制

### 2. 行为分析
- **请求模式分析**：分析用户的请求行为模式
- **异常检测**：自动检测异常行为，如频率异常、端点访问异常等
- **地理位置分析**：检测地理位置异常变化
- **User-Agent分析**：检测可疑的User-Agent

### 3. 自动防护
- **自动封禁**：检测到恶意行为时自动封禁
- **多级封禁**：支持IP、用户、设备三个级别的封禁
- **封禁管理**：支持手动封禁和解除封禁

### 4. 监控告警
- **实时监控**：实时监控接口访问情况
- **告警机制**：支持多种告警渠道
- **日志记录**：详细记录所有安全事件

## 快速开始

### 1. 基本使用

```javascript
const apiProtection = require('../../utils/apiProtection.js')

// 创建受保护的API端点
const protectedAPI = apiProtection.createProtectedEndpoint('/api/game/score', async (requestInfo) => {
  // 你的业务逻辑
  return {
    success: true,
    data: { score: 100 }
  }
})

// 调用受保护的API
const requestInfo = {
  ip: '127.0.0.1',
  userId: 'user123',
  deviceId: 'device456',
  endpoint: '/api/game/score',
  userAgent: 'WeChat-MiniProgram',
  referer: 'https://servicewechat.com'
}

const result = await protectedAPI(requestInfo)
```

### 2. 在页面中使用

```javascript
// pages/game/game.js
const apiProtection = require('../../utils/apiProtection.js')

Page({
  // 记录高分
  async recordHighScore(score) {
    const requestInfo = {
      ip: '127.0.0.1',
      userId: getApp().globalData.userInfo?.openId || 'anonymous',
      deviceId: wx.getSystemInfoSync().deviceId || 'unknown',
      endpoint: '/api/game/score',
      userAgent: 'WeChat-MiniProgram',
      referer: 'https://servicewechat.com'
    }

    const protectedAPI = apiProtection.createProtectedEndpoint('/api/game/score', async (reqInfo) => {
      // 服务器端逻辑
      return { success: true, score: reqInfo.score }
    })

    const result = await protectedAPI(requestInfo)
    
    if (result.success) {
      console.log('高分记录成功')
    } else {
      console.warn('高分记录失败:', result.error)
    }
  }
})
```

## 配置说明

### 1. 限流配置

```javascript
const securityConfig = require('../../utils/securityConfig.js')

// 设置全局限流参数
securityConfig.set('rateLimit.windowMs', 60000) // 1分钟
securityConfig.set('rateLimit.maxRequests', 60) // 每分钟60次

// 设置接口特定配置
securityConfig.setEndpointConfig('/api/game/score', {
  rateLimit: {
    windowMs: 60000,
    maxRequests: 120 // 游戏接口允许更高频率
  }
})
```

### 2. 安全配置

```javascript
// 启用自动封禁
securityConfig.set('security.enableAutoBan', true)
securityConfig.set('security.banThreshold', 10) // 10次可疑活动后封禁
securityConfig.set('security.banDuration', 3600000) // 封禁1小时

// 启用IP验证
securityConfig.set('security.enableIPValidation', true)

// 启用User-Agent验证
securityConfig.set('security.enableUserAgentValidation', true)
```

### 3. 监控配置

```javascript
// 启用监控
securityConfig.set('monitoring.enableMetrics', true)
securityConfig.set('monitoring.enableAlerts', true)

// 设置告警阈值
securityConfig.set('monitoring.alertThresholds.highRequestRate', 1000)
securityConfig.set('monitoring.alertThresholds.highErrorRate', 0.1)

// 启用日志记录
securityConfig.set('logging.enableConsole', true)
securityConfig.set('logging.enableFile', true)
securityConfig.set('logging.logFile', './logs/security.log')
```

## 接口配置示例

### 1. 游戏接口配置

```javascript
// 游戏接口允许较高频率，不自动封禁
securityConfig.setEndpointConfig('/api/game', {
  rateLimit: {
    windowMs: 60000,
    maxRequests: 120
  },
  security: {
    enableRateLimit: true,
    enableRequestTracking: true,
    enableAutoBan: false
  }
})
```

### 2. 登录接口配置

```javascript
// 登录接口严格限制，快速封禁
securityConfig.setEndpointConfig('/api/login', {
  rateLimit: {
    windowMs: 300000, // 5分钟
    maxRequests: 5 // 5分钟内最多5次
  },
  security: {
    enableRateLimit: true,
    enableRequestTracking: true,
    enableAutoBan: true,
    banThreshold: 3 // 3次失败就封禁
  }
})
```

### 3. 上传接口配置

```javascript
// 上传接口限制文件大小和频率
securityConfig.setEndpointConfig('/api/upload', {
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
})
```

## 监控和告警

### 1. 获取统计信息

```javascript
const stats = apiProtection.getSecurityStats()
console.log('安全统计:', stats)
```

### 2. 手动封禁

```javascript
// 封禁IP
apiProtection.ban('ip', '192.168.1.100', '恶意攻击', 3600000)

// 封禁用户
apiProtection.ban('user', 'user123', '刷接口', 1800000)

// 封禁设备
apiProtection.ban('device', 'device456', '异常行为', 7200000)
```

### 3. 解除封禁

```javascript
// 解除IP封禁
apiProtection.unban('ip', '192.168.1.100')

// 解除用户封禁
apiProtection.unban('user', 'user123')

// 解除设备封禁
apiProtection.unban('device', 'device456')
```

## 最佳实践

### 1. 合理设置限流参数
- 根据接口特性设置不同的限流参数
- 游戏接口可以设置较高的频率限制
- 登录、注册等敏感接口应该设置严格的限制

### 2. 启用多层防护
- 同时启用IP、用户、设备三个维度的限流
- 启用行为分析和异常检测
- 启用自动封禁机制

### 3. 监控和告警
- 启用实时监控
- 设置合理的告警阈值
- 定期查看安全日志

### 4. 定期维护
- 定期清理过期数据
- 分析安全日志，调整防护策略
- 更新黑名单和白名单

## 注意事项

1. **性能影响**：安全防护会增加一定的处理时间，建议在测试环境中评估性能影响
2. **配置管理**：建议将配置集中管理，便于维护和调整
3. **日志管理**：定期清理日志文件，避免占用过多存储空间
4. **错误处理**：确保在安全防护失败时能够优雅降级

## 故障排除

### 1. 正常用户被误封
- 检查限流参数是否过于严格
- 查看用户的具体行为模式
- 考虑将用户IP加入白名单

### 2. 防护效果不明显
- 检查是否启用了所有防护功能
- 调整限流参数和封禁阈值
- 查看监控数据，分析攻击模式

### 3. 性能问题
- 检查监控间隔是否过短
- 调整数据保留时间
- 考虑减少日志记录频率

## 更新日志

- v1.0.0: 初始版本，支持基本的限流和防护功能
- v1.1.0: 添加行为分析和异常检测
- v1.2.0: 添加监控和告警功能
- v1.3.0: 优化性能和配置管理