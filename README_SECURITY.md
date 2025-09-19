# 微信小程序接口安全防护系统

一套完整的接口安全防护解决方案，防止用户恶意刷接口，保护您的应用免受攻击。

## 🛡️ 核心功能

### 1. 多维度限流
- **IP限流**：基于客户端IP地址限制请求频率
- **用户限流**：基于用户ID限制请求频率  
- **设备限流**：基于设备ID限制请求频率
- **滑动窗口**：支持固定窗口和滑动窗口两种限流模式
- **黑白名单**：支持IP黑白名单机制

### 2. 智能行为分析
- **请求模式分析**：分析用户的正常请求行为模式
- **异常检测**：自动检测频率异常、端点访问异常等
- **地理位置分析**：检测地理位置异常变化
- **User-Agent分析**：识别可疑的爬虫和自动化工具

### 3. 自动防护机制
- **自动封禁**：检测到恶意行为时自动封禁
- **多级封禁**：支持IP、用户、设备三个级别的封禁
- **封禁管理**：支持手动封禁和解除封禁
- **封禁时长**：支持自定义封禁持续时间

### 4. 实时监控告警
- **实时监控**：监控接口访问情况、错误率、响应时间等
- **告警机制**：支持控制台、Webhook等多种告警渠道
- **日志记录**：详细记录所有安全事件和异常行为
- **统计分析**：提供丰富的统计数据和报表

## 📁 文件结构

```
utils/
├── rateLimiter.js          # 限流工具类
├── requestTracker.js       # 请求追踪器
├── securityMiddleware.js   # 安全中间件
├── securityConfig.js       # 配置管理系统
├── securityMonitor.js      # 监控系统
└── apiProtection.js        # API防护包装器

docs/
└── api-security-guide.md   # 详细使用指南

examples/
└── security-test.js        # 测试示例
```

## 🚀 快速开始

### 1. 基本使用

```javascript
const apiProtection = require('./utils/apiProtection.js')

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

### 2. 在微信小程序中使用

```javascript
// pages/game/game.js
const apiProtection = require('../../utils/apiProtection.js')

Page({
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

## ⚙️ 配置说明

### 限流配置

```javascript
const securityConfig = require('./utils/securityConfig.js')

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

### 安全配置

```javascript
// 启用自动封禁
securityConfig.set('security.enableAutoBan', true)
securityConfig.set('security.banThreshold', 10) // 10次可疑活动后封禁
securityConfig.set('security.banDuration', 3600000) // 封禁1小时

// 启用各种验证
securityConfig.set('security.enableIPValidation', true)
securityConfig.set('security.enableUserAgentValidation', true)
```

### 监控配置

```javascript
// 启用监控和告警
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

## 📊 监控和管理

### 获取统计信息

```javascript
const stats = apiProtection.getSecurityStats()
console.log('安全统计:', stats)
```

### 手动封禁

```javascript
// 封禁IP
apiProtection.ban('ip', '192.168.1.100', '恶意攻击', 3600000)

// 封禁用户
apiProtection.ban('user', 'user123', '刷接口', 1800000)

// 封禁设备
apiProtection.ban('device', 'device456', '异常行为', 7200000)
```

### 解除封禁

```javascript
// 解除IP封禁
apiProtection.unban('ip', '192.168.1.100')

// 解除用户封禁
apiProtection.unban('user', 'user123')

// 解除设备封禁
apiProtection.unban('device', 'device456')
```

## 🧪 测试

运行测试示例：

```bash
node examples/security-test.js
```

测试包括：
- 限流功能测试
- 行为分析测试
- 自动封禁测试
- 配置管理测试
- 监控功能测试

## 📈 性能优化

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

## 🔧 故障排除

### 正常用户被误封
- 检查限流参数是否过于严格
- 查看用户的具体行为模式
- 考虑将用户IP加入白名单

### 防护效果不明显
- 检查是否启用了所有防护功能
- 调整限流参数和封禁阈值
- 查看监控数据，分析攻击模式

### 性能问题
- 检查监控间隔是否过短
- 调整数据保留时间
- 考虑减少日志记录频率

## 📚 详细文档

更多详细信息请参考：
- [API安全防护指南](./docs/api-security-guide.md)
- [水印功能指南](./docs/watermark-guide.md)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

本项目采用MIT许可证，详见[LICENSE](./LICENSE)文件。

## 🔄 更新日志

- **v1.0.0**: 初始版本，支持基本的限流和防护功能
- **v1.1.0**: 添加行为分析和异常检测
- **v1.2.0**: 添加监控和告警功能
- **v1.3.0**: 优化性能和配置管理

---

**注意**: 这是一个演示项目，在生产环境中使用前请根据实际需求进行充分测试和配置调整。