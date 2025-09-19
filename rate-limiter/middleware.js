/**
 * 接口限流中间件
 * 支持多种限流策略：滑动窗口、令牌桶、固定窗口
 */

class RateLimitMiddleware {
  constructor(options = {}) {
    this.options = {
      windowMs: options.windowMs || 60 * 1000, // 时间窗口，默认1分钟
      max: options.max || 100, // 最大请求数
      strategy: options.strategy || 'sliding-window', // 限流策略
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      skipIf: options.skipIf || (() => false),
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      onLimitReached: options.onLimitReached || this.defaultOnLimitReached,
      store: options.store, // 存储实例（Redis或Memory）
      message: options.message || '请求过于频繁，请稍后再试',
      standardHeaders: options.standardHeaders !== false,
      legacyHeaders: options.legacyHeaders !== false,
      // 白名单IP
      whitelist: options.whitelist || [],
      // 黑名单IP
      blacklist: options.blacklist || [],
      // 动态限流配置
      dynamicConfig: options.dynamicConfig || false
    }

    // 如果没有提供store，使用默认的内存store
    if (!this.options.store) {
      const MemoryStore = require('./stores/memory-store');
      this.options.store = new MemoryStore();
    }
  }

  /**
   * 默认key生成器
   */
  defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * 默认限流回调
   */
  defaultOnLimitReached(req, res, next) {
    res.status(429).json({
      error: this.options.message,
      retryAfter: Math.ceil(this.options.windowMs / 1000)
    });
  }

  /**
   * 检查IP是否在白名单
   */
  isWhitelisted(ip) {
    return this.options.whitelist.includes(ip);
  }

  /**
   * 检查IP是否在黑名单
   */
  isBlacklisted(ip) {
    return this.options.blacklist.includes(ip);
  }

  /**
   * 获取动态配置
   */
  async getDynamicConfig(key) {
    if (!this.options.dynamicConfig) {
      return this.options;
    }

    // 这里可以从数据库或配置中心获取动态配置
    // 示例：根据用户类型设置不同的限流规则
    const userType = await this.getUserType(key);
    switch (userType) {
      case 'premium':
        return { ...this.options, max: this.options.max * 5 };
      case 'vip':
        return { ...this.options, max: this.options.max * 10 };
      default:
        return this.options;
    }
  }

  /**
   * 获取用户类型（示例）
   */
  async getUserType(key) {
    // 这里应该根据实际业务逻辑获取用户类型
    return 'normal';
  }

  /**
   * 设置响应头
   */
  setHeaders(res, result) {
    if (this.options.standardHeaders) {
      res.set('X-RateLimit-Limit', result.limit);
      res.set('X-RateLimit-Remaining', Math.max(0, result.remaining));
      res.set('X-RateLimit-Reset', new Date(result.resetTime));
    }

    if (this.options.legacyHeaders) {
      res.set('X-Rate-Limit-Limit', result.limit);
      res.set('X-Rate-Limit-Remaining', Math.max(0, result.remaining));
      res.set('X-Rate-Limit-Reset', Math.ceil(result.resetTime / 1000));
    }

    if (result.exceeded) {
      res.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
    }
  }

  /**
   * 中间件主函数
   */
  middleware() {
    return async (req, res, next) => {
      try {
        // 跳过检查的条件
        if (this.options.skipIf(req, res)) {
          return next();
        }

        const key = this.options.keyGenerator(req);
        const ip = req.ip || req.connection.remoteAddress;

        // 黑名单检查
        if (this.isBlacklisted(ip)) {
          return res.status(403).json({
            error: '访问被拒绝',
            reason: 'IP在黑名单中'
          });
        }

        // 白名单检查
        if (this.isWhitelisted(ip)) {
          return next();
        }

        // 获取动态配置
        const config = await this.getDynamicConfig(key);

        // 执行限流检查
        const result = await this.options.store.increment(key, config);

        // 设置响应头
        this.setHeaders(res, result);

        // 检查是否超出限制
        if (result.exceeded) {
          // 记录限流事件
          this.logRateLimitEvent(req, result);
          
          // 调用限流回调
          return this.options.onLimitReached(req, res, next);
        }

        // 添加限流信息到请求对象
        req.rateLimit = result;

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // 出错时允许请求通过，避免影响正常业务
        next();
      }
    };
  }

  /**
   * 记录限流事件
   */
  logRateLimitEvent(req, result) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl || req.url,
      method: req.method,
      limit: result.limit,
      current: result.current,
      resetTime: new Date(result.resetTime).toISOString()
    };

    console.log('Rate limit exceeded:', JSON.stringify(logData));
    
    // 这里可以发送到日志系统或监控系统
    // 例如：发送到ELK、Prometheus等
  }

  /**
   * 重置指定key的限流计数
   */
  async reset(key) {
    return this.options.store.reset(key);
  }

  /**
   * 获取指定key的当前状态
   */
  async getStatus(key) {
    return this.options.store.get(key);
  }

  /**
   * 添加IP到白名单
   */
  addToWhitelist(ip) {
    if (!this.options.whitelist.includes(ip)) {
      this.options.whitelist.push(ip);
    }
  }

  /**
   * 从白名单移除IP
   */
  removeFromWhitelist(ip) {
    const index = this.options.whitelist.indexOf(ip);
    if (index > -1) {
      this.options.whitelist.splice(index, 1);
    }
  }

  /**
   * 添加IP到黑名单
   */
  addToBlacklist(ip) {
    if (!this.options.blacklist.includes(ip)) {
      this.options.blacklist.push(ip);
    }
  }

  /**
   * 从黑名单移除IP
   */
  removeFromBlacklist(ip) {
    const index = this.options.blacklist.indexOf(ip);
    if (index > -1) {
      this.options.blacklist.splice(index, 1);
    }
  }
}

/**
 * 创建限流中间件的便捷函数
 */
function createRateLimit(options) {
  const limiter = new RateLimitMiddleware(options);
  return limiter.middleware();
}

/**
 * 预设配置
 */
const presets = {
  // 严格限流：每分钟10次
  strict: {
    windowMs: 60 * 1000,
    max: 10,
    message: '请求过于频繁，请稍后再试'
  },

  // 中等限流：每分钟50次
  moderate: {
    windowMs: 60 * 1000,
    max: 50,
    message: '请求过于频繁，请稍后再试'
  },

  // 宽松限流：每分钟100次
  loose: {
    windowMs: 60 * 1000,
    max: 100,
    message: '请求过于频繁，请稍后再试'
  },

  // API限流：每小时1000次
  api: {
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: 'API调用次数超出限制，请稍后再试'
  },

  // 登录限流：每15分钟5次
  login: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => `login_${req.ip}`,
    message: '登录尝试过于频繁，请15分钟后再试'
  },

  // 注册限流：每小时3次
  register: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => `register_${req.ip}`,
    message: '注册尝试过于频繁，请1小时后再试'
  }
};

module.exports = {
  RateLimitMiddleware,
  createRateLimit,
  presets
};