const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../utils/catchAsync');
const { validateTenant, validateTenantUpdate } = require('../validators/tenantValidator');

/**
 * 获取所有租户（仅超级管理员）
 */
const getAllTenants = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  
  // 状态过滤
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // 订阅计划过滤
  if (req.query.plan) {
    filter['subscription.plan'] = req.query.plan;
  }
  
  // 搜索
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { slug: { $regex: req.query.search, $options: 'i' } },
      { 'contact.email': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const tenants = await Tenant.find(filter)
    .select('-database.connectionString')
    .populate('createdBy', 'username email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Tenant.countDocuments(filter);

  res.json({
    success: true,
    data: {
      tenants,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    }
  });
});

/**
 * 获取单个租户信息
 */
const getTenant = catchAsync(async (req, res) => {
  const tenantId = req.params.id;
  
  const tenant = await Tenant.findById(tenantId)
    .select('-database.connectionString')
    .populate('createdBy', 'username email');

  if (!tenant) {
    throw new AppError('租户不存在', 404);
  }

  // 非超级管理员只能查看自己的租户
  if (req.user.role !== 'super_admin' && tenant._id.toString() !== req.tenant._id.toString()) {
    throw new AppError('权限不足', 403);
  }

  // 获取租户统计信息
  const stats = await getTenantStats(tenantId);

  res.json({
    success: true,
    data: {
      tenant,
      stats
    }
  });
});

/**
 * 创建新租户（仅超级管理员）
 */
const createTenant = catchAsync(async (req, res) => {
  const { error, value } = validateTenant(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  // 检查 slug 是否已存在
  const existingTenant = await Tenant.findOne({ slug: value.slug });
  if (existingTenant) {
    throw new AppError('租户标识符已存在', 400);
  }

  // 检查域名是否已存在（如果提供了域名）
  if (value.domain) {
    const existingDomain = await Tenant.findOne({ domain: value.domain });
    if (existingDomain) {
      throw new AppError('域名已被使用', 400);
    }
  }

  const tenant = new Tenant({
    ...value,
    createdBy: req.user._id
  });

  await tenant.save();

  // 创建租户管理员账户
  if (value.adminUser) {
    const adminUser = new User({
      username: value.adminUser.username,
      email: value.adminUser.email,
      password: value.adminUser.password,
      tenantId: tenant._id,
      role: 'tenant_admin',
      emailVerified: true,
      permissions: [
        'user.read',
        'user.create',
        'user.update',
        'user.delete',
        'tenant.read',
        'tenant.update'
      ]
    });

    await adminUser.save();
  }

  res.status(201).json({
    success: true,
    message: '租户创建成功',
    data: {
      tenant: {
        ...tenant.toJSON(),
        database: undefined // 不返回数据库连接信息
      }
    }
  });
});

/**
 * 更新租户信息
 */
const updateTenant = catchAsync(async (req, res) => {
  const tenantId = req.params.id;
  
  const { error, value } = validateTenantUpdate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('租户不存在', 404);
  }

  // 非超级管理员只能更新自己的租户，且有限制
  if (req.user.role !== 'super_admin') {
    if (tenant._id.toString() !== req.tenant._id.toString()) {
      throw new AppError('权限不足', 403);
    }
    
    // 限制租户管理员可以更新的字段
    const allowedFields = ['name', 'contact', 'settings'];
    const updateFields = Object.keys(value);
    const isValidOperation = updateFields.every(field => 
      allowedFields.some(allowed => field.startsWith(allowed))
    );
    
    if (!isValidOperation) {
      throw new AppError('权限不足，无法更新指定字段', 403);
    }
  }

  // 检查 slug 唯一性（如果要更新 slug）
  if (value.slug && value.slug !== tenant.slug) {
    const existingTenant = await Tenant.findOne({ slug: value.slug });
    if (existingTenant) {
      throw new AppError('租户标识符已存在', 400);
    }
  }

  // 检查域名唯一性（如果要更新域名）
  if (value.domain && value.domain !== tenant.domain) {
    const existingDomain = await Tenant.findOne({ domain: value.domain });
    if (existingDomain) {
      throw new AppError('域名已被使用', 400);
    }
  }

  Object.assign(tenant, value);
  await tenant.save();

  res.json({
    success: true,
    message: '租户更新成功',
    data: {
      tenant: {
        ...tenant.toJSON(),
        database: undefined
      }
    }
  });
});

/**
 * 删除租户（仅超级管理员）
 */
const deleteTenant = catchAsync(async (req, res) => {
  const tenantId = req.params.id;
  
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('租户不存在', 404);
  }

  // 检查是否有关联的用户
  const userCount = await User.countDocuments({ tenantId });
  if (userCount > 0) {
    throw new AppError('无法删除有用户的租户，请先删除所有用户', 400);
  }

  await tenant.deleteOne();

  res.json({
    success: true,
    message: '租户删除成功'
  });
});

/**
 * 获取租户统计信息
 */
const getTenantStats = async (tenantId) => {
  const [userCount, adminCount] = await Promise.all([
    User.countDocuments({ tenantId }),
    User.countDocuments({ tenantId, role: { $in: ['tenant_admin', 'admin'] } })
  ]);

  return {
    userCount,
    adminCount,
    activeUsers: userCount, // 这里可以添加更复杂的活跃用户统计
  };
};

/**
 * 获取当前租户信息
 */
const getCurrentTenant = catchAsync(async (req, res) => {
  if (!req.tenant) {
    throw new AppError('租户信息未找到', 404);
  }

  const stats = await getTenantStats(req.tenant._id);

  res.json({
    success: true,
    data: {
      tenant: req.tenant,
      stats
    }
  });
});

/**
 * 更新租户状态（仅超级管理员）
 */
const updateTenantStatus = catchAsync(async (req, res) => {
  const tenantId = req.params.id;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended', 'trial'].includes(status)) {
    throw new AppError('无效的状态值', 400);
  }

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('租户不存在', 404);
  }

  tenant.status = status;
  await tenant.save();

  res.json({
    success: true,
    message: '租户状态更新成功',
    data: {
      tenant: {
        ...tenant.toJSON(),
        database: undefined
      }
    }
  });
});

/**
 * 获取租户使用情况报告
 */
const getTenantUsageReport = catchAsync(async (req, res) => {
  const tenantId = req.params.id;
  
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new AppError('租户不存在', 404);
  }

  // 非超级管理员只能查看自己租户的报告
  if (req.user.role !== 'super_admin' && tenant._id.toString() !== req.tenant._id.toString()) {
    throw new AppError('权限不足', 403);
  }

  const stats = await getTenantStats(tenantId);
  
  // 这里可以添加更多的使用情况统计
  const usageReport = {
    tenant: {
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.subscription.plan
    },
    usage: {
      users: {
        current: stats.userCount,
        limit: tenant.subscription.maxUsers,
        percentage: Math.round((stats.userCount / tenant.subscription.maxUsers) * 100)
      },
      storage: {
        current: 0, // TODO: 实现存储使用量统计
        limit: tenant.subscription.maxStorage,
        percentage: 0
      }
    },
    subscription: {
      plan: tenant.subscription.plan,
      startDate: tenant.subscription.startDate,
      endDate: tenant.subscription.endDate,
      daysRemaining: tenant.daysRemaining,
      isExpired: tenant.isExpired
    }
  };

  res.json({
    success: true,
    data: usageReport
  });
});

module.exports = {
  getAllTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getCurrentTenant,
  updateTenantStatus,
  getTenantUsageReport
};