/**
 * API保护服务
 * 集成多种防护策略：限流、防刷、IP过滤、请求验证等
 */

const crypto = require('crypto');
const { RateLimitMiddleware } = require('./middleware');
const MemoryStore = require('./stores/memory-store');

class ApiProtectionService {
  constructor(options = {}) {
    this.options = {
      // 基础配置
      enabled: options.enabled !== false,
      logLevel: options.logLevel || 'info',
      
      // 限流配置
      rateLimit: options.rateLimit || {
        windowMs: 60 * 1000,
        max: 100
      },
      
      // IP过滤配置
      ipFilter: options.ipFilter || {
        whitelist: [],
        blacklist: [],
        autoBlock: true,
        blockDuration: 24 * 60 * 60 * 1000, // 24小时
        maxViolations: 10 // 最大违规次数
      },
      
      // 请求验证配置
      requestValidation: options.requestValidation || {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        requireUserAgent: true,
        blockSuspiciousUserAgents: true
      },
      
      // 防刷配置
      antiBrush: options.antiBrush || {
        enabled: true,
        duplicateWindow: 5 * 1000, // 5秒内的重复请求
        maxDuplicates: 3,
        fingerprintHeaders: ['user-agent', 'accept', 'accept-language']
      },
      
      // 蜜罐配置
      honeypot: options.honeypot || {
        enabled: true,
        paths: ['/admin', '/wp-admin', '/.env', '/config'],
        autoBlock: true
      },
      
      // 地理位置过滤
      geoFilter: options.geoFilter || {
        enabled: false,
        allowedCountries: [],
        blockedCountries: []
      },
      
      // 存储配置
      store: options.store
    };

    // 初始化存储
    if (!this.options.store) {
      this.options.store = new MemoryStore();
    }

    // 初始化限流中间件
    this.rateLimiter = new RateLimitMiddleware({
      ...this.options.rateLimit,
      store: this.options.store
    });

    // 违规记录
    this.violations = new Map();
    
    // 请求指纹缓存
    this.requestFingerprints = new Map();
    
    // 可疑用户代理列表
    this.suspiciousUserAgents = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http/i
    ];

