/**
 * 基于Redis的分布式限流存储
 * 适用于分布式部署场景
 */

class RedisStore {
  constructor(redisClient, options = {}) {
    if (!redisClient) {
      throw new Error('Redis client is required');
    }

    this.redis = redisClient;
    this.options = {
      keyPrefix: options.keyPrefix || 'rate-limit:',
      keyExpiration: options.keyExpiration || 7200, // 默认2小时过期
      pipeline: options.pipeline !== false // 是否使用pipeline优化
    };

    // Lua脚本用于原子操作
    this.scripts = {
      slidingWindow: `
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local expiry = tonumber(ARGV[4])
        
        -- 清理过期的时间戳
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
        
        -- 获取当前计数
        local current = redis.call('ZCARD', key)
        
        if current < limit then
          -- 添加当前时间戳
          redis.call('ZADD', key, now, now)
          redis.call('EXPIRE', key, expiry)
          current = current + 1
        end
        
        -- 获取最早的时间戳
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local resetTime = now + window
        if oldest[2] then
          resetTime = tonumber(oldest[2]) + window
        end
        
        return {current, limit, resetTime}
      `,

      fixedWindow: `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        -- 计算当前窗口的开始时间
        local windowStart = math.floor(now / window) * window
        local windowKey = key .. ':' .. windowStart
        
        -- 增加计数
        local current = redis.call('INCR', windowKey)
        
        -- 设置过期时间
        if current == 1 then
          redis.call('EXPIRE', windowKey, math.ceil(window / 1000) + 1)
        end
        
        local resetTime = windowStart + window
        
        return {current, limit, resetTime}
      `,

      tokenBucket: `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local tokensRequested = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])
        local expiry = tonumber(ARGV[5])
        
        -- 获取当前令牌数和最后补充时间
        local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1]) or capacity
        local lastRefill = tonumber(bucket[2]) or now
        
        -- 计算需要补充的令牌
        local timePassed = (now - lastRefill) / 1000
        local tokensToAdd = math.floor(timePassed * refillRate)
        
        if tokensToAdd > 0 then
          tokens = math.min(capacity, tokens + tokensToAdd)
          lastRefill = now
        end
        
        local exceeded = tokens < tokensRequested
        
        if not exceeded then
          tokens = tokens - tokensRequested
        end
        
        -- 更新令牌桶状态
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
        redis.call('EXPIRE', key, expiry)
        
        -- 计算重置时间
        local tokensNeeded = math.max(0, tokensRequested - tokens)
        local timeToRefill = tokensNeeded / refillRate * 1000
        local resetTime = now + timeToRefill
        
        return {capacity - tokens, capacity, resetTime, exceeded and 1 or 0}
      `
    };

    // 预加载Lua脚本
    this.loadScripts();
  }

  /**
   * 预加载Lua脚本
   */
  async loadScripts() {
    try {
      this.scriptShas = {};
      for (const [name, script] of Object.entries(this.scripts)) {
        this.scriptShas[name] = await this.redis.script('LOAD', script);
      }
    } catch (error) {
      console.warn('Failed to preload Lua scripts:', error.message);
      // 如果预加载失败，运行时会直接执行脚本
    }
  }

  /**
   * 执行Lua脚本
   */
  async evalScript(scriptName, keys, args) {
    const sha = this.scriptShas && this.scriptShas[scriptName];
    
    if (sha) {
      try {
        return await this.redis.evalsha(sha, keys.length, ...keys, ...args);
      } catch (error) {
        if (error.message.includes('NOSCRIPT')) {
          // 脚本不存在，重新加载
          await this.loadScripts();
          return await this.redis.evalsha(this.scriptShas[scriptName], keys.length, ...keys, ...args);
        }
        throw error;
      }
    } else {
      // 直接执行脚本
      return await this.redis.eval(this.scripts[scriptName], keys.length, ...keys, ...args);
    }
  }

  /**
   * 生成Redis key
   */
  getKey(key) {
    return `${this.options.keyPrefix}${key}`;
  }

  /**
   * 增加计数
   */
  async increment(key, config) {
    const redisKey = this.getKey(key);
    const now = Date.now();
    const windowMs = config.windowMs || 60000;
    const max = config.max || 100;
    const strategy = config.strategy || 'sliding-window';
    const expiry = Math.ceil((config.windowMs || 60000) / 1000) + 60; // 额外60秒缓冲

    let result;

    try {
      switch (strategy) {
        case 'sliding-window':
          result = await this.slidingWindowIncrement(redisKey, windowMs, max, now, expiry);
          break;
        case 'fixed-window':
          result = await this.fixedWindowIncrement(redisKey, max, windowMs, now);
          break;
        case 'token-bucket':
          result = await this.tokenBucketIncrement(redisKey, config, now, expiry);
          break;
        default:
          result = await this.slidingWindowIncrement(redisKey, windowMs, max, now, expiry);
      }

      return result;
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Redis出错时的降级策略：允许请求通过
      return {
        limit: max,
        current: 0,
        remaining: max,
        exceeded: false,
        resetTime: now + windowMs
      };
    }
  }

