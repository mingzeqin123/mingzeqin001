const Tenant = require('../models/Tenant');
const { AppError } = require('../utils/errors');

/**
 * 租户识别中间件
 * 支持多种租户识别方式：
 * 1. 子域名识别 (tenant.example.com)
 * 2. 路径参数识别 (/tenant/:tenantSlug)
 * 3. 请求头识别 (X-Tenant-ID)
 * 4. 查询参数识别 (?tenant=slug)
 */
const identifyTenant = async (req, res, next) => {
  try {
    let tenantIdentifier = null;
    let identificationMethod = null;

    // 1. 从子域名识别租户
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenantIdentifier = subdomain;
      identificationMethod = 'subdomain';
    }
    
    // 2. 从路径参数识别租户
    if (!tenantIdentifier && req.params.tenantSlug) {
      tenantIdentifier = req.params.tenantSlug;
      identificationMethod = 'path';
    }
    
    // 3. 从请求头识别租户
    if (!tenantIdentifier && req.get('X-Tenant-ID')) {
      tenantIdentifier = req.get('X-Tenant-ID');
      identificationMethod = 'header';
    }
    
    // 4. 从查询参数识别租户
    if (!tenantIdentifier && req.query.tenant) {
      tenantIdentifier = req.query.tenant;
      identificationMethod = 'query';
    }

    // 如果没有找到租户标识符，检查是否是超级管理员路由
    if (!tenantIdentifier) {
      if (req.path.startsWith('/api/super-admin')) {
        req.tenant = null;
        req.tenantContext = {
          method: 'super_admin',
          isSuperAdmin: true
        };
        return next();
      }
      
      throw new AppError('租户标识符未找到', 400);
    }

    // 查找租户
    const tenant = await Tenant.findByIdentifier(tenantIdentifier)
      .select('-database.connectionString'); // 不返回敏感信息

    if (!tenant) {
      throw new AppError('租户不存在', 404);
    }

    // 检查租户状态
    if (tenant.status === 'suspended') {
      throw new AppError('租户已被暂停', 403);
    }

    if (tenant.status === 'inactive') {
      throw new AppError('租户未激活', 403);
    }

    // 检查订阅是否过期
    if (tenant.isExpired) {
      throw new AppError('租户订阅已过期', 402);
    }

    // 将租户信息添加到请求对象
    req.tenant = tenant;
    req.tenantContext = {
      method: identificationMethod,
      identifier: tenantIdentifier,
      isSuperAdmin: false
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 租户数据隔离中间件
 * 确保所有数据库查询都包含租户过滤条件
 */
const enforceTenantIsolation = (req, res, next) => {
  if (!req.tenant && !req.tenantContext?.isSuperAdmin) {
    return next(new AppError('租户上下文未设置', 500));
  }

  // 为超级管理员跳过租户隔离
  if (req.tenantContext?.isSuperAdmin) {
    return next();
  }

  // 修改 mongoose 查询以包含租户过滤
  const originalFind = req.app.locals.mongoose?.Model?.find;
  const originalFindOne = req.app.locals.mongoose?.Model?.findOne;
  const originalFindOneAndUpdate = req.app.locals.mongoose?.Model?.findOneAndUpdate;

  // 这里可以添加更多的查询方法拦截逻辑
  // 实际实现中建议使用 mongoose 插件来处理

  next();
};

/**
 * 检查租户权限中间件
 */
const checkTenantPermissions = (requiredFeatures = []) => {
  return (req, res, next) => {
    if (req.tenantContext?.isSuperAdmin) {
      return next();
    }

    if (!req.tenant) {
      return next(new AppError('租户信息未找到', 500));
    }

    // 检查必需的功能权限
    for (const feature of requiredFeatures) {
      if (!req.tenant.hasFeature(feature)) {
        return next(new AppError(`租户没有 ${feature} 功能权限`, 403));
      }
    }

    next();
  };
};

/**
 * 租户资源限制中间件
 */
const checkTenantLimits = (resourceType) => {
  return async (req, res, next) => {
    if (req.tenantContext?.isSuperAdmin) {
      return next();
    }

    if (!req.tenant) {
      return next(new AppError('租户信息未找到', 500));
    }

    try {
      switch (resourceType) {
        case 'users':
          const canAddUser = await req.tenant.canAddUser();
          if (!canAddUser) {
            return next(new AppError('已达到用户数量限制', 403));
          }
          break;
          
        case 'storage':
          // 这里可以添加存储空间检查逻辑
          break;
          
        default:
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 租户上下文日志中间件
 */
const logTenantContext = (req, res, next) => {
  if (req.tenant) {
    console.log(`[${new Date().toISOString()}] Tenant: ${req.tenant.name} (${req.tenant.slug}) - ${req.method} ${req.path}`);
  } else if (req.tenantContext?.isSuperAdmin) {
    console.log(`[${new Date().toISOString()}] Super Admin - ${req.method} ${req.path}`);
  }
  next();
};

module.exports = {
  identifyTenant,
  enforceTenantIsolation,
  checkTenantPermissions,
  checkTenantLimits,
  logTenantContext
};