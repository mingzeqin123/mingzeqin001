const winston = require('winston');

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
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // 数据库相关错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: '数据验证失败',
      details: errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'unknown';
    return res.status(400).json({
      success: false,
      error: `${field}已存在`
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: '关联数据不存在'
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      error: '数据库操作失败'
    });
  }

  // JWT相关错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '无效的认证token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '认证token已过期'
    });
  }

  // 业务逻辑错误
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // 默认服务器错误
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? err.message : '服务器内部错误',
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * 404错误处理
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * 异步错误捕获包装器
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 业务错误类
 */
class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  BusinessError,
  logger
};