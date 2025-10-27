const express = require('express');
const cron = require('node-cron');
const winston = require('winston');
const path = require('path');
require('dotenv').config();

const DatabaseService = require('./services/DatabaseService');
const OSSService = require('./services/OSSService');
const DataAggregator = require('./services/DataAggregator');
const SchedulerService = require('./services/SchedulerService');

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建服务实例
const dbService = new DatabaseService(logger);
const ossService = new OSSService(logger);
const dataAggregator = new DataAggregator(dbService, logger);
const schedulerService = new SchedulerService(dataAggregator, ossService, logger);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 手动触发数据汇总
app.post('/aggregate', async (req, res) => {
  try {
    logger.info('手动触发数据汇总任务');
    const result = await schedulerService.runAggregation();
    res.json({ 
      success: true, 
      message: '数据汇总任务执行成功',
      result 
    });
  } catch (error) {
    logger.error('手动触发数据汇总失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '数据汇总任务执行失败',
      error: error.message 
    });
  }
});

// 获取任务状态
app.get('/status', (req, res) => {
  res.json({
    status: schedulerService.getStatus(),
    lastRun: schedulerService.getLastRun(),
    nextRun: schedulerService.getNextRun()
  });
});

// 启动定时任务
schedulerService.start();

// 启动服务器
app.listen(PORT, () => {
  logger.info(`数据汇总服务已启动，端口: ${PORT}`);
  logger.info(`定时任务配置: ${process.env.CRON_SCHEDULE || '0 0 2 * * *'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务...');
  schedulerService.stop();
  process.exit(0);
});

module.exports = app;