    // 启动清理任务
    this.startCleanupTasks();
  }

  /**
   * 创建保护中间件
   */
  createMiddleware() {
    return async (req, res, next) => {
      if (!this.options.enabled) {
        return next();
      }

      try {
        // 1. IP过滤检查
        const ipCheckResult = await this.checkIpFilter(req);
        if (!ipCheckResult.allowed) {
          return this.blockRequest(res, ipCheckResult.reason, 403);
        }

        // 2. 蜜罐检查
        const honeypotResult = await this.checkHoneypot(req);
        if (!honeypotResult.allowed) {
          // 蜜罐触发时，记录但可能不直接阻止
          this.logSecurity('honeypot', req, honeypotResult.reason);
          if (this.options.honeypot.autoBlock) {
            this.addToBlacklist(this.getClientIp(req), 'honeypot-triggered');
            return this.blockRequest(res, 'Access denied', 404);
          }
        }

        // 3. 请求验证
        const validationResult = await this.validateRequest(req);
        if (!validationResult.valid) {
          return this.blockRequest(res, validationResult.reason, 400);
        }

        // 4. 防刷检查
        const antiBrushResult = await this.checkAntiBrush(req);
        if (!antiBrushResult.allowed) {
          return this.blockRequest(res, antiBrushResult.reason, 429);
        }

        // 5. 地理位置过滤
        if (this.options.geoFilter.enabled) {
          const geoResult = await this.checkGeoFilter(req);
          if (!geoResult.allowed) {
            return this.blockRequest(res, geoResult.reason, 403);
          }
        }

        // 6. 限流检查
        return this.rateLimiter.middleware()(req, res, next);

      } catch (error) {
        this.log('error', 'Protection middleware error:', error);
        // 出错时允许请求通过
        next();
      }
    };
  }

  /**
   * IP过滤检查
   */
  async checkIpFilter(req) {
    const ip = this.getClientIp(req);
    
    // 检查黑名单
    if (this.options.ipFilter.blacklist.includes(ip)) {
      return { allowed: false, reason: 'IP在黑名单中' };
    }

    // 检查白名单（如果配置了白名单，则只允许白名单IP）
    if (this.options.ipFilter.whitelist.length > 0) {
      if (!this.options.ipFilter.whitelist.includes(ip)) {
        return { allowed: false, reason: 'IP不在白名单中' };
      }
    }

    // 检查自动封禁
    if (this.options.ipFilter.autoBlock) {
      const violations = this.violations.get(ip);
      if (violations && violations.count >= this.options.ipFilter.maxViolations) {
        if (Date.now() - violations.lastViolation < this.options.ipFilter.blockDuration) {
          return { allowed: false, reason: 'IP因多次违规被自动封禁' };
        } else {
          // 封禁期已过，重置违规计数
          this.violations.delete(ip);
        }
      }
    }

    return { allowed: true };
  }

  /**
   * 蜜罐检查
   */
  async checkHoneypot(req) {
    if (!this.options.honeypot.enabled) {
      return { allowed: true };
    }

    const path = req.path || req.url;
    const isHoneypotPath = this.options.honeypot.paths.some(honeypotPath => 
      path.toLowerCase().includes(honeypotPath.toLowerCase())
    );

    if (isHoneypotPath) {
      return { 
        allowed: false, 
        reason: `访问蜜罐路径: ${path}` 
      };
    }

    return { allowed: true };
  }

  /**
   * 请求验证
   */
  async validateRequest(req) {
    // 检查请求方法
    if (!this.options.requestValidation.allowedMethods.includes(req.method)) {
      return { 
        valid: false, 
        reason: `不允许的请求方法: ${req.method}` 
      };
    }

    // 检查User-Agent
    if (this.options.requestValidation.requireUserAgent) {
      const userAgent = req.get('User-Agent');
      if (!userAgent) {
        return { 
          valid: false, 
          reason: '缺少User-Agent头' 
        };
      }

      // 检查可疑User-Agent
      if (this.options.requestValidation.blockSuspiciousUserAgents) {
        const isSuspicious = this.suspiciousUserAgents.some(pattern => 
          pattern.test(userAgent)
        );
        if (isSuspicious) {
          return { 
            valid: false, 
            reason: `可疑的User-Agent: ${userAgent}` 
          };
        }
      }
    }

    // 检查请求体大小
    if (req.get('Content-Length')) {
      const contentLength = parseInt(req.get('Content-Length'));
      if (contentLength > this.options.requestValidation.maxBodySize) {
        return { 
          valid: false, 
          reason: `请求体过大: ${contentLength} bytes` 
        };
      }
    }

    return { valid: true };
  }

  /**
   * 防刷检查
   */
  async checkAntiBrush(req) {
    if (!this.options.antiBrush.enabled) {
      return { allowed: true };
    }

    const fingerprint = this.generateRequestFingerprint(req);
    const now = Date.now();
    
    const existing = this.requestFingerprints.get(fingerprint);
    if (existing) {
      const timeDiff = now - existing.lastSeen;
      
      if (timeDiff < this.options.antiBrush.duplicateWindow) {
        existing.count++;
        existing.lastSeen = now;
        
        if (existing.count > this.options.antiBrush.maxDuplicates) {
          return { 
            allowed: false, 
            reason: `重复请求过于频繁: ${existing.count}次` 
          };
        }
      } else {
        // 重置计数
        existing.count = 1;
        existing.lastSeen = now;
      }
    } else {
      this.requestFingerprints.set(fingerprint, {
        count: 1,
        lastSeen: now,
        ip: this.getClientIp(req)
      });
    }

    return { allowed: true };
  }

  /**
   * 地理位置过滤检查
   */
  async checkGeoFilter(req) {
    // 这里需要集成地理位置服务（如MaxMind GeoIP）
    // 示例实现
    const ip = this.getClientIp(req);
    const country = await this.getCountryByIp(ip);
    
    if (!country) {
      return { allowed: true }; // 无法确定地理位置时允许通过
    }

    // 检查允许的国家
    if (this.options.geoFilter.allowedCountries.length > 0) {
      if (!this.options.geoFilter.allowedCountries.includes(country)) {
        return { 
          allowed: false, 
          reason: `国家不在允许列表中: ${country}` 
        };
      }
    }

    // 检查禁止的国家
    if (this.options.geoFilter.blockedCountries.includes(country)) {
      return { 
        allowed: false, 
        reason: `国家在禁止列表中: ${country}` 
      };
    }

    return { allowed: true };
  }

  /**
   * 生成请求指纹
   */
  generateRequestFingerprint(req) {
    const elements = [
      req.method,
      req.path || req.url,
      this.getClientIp(req)
    ];

    // 添加指定的头部信息
    this.options.antiBrush.fingerprintHeaders.forEach(header => {
      const value = req.get(header);
      if (value) {
        elements.push(value);
      }
    });

    // 对于POST请求，可以包含部分请求体信息
    if (req.method === 'POST' && req.body) {
      const bodyStr = JSON.stringify(req.body);
      elements.push(crypto.createHash('md5').update(bodyStr).digest('hex'));
    }

    return crypto.createHash('sha256')
      .update(elements.join('|'))
      .digest('hex');
  }

  /**
   * 获取客户端IP
   */
  getClientIp(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.get('X-Forwarded-For') ||
           req.get('X-Real-IP') ||
           'unknown';
  }

  /**
   * 根据IP获取国家（示例实现）
   */
  async getCountryByIp(ip) {
    // 这里应该集成真实的地理位置服务
    // 例如：MaxMind GeoIP2、ip-api.com等
    try {
      // 示例：使用免费的ip-api服务
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      const data = await response.json();
      return data.countryCode;
    } catch (error) {
      this.log('warn', 'Failed to get country by IP:', error);
      return null;
    }
  }

  /**
   * 阻止请求
   */
  blockRequest(res, reason, statusCode = 403) {
    this.log('warn', `Request blocked: ${reason}`);
    
    res.status(statusCode).json({
      error: '请求被拒绝',
      message: statusCode === 429 ? '请求过于频繁' : '访问被拒绝',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录违规
   */
  recordViolation(ip, reason) {
    if (!this.options.ipFilter.autoBlock) {
      return;
    }

    const existing = this.violations.get(ip);
    if (existing) {
      existing.count++;
      existing.lastViolation = Date.now();
      existing.reasons.push(reason);
    } else {
      this.violations.set(ip, {
        count: 1,
        firstViolation: Date.now(),
        lastViolation: Date.now(),
        reasons: [reason]
      });
    }

    this.logSecurity('violation', { ip }, `违规记录: ${reason}`);
  }

  /**
   * 添加到黑名单
   */
  addToBlacklist(ip, reason) {
    if (!this.options.ipFilter.blacklist.includes(ip)) {
      this.options.ipFilter.blacklist.push(ip);
      this.logSecurity('blacklist', { ip }, `IP已加入黑名单: ${reason}`);
    }
  }

  /**
   * 从黑名单移除
   */
  removeFromBlacklist(ip) {
    const index = this.options.ipFilter.blacklist.indexOf(ip);
    if (index > -1) {
      this.options.ipFilter.blacklist.splice(index, 1);
      this.logSecurity('blacklist', { ip }, 'IP已从黑名单移除');
    }
  }

  /**
   * 安全日志
   */
  logSecurity(type, req, message) {
    const logData = {
      timestamp: new Date().toISOString(),
      type,
      ip: typeof req === 'object' && req.ip ? req.ip : (req.ip || this.getClientIp(req)),
      userAgent: typeof req === 'object' && req.get ? req.get('User-Agent') : undefined,
      url: typeof req === 'object' && req.originalUrl ? req.originalUrl : undefined,
      message
    };

    this.log('warn', `[SECURITY] ${type.toUpperCase()}:`, logData);
    
    // 这里可以发送到安全监控系统
    // 例如：Sentry、LogRocket、自定义安全中心等
  }

  /**
   * 日志记录
   */
  log(level, message, ...args) {
    if (this.shouldLog(level)) {
      console[level](`[API-PROTECTION] ${message}`, ...args);
    }
  }

  /**
   * 判断是否应该记录日志
   */
  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.options.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 启动清理任务
   */
  startCleanupTasks() {
    // 清理请求指纹缓存
    setInterval(() => {
      const now = Date.now();
      const expiredKeys = [];
      
      for (const [key, data] of this.requestFingerprints.entries()) {
        if (now - data.lastSeen > this.options.antiBrush.duplicateWindow * 10) {
          expiredKeys.push(key);
        }
      }
      
      expiredKeys.forEach(key => this.requestFingerprints.delete(key));
      
      if (expiredKeys.length > 0) {
        this.log('debug', `Cleaned up ${expiredKeys.length} expired request fingerprints`);
      }
    }, 60 * 1000); // 每分钟清理一次

    // 清理违规记录
    setInterval(() => {
      const now = Date.now();
      const expiredIps = [];
      
      for (const [ip, data] of this.violations.entries()) {
        if (now - data.lastViolation > this.options.ipFilter.blockDuration) {
          expiredIps.push(ip);
        }
      }
      
      expiredIps.forEach(ip => this.violations.delete(ip));
      
      if (expiredIps.length > 0) {
        this.log('debug', `Cleaned up ${expiredIps.length} expired violation records`);
      }
    }, 60 * 60 * 1000); // 每小时清理一次
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      enabled: this.options.enabled,
      blacklistedIps: this.options.ipFilter.blacklist.length,
      whitelistedIps: this.options.ipFilter.whitelist.length,
      violationRecords: this.violations.size,
      requestFingerprints: this.requestFingerprints.size,
      rateLimitStats: this.options.store.getStats ? this.options.store.getStats() : null
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const stats = this.getStats();
    const storeHealth = this.options.store.healthCheck ? 
      await this.options.store.healthCheck() : 
      { status: 'unknown' };

    return {
      status: 'healthy',
      protection: stats,
      store: storeHealth,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 销毁服务
   */
  destroy() {
    // 清理定时器等资源
    this.violations.clear();
    this.requestFingerprints.clear();
    
    if (this.options.store && this.options.store.destroy) {
      this.options.store.destroy();
    }
  }
}

module.exports = ApiProtectionService;