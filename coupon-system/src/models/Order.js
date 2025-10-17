const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');

const Order = sequelize.define('Order', {
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
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_no'
  },
  originalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'original_amount',
    validate: {
      min: 0
    }
  },
  couponDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'coupon_discount',
    validate: {
      min: 0
    }
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'final_amount',
    validate: {
      min: 0
    }
  },
  couponId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'coupon_id'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partial_refunded'),
    defaultValue: 'pending',
    field: 'payment_status'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'payment_method'
  },
  paymentTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payment_transaction_id'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at'
  }
}, {
  tableName: 'orders',
  indexes: [
    {
      fields: ['user_id', 'payment_status']
    },
    {
      fields: ['order_no']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['coupon_id']
    }
  ],
  hooks: {
    beforeCreate: (order) => {
      if (!order.orderNo) {
        order.orderNo = generateOrderNo();
      }
      // 计算最终金额
      order.finalAmount = Math.max(0, order.originalAmount - order.couponDiscount);
    },
    beforeUpdate: (order) => {
      // 如果原始金额或优惠券折扣发生变化，重新计算最终金额
      if (order.changed('originalAmount') || order.changed('couponDiscount')) {
        order.finalAmount = Math.max(0, order.originalAmount - order.couponDiscount);
      }
    }
  }
});

// 生成订单号
function generateOrderNo() {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString().substr(2, 6);
  return `ORD${timestamp}${random}`;
}

// 实例方法
Order.prototype.isPaid = function() {
  return this.paymentStatus === 'paid';
};

Order.prototype.canRefund = function() {
  return this.paymentStatus === 'paid';
};

Order.prototype.isRefunded = function() {
  return this.paymentStatus === 'refunded' || this.paymentStatus === 'partial_refunded';
};

Order.prototype.markAsPaid = function(paymentMethod, transactionId) {
  this.paymentStatus = 'paid';
  this.paymentMethod = paymentMethod;
  this.paymentTransactionId = transactionId;
  this.paidAt = new Date();
  return this.save();
};

Order.prototype.markAsRefunded = function(isPartial = false) {
  this.paymentStatus = isPartial ? 'partial_refunded' : 'refunded';
  return this.save();
};

Order.prototype.applyCoupon = function(couponDiscount, couponId) {
  this.couponDiscount = couponDiscount;
  this.couponId = couponId;
  this.finalAmount = Math.max(0, this.originalAmount - couponDiscount);
  return this.save();
};

Order.prototype.removeCoupon = function() {
  this.couponDiscount = 0;
  this.couponId = null;
  this.finalAmount = this.originalAmount;
  return this.save();
};

// 静态方法
Order.generateOrderNo = generateOrderNo;

module.exports = Order;