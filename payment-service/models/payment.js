const mongoose = require('mongoose');

// 支付记录模型
const paymentSchema = new mongoose.Schema({
  // 支付ID
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 幂等性键 - 用于防重复提交
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 用户ID
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // 订单ID
  orderId: {
    type: String,
    required: true,
    index: true
  },
  
  // 支付金额（分为单位）
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  
  // 货币类型
  currency: {
    type: String,
    required: true,
    default: 'CNY'
  },
  
  // 支付方式
  paymentMethod: {
    type: String,
    required: true,
    enum: ['alipay', 'wechat', 'unionpay', 'credit_card']
  },
  
  // 支付状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  
  // 第三方支付平台交易号
  thirdPartyTransactionId: {
    type: String,
    index: true
  },
  
  // 支付描述
  description: {
    type: String,
    maxlength: 500
  },
  
  // 回调URL
  callbackUrl: {
    type: String
  },
  
  // 支付完成时间
  paidAt: {
    type: Date
  },
  
  // 失败原因
  failureReason: {
    type: String
  },
  
  // 重试次数
  retryCount: {
    type: Number,
    default: 0,
    max: 3
  },
  
  // 元数据
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  versionKey: false
});

// 创建复合索引
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// 幂等性记录模型
const idempotencySchema = new mongoose.Schema({
  // 幂等性键
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // 请求指纹（基于请求参数生成）
  requestFingerprint: {
    type: String,
    required: true
  },
  
  // 响应数据
  response: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // 处理状态
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true
  },
  
  // 关联的支付ID
  paymentId: {
    type: String,
    index: true
  },
  
  // 过期时间（24小时后自动清理）
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24小时
  }
}, {
  timestamps: true,
  versionKey: false
});

const Payment = mongoose.model('Payment', paymentSchema);
const IdempotencyRecord = mongoose.model('IdempotencyRecord', idempotencySchema);

module.exports = {
  Payment,
  IdempotencyRecord
};