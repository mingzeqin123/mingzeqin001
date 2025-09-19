# 接口防刷系统

一个功能强大的接口防刷和限流系统，支持多种限流策略、防刷机制和安全防护功能。

## 🚀 特性

### 🛡️ 核心功能
- **多种限流算法**：滑动窗口、固定窗口、令牌桶
- **分布式支持**：Redis 存储，支持多服务器部署
- **内存存储**：单机部署的高性能选择
- **防刷机制**：请求指纹识别，防止重复请求攻击
- **IP 过滤**：黑白名单管理，自动封禁机制
- **蜜罐系统**：识别和阻止恶意扫描
- **请求验证**：User-Agent 检查、请求体大小限制
- **地理位置过滤**：基于国家的访问控制

### 🔧 技术特点
- **高性能**：使用 Lua 脚本确保 Redis 操作的原子性
- **易集成**：支持 Express.js、Flask 等主流框架
- **可扩展**：模块化设计，易于扩展新功能
- **监控友好**：详细的统计信息和日志记录
- **优雅降级**：Redis 故障时自动切换到内存存储

## 📦 安装

```bash
# Node.js 环境
npm install

# Python 环境
pip install flask redis
```

## 🎯 快速开始

### Node.js / Express.js

```javascript
const express = require('express');
const { createRateLimit, presets } = require('./middleware');
const ApiProtectionService = require('./api-protection');

const app = express();

// 基础限流
const basicRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后再试'
});

// 应用限流中间件
app.use('/api/', basicRateLimit);

// API保护服务
const apiProtection = new ApiProtectionService({
  rateLimit: { windowMs: 60 * 1000, max: 100 },
  ipFilter: { autoBlock: true, maxViolations: 5 },
  antiBrush: { enabled: true, maxDuplicates: 3 }
});

app.use(apiProtection.createMiddleware());

// 严格限流的登录接口
app.post('/api/login', presets.login, (req, res) => {
  // 登录逻辑
});

app.listen(3000);
```

### Python / Flask

```python
from flask import Flask
from flask_example import rate_limiter, rate_limit, anti_brush

app = Flask(__name__)

# 基础限流
@app.route('/api/users')
@rate_limit(limit=50, window=60)
def get_users():
    return {'users': []}

# 防刷 + 限流
@app.route('/api/search')
@rate_limit(limit=30, window=60)
@anti_brush(window=5, max_duplicates=3)
def search():
    return {'results': []}

# 严格限流的敏感接口
@app.route('/api/login', methods=['POST'])
@rate_limit(limit=5, window=900)  # 15分钟5次
def login():
    # 登录逻辑
    pass

app.run()
```

## 📋 配置说明

### 基础限流配置

```javascript
{
  windowMs: 60 * 1000,        // 时间窗口（毫秒）
  max: 100,                   // 最大请求数
  strategy: 'sliding-window', // 限流策略
  message: '请求过于频繁',     // 错误消息
  keyGenerator: (req) => req.ip, // Key生成函数
  store: redisStore           // 存储实例
}
```

### API保护配置

```javascript
{
  // 限流配置
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
    strategy: 'sliding-window'
  },
  
  // IP过滤配置
  ipFilter: {
    whitelist: [],              // 白名单IP
    blacklist: [],              // 黑名单IP
    autoBlock: true,            // 自动封禁
    blockDuration: 24 * 60 * 60 * 1000, // 封禁时长
    maxViolations: 5            // 最大违规次数
  },
  
  // 请求验证配置
  requestValidation: {
    maxBodySize: 10 * 1024 * 1024,      // 最大请求体
    allowedMethods: ['GET', 'POST'],     // 允许的方法
    requireUserAgent: true,              // 必须有UA
    blockSuspiciousUserAgents: true      // 阻止可疑UA
  },
  
  // 防刷配置
  antiBrush: {
    enabled: true,
    duplicateWindow: 5 * 1000,  // 重复检测窗口
    maxDuplicates: 3,           // 最大重复次数
    fingerprintHeaders: ['user-agent', 'accept']
  },
  
  // 蜜罐配置
  honeypot: {
    enabled: true,
    paths: ['/admin', '/.env'], // 蜜罐路径
    autoBlock: true             // 自动封禁访问者
  }
}
```

