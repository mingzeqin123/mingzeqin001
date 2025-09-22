const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../utils/catchAsync');
const { validateLogin } = require('../validators/userValidator');

/**
 * 生成 JWT Token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * 创建并发送 Token
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 1) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // 移除密码字段
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

/**
 * 用户登录
 */
const login = catchAsync(async (req, res, next) => {
  const { error, value } = validateLogin(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, password, tenantSlug } = value;

  // 1) 查找用户
  let user;
  
  if (tenantSlug) {
    // 租户用户登录
    const tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      throw new AppError('租户不存在', 404);
    }
    
    if (tenant.status !== 'active' && tenant.status !== 'trial') {
      throw new AppError('租户未激活或已被暂停', 403);
    }
    
    user = await User.findOne({ 
      email, 
      tenantId: tenant._id 
    }).select('+password').populate('tenantId');
    
  } else {
    // 超级管理员登录
    user = await User.findOne({ 
      email, 
      role: 'super_admin' 
    }).select('+password');
  }

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('邮箱或密码错误', 401);
  }

  // 2) 检查用户状态
  if (user.status !== 'active') {
    throw new AppError('账户已被禁用', 401);
  }

  // 3) 更新登录信息
  user.lastLogin = new Date();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  // 4) 生成并发送 token
  createSendToken(user, 200, res);
});

/**
 * 用户登出
 */
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: '登出成功'
  });
};

/**
 * 获取当前用户信息
 */
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('tenantId', 'name slug status subscription');

  res.json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * 更新用户资料
 */
const updateProfile = catchAsync(async (req, res) => {
  // 不允许更新的字段
  const restrictedFields = ['password', 'role', 'permissions', 'tenantId', 'status'];
  const updates = { ...req.body };
  
  restrictedFields.forEach(field => delete updates[field]);

  // 如果要更新邮箱，检查唯一性
  if (updates.email) {
    const existingUser = await User.findOne({
      email: updates.email,
      _id: { $ne: req.user.id },
      tenantId: req.user.tenantId
    });
    
    if (existingUser) {
      throw new AppError('邮箱已被使用', 400);
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  }).populate('tenantId', 'name slug status subscription');

  res.json({
    success: true,
    message: '资料更新成功',
    data: {
      user
    }
  });
});

/**
 * 修改密码
 */
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // 1) 验证输入
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('请提供当前密码和新密码', 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('新密码和确认密码不匹配', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('新密码至少需要6个字符', 400);
  }

  // 2) 获取用户（包含密码）
  const user = await User.findById(req.user.id).select('+password');

  // 3) 检查当前密码是否正确
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('当前密码错误', 401);
  }

  // 4) 更新密码
  user.password = newPassword;
  await user.save();

  // 5) 生成新的 token
  createSendToken(user, 200, res);
});

/**
 * 验证 Token（用于前端路由守卫）
 */
const verifyToken = catchAsync(async (req, res) => {
  // 如果到达这里，说明 authenticate 中间件已经验证了 token
  res.json({
    success: true,
    message: 'Token 有效',
    data: {
      user: req.user
    }
  });
});

/**
 * 刷新 Token
 */
const refreshToken = catchAsync(async (req, res) => {
  // 获取当前用户最新信息
  const user = await User.findById(req.user.id)
    .populate('tenantId', 'name slug status subscription');

  if (!user) {
    throw new AppError('用户不存在', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('账户已被禁用', 401);
  }

  // 生成新的 token
  createSendToken(user, 200, res);
});

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  refreshToken
};