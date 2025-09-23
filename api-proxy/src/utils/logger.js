const winston = require('winston');
const config = require('config');
const fs = require('fs');
const path = require('path');

// 确保日志目录存在
const logDir = path.dirname(config.get('logging.filename'));
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台日志格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ' ' + JSON.stringify(meta);
    }
    
    return log;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || config.get('logging.level'),
  format: logFormat,
  defaultMeta: { service: 'api-proxy' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: config.get('logging.filename').replace('.log', '-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: config.get('logging.filename'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 在非生产环境下添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// 添加请求日志方法
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    contentLength: res.get('content-length') || 0
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// 添加API调用日志方法
logger.logApiCall = (endpoint, method, url, statusCode, responseTime, error = null) => {
  const logData = {
    endpoint,
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`
  };
  
  if (error) {
    logger.error('API Call Failed', { ...logData, error: error.message });
  } else if (statusCode >= 400) {
    logger.warn('API Call Warning', logData);
  } else {
    logger.info('API Call Success', logData);
  }
};

module.exports = logger;