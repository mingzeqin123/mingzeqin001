const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWT认证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证token'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户信息
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: '账户已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.status
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: '无效的token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'token已过期'
      });
    }

    return res.status(500).json({
      success: false,
      error: '认证失败'
    });
  }
};

/**
 * 角色授权中间件
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // 这里简化处理，实际项目中应该从数据库获取用户角色
    // 目前假设所有用户都是普通用户，管理员需要特殊标识
    const userRoles = req.user.username === 'admin' ? ['admin', 'user'] : ['user'];
    
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasPermission = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }
    
    next();
  };
};

/**
 * 可选认证中间件（用于某些接口可以匿名访问但登录后有更多功能）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 没有token，继续执行但不设置用户信息
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (user && user.status === 'active') {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status
      };
    }
    
    next();
  } catch (error) {
    // 认证失败但不阻止请求继续
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};