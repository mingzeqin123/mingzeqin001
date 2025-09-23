const HttpAdapter = require('./HttpAdapter');
const GraphQLAdapter = require('./GraphQLAdapter');
const GrpcAdapter = require('./GrpcAdapter');
const logger = require('../utils/logger');

/**
 * 适配器工厂类
 * 根据配置创建相应的API适配器实例
 */
class AdapterFactory {
  static adapters = new Map();

  /**
   * 创建适配器实例
   */
  static createAdapter(config) {
    const { type, name } = config;

    if (this.adapters.has(name)) {
      return this.adapters.get(name);
    }

    let adapter;

    switch (type.toLowerCase()) {
      case 'http':
      case 'https':
      case 'rest':
        adapter = new HttpAdapter(config);
        break;

      case 'graphql':
        adapter = new GraphQLAdapter(config);
        break;

      case 'grpc':
        adapter = new GrpcAdapter(config);
        break;

      default:
        throw new Error(`Unsupported adapter type: ${type}`);
    }

    // 缓存适配器实例
    this.adapters.set(name, adapter);
    
    logger.info(`Created ${type} adapter: ${name}`);
    
    return adapter;
  }

  /**
   * 获取适配器实例
   */
  static getAdapter(name) {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Adapter ${name} not found`);
    }
    return adapter;
  }

  /**
   * 获取所有适配器
   */
  static getAllAdapters() {
    return Array.from(this.adapters.values());
  }

  /**
   * 根据路径匹配适配器
   */
  static findAdapterByPath(path) {
    for (const adapter of this.adapters.values()) {
      if (this.matchPath(path, adapter.config.path)) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * 路径匹配逻辑
   */
  static matchPath(requestPath, configPath) {
    // 精确匹配
    if (requestPath === configPath) {
      return true;
    }

    // 通配符匹配
    if (configPath.endsWith('/*')) {
      const basePath = configPath.slice(0, -2);
      return requestPath.startsWith(basePath);
    }

    // 参数匹配 (例如: /api/:id)
    if (configPath.includes(':')) {
      const configParts = configPath.split('/');
      const requestParts = requestPath.split('/');

      if (configParts.length !== requestParts.length) {
        return false;
      }

      return configParts.every((part, index) => {
        return part.startsWith(':') || part === requestParts[index];
      });
    }

    return false;
  }

  /**
   * 移除适配器
   */
  static removeAdapter(name) {
    const adapter = this.adapters.get(name);
    if (adapter) {
      // 清理资源
      if (typeof adapter.close === 'function') {
        adapter.close();
      }
      
      this.adapters.delete(name);
      logger.info(`Removed adapter: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 清理所有适配器
   */
  static clearAll() {
    for (const [name, adapter] of this.adapters) {
      if (typeof adapter.close === 'function') {
        adapter.close();
      }
    }
    this.adapters.clear();
    logger.info('All adapters cleared');
  }

  /**
   * 获取适配器统计信息
   */
  static getStats() {
    const stats = {
      total: this.adapters.size,
      byType: {},
      adapters: []
    };

    for (const [name, adapter] of this.adapters) {
      const type = adapter.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      stats.adapters.push({
        name,
        type,
        baseUrl: adapter.baseUrl,
        path: adapter.config.path,
        initialized: adapter.initialized !== false
      });
    }

    return stats;
  }

  /**
   * 验证适配器配置
   */
  static validateConfig(config) {
    const requiredFields = ['name', 'type', 'path'];
    
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // 类型特定的验证
    switch (config.type.toLowerCase()) {
      case 'http':
      case 'https':
      case 'rest':
        if (!config.baseUrl) {
          throw new Error('baseUrl is required for HTTP/HTTPS adapters');
        }
        break;

      case 'graphql':
        if (!config.baseUrl) {
          throw new Error('baseUrl is required for GraphQL adapters');
        }
        break;

      case 'grpc':
        if (!config.host) {
          throw new Error('host is required for gRPC adapters');
        }
        if (!config.protoPath) {
          throw new Error('protoPath is required for gRPC adapters');
        }
        if (!config.serviceName) {
          throw new Error('serviceName is required for gRPC adapters');
        }
        break;

      default:
        throw new Error(`Unsupported adapter type: ${config.type}`);
    }

    return true;
  }

  /**
   * 批量创建适配器
   */
  static async createAdapters(configs) {
    const results = [];
    
    for (const config of configs) {
      try {
        this.validateConfig(config);
        const adapter = this.createAdapter(config);
        
        // 如果是gRPC适配器，进行初始化
        if (adapter.type === 'grpc' && typeof adapter.initialize === 'function') {
          await adapter.initialize();
        }
        
        results.push({
          name: config.name,
          success: true,
          adapter
        });
      } catch (error) {
        logger.error(`Failed to create adapter ${config.name}:`, error);
        results.push({
          name: config.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * 健康检查所有适配器
   */
  static async healthCheck() {
    const results = {};
    
    for (const [name, adapter] of this.adapters) {
      try {
        if (typeof adapter.healthCheck === 'function') {
          results[name] = await adapter.healthCheck();
        } else {
          results[name] = {
            status: 'unknown',
            message: 'Health check not implemented'
          };
        }
      } catch (error) {
        results[name] = {
          status: 'error',
          message: error.message
        };
      }
    }
    
    return results;
  }
}

module.exports = AdapterFactory;