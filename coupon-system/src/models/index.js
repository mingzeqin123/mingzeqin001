const sequelize = require('../config/database');
const User = require('./User');
const CouponTemplate = require('./CouponTemplate');
const UserCoupon = require('./UserCoupon');
const Order = require('./Order');
const Refund = require('./Refund');

// 定义模型关联关系

// User 与 UserCoupon 的关系
User.hasMany(UserCoupon, { foreignKey: 'userId', as: 'coupons' });
UserCoupon.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// CouponTemplate 与 UserCoupon 的关系
CouponTemplate.hasMany(UserCoupon, { foreignKey: 'templateId', as: 'userCoupons' });
UserCoupon.belongsTo(CouponTemplate, { foreignKey: 'templateId', as: 'template' });

// User 与 Order 的关系
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserCoupon 与 Order 的关系
UserCoupon.hasMany(Order, { foreignKey: 'couponId', as: 'orders' });
Order.belongsTo(UserCoupon, { foreignKey: 'couponId', as: 'coupon' });

// Order 与 Refund 的关系
Order.hasMany(Refund, { foreignKey: 'orderId', as: 'refunds' });
Refund.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// User 与 Refund 的关系
User.hasMany(Refund, { foreignKey: 'userId', as: 'refunds' });
Refund.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 导出所有模型和数据库连接
module.exports = {
  sequelize,
  User,
  CouponTemplate,
  UserCoupon,
  Order,
  Refund
};