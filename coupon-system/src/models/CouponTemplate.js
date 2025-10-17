const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CouponTemplate = sequelize.define('CouponTemplate', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('fixed', 'percentage', 'free_shipping'),
    allowNull: false,
    validate: {
      isIn: [['fixed', 'percentage', 'free_shipping']]
    }
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'min_order_amount',
    validate: {
      min: 0
    }
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'max_discount_amount',
    validate: {
      min: 0
    }
  },
  validDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    field: 'valid_days',
    validate: {
      min: 1,
      max: 365
    }
  },
  usageLimitPerUser: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'usage_limit_per_user',
    validate: {
      min: 1
    }
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'total_quantity',
    validate: {
      min: 1
    }
  },
  categoryIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'category_ids'
  },
  productIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'product_ids'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'expired'),
    defaultValue: 'active'
  }
}, {
  tableName: 'coupon_templates',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

// 实例方法
CouponTemplate.prototype.calculateDiscount = function(orderAmount, categoryIds = [], productIds = []) {
  // 检查最小订单金额
  if (orderAmount < this.minOrderAmount) {
    return 0;
  }

  // 检查适用范围
  if (this.categoryIds && this.categoryIds.length > 0) {
    const hasMatchingCategory = categoryIds.some(id => this.categoryIds.includes(id));
    if (!hasMatchingCategory) return 0;
  }

  if (this.productIds && this.productIds.length > 0) {
    const hasMatchingProduct = productIds.some(id => this.productIds.includes(id));
    if (!hasMatchingProduct) return 0;
  }

  let discount = 0;

  switch (this.type) {
    case 'fixed':
      discount = Math.min(this.value, orderAmount);
      break;
    case 'percentage':
      discount = orderAmount * (this.value / 100);
      if (this.maxDiscountAmount) {
        discount = Math.min(discount, this.maxDiscountAmount);
      }
      break;
    case 'free_shipping':
      // 免运费优惠，这里返回固定值，实际业务中可能需要根据运费计算
      discount = this.value;
      break;
  }

  return Math.round(discount * 100) / 100; // 保留两位小数
};

CouponTemplate.prototype.isApplicable = function(categoryIds = [], productIds = []) {
  // 如果没有限制分类和商品，则适用于所有
  if ((!this.categoryIds || this.categoryIds.length === 0) && 
      (!this.productIds || this.productIds.length === 0)) {
    return true;
  }

  // 检查分类匹配
  if (this.categoryIds && this.categoryIds.length > 0) {
    const hasMatchingCategory = categoryIds.some(id => this.categoryIds.includes(id));
    if (hasMatchingCategory) return true;
  }

  // 检查商品匹配
  if (this.productIds && this.productIds.length > 0) {
    const hasMatchingProduct = productIds.some(id => this.productIds.includes(id));
    if (hasMatchingProduct) return true;
  }

  return false;
};

module.exports = CouponTemplate;