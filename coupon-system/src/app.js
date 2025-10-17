const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFoundHandler, logger } = require('./middleware/errorHandler');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// 更严格的速率限制（登录、注册等敏感操作）
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次尝试
  message: {
    success: false,
    error: '操作过于频繁，请稍后再试'
  }
});

app.use('/api/v1/users/login', strictLimiter);
app.use('/api/v1/users/register', strictLimiter);
app.use('/api/v1/users/forgot-password', strictLimiter);

// 路由
app.use('/', routes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 数据库连接和服务器启动
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    logger.info('数据库连接成功');

    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('数据库模型同步完成');
    }

    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`优惠券系统服务启动成功，端口: ${PORT}`);
      logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API文档: http://localhost:${PORT}/api/v1`);
    });

  } catch (error) {
    logger.error('服务启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  
  try {
    await sequelize.close();
    logger.info('数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    logger.error('关闭服务时出错:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('收到SIGINT信号，正在关闭服务...');
  
  try {
    await sequelize.close();
    logger.info('数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    logger.error('关闭服务时出错:', error);
    process.exit(1);
  }
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise });
  process.exit(1);
});

// 启动服务器
startServer();

module.exports = app;