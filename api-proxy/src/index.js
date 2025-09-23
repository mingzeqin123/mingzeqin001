#!/usr/bin/env node

require('dotenv').config();
const app = require('./app');
const config = require('config');
const logger = require('./utils/logger');

const PORT = process.env.PORT || config.get('server.port');
const HOST = process.env.HOST || config.get('server.host');

// 启动服务器
const server = app.listen(PORT, HOST, () => {
  logger.info(`API Proxy Server is running on http://${HOST}:${PORT}`);
  logger.info('Environment:', process.env.NODE_ENV || 'development');
  
  // 显示已配置的API端点
  const endpoints = config.get('apis.endpoints');
  logger.info(`Configured API endpoints: ${endpoints.length}`);
  endpoints.forEach(endpoint => {
    logger.info(`  - ${endpoint.name} (${endpoint.type}): ${endpoint.path}`);
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = server;