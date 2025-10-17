const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment');

const Refund = sequelize.define('Refund', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'order_id'
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  refundNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'refund_no'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'refund_amount',
    validate: {
      min: 0
    }
  },
  couponRefundType: {
    type: DataTypes.ENUM('restore', 'void', 'new_coupon'),
    defaultValue: 'restore',
    field: 'coupon_refund_type'
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refund_reason'
  },
  refundStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
    field: 'refund_status'
  },
  refundTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'refund_transaction_id'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  }
}, {
  tableName: 'refunds',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['refund_status']
    },
    {
      fields: ['refund_no']
    }
  ],
  hooks: {
    beforeCreate: (refund) => {
      if (!refund.refundNo) {
        refund.refundNo = generateRefundNo();
      }
    }
  }
});

// 生成退款单号
function generateRefundNo() {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString().substr(2, 6);
  return `REF${timestamp}${random}`;
}

// 实例方法
Refund.prototype.isPending = function() {
  return this.refundStatus === 'pending';
};

Refund.prototype.isProcessing = function() {
  return this.refundStatus === 'processing';
};

Refund.prototype.isCompleted = function() {
  return this.refundStatus === 'completed';
};

Refund.prototype.isFailed = function() {
  return this.refundStatus === 'failed';
};

Refund.prototype.isCancelled = function() {
  return this.refundStatus === 'cancelled';
};

Refund.prototype.canProcess = function() {
  return this.refundStatus === 'pending';
};

Refund.prototype.canCancel = function() {
  return this.refundStatus === 'pending' || this.refundStatus === 'processing';
};

Refund.prototype.startProcessing = function() {
  if (!this.canProcess()) {
    throw new Error('退款单状态不允许处理');
  }
  
  this.refundStatus = 'processing';
  this.processedAt = new Date();
  return this.save();
};

Refund.prototype.complete = function(transactionId) {
  if (this.refundStatus !== 'processing') {
    throw new Error('只有处理中的退款单才能完成');
  }
  
  this.refundStatus = 'completed';
  this.refundTransactionId = transactionId;
  this.completedAt = new Date();
  return this.save();
};

Refund.prototype.fail = function(reason) {
  if (this.refundStatus !== 'processing') {
    throw new Error('只有处理中的退款单才能标记为失败');
  }
  
  this.refundStatus = 'failed';
  if (reason) {
    this.refundReason = this.refundReason ? `${this.refundReason}\n失败原因: ${reason}` : `失败原因: ${reason}`;
  }
  return this.save();
};

Refund.prototype.cancel = function(reason) {
  if (!this.canCancel()) {
    throw new Error('当前状态不允许取消退款');
  }
  
  this.refundStatus = 'cancelled';
  if (reason) {
    this.refundReason = this.refundReason ? `${this.refundReason}\n取消原因: ${reason}` : `取消原因: ${reason}`;
  }
  return this.save();
};

// 静态方法
Refund.generateRefundNo = generateRefundNo;

module.exports = Refund;