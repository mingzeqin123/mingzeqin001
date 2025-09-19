/**
 * 基于内存的限流存储
 * 适用于单机部署场景
 */

class MemoryStore {
  constructor(options = {}) {
    this.options = {
      cleanupInterval: options.cleanupInterval || 60 * 1000, // 清理间隔
      maxSize: options.maxSize || 10000 // 最大存储条目数
    };

    // 存储结构：key -> { count, resetTime, timestamps }
    this.store = new Map();
    
    // 启动定期清理
    this.startCleanup();
  }

  /**
   * 增加计数
   */
  async increment(key, config) {
    const now = Date.now();
    const windowMs = config.windowMs || 60000;
    const max = config.max || 100;
    const strategy = config.strategy || 'sliding-window';

    let record = this.store.get(key);

    if (!record) {
      record = {
        count: 0,
        resetTime: now + windowMs,
        timestamps: [],
        createdAt: now
      };
      this.store.set(key, record);
    }

    let result;

    switch (strategy) {
      case 'sliding-window':
        result = this.slidingWindowIncrement(record, now, windowMs, max);
        break;
      case 'fixed-window':
        result = this.fixedWindowIncrement(record, now, windowMs, max);
        break;
      case 'token-bucket':
        result = this.tokenBucketIncrement(record, now, config);
        break;
      default:
        result = this.slidingWindowIncrement(record, now, windowMs, max);
    }

    // 更新存储
    this.store.set(key, record);

    // 检查存储大小
    this.checkSize();

    return result;
  }

  /**
   * 滑动窗口算法
   */
  slidingWindowIncrement(record, now, windowMs, max) {
    // 清理过期的时间戳
    record.timestamps = record.timestamps.filter(timestamp => 
      now - timestamp < windowMs
    );

    // 添加当前时间戳
    record.timestamps.push(now);
    record.count = record.timestamps.length;

    const exceeded = record.count > max;
    const remaining = Math.max(0, max - record.count);
    
    // 计算重置时间（最早的时间戳 + 窗口时间）
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTime = oldestTimestamp + windowMs;

    return {
      limit: max,
      current: record.count,
      remaining,
      exceeded,
      resetTime
    };
  }

  /**
   * 固定窗口算法
   */
  fixedWindowIncrement(record, now, windowMs, max) {
    // 检查是否需要重置窗口
    if (now >= record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    const exceeded = record.count > max;
    const remaining = Math.max(0, max - record.count);

    return {
      limit: max,
      current: record.count,
      remaining,
      exceeded,
      resetTime: record.resetTime
    };
  }

  /**
   * 令牌桶算法
   */
  tokenBucketIncrement(record, now, config) {
    const capacity = config.max || 100;
    const refillRate = config.refillRate || capacity; // 每秒补充的令牌数
    const tokensRequested = config.tokensRequested || 1;

    // 初始化令牌桶
    if (!record.tokens) {
      record.tokens = capacity;
      record.lastRefill = now;
    }

    // 计算需要补充的令牌
    const timePassed = (now - record.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * refillRate);
    
    if (tokensToAdd > 0) {
      record.tokens = Math.min(capacity, record.tokens + tokensToAdd);
      record.lastRefill = now;
    }

    // 检查是否有足够的令牌
    const exceeded = record.tokens < tokensRequested;
    
    if (!exceeded) {
      record.tokens -= tokensRequested;
    }

    // 计算下次重置时间
    const tokensNeeded = Math.max(0, tokensRequested - record.tokens);
    const timeToRefill = tokensNeeded / refillRate * 1000;
    const resetTime = now + timeToRefill;

    return {
      limit: capacity,
      current: capacity - record.tokens,
      remaining: record.tokens,
      exceeded,
      resetTime
    };
  }

  /**
   * 获取记录
   */
  async get(key) {
    const record = this.store.get(key);
    if (!record) {
      return null;
    }

    return {
      count: record.count,
      resetTime: record.resetTime,
      remaining: Math.max(0, record.limit - record.count)
    };
  }

  /**
   * 重置记录
   */
  async reset(key) {
    this.store.delete(key);
    return true;
  }

  /**
   * 清理过期记录
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, record] of this.store.entries()) {
      // 删除过期的记录
      if (record.resetTime && now > record.resetTime + 60000) {
        keysToDelete.push(key);
      }
      // 删除过老的记录（24小时）
      else if (record.createdAt && now - record.createdAt > 24 * 60 * 60 * 1000) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired rate limit records`);
    }
  }

  /**
   * 启动定期清理
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);

    // 确保进程退出时清理定时器
    process.on('SIGINT', () => this.stopCleanup());
    process.on('SIGTERM', () => this.stopCleanup());
  }

  /**
   * 停止定期清理
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 检查存储大小
   */
  checkSize() {
    if (this.store.size > this.options.maxSize) {
      // 删除最老的记录
      const sortedEntries = Array.from(this.store.entries())
        .sort(([, a], [, b]) => a.createdAt - b.createdAt);
      
      const toDelete = sortedEntries.slice(0, Math.floor(this.options.maxSize * 0.1));
      toDelete.forEach(([key]) => this.store.delete(key));
      
      console.log(`Removed ${toDelete.length} old rate limit records due to size limit`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalKeys: this.store.size,
      maxSize: this.options.maxSize,
      cleanupInterval: this.options.cleanupInterval
    };
  }

  /**
   * 清空所有记录
   */
  clear() {
    this.store.clear();
  }

  /**
   * 销毁存储
   */
  destroy() {
    this.stopCleanup();
    this.clear();
  }
}

module.exports = MemoryStore;