## 🔄 限流算法

### 1. 滑动窗口（Sliding Window）
- **原理**：维护一个时间戳列表，实时清理过期记录
- **特点**：精确控制，但内存占用较高
- **适用**：对精度要求高的场景

```javascript
createRateLimit({
  strategy: 'sliding-window',
  windowMs: 60000,
  max: 100
})
```

### 2. 固定窗口（Fixed Window）
- **原理**：按固定时间段重置计数器
- **特点**：简单高效，但可能出现突发流量
- **适用**：一般的限流场景

```javascript
createRateLimit({
  strategy: 'fixed-window',
  windowMs: 60000,
  max: 100
})
```

### 3. 令牌桶（Token Bucket）
- **原理**：以固定速率补充令牌，请求消耗令牌
- **特点**：允许突发流量，平滑限流
- **适用**：需要处理突发请求的场景

```javascript
createRateLimit({
  strategy: 'token-bucket',
  max: 100,           // 桶容量
  refillRate: 10,     // 每秒补充10个令牌
  tokensRequested: 1  // 每次请求消耗1个令牌
})
```

## 🏪 存储方案

### Redis 存储（推荐）
- **优势**：分布式、高性能、持久化
- **适用**：生产环境、多服务器部署

```javascript
const redis = require('redis');
const RedisStore = require('./stores/redis-store');

const redisClient = redis.createClient({
  url: 'redis://localhost:6379'
});

const store = new RedisStore(redisClient, {
  keyPrefix: 'rate-limit:',
  keyExpiration: 7200
});
```

### 内存存储
- **优势**：零依赖、高性能
- **适用**：单机部署、开发测试

```javascript
const MemoryStore = require('./stores/memory-store');

const store = new MemoryStore({
  cleanupInterval: 60 * 1000,
  maxSize: 10000
});
```

## 🛡️ 安全防护

### IP 过滤
```javascript
// 添加到黑名单
apiProtection.addToBlacklist('192.168.1.100', 'malicious-activity');

// 添加到白名单
apiProtection.addToWhitelist('192.168.1.1');

// 自动封禁配置
{
  ipFilter: {
    autoBlock: true,
    maxViolations: 5,           // 5次违规后自动封禁
    blockDuration: 24 * 60 * 60 * 1000 // 封禁24小时
  }
}
```

### 防刷机制
```javascript
// 请求指纹生成
fingerprintHeaders: [
  'user-agent',
  'accept', 
  'accept-language',
  'accept-encoding'
]

// 防刷配置
{
  antiBrush: {
    duplicateWindow: 5 * 1000,  // 5秒内
    maxDuplicates: 3,           // 最多3次相同请求
    enabled: true
  }
}
```

### 蜜罐系统
```javascript
{
  honeypot: {
    enabled: true,
    paths: [
      '/admin',
      '/wp-admin', 
      '/.env',
      '/config',
      '/phpmyadmin'
    ],
    autoBlock: true  // 触发蜜罐自动封禁IP
  }
}
```

## 📊 监控和统计

### 获取统计信息
```javascript
// Express.js
app.get('/admin/stats', (req, res) => {
  const stats = apiProtection.getStats();
  res.json(stats);
});

// 返回数据示例
{
  "enabled": true,
  "blacklistedIps": 5,
  "whitelistedIps": 2,
  "violationRecords": 12,
  "requestFingerprints": 156,
  "rateLimitStats": {
    "totalKeys": 1024,
    "redisConnected": true
  }
}
```

### 健康检查
```javascript
app.get('/health', async (req, res) => {
  const health = await apiProtection.healthCheck();
  res.json(health);
});
```

### 日志记录
系统会自动记录以下事件：
- 限流触发
- 违规行为
- 蜜罐访问
- IP封禁/解封
- 系统错误

```javascript
// 自定义日志处理
{
  onLimitReached: (req, res, next) => {
    console.log('Rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    
    // 发送到监控系统
    sendToMonitoring('rate_limit_exceeded', req);
    
    res.status(429).json({ error: '请求过于频繁' });
  }
}
```

