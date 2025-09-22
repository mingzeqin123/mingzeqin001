const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 用户基本信息
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // 租户ID（多租户关键字段）
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  
  // 用户角色
  role: {
    type: String,
    enum: ['super_admin', 'tenant_admin', 'admin', 'user'],
    default: 'user'
  },
  
  // 权限列表
  permissions: [{
    type: String
  }],
  
  // 个人信息
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    phone: String,
    department: String,
    position: String
  },
  
  // 账户状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // 登录信息
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // 密码重置
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // 邮箱验证
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引确保同一租户内用户名和邮箱唯一
userSchema.index({ tenantId: 1, username: 1 }, { unique: true });
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// 超级管理员邮箱全局唯一
userSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { role: 'super_admin' }
  }
);

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 实例方法：验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 实例方法：检查权限
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions.includes(permission);
};

// 实例方法：获取完整姓名
userSchema.methods.getFullName = function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
};

// 虚拟字段：隐藏密码
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.emailVerificationToken;
  return user;
};

// 静态方法：根据租户查找用户
userSchema.statics.findByTenant = function(tenantId, conditions = {}) {
  return this.find({ tenantId, ...conditions });
};

module.exports = mongoose.model('User', userSchema);