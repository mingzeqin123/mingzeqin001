const { UserCoupon, CouponTemplate, Order, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class CouponUsageService {
  /**
   * 验证优惠券是否可用
   * @param {string} couponCode - 优惠券码
   * @param {number} userId - 用户ID
   * @param {Object} orderInfo - 订单信息
   * @returns {Promise<Object>} 验证结果
   */
  async validateCoupon(couponCode, userId, orderInfo = {}) {
    const userCoupon = await UserCoupon.findOne({
      where: {
        couponCode,
        userId
      },
      include: [{
        model: CouponTemplate,
        as: 'template'
      }]
    });

    if (!userCoupon) {
      return {
        valid: false,
        error: '优惠券不存在或不属于当前用户'
      };
    }

    if (!userCoupon.canUse()) {
      return {
        valid: false,
        error: userCoupon.status === 'used' ? '优惠券已使用' : 
               userCoupon.status === 'expired' ? '优惠券已过期' : 
               userCoupon.status === 'refunded' ? '优惠券已退款' : '优惠券不可用'
      };
    }

    const template = userCoupon.template;
    if (!template || template.status !== 'active') {
      return {
        valid: false,
        error: '优惠券模板已失效'
      };
    }

    // 检查订单金额是否满足最小消费要求
    if (orderInfo.amount && orderInfo.amount < template.minOrderAmount) {
      return {
        valid: false,
        error: `订单金额不满足最小消费要求￥${template.minOrderAmount}`
      };
    }

    // 检查商品适用范围
    if (orderInfo.categoryIds || orderInfo.productIds) {
      const isApplicable = template.isApplicable(
        orderInfo.categoryIds || [],
        orderInfo.productIds || []
      );

      if (!isApplicable) {
        return {
          valid: false,
          error: '优惠券不适用于当前商品'
        };
      }
    }

    // 计算折扣金额
    const discountAmount = template.calculateDiscount(
      orderInfo.amount || 0,
      orderInfo.categoryIds || [],
      orderInfo.productIds || []
    );

    return {
      valid: true,
      userCoupon,
      template,
      discountAmount
    };
  }

  /**
   * 使用优惠券
   * @param {string} couponCode - 优惠券码
   * @param {number} userId - 用户ID
   * @param {number} orderId - 订单ID
   * @param {Object} orderInfo - 订单信息
   * @returns {Promise<Object>} 使用结果
   */
  async useCoupon(couponCode, userId, orderId, orderInfo) {
    // 验证优惠券
    const validation = await this.validateCoupon(couponCode, userId, orderInfo);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const { userCoupon, discountAmount } = validation;

    try {
      // 使用优惠券
      await userCoupon.use(orderId);

      return {
        success: true,
        userCoupon,
        discountAmount,
        message: '优惠券使用成功'
      };
    } catch (error) {
      throw new Error(`使用优惠券失败: ${error.message}`);
    }
  }

  /**
   * 获取用户可用的优惠券列表
   * @param {number} userId - 用户ID
   * @param {Object} orderInfo - 订单信息（用于筛选适用的优惠券）
   * @returns {Promise<Array>} 可用优惠券列表
   */
  async getUserAvailableCoupons(userId, orderInfo = {}) {
    const userCoupons = await UserCoupon.findAll({
      where: {
        userId,
        status: 'unused',
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      include: [{
        model: CouponTemplate,
        as: 'template',
        where: {
          status: 'active'
        }
      }],
      order: [['expiresAt', 'ASC']]
    });

    const availableCoupons = [];

    for (const userCoupon of userCoupons) {
      const template = userCoupon.template;

      // 检查最小订单金额
      if (orderInfo.amount && orderInfo.amount < template.minOrderAmount) {
        continue;
      }

      // 检查适用范围
      if (orderInfo.categoryIds || orderInfo.productIds) {
        const isApplicable = template.isApplicable(
          orderInfo.categoryIds || [],
          orderInfo.productIds || []
        );
        if (!isApplicable) {
          continue;
        }
      }

      // 计算折扣金额
      const discountAmount = template.calculateDiscount(
        orderInfo.amount || 0,
        orderInfo.categoryIds || [],
        orderInfo.productIds || []
      );

      availableCoupons.push({
        ...userCoupon.toJSON(),
        discountAmount,
        template: template.toJSON()
      });
    }

    return availableCoupons;
  }

  /**
   * 获取最优优惠券推荐
   * @param {number} userId - 用户ID
   * @param {Object} orderInfo - 订单信息
   * @returns {Promise<Object|null>} 最优优惠券
   */
  async getBestCouponRecommendation(userId, orderInfo) {
    const availableCoupons = await this.getUserAvailableCoupons(userId, orderInfo);

    if (availableCoupons.length === 0) {
      return null;
    }

    // 按折扣金额降序排序，选择折扣最大的优惠券
    availableCoupons.sort((a, b) => b.discountAmount - a.discountAmount);

    return availableCoupons[0];
  }

  /**
   * 批量验证优惠券组合
   * @param {Array} couponCodes - 优惠券码数组
   * @param {number} userId - 用户ID
   * @param {Object} orderInfo - 订单信息
   * @returns {Promise<Object>} 验证结果
   */
  async validateCouponCombination(couponCodes, userId, orderInfo) {
    const results = [];
    let totalDiscount = 0;
    const validCoupons = [];

    for (const couponCode of couponCodes) {
      const validation = await this.validateCoupon(couponCode, userId, orderInfo);
      
      if (validation.valid) {
        validCoupons.push(validation.userCoupon);
        totalDiscount += validation.discountAmount;
        results.push({
          couponCode,
          valid: true,
          discountAmount: validation.discountAmount
        });
      } else {
        results.push({
          couponCode,
          valid: false,
          error: validation.error
        });
      }
    }

    // 确保总折扣不超过订单金额
    if (totalDiscount > orderInfo.amount) {
      totalDiscount = orderInfo.amount;
    }

    return {
      results,
      validCoupons,
      totalDiscount,
      finalAmount: Math.max(0, orderInfo.amount - totalDiscount)
    };
  }

  /**
   * 获取用户优惠券使用统计
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 统计结果
   */
  async getUserCouponStats(userId, options = {}) {
    const { startDate, endDate } = options;
    
    const whereClause = { userId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = startDate;
      if (endDate) whereClause.createdAt[Op.lte] = endDate;
    }

    const [total, unused, used, expired] = await Promise.all([
      UserCoupon.count({ where: whereClause }),
      UserCoupon.count({ where: { ...whereClause, status: 'unused' } }),
      UserCoupon.count({ where: { ...whereClause, status: 'used' } }),
      UserCoupon.count({ where: { ...whereClause, status: 'expired' } })
    ]);

    // 计算总节省金额
    const usedCoupons = await UserCoupon.findAll({
      where: {
        ...whereClause,
        status: 'used'
      },
      include: [{
        model: Order,
        as: 'orders',
        attributes: ['couponDiscount']
      }]
    });

    const totalSaved = usedCoupons.reduce((sum, coupon) => {
      return sum + (coupon.orders?.[0]?.couponDiscount || 0);
    }, 0);

    return {
      total,
      unused,
      used,
      expired,
      totalSaved,
      usageRate: total > 0 ? (used / total * 100).toFixed(2) : 0
    };
  }

  /**
   * 检查优惠券是否即将过期
   * @param {number} userId - 用户ID
   * @param {number} days - 天数阈值，默认7天
   * @returns {Promise<Array>} 即将过期的优惠券列表
   */
  async getExpiringCoupons(userId, days = 7) {
    const expirationDate = moment().add(days, 'days').toDate();

    return await UserCoupon.findAll({
      where: {
        userId,
        status: 'unused',
        expiresAt: {
          [Op.between]: [new Date(), expirationDate]
        }
      },
      include: [{
        model: CouponTemplate,
        as: 'template'
      }],
      order: [['expiresAt', 'ASC']]
    });
  }

  /**
   * 自动过期优惠券（定时任务使用）
   * @returns {Promise<number>} 过期的优惠券数量
   */
  async expireOldCoupons() {
    const [affectedRows] = await UserCoupon.update(
      { status: 'expired' },
      {
        where: {
          status: 'unused',
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      }
    );

    return affectedRows;
  }
}

module.exports = new CouponUsageService();