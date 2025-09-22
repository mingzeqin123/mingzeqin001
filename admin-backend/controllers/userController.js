const User = require('../models/User');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../utils/catchAsync');
const { validateUser, validateUserUpdate } = require('../validators/userValidator');

/**
 * 获取用户列表
 */
const getUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let filter = {};
  
  // 超级管理员可以查看所有用户，其他角色只能查看自己租户的用户
  if (req.user.role === 'super_admin') {
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    }
  } else {
    filter.tenantId = req.tenant._id;
  }

  // 角色过滤
  if (req.query.role) {
    filter.role = req.query.role;
  }
  
  // 状态过滤
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // 搜索
  if (req.query.search) {
    filter.$or = [
      { username: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { 'profile.firstName': { $regex: req.query.search, $options: 'i' } },
      { 'profile.lastName': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .populate('tenantId', 'name slug')
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: {
      users,
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
 * 获取单个用户信息
 */
const getUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  
  let filter = { _id: userId };
  
  // 非超级管理员只能查看自己租户的用户
  if (req.user.role !== 'super_admin') {
    filter.tenantId = req.tenant._id;
  }

  const user = await User.findOne(filter)
    .populate('tenantId', 'name slug')
    .select('-password');

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * 创建新用户
 */
const createUser = catchAsync(async (req, res) => {
  const { error, value } = validateUser(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  // 设置租户ID
  if (req.user.role === 'super_admin') {
    // 超级管理员可以指定租户
    if (!value.tenantId) {
      throw new AppError('超级管理员创建用户时必须指定租户', 400);
    }
  } else {
    // 其他角色只能在自己的租户下创建用户
    value.tenantId = req.tenant._id;
  }

  // 检查租户用户数量限制
  if (req.tenant && !(await req.tenant.canAddUser())) {
    throw new AppError('已达到租户用户数量限制', 403);
  }

  // 检查用户名和邮箱在租户内的唯一性
  const existingUser = await User.findOne({
    tenantId: value.tenantId,
    $or: [
      { username: value.username },
      { email: value.email }
    ]
  });

  if (existingUser) {
    throw new AppError('用户名或邮箱已存在', 400);
  }

  // 权限检查：只有管理员可以创建管理员用户
  if (['admin', 'tenant_admin'].includes(value.role)) {
    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      throw new AppError('权限不足，无法创建管理员用户', 403);
    }
  }

  const user = new User(value);
  await user.save();

  res.status(201).json({
    success: true,
    message: '用户创建成功',
    data: { user }
  });
});

/**
 * 更新用户信息
 */
const updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  
  const { error, value } = validateUserUpdate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  let filter = { _id: userId };
  
  // 非超级管理员只能更新自己租户的用户
  if (req.user.role !== 'super_admin') {
    filter.tenantId = req.tenant._id;
  }

  const user = await User.findOne(filter);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // 权限检查
  if (value.role && value.role !== user.role) {
    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      throw new AppError('权限不足，无法修改用户角色', 403);
    }
    
    // 租户管理员不能创建超级管理员
    if (value.role === 'super_admin' && req.user.role !== 'super_admin') {
      throw new AppError('权限不足，无法创建超级管理员', 403);
    }
  }

  // 检查用户名和邮箱唯一性
  if (value.username || value.email) {
    const existingUser = await User.findOne({
      _id: { $ne: userId },
      tenantId: user.tenantId,
      $or: [
        ...(value.username ? [{ username: value.username }] : []),
        ...(value.email ? [{ email: value.email }] : [])
      ]
    });

    if (existingUser) {
      throw new AppError('用户名或邮箱已存在', 400);
    }
  }

  Object.assign(user, value);
  await user.save();

  res.json({
    success: true,
    message: '用户更新成功',
    data: { user }
  });
});

/**
 * 删除用户
 */
const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  
  let filter = { _id: userId };
  
  // 非超级管理员只能删除自己租户的用户
  if (req.user.role !== 'super_admin') {
    filter.tenantId = req.tenant._id;
  }

  const user = await User.findOne(filter);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // 不能删除自己
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('不能删除自己', 400);
  }

  // 权限检查：只有管理员可以删除管理员用户
  if (['admin', 'tenant_admin', 'super_admin'].includes(user.role)) {
    if (!['super_admin', 'tenant_admin'].includes(req.user.role)) {
      throw new AppError('权限不足，无法删除管理员用户', 403);
    }
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: '用户删除成功'
  });
});

/**
 * 更新用户状态
 */
const updateUserStatus = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new AppError('无效的状态值', 400);
  }

  let filter = { _id: userId };
  
  // 非超级管理员只能更新自己租户的用户状态
  if (req.user.role !== 'super_admin') {
    filter.tenantId = req.tenant._id;
  }

  const user = await User.findOne(filter);
  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  // 不能修改自己的状态
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('不能修改自己的状态', 400);
  }

  user.status = status;
  await user.save();

  res.json({
    success: true,
    message: '用户状态更新成功',
    data: { user }
  });
});

/**
 * 获取用户统计信息
 */
const getUserStats = catchAsync(async (req, res) => {
  let filter = {};
  
  // 非超级管理员只能查看自己租户的统计
  if (req.user.role !== 'super_admin') {
    filter.tenantId = req.tenant._id;
  } else if (req.query.tenantId) {
    filter.tenantId = req.query.tenantId;
  }

  const stats = await Promise.all([
    User.countDocuments({ ...filter, status: 'active' }),
    User.countDocuments({ ...filter, status: 'inactive' }),
    User.countDocuments({ ...filter, status: 'suspended' }),
    User.countDocuments({ ...filter, role: 'admin' }),
    User.countDocuments({ ...filter, role: 'user' }),
    User.countDocuments({
      ...filter,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  res.json({
    success: true,
    data: {
      total: stats[0] + stats[1] + stats[2],
      active: stats[0],
      inactive: stats[1],
      suspended: stats[2],
      admins: stats[3],
      users: stats[4],
      newThisMonth: stats[5]
    }
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserStats
};