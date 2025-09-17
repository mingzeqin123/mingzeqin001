/**
 * 错误处理中间件模块
 * 统一处理应用程序中的错误
 */
import { serverErrorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (error, req, res, next) => {
  // 记录错误日志
  logger.error('未处理的错误', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // 根据错误类型返回不同的响应
  if (error.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: '数据验证失败',
      errors: error.errors,
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'UnauthorizedError' || error.status === 401) {
    return res.status(401).json({
      success: false,
      message: '未授权访问',
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'ForbiddenError' || error.status === 403) {
    return res.status(403).json({
      success: false,
      message: '禁止访问',
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'NotFoundError' || error.status === 404) {
    return res.status(404).json({
      success: false,
      message: '资源未找到',
      timestamp: new Date().toISOString()
    });
  }

  // 处理特定的业务错误
  if (error.message.includes('不存在') || error.message.includes('未找到')) {
    return res.status(404).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('已存在') || error.message.includes('重复')) {
    return res.status(409).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('无权限') || error.message.includes('权限不足')) {
    return res.status(403).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // 默认服务器错误
  const isDevelopment = config.server.env === 'development';
  
  return res.status(500).json({
    success: false,
    message: '服务器内部错误',
    ...(isDevelopment && {
      error: error.message,
      stack: error.stack
    }),
    timestamp: new Date().toISOString()
  });
};

/**
 * 404错误处理中间件
 */
export const notFoundHandler = (req, res) => {
  logger.warn('404 - 路由未找到', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  return res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.url} 未找到`,
    timestamp: new Date().toISOString()
  });
};

/**
 * 异步错误捕获包装器
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 业务错误类
 */
export class BusinessError extends AppError {
  constructor(message, statusCode = 400) {
    super(message, statusCode, true);
    this.name = 'BusinessError';
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message, errors = [], statusCode = 422) {
    super(message, statusCode, true);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends AppError {
  constructor(message = '认证失败', statusCode = 401) {
    super(message, statusCode, true);
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权错误类
 */
export class AuthorizationError extends AppError {
  constructor(message = '权限不足', statusCode = 403) {
    super(message, statusCode, true);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源未找到错误类
 */
export class NotFoundError extends AppError {
  constructor(message = '资源未找到', statusCode = 404) {
    super(message, statusCode, true);
    this.name = 'NotFoundError';
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  BusinessError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
};