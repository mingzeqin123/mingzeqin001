const logger = require('../utils/logger');

/**
 * 基础适配器类
 * 所有API适配器都应该继承这个类
 */
class BaseAdapter {
  constructor(config) {
    this.config = config;
    this.name = config.name || 'unknown';
    this.type = config.type || 'unknown';
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * 处理请求的抽象方法
   * 子类必须实现这个方法
   */
  async handleRequest(req, res) {
    throw new Error('handleRequest method must be implemented by subclass');
  }

  /**
   * 验证请求
   */
  validateRequest(req) {
    // 基础验证逻辑
    if (!req.method) {
      throw new Error('HTTP method is required');
    }
    return true;
  }

  /**
   * 准备请求头
   */
  prepareHeaders(req, additionalHeaders = {}) {
    const headers = {
      'Content-Type': req.get('Content-Type') || 'application/json',
      'User-Agent': req.get('User-Agent') || 'API-Proxy/1.0.0',
      ...additionalHeaders
    };

    // 添加认证头
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          if (this.config.auth.token) {
            headers['Authorization'] = `Bearer ${this.config.auth.token}`;
          }
          break;
        case 'basic':
          if (this.config.auth.username && this.config.auth.password) {
            const credentials = Buffer.from(
              `${this.config.auth.username}:${this.config.auth.password}`
            ).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'apikey':
          if (this.config.auth.key && this.config.auth.value) {
            headers[this.config.auth.key] = this.config.auth.value;
          }
          break;
      }
    }

    // 添加配置中的自定义头
    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }

    return headers;
  }

  /**
   * 处理重试逻辑
   */
  async retry(fn, maxRetries = this.retries, delay = this.retryDelay) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries) {
          break;
        }
        
        // 如果是4xx错误，不需要重试
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          break;
        }
        
        logger.warn(`Request failed, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries + 1})`, {
          adapter: this.name,
          error: error.message
        });
        
        await this.sleep(delay);
        delay *= 1.5; // 指数退避
      }
    }
    
    throw lastError;
  }

  /**
   * 休眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录API调用
   */
  logApiCall(method, url, statusCode, responseTime, error = null) {
    logger.logApiCall(this.name, method, url, statusCode, responseTime, error);
  }

  /**
   * 处理错误响应
   */
  handleError(error, res) {
    let statusCode = 500;
    let message = 'Internal server error';

    if (error.response) {
      // 目标API返回了错误响应
      statusCode = error.response.status;
      message = error.response.data?.message || error.response.statusText || error.message;
    } else if (error.request) {
      // 请求被发出但没有收到响应
      statusCode = 503;
      message = 'Service unavailable';
    } else {
      // 其他错误
      message = error.message;
    }

    logger.error(`Adapter ${this.name} error:`, {
      message: error.message,
      status: statusCode,
      stack: error.stack
    });

    return res.status(statusCode).json({
      success: false,
      error: message,
      adapter: this.name,
      type: this.type
    });
  }

  /**
   * 获取适配器信息
   */
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retries: this.retries
    };
  }
}

module.exports = BaseAdapter;