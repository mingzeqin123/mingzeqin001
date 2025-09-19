/**
 * 配置示例文件
 * 复制此文件为 config.js 并根据需要修改配置
 */

module.exports = {
  // 基础配置
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    trustProxy: true
  },

  // Redis 配置
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'rate-limit:',
    keyExpiration: 7200, // 2小时
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true
    }
  },

  // 全局限流配置
  globalRateLimit: {
    enabled: true,
    windowMs: 60 * 1000,        // 1分钟
    max: 1000,                  // 每分钟1000次请求
    strategy: 'sliding-window',
    message: '全局请求频率过高，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
  },

  // API保护配置
  apiProtection: {
    enabled: true,
    logLevel: 'info', // debug, info, warn, error

    // 限流配置
    rateLimit: {
      windowMs: 60 * 1000,
      max: 100,
      strategy: 'sliding-window'
    },

    // IP过滤配置
    ipFilter: {
      whitelist: [
        // '192.168.1.1',
        // '10.0.0.1'
      ],
      blacklist: [
        // '192.168.1.100'
      ],
      autoBlock: true,
      blockDuration: 24 * 60 * 60 * 1000, // 24小时
      maxViolations: 5,
      // 可信代理IP（用于获取真实客户端IP）
      trustedProxies: [
        '127.0.0.1',
        '::1',
        'loopback',
        'linklocal',
        'uniquelocal'
      ]
    },

    // 请求验证配置
    requestValidation: {
      maxBodySize: 10 * 1024 * 1024, // 10MB
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      requireUserAgent: true,
      blockSuspiciousUserAgents: true,
      // 可疑用户代理模式
      suspiciousUserAgentPatterns: [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python-requests/i,
        /java/i,
        /go-http/i
      ]
    },

    // 防刷配置
    antiBrush: {
      enabled: true,
      duplicateWindow: 5 * 1000,  // 5秒
      maxDuplicates: 3,
      fingerprintHeaders: [
        'user-agent',
        'accept',
        'accept-language',
        'accept-encoding'
      ],
      // 忽略的路径（不进行防刷检查）
      ignorePaths: [
        '/health',
        '/ping',
        '/favicon.ico'
      ]
    },

    // 蜜罐配置
    honeypot: {
      enabled: true,
      autoBlock: true,
      paths: [
        '/admin',
        '/wp-admin',
        '/wp-login.php',
        '/.env',
        '/config',
        '/phpmyadmin',
        '/mysql',
        '/database',
        '/backup',
        '/test',
        '/debug',
        '/api/v1/admin',
        '/administrator'
      ]
    },

    // 地理位置过滤配置
    geoFilter: {
      enabled: false,
      // MaxMind GeoIP2 数据库路径
      geoipDatabase: './data/GeoLite2-Country.mmdb',
      // 允许的国家代码（ISO 3166-1 alpha-2）
      allowedCountries: [
        // 'CN', 'US', 'JP'
      ],
      // 禁止的国家代码
      blockedCountries: [
        // 'XX'
      ]
    }
  },

  // 特定路由的限流配置
  routeConfigs: {
    // 登录接口
    login: {
      windowMs: 15 * 60 * 1000,   // 15分钟
      max: 5,                     // 最多5次尝试
      keyGenerator: (req) => `login_${req.ip}`,
      message: '登录尝试过于频繁，请15分钟后再试',
      onLimitReached: (req, res) => {
        // 记录登录攻击
        console.log(`Login attack detected from ${req.ip}`);
        res.status(429).json({
          error: '登录尝试过于频繁',
          retryAfter: 15 * 60
        });
      }
    },

    // 注册接口
    register: {
      windowMs: 60 * 60 * 1000,   // 1小时
      max: 3,                     // 最多3次注册
      keyGenerator: (req) => `register_${req.ip}`,
      message: '注册尝试过于频繁，请1小时后再试'
    },

    // 密码重置接口
    passwordReset: {
      windowMs: 60 * 60 * 1000,   // 1小时
      max: 3,                     // 最多3次重置
      keyGenerator: (req) => `reset_${req.body.email || req.ip}`,
      message: '密码重置请求过于频繁，请1小时后再试'
    },

    // 文件上传接口
    upload: {
      windowMs: 60 * 1000,        // 1分钟
      max: 5,                     // 最多5次上传
      keyGenerator: (req) => `upload_${req.user?.id || req.ip}`,
      message: '上传过于频繁，请稍后再试'
    },

    // 搜索接口
    search: {
      windowMs: 60 * 1000,        // 1分钟
      max: 30,                    // 最多30次搜索
      strategy: 'sliding-window',
      keyGenerator: (req) => `search_${req.ip}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: true
    },

    // API接口
    api: {
      windowMs: 60 * 60 * 1000,   // 1小时
      max: 1000,                  // 最多1000次调用
      keyGenerator: (req) => {
        const apiKey = req.get('X-API-Key');
        return apiKey ? `api_${apiKey}` : `ip_${req.ip}`;
      },
      skipIf: (req) => {
        // 跳过没有API密钥的请求
        return !req.get('X-API-Key');
      }
    }
  },

  // 监控配置
  monitoring: {
    enabled: true,
    // 统计信息更新间隔
    statsInterval: 60 * 1000,     // 1分钟
    // 清理间隔
    cleanupInterval: 60 * 60 * 1000, // 1小时
    // Prometheus 指标端点
    metricsEnabled: true,
    metricsPath: '/metrics',
    // 健康检查配置
    healthCheck: {
      path: '/health',
      includeDetails: true
    }
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json', // json, simple
    // 日志文件配置
    file: {
      enabled: false,
      filename: 'logs/rate-limiter.log',
      maxSize: '10m',
      maxFiles: 5
    },
    // 安全事件日志
    security: {
      enabled: true,
      filename: 'logs/security.log',
      events: [
        'rate_limit_exceeded',
        'ip_blocked',
        'honeypot_triggered',
        'suspicious_activity'
      ]
    }
  },

  // 通知配置
  notifications: {
    enabled: false,
    // Webhook 通知
    webhook: {
      url: process.env.WEBHOOK_URL,
      events: ['ip_blocked', 'honeypot_triggered'],
      timeout: 5000
    },
    // 邮件通知
    email: {
      enabled: false,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      events: ['critical_attack', 'system_error']
    }
  },

  // 缓存配置
  cache: {
    enabled: true,
    // 缓存 TTL（秒）
    ttl: 300,
    // 最大缓存条目数
    maxSize: 1000,
    // 缓存的数据类型
    types: ['geoip', 'user_type', 'api_key_info']
  },

  // 开发环境特殊配置
  development: {
    // 开发环境下的宽松配置
    rateLimit: {
      max: 1000,  // 更高的限制
      windowMs: 60 * 1000
    },
    // 禁用某些安全检查
    skipSecurityChecks: ['user-agent', 'honeypot'],
    // 启用调试信息
    debug: true
  },

  // 测试环境配置
  test: {
    rateLimit: {
      max: 10000,  // 测试时不限制
      windowMs: 1000
    },
    skipAllChecks: true
  }
};