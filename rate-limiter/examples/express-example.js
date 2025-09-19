/**
 * Express.js 集成示例
 * 演示如何在Express应用中使用接口防刷系统
 */

const express = require('express');
const redis = require('redis');
const { createRateLimit, presets } = require('../middleware');
const ApiProtectionService = require('../api-protection');
const RedisStore = require('../stores/redis-store');
const MemoryStore = require('../stores/memory-store');

// 创建Express应用
const app = express();

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1);

// 示例1：基础限流配置
const basicRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false
});

// 示例2：使用Redis存储的分布式限流
let redisStore = null;
if (process.env.REDIS_URL) {
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis连接错误:', err);
  });
  
  redisClient.connect().then(() => {
    console.log('Redis连接成功');
    redisStore = new RedisStore(redisClient);
  });
}

const distributedRateLimit = createRateLimit({
  store: redisStore || new MemoryStore(),
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    // 可以根据用户ID或IP生成key
    return req.user?.id || req.ip;
  }
});

// 示例3：API保护服务配置
const apiProtection = new ApiProtectionService({
  enabled: true,
  logLevel: 'info',
  
  // 限流配置
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
    store: redisStore || new MemoryStore()
  },
  
  // IP过滤配置
  ipFilter: {
    whitelist: [], // 白名单IP
    blacklist: [], // 黑名单IP
    autoBlock: true,
    blockDuration: 24 * 60 * 60 * 1000, // 24小时
    maxViolations: 5
  },
  
  // 请求验证配置
  requestValidation: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    requireUserAgent: true,
    blockSuspiciousUserAgents: true
  },
  
  // 防刷配置
  antiBrush: {
    enabled: true,
    duplicateWindow: 5 * 1000, // 5秒
    maxDuplicates: 3,
    fingerprintHeaders: ['user-agent', 'accept', 'accept-language']
  },
  
  // 蜜罐配置
  honeypot: {
    enabled: true,
    paths: ['/admin', '/wp-admin', '/.env', '/config', '/phpmyadmin'],
    autoBlock: true
  }
});

// 全局API保护中间件
app.use(apiProtection.createMiddleware());

// 路由示例

// 1. 普通API路由（使用全局保护）
app.get('/api/users', (req, res) => {
  res.json({
    message: '用户列表',
    users: [
      { id: 1, name: '用户1' },
      { id: 2, name: '用户2' }
    ]
  });
});

// 2. 严格限流的敏感API
app.post('/api/login', presets.login, (req, res) => {
  const { username, password } = req.body;
  
  // 模拟登录验证
  if (username === 'admin' && password === 'password') {
    res.json({
      success: true,
      message: '登录成功',
      token: 'mock-jwt-token'
    });
  } else {
    // 记录失败的登录尝试
    const ip = req.ip;
    apiProtection.recordViolation(ip, 'login-failed');
    
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 3. 注册接口（更严格的限流）
app.post('/api/register', presets.register, (req, res) => {
  const { username, email, password } = req.body;
  
  // 模拟注册逻辑
  res.json({
    success: true,
    message: '注册成功',
    user: { username, email }
  });
});

// 4. 文件上传接口（自定义限流）
const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 5, // 每分钟最多5次上传
  keyGenerator: (req) => `upload_${req.ip}`,
  message: '上传过于频繁，请稍后再试'
});

app.post('/api/upload', uploadRateLimit, (req, res) => {
  // 模拟文件上传
  res.json({
    success: true,
    message: '文件上传成功',
    fileId: Date.now()
  });
});

// 5. 搜索接口（滑动窗口限流）
const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
  strategy: 'sliding-window',
  keyGenerator: (req) => `search_${req.ip}`,
  skipSuccessfulRequests: false,
  skipFailedRequests: true
});

app.get('/api/search', searchRateLimit, (req, res) => {
  const { q } = req.query;
  
  res.json({
    query: q,
    results: [
      { id: 1, title: '搜索结果1' },
      { id: 2, title: '搜索结果2' }
    ]
  });
});

// 6. API密钥验证的接口（令牌桶限流）
const apiKeyRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 1000, // 令牌桶容量
  strategy: 'token-bucket',
  refillRate: 100, // 每秒补充100个令牌
  keyGenerator: (req) => {
    const apiKey = req.get('X-API-Key');
    return apiKey ? `api_${apiKey}` : `ip_${req.ip}`;
  },
  skipIf: (req) => {
    // 跳过没有API密钥的请求（会被其他中间件处理）
    return !req.get('X-API-Key');
  }
});

app.get('/api/data', apiKeyRateLimit, (req, res) => {
  const apiKey = req.get('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      error: '缺少API密钥'
    });
  }
  
  // 模拟API密钥验证
  if (apiKey !== 'valid-api-key') {
    return res.status(403).json({
      error: '无效的API密钥'
    });
  }
  
  res.json({
    data: 'API数据',
    timestamp: new Date().toISOString()
  });
});

// 管理接口

// 获取保护统计信息
app.get('/admin/protection-stats', (req, res) => {
  const stats = apiProtection.getStats();
  res.json(stats);
});

// 手动添加IP到黑名单
app.post('/admin/blacklist', (req, res) => {
  const { ip, reason } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      error: '缺少IP地址'
    });
  }
  
  apiProtection.addToBlacklist(ip, reason || 'manual');
  
  res.json({
    success: true,
    message: `IP ${ip} 已添加到黑名单`
  });
});

// 从黑名单移除IP
app.delete('/admin/blacklist/:ip', (req, res) => {
  const { ip } = req.params;
  
  apiProtection.removeFromBlacklist(ip);
  
  res.json({
    success: true,
    message: `IP ${ip} 已从黑名单移除`
  });
});

// 健康检查接口
app.get('/health', async (req, res) => {
  try {
    const health = await apiProtection.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('应用错误:', error);
  
  res.status(500).json({
    error: '内部服务器错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '服务暂时不可用'
  });
});

// 404处理
app.use((req, res) => {
  // 记录404访问（可能是扫描行为）
  const ip = req.ip;
  const path = req.path;
  
  // 检查是否是常见的扫描路径
  const scanPaths = ['/admin', '/wp-admin', '/.env', '/config', '/phpmyadmin', '/mysql'];
  const isScanAttempt = scanPaths.some(scanPath => path.includes(scanPath));
  
  if (isScanAttempt) {
    apiProtection.recordViolation(ip, `scan-attempt:${path}`);
  }
  
  res.status(404).json({
    error: '页面未找到',
    path: req.path
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT}/health 查看健康状态`);
  console.log(`访问 http://localhost:${PORT}/admin/protection-stats 查看保护统计`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  apiProtection.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  apiProtection.destroy();
  process.exit(0);
});

module.exports = app;