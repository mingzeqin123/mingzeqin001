require('dotenv').config();
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const database = require('./config/database');
const ossService = require('./config/oss');
const schedulerService = require('./services/schedulerService');
const dataSummaryService = require('./services/dataSummaryService');

class DataSummaryApp {
  constructor() {
    this.isRunning = false;
    this.setupGracefulShutdown();
  }

  /**
   * 启动应用程序
   */
  async start() {
    try {
      logger.info('正在启动数据汇总服务...');

      // 创建必要的目录
      this.createDirectories();

      // 验证环境变量
      this.validateEnvironment();

      // 测试数据库连接
      await this.testDatabaseConnection();

      // 测试OSS连接
      await this.testOSSConnection();

      // 初始化并启动调度器
      schedulerService.init();
      schedulerService.startAllTasks();

      this.isRunning = true;
      logger.info('数据汇总服务启动成功');

      // 输出任务状态
      this.logTasksStatus();

      // 保持进程运行
      this.keepAlive();

    } catch (error) {
      logger.error('服务启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 创建必要的目录
   */
  createDirectories() {
    const directories = [
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../temp'),
      path.join(__dirname, '../exports')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`创建目录: ${dir}`);
      }
    });
  }

  /**
   * 验证环境变量
   */
  validateEnvironment() {
    const requiredEnvVars = [
      'DB_HOST',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'OSS_ACCESS_KEY_ID',
      'OSS_ACCESS_KEY_SECRET',
      'OSS_BUCKET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`缺少必要的环境变量: ${missingVars.join(', ')}`);
    }

    logger.info('环境变量验证通过');
  }

  /**
   * 测试数据库连接
   */
  async testDatabaseConnection() {
    try {
      await database.query('SELECT 1');
      logger.info('数据库连接测试成功');
    } catch (error) {
      logger.error('数据库连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 测试OSS连接
   */
  async testOSSConnection() {
    try {
      // 尝试上传一个测试文件
      const testData = { test: true, timestamp: new Date().toISOString() };
      await ossService.uploadJson('test/connection-test.json', testData);
      logger.info('OSS连接测试成功');
    } catch (error) {
      logger.error('OSS连接测试失败:', error);
      throw error;
    }
  }

  /**
   * 输出任务状态
   */
  logTasksStatus() {
    const tasks = schedulerService.getTasksStatus();
    logger.info('当前定时任务状态:');
    tasks.forEach(task => {
      logger.info(`- ${task.name}: ${task.status} (${task.cronExpression})`);
    });
  }

  /**
   * 保持进程运行
   */
  keepAlive() {
    setInterval(() => {
      if (this.isRunning) {
        logger.debug('服务正在运行中...');
      }
    }, 60000); // 每分钟输出一次状态
  }

  /**
   * 设置优雅关闭
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭...`);
      this.isRunning = false;

      try {
        // 停止调度器
        await schedulerService.shutdown();

        // 关闭数据库连接
        await database.close();

        logger.info('服务已安全关闭');
        process.exit(0);
      } catch (error) {
        logger.error('关闭过程中发生错误:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      process.exit(1);
    });
  }

  /**
   * 手动执行数据汇总
   * @param {string} dateRange 日期范围
   * @param {string} specificDate 特定日期
   */
  async executeManualSummary(dateRange = 'daily', specificDate = null) {
    try {
      logger.info(`手动执行数据汇总: ${dateRange}`);
      const result = await dataSummaryService.executeSummaryTask(dateRange, specificDate);
      logger.info('手动汇总完成:', result.summary);
      return result;
    } catch (error) {
      logger.error('手动汇总失败:', error);
      throw error;
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      tasks: schedulerService.getTasksStatus()
    };
  }
}

// 如果直接运行此文件，则启动应用
if (require.main === module) {
  const app = new DataSummaryApp();
  app.start().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
  });
}

module.exports = DataSummaryApp;