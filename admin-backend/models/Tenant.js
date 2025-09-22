const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // 租户基本信息
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // 租户唯一标识符（用于子域名或路由）
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 50
  },
  
  // 租户域名（可选）
  domain: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true
  },
  
  // 租户状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial'],
    default: 'trial'
  },
  
  // 联系信息
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: String,
    address: String
  },
  
  // 订阅信息
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    maxUsers: {
      type: Number,
      default: 5
    },
    maxStorage: {
      type: Number,
      default: 1024 // MB
    }
  },
  
  // 配置信息
  settings: {
    theme: {
      type: String,
      default: 'default'
    },
    language: {
      type: String,
      default: 'zh-CN'
    },
    timezone: {
      type: String,
      default: 'Asia/Shanghai'
    },
    features: [{
      type: String
    }]
  },
  
  // 数据库连接信息（如果使用数据库分离策略）
  database: {
    connectionString: String,
    dbName: String
  },
  
  // 创建者信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
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

// 更新时间中间件
tenantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 虚拟字段：是否过期
tenantSchema.virtual('isExpired').get(function() {
  if (!this.subscription.endDate) return false;
  return new Date() > this.subscription.endDate;
});

// 虚拟字段：剩余天数
tenantSchema.virtual('daysRemaining').get(function() {
  if (!this.subscription.endDate) return null;
  const diff = this.subscription.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// 实例方法：检查功能权限
tenantSchema.methods.hasFeature = function(feature) {
  return this.settings.features.includes(feature);
};

// 实例方法：检查用户数量限制
tenantSchema.methods.canAddUser = async function() {
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({ tenantId: this._id });
  return userCount < this.subscription.maxUsers;
};

// 静态方法：根据域名或slug查找租户
tenantSchema.statics.findByIdentifier = function(identifier) {
  return this.findOne({
    $or: [
      { slug: identifier },
      { domain: identifier }
    ]
  });
};

module.exports = mongoose.model('Tenant', tenantSchema);