## 🎛️ 预设配置

系统提供了多种预设配置：

```javascript
const { presets } = require('./middleware');

// 严格限流
app.use('/api/sensitive', presets.strict);

// 登录限流
app.post('/login', presets.login, loginHandler);

// 注册限流  
app.post('/register', presets.register, registerHandler);

// API限流
app.use('/api', presets.api);
```

预设配置详情：

| 预设 | 时间窗口 | 最大请求数 | 适用场景 |
|------|----------|------------|----------|
| strict | 1分钟 | 10次 | 敏感操作 |
| moderate | 1分钟 | 50次 | 一般API |
| loose | 1分钟 | 100次 | 公开接口 |
| api | 1小时 | 1000次 | API服务 |
| login | 15分钟 | 5次 | 登录接口 |
| register | 1小时 | 3次 | 注册接口 |

## 🔧 高级用法

### 自定义 Key 生成器
```javascript
createRateLimit({
  keyGenerator: (req) => {
    // 基于用户ID限流
    if (req.user) {
      return `user_${req.user.id}`;
    }
    // 基于API密钥限流
    const apiKey = req.get('X-API-Key');
    if (apiKey) {
      return `api_${apiKey}`;
    }
    // 默认基于IP
    return req.ip;
  }
})
```

### 动态配置
```javascript
{
  dynamicConfig: true,
  getDynamicConfig: async (key) => {
    // 根据用户类型返回不同配置
    const userType = await getUserType(key);
    switch (userType) {
      case 'premium':
        return { max: 500 };
      case 'vip':
        return { max: 1000 };
      default:
        return { max: 100 };
    }
  }
}
```

### 条件跳过
```javascript
createRateLimit({
  skipIf: (req, res) => {
    // 跳过管理员用户
    return req.user && req.user.role === 'admin';
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true
})
```

## 🚀 性能优化

### Redis 优化
```javascript
// 使用 Pipeline 批量操作
const store = new RedisStore(redisClient, {
  pipeline: true,
  keyExpiration: 7200
});

// 预加载 Lua 脚本
await store.loadScripts();
```

### 内存优化
```javascript
const memoryStore = new MemoryStore({
  cleanupInterval: 60 * 1000,  // 清理间隔
  maxSize: 10000               // 最大条目数
});
```

### 监控优化
```javascript
// 定期清理过期数据
setInterval(() => {
  store.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次
```

## 🛠️ 故障排除

### 常见问题

1. **Redis 连接失败**
   ```javascript
   // 解决方案：配置重连机制
   const redisClient = redis.createClient({
     url: 'redis://localhost:6379',
     retry_strategy: (options) => {
       if (options.error && options.error.code === 'ECONNREFUSED') {
         return new Error('Redis服务器拒绝连接');
       }
       if (options.total_retry_time > 1000 * 60 * 60) {
         return new Error('重试时间已用尽');
       }
       return Math.min(options.attempt * 100, 3000);
     }
   });
   ```

2. **内存占用过高**
   ```javascript
   // 解决方案：调整清理策略
   const store = new MemoryStore({
     cleanupInterval: 30 * 1000,  // 更频繁的清理
     maxSize: 5000                // 减少最大条目数
   });
   ```

3. **误封正常用户**
   ```javascript
   // 解决方案：调整违规阈值
   {
     ipFilter: {
       maxViolations: 10,  // 提高违规阈值
       blockDuration: 60 * 60 * 1000  // 缩短封禁时间
     }
   }
   ```

### 调试模式
```javascript
const apiProtection = new ApiProtectionService({
  logLevel: 'debug',  // 开启详细日志
  enabled: true
});
```

## 📈 部署建议

### 生产环境
- 使用 Redis 集群确保高可用
- 配置适当的限流阈值
- 启用详细的监控和告警
- 定期备份黑白名单数据

### 开发环境
- 使用内存存储降低依赖
- 设置较宽松的限流规则
- 启用调试日志

### 测试环境
- 模拟各种攻击场景
- 测试故障转移机制
- 验证性能表现

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License