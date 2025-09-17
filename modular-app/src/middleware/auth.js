/**
 * 认证中间件模块
 * 处理JWT认证和授权
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * JWT认证中间件
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return unauthorizedResponse(res, '缺少访问令牌');
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        logger.warn('JWT验证失败', { error: err.message, token: token.substring(0, 20) + '...' });
        return forbiddenResponse(res, '无效的访问令牌');
      }

      req.user = user;
      logger.debug('用户认证成功', { userId: user.id, username: user.username });
      next();
    });
  } catch (error) {
    logger.error('认证中间件错误', { error: error.message });
    return forbiddenResponse(res, '认证失败');
  }
};

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        req.user = null;
      } else {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * 生成JWT令牌
 */
export const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    logger.debug('JWT令牌生成成功', { userId: user.id });
    return token;
  } catch (error) {
    logger.error('JWT令牌生成失败', { error: error.message, userId: user.id });
    throw new Error('令牌生成失败');
  }
};

/**
 * 验证JWT令牌
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return { valid: true, decoded };
  } catch (error) {
    logger.warn('JWT令牌验证失败', { error: error.message });
    return { valid: false, error: error.message };
  }
};

/**
 * 角色检查中间件工厂
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, '需要认证');
    }

    // 如果没有指定角色要求，只需要认证即可
    if (roles.length === 0) {
      return next();
    }

    // 检查用户角色（这里简化处理，实际项目中应该从数据库获取用户角色）
    const userRoles = req.user.roles || ['user'];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return forbiddenResponse(res, '权限不足');
    }

    next();
  };
};

export default {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  requireRole
};