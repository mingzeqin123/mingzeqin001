const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const UserCoupon = sequelize.define('UserCoupon', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  templateId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'template_id'
  },
  batchId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'batch_id'
  },
  couponCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'coupon_code'
  },
  obtainedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'obtained_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'used_at'
  },
  orderId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'order_id'
  },
  status: {
    type: DataTypes.ENUM('unused', 'used', 'expired', 'refunded'),
    defaultValue: 'unused'
  }
}, {
  tableName: 'user_coupons',
  indexes: [
    {
      fields: ['user_id', 'status']
    },
    {
      fields: ['coupon_code']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['template_id']
    }
  ],
  hooks: {
    beforeCreate: (userCoupon) => {
      if (!userCoupon.couponCode) {
        userCoupon.couponCode = generateCouponCode();
      }
    }
  }
});

// 生成优惠券码
function generateCouponCode() {
  const prefix = 'CPN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// 实例方法
UserCoupon.prototype.isValid = function() {
  return this.status === 'unused' && moment().isBefore(this.expiresAt);
};

UserCoupon.prototype.isExpired = function() {
  return moment().isAfter(this.expiresAt);
};

UserCoupon.prototype.canUse = function() {
  return this.status === 'unused' && !this.isExpired();
};

UserCoupon.prototype.use = function(orderId) {
  if (!this.canUse()) {
    throw new Error('优惠券不可用');
  }
  
  this.status = 'used';
  this.usedAt = new Date();
  this.orderId = orderId;
  return this.save();
};

UserCoupon.prototype.refund = function() {
  if (this.status !== 'used') {
    throw new Error('只有已使用的优惠券才能退款');
  }
  
  this.status = 'refunded';
  return this.save();
};

UserCoupon.prototype.restore = function() {
  if (this.status !== 'refunded') {
    throw new Error('只有已退款的优惠券才能恢复');
  }
  
  // 检查是否过期
  if (this.isExpired()) {
    this.status = 'expired';
  } else {
    this.status = 'unused';
    this.usedAt = null;
    this.orderId = null;
  }
  
  return this.save();
};

// 静态方法
UserCoupon.generateCouponCode = generateCouponCode;

module.exports = UserCoupon;