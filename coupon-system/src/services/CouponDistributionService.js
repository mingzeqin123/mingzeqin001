const { UserCoupon, CouponTemplate, User } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

class CouponDistributionService {
  /**
   * 批量发放优惠券给指定用户
   * @param {number} templateId - 优惠券模板ID
   * @param {Array} userIds - 用户ID数组
   * @param {Object} options - 发放选项
   * @returns {Promise<Object>} 发放结果
   */
  async distributeToUsers(templateId, userIds, options = {}) {
    const template = await CouponTemplate.findByPk(templateId);
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    if (template.status !== 'active') {
      throw new Error('优惠券模板未激活');
    }

    const results = {
      success: [],
      failed: [],
      total: userIds.length
    };

    for (const userId of userIds) {
      try {
        const userCoupon = await this.distributeToUser(templateId, userId, options);
        results.success.push({
          userId,
          couponId: userCoupon.id,
          couponCode: userCoupon.couponCode
        });
      } catch (error) {
        results.failed.push({
          userId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 发放优惠券给单个用户
   * @param {number} templateId - 优惠券模板ID
   * @param {number} userId - 用户ID
   * @param {Object} options - 发放选项
   * @returns {Promise<UserCoupon>} 用户优惠券
   */
  async distributeToUser(templateId, userId, options = {}) {
    const template = await CouponTemplate.findByPk(templateId);
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    if (template.status !== 'active') {
      throw new Error('优惠券模板未激活');
    }

    // 检查用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.status !== 'active') {
      throw new Error('用户状态异常');
    }

    // 检查用户已拥有该模板优惠券的数量
    const userCouponCount = await UserCoupon.count({
      where: {
        userId,
        templateId,
        status: {
          [Op.in]: ['unused', 'used']
        }
      }
    });

    if (userCouponCount >= template.usageLimitPerUser) {
      throw new Error(`用户已达到该优惠券的最大拥有数量限制(${template.usageLimitPerUser})`);
    }

    // 检查总发行量限制
    if (template.totalQuantity) {
      const totalDistributed = await UserCoupon.count({
        where: {
          templateId,
          status: {
            [Op.in]: ['unused', 'used', 'expired']
          }
        }
      });

      if (totalDistributed >= template.totalQuantity) {
        throw new Error('优惠券已发完');
      }
    }

    // 计算过期时间
    const expiresAt = options.customExpiresAt || 
      moment().add(template.validDays, 'days').toDate();

    // 创建用户优惠券
    const userCoupon = await UserCoupon.create({
      userId,
      templateId,
      batchId: options.batchId,
      expiresAt,
      obtainedAt: new Date()
    });

    return userCoupon;
  }

  /**
   * 自动发放优惠券（新用户注册）
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 发放的优惠券列表
   */
  async distributeWelcomeCoupons(userId) {
    // 获取所有新用户注册优惠券模板
    const templates = await CouponTemplate.findAll({
      where: {
        status: 'active',
        // 这里可以添加特定的新用户优惠券标识
        // 例如：category: 'welcome'
      }
    });

    const distributedCoupons = [];

    for (const template of templates) {
      try {
        const userCoupon = await this.distributeToUser(template.id, userId, {
          batchId: null // 自动发放不属于特定批次
        });
        distributedCoupons.push(userCoupon);
      } catch (error) {
        console.error(`发放新用户优惠券失败: ${error.message}`, {
          templateId: template.id,
          userId
        });
      }
    }

    return distributedCoupons;
  }

  /**
   * 生日优惠券发放
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 发放的优惠券列表
   */
  async distributeBirthdayCoupons(userId) {
    // 获取所有生日优惠券模板
    const templates = await CouponTemplate.findAll({
      where: {
        status: 'active',
        // 这里可以添加特定的生日优惠券标识
        // 例如：category: 'birthday'
      }
    });

    const distributedCoupons = [];

    for (const template of templates) {
      try {
        // 检查用户今年是否已经领取过生日优惠券
        const currentYear = moment().year();
        const yearStart = moment().startOf('year').toDate();
        const yearEnd = moment().endOf('year').toDate();

        const existingBirthdayCoupon = await UserCoupon.findOne({
          where: {
            userId,
            templateId: template.id,
            obtainedAt: {
              [Op.between]: [yearStart, yearEnd]
            }
          }
        });

        if (existingBirthdayCoupon) {
          continue; // 今年已经领取过了
        }

        const userCoupon = await this.distributeToUser(template.id, userId);
        distributedCoupons.push(userCoupon);
      } catch (error) {
        console.error(`发放生日优惠券失败: ${error.message}`, {
          templateId: template.id,
          userId
        });
      }
    }

    return distributedCoupons;
  }

  /**
   * 活动优惠券发放
   * @param {number} templateId - 优惠券模板ID
   * @param {Object} criteria - 发放条件
   * @returns {Promise<Object>} 发放结果
   */
  async distributeEventCoupons(templateId, criteria = {}) {
    const template = await CouponTemplate.findByPk(templateId);
    if (!template) {
      throw new Error('优惠券模板不存在');
    }

    // 构建用户查询条件
    const userWhere = {
      status: 'active'
    };

    // 根据条件筛选用户
    if (criteria.userIds && criteria.userIds.length > 0) {
      userWhere.id = { [Op.in]: criteria.userIds };
    }

    if (criteria.registeredAfter) {
      userWhere.createdAt = { [Op.gte]: criteria.registeredAfter };
    }

    if (criteria.registeredBefore) {
      userWhere.createdAt = userWhere.createdAt || {};
      userWhere.createdAt[Op.lte] = criteria.registeredBefore;
    }

    const users = await User.findAll({
      where: userWhere,
      attributes: ['id']
    });

    const userIds = users.map(user => user.id);

    return await this.distributeToUsers(templateId, userIds, {
      batchId: criteria.batchId
    });
  }

  /**
   * 获取用户可领取的优惠券
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 可领取的优惠券模板列表
   */
  async getAvailableCouponsForUser(userId) {
    const user = await User.findByPk(userId);
    if (!user || user.status !== 'active') {
      return [];
    }

    // 获取所有激活的优惠券模板
    const templates = await CouponTemplate.findAll({
      where: {
        status: 'active'
      }
    });

    const availableTemplates = [];

    for (const template of templates) {
      // 检查用户已拥有该模板优惠券的数量
      const userCouponCount = await UserCoupon.count({
        where: {
          userId,
          templateId: template.id,
          status: {
            [Op.in]: ['unused', 'used']
          }
        }
      });

      if (userCouponCount < template.usageLimitPerUser) {
        // 检查总发行量限制
        if (template.totalQuantity) {
          const totalDistributed = await UserCoupon.count({
            where: {
              templateId: template.id,
              status: {
                [Op.in]: ['unused', 'used', 'expired']
              }
            }
          });

          if (totalDistributed < template.totalQuantity) {
            availableTemplates.push(template);
          }
        } else {
          availableTemplates.push(template);
        }
      }
    }

    return availableTemplates;
  }

  /**
   * 用户主动领取优惠券
   * @param {number} templateId - 优惠券模板ID
   * @param {number} userId - 用户ID
   * @returns {Promise<UserCoupon>} 领取的优惠券
   */
  async claimCoupon(templateId, userId) {
    return await this.distributeToUser(templateId, userId);
  }
}

module.exports = new CouponDistributionService();