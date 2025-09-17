/**
 * 主应用入口文件
 * 整合所有模块，启动Web服务器
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config/index.js';
import { DataStore } from './data/DataStore.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

/**
 * 应用程序类
 */
class App {
  constructor() {
    this.app = express();
    this.dataStore = null;
    this.server = null;
  }

  /**
   * 初始化应用程序
   */
  async initialize() {
    try {
      logger.info('应用程序初始化开始...');

      // 验证配置
      validateConfig();
      logger.info('配置验证通过');

      // 初始化数据存储
      this.dataStore = new DataStore();
      await this.dataStore.initialize();
      logger.info('数据存储初始化完成');

      // 配置中间件
      this.configureMiddleware();
      logger.info('中间件配置完成');

      // 配置路由
      this.configureRoutes();
      logger.info('路由配置完成');

      // 配置错误处理
      this.configureErrorHandling();
      logger.info('错误处理配置完成');

      logger.info('应用程序初始化完成');
    } catch (error) {
      logger.error('应用程序初始化失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 配置中间件
   */
  configureMiddleware() {
    // 安全中间件
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS配置
    this.app.use(cors({
      origin: config.server.corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // 请求解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 请求日志中间件
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP请求', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      });

      next();
    });

    // 添加请求ID
    this.app.use((req, res, next) => {
      req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });
  }

  /**
   * 配置路由
   */
  configureRoutes() {
    // 根路径响应
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '欢迎使用模块化任务管理系统',
        version: config.api.version,
        environment: config.server.env,
        timestamp: new Date().toISOString(),
        api_docs: `${config.api.prefix}/`
      });
    });

    // API路由
    this.app.use(config.api.prefix, apiRoutes);

    // 静态文件服务（如果需要）
    // this.app.use('/static', express.static('public'));
  }

  /**
   * 配置错误处理
   */
  configureErrorHandling() {
    // 404错误处理
    this.app.use(notFoundHandler);

    // 全局错误处理
    this.app.use(errorHandler);
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        this.server = this.app.listen(config.server.port, (err) => {
          if (err) {
            logger.error('服务器启动失败', { error: err.message });
            reject(err);
            return;
          }

          logger.info('服务器启动成功', {
            port: config.server.port,
            environment: config.server.env,
            apiVersion: config.api.version,
            apiPrefix: config.api.prefix
          });

          // 打印启动信息
          console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    模块化任务管理系统                          ║
║                                                              ║
║  🚀 服务器已启动                                              ║
║  📍 地址: http://localhost:${config.server.port}                                    ║
║  🌐 API: http://localhost:${config.server.port}${config.api.prefix}/                          ║
║  🔧 环境: ${config.server.env.toUpperCase()}                                        ║
║  📖 版本: ${config.api.version}                                              ║
║                                                              ║
║  📚 API文档: http://localhost:${config.server.port}${config.api.prefix}/                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
          `);

          resolve(this.server);
        });
      });
    } catch (error) {
      logger.error('应用程序启动失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop() {
    try {
      logger.info('正在停止服务器...');

      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('HTTP服务器已停止');
      }

      if (this.dataStore) {
        await this.dataStore.cleanup();
        logger.info('数据存储已清理');
      }

      logger.info('应用程序已完全停止');
    } catch (error) {
      logger.error('停止服务器时发生错误', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取应用实例
   */
  getApp() {
    return this.app;
  }

  /**
   * 获取数据存储实例
   */
  getDataStore() {
    return this.dataStore;
  }
}

/**
 * 创建应用实例
 */
const app = new App();

/**
 * 优雅关闭处理
 */
const gracefulShutdown = async (signal) => {
  logger.info(`收到${signal}信号，开始优雅关闭...`);
  
  try {
    await app.stop();
    logger.info('应用程序已优雅关闭');
    process.exit(0);
  } catch (error) {
    logger.error('优雅关闭失败', { error: error.message });
    process.exit(1);
  }
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason, promise });
  process.exit(1);
});

// 如果直接运行此文件，启动应用
if (import.meta.url === `file://${process.argv[1]}`) {
  app.start().catch((error) => {
    logger.error('应用启动失败', { error: error.message });
    process.exit(1);
  });
}

export default app;
export { App };