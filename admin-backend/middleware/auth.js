const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errors');

/**
 * JWT 认证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    // 获取 token
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw new AppError('请先登录', 401);
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.id)
      .populate('tenantId', 'name slug status subscription')
      .select('+permissions');

    if (!user) {
      throw new AppError('用户不存在', 401);
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      throw new AppError('账户已被禁用', 401);
    }

    // 对于非超级管理员，检查租户状态
    if (user.role !== 'super_admin') {
      if (!user.tenantId) {
        throw new AppError('用户没有关联的租户', 401);
      }

      // 如果已经设置了租户上下文，验证用户是否属于该租户
      if (req.tenant && user.tenantId._id.toString() !== req.tenant._id.toString()) {
        throw new AppError('用户不属于当前租户', 403);
      }

      // 如果还没有设置租户上下文，使用用户的租户
      if (!req.tenant && !req.tenantContext?.isSuperAdmin) {
        req.tenant = user.tenantId;
        req.tenantContext = {
          method: 'user_tenant',
          identifier: user.tenantId.slug,
          isSuperAdmin: false
        };
      }
    }

    // 将用户信息添加到请求对象
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('无效的令牌', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('令牌已过期', 401));
    } else {
      next(error);
    }
  }
};

/**
 * 角色权限检查中间件
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('请先登录', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('权限不足', 403));
    }

    next();
  };
};

/**
 * 权限检查中间件
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('请先登录', 401));
    }

    if (!req.user.hasPermission(permission)) {
      return next(new AppError(`需要 ${permission} 权限`, 403));
    }

    next();
  };
};

/**
 * 超级管理员权限检查
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return next(new AppError('需要超级管理员权限', 403));
  }
  next();
};

/**
 * 租户管理员权限检查
 */
const requireTenantAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('请先登录', 401));
  }

  const allowedRoles = ['super_admin', 'tenant_admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('需要租户管理员权限', 403));
  }

  next();
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id)
        .populate('tenantId', 'name slug status subscription')
        .select('+permissions');
      
      if (user && user.status === 'active') {
        req.user = user;
        
        if (user.role !== 'super_admin' && user.tenantId) {
          req.tenant = user.tenantId;
          req.tenantContext = {
            method: 'user_tenant',
            identifier: user.tenantId.slug,
            isSuperAdmin: false
          };
        }
      }
    }
  } catch (error) {
    // 可选认证失败时不抛出错误，继续处理请求
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  requireSuperAdmin,
  requireTenantAdmin,
  optionalAuth
};