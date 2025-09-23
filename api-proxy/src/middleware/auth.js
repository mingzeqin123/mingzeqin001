const jwt = require('jsonwebtoken');
const config = require('config');
const logger = require('../utils/logger');

/**
 * JWT认证中间件
 */
const authMiddleware = (req, res, next) => {
  // 如果认证被禁用，直接通过
  if (!config.get('auth.enableAuth')) {
    return next();
  }

  // 获取token
  const authHeader = req.header('Authorization');
  const apiKey = req.header('X-API-Key');
  
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (apiKey) {
    // 可以支持API Key认证
    req.apiKey = apiKey;
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.get('auth.jwtSecret'));
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      token: token.substring(0, 10) + '...'
    });
    
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

/**
 * 生成JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || config.get('auth.jwtSecret'),
    { expiresIn: process.env.JWT_EXPIRATION || config.get('auth.jwtExpiration') }
  );
};

/**
 * API Key验证中间件
 */
const apiKeyAuth = (validApiKeys = []) => {
  return (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API Key required'
      });
    }
    
    if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        apiKey: apiKey.substring(0, 8) + '...'
      });
      
      return res.status(401).json({
        success: false,
        error: 'Invalid API Key'
      });
    }
    
    req.apiKey = apiKey;
    next();
  };
};

module.exports = {
  authMiddleware,
  generateToken,
  apiKeyAuth
};