  /**
   * 滑动窗口实现
   */
  async slidingWindowIncrement(key, windowMs, limit, now, expiry) {
    const result = await this.evalScript('slidingWindow', [key], [windowMs, limit, now, expiry]);
    const [current, max, resetTime] = result;

    return {
      limit: max,
      current,
      remaining: Math.max(0, max - current),
      exceeded: current > max,
      resetTime
    };
  }

  /**
   * 固定窗口实现
   */
  async fixedWindowIncrement(key, limit, windowMs, now) {
    const result = await this.evalScript('fixedWindow', [key], [limit, windowMs, now]);
    const [current, max, resetTime] = result;

    return {
      limit: max,
      current,
      remaining: Math.max(0, max - current),
      exceeded: current > max,
      resetTime
    };
  }

  /**
   * 令牌桶实现
   */
  async tokenBucketIncrement(key, config, now, expiry) {
    const capacity = config.max || 100;
    const refillRate = config.refillRate || capacity;
    const tokensRequested = config.tokensRequested || 1;

    const result = await this.evalScript('tokenBucket', [key], [
      capacity, refillRate, tokensRequested, now, expiry
    ]);
    const [current, max, resetTime, exceededFlag] = result;

    return {
      limit: max,
      current,
      remaining: max - current,
      exceeded: exceededFlag === 1,
      resetTime
    };
  }

  /**
   * 获取记录
   */
  async get(key) {
    const redisKey = this.getKey(key);
    
    try {
      // 尝试获取不同类型的数据
      const [zcard, count, bucket] = await Promise.all([
        this.redis.zcard(redisKey).catch(() => 0),
        this.redis.get(redisKey).catch(() => null),
        this.redis.hmget(redisKey, 'tokens', 'lastRefill').catch(() => [null, null])
      ]);

      if (zcard > 0) {
        // 滑动窗口数据
        const ttl = await this.redis.ttl(redisKey);
        return {
          count: zcard,
          resetTime: Date.now() + (ttl * 1000),
          remaining: 0 // 需要更多信息才能计算准确值
        };
      } else if (count !== null) {
        // 固定窗口数据
        const ttl = await this.redis.ttl(redisKey);
        return {
          count: parseInt(count),
          resetTime: Date.now() + (ttl * 1000),
          remaining: 0
        };
      } else if (bucket[0] !== null) {
        // 令牌桶数据
        return {
          count: 0,
          tokens: parseInt(bucket[0]),
          resetTime: Date.now() + 60000 // 估算值
        };
      }

      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * 重置记录
   */
  async reset(key) {
    const redisKey = this.getKey(key);
    
    try {
      await this.redis.del(redisKey);
      return true;
    } catch (error) {
      console.error('Redis reset error:', error);
      return false;
    }
  }

  /**
   * 批量重置记录
   */
  async resetPattern(pattern) {
    const searchPattern = this.getKey(pattern);
    
    try {
      const keys = await this.redis.keys(searchPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis reset pattern error:', error);
      return 0;
    }
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const pattern = this.getKey('*');
      const keys = await this.redis.keys(pattern);
      
      return {
        totalKeys: keys.length,
        keyPrefix: this.options.keyPrefix,
        redisConnected: this.redis.status === 'ready'
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        totalKeys: 0,
        keyPrefix: this.options.keyPrefix,
        redisConnected: false
      };
    }
  }

  /**
   * 清理过期数据
   */
  async cleanup() {
    // Redis会自动清理过期数据，这里可以添加额外的清理逻辑
    try {
      const pattern = this.getKey('*');
      const keys = await this.redis.keys(pattern);
      
      // 检查并清理可能的孤儿数据
      let cleaned = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // 没有设置过期时间的key
          await this.redis.expire(key, this.options.keyExpiration);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`Set expiration for ${cleaned} rate limit keys`);
      }
      
      return cleaned;
    } catch (error) {
      console.error('Redis cleanup error:', error);
      return 0;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      await this.redis.ping();
      return { status: 'healthy', message: 'Redis connection is working' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  /**
   * 销毁连接
   */
  async destroy() {
    // 注意：不要在这里关闭Redis连接，因为它可能被其他地方使用
    // 只清理相关的脚本缓存
    this.scriptShas = null;
  }
}

module.exports = RedisStore;