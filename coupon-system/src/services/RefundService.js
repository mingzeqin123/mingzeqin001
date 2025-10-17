const { Order, Refund, UserCoupon, CouponTemplate, User } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class RefundService {
  /**
   * 创建退款申请
   * @param {Object} refundData - 退款数据
   * @returns {Promise<Refund>} 创建的退款记录
   */
  async createRefund(refundData) {
    const {
      orderId,
      userId,
      refundAmount,
      refundReason,
      couponRefundType = 'restore'
    } = refundData;

    const transaction = await sequelize.transaction();

    try {
      // 验证订单
      const order = await Order.findByPk(orderId, {
        include: [{
          model: UserCoupon,
          as: 'coupon',
          include: [{
            model: CouponTemplate,
            as: 'template'
          }]
        }],
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.userId !== userId) {
        throw new Error('订单不属于当前用户');
      }

      if (!order.canRefund()) {
        throw new Error('订单状态不允许退款');
      }

      // 验证退款金额
      if (refundAmount <= 0 || refundAmount > order.finalAmount) {
        throw new Error('退款金额无效');
      }

      // 检查是否已有退款申请
      const existingRefund = await Refund.findOne({
        where: {
          orderId,
          refundStatus: {
            [Op.in]: ['pending', 'processing']
          }
        },
        transaction
      });

      if (existingRefund) {
        throw new Error('该订单已有进行中的退款申请');
      }

      // 创建退款记录
      const refund = await Refund.create({
        orderId,
        userId,
        refundAmount,
        refundReason,
        couponRefundType,
        refundStatus: 'pending'
      }, { transaction });

      await transaction.commit();

      return refund;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 处理退款
   * @param {number} refundId - 退款ID
   * @param {Object} processData - 处理数据
   * @returns {Promise<Object>} 处理结果
   */
  async processRefund(refundId, processData = {}) {
    const { adminId, approvalNote } = processData;

    const transaction = await sequelize.transaction();

    try {
      const refund = await Refund.findByPk(refundId, {
        include: [{
          model: Order,
          as: 'order',
          include: [{
            model: UserCoupon,
            as: 'coupon',
            include: [{
              model: CouponTemplate,
              as: 'template'
            }]
          }]
        }],
        transaction
      });

      if (!refund) {
        throw new Error('退款记录不存在');
      }

      if (!refund.canProcess()) {
        throw new Error('退款状态不允许处理');
      }

      // 开始处理退款
      await refund.startProcessing();

      const order = refund.order;

      // 调用支付网关进行退款
      const refundResult = await this.callRefundGateway({
        originalTransactionId: order.paymentTransactionId,
        refundAmount: refund.refundAmount,
        refundReason: refund.refundReason,
        refundNo: refund.refundNo
      });

      if (!refundResult.success) {
        // 退款失败
        await refund.fail(refundResult.error);
        await transaction.commit();

        return {
          success: false,
          error: refundResult.error,
          refund
        };
      }

      // 退款成功，完成退款记录
      await refund.complete(refundResult.transactionId);

      // 处理优惠券退款
      if (order.coupon) {
        await this.handleCouponRefund(order.coupon, refund.couponRefundType, transaction);
      }

      // 更新订单状态
      const isFullRefund = refund.refundAmount >= order.finalAmount;
      await order.markAsRefunded(!isFullRefund);

      await transaction.commit();

      return {
        success: true,
        refund: await refund.reload(),
        transactionId: refundResult.transactionId
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 处理优惠券退款
   * @param {UserCoupon} userCoupon - 用户优惠券
   * @param {string} refundType - 退款类型
   * @param {Transaction} transaction - 数据库事务
   */
  async handleCouponRefund(userCoupon, refundType, transaction) {
    switch (refundType) {
      case 'restore':
        // 恢复优惠券
        if (userCoupon.isExpired()) {
          // 如果优惠券已过期，延长有效期
          const template = userCoupon.template;
          const newExpiresAt = moment().add(template.validDays, 'days').toDate();
          await userCoupon.update({
            status: 'unused',
            usedAt: null,
            orderId: null,
            expiresAt: newExpiresAt
          }, { transaction });
        } else {
          await userCoupon.restore();
        }
        break;

      case 'void':
        // 作废优惠券，不恢复
        await userCoupon.update({
          status: 'refunded'
        }, { transaction });
        break;

      case 'new_coupon':
        // 发放新的优惠券
        const template = userCoupon.template;
        const newExpiresAt = moment().add(template.validDays, 'days').toDate();
        
        await UserCoupon.create({
          userId: userCoupon.userId,
          templateId: userCoupon.templateId,
          expiresAt: newExpiresAt,
          obtainedAt: new Date()
        }, { transaction });

        // 原优惠券标记为已退款
        await userCoupon.update({
          status: 'refunded'
        }, { transaction });
        break;

      default:
        throw new Error('无效的优惠券退款类型');
    }
  }

  /**
   * 模拟退款网关调用
   * @param {Object} refundData - 退款数据
   * @returns {Promise<Object>} 退款结果
   */
  async callRefundGateway(refundData) {
    const { originalTransactionId, refundAmount, refundReason, refundNo } = refundData;

    // 模拟退款处理时间
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟退款结果（95%成功率）
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        refundAmount,
        originalTransactionId,
        processedAt: new Date()
      };
    } else {
      return {
        success: false,
        error: '退款网关处理失败',
        errorCode: 'REFUND_GATEWAY_ERROR'
      };
    }
  }

  /**
   * 取消退款申请
   * @param {number} refundId - 退款ID
   * @param {string} reason - 取消原因
   * @returns {Promise<Refund>} 更新后的退款记录
   */
  async cancelRefund(refundId, reason = '') {
    const refund = await Refund.findByPk(refundId);

    if (!refund) {
      throw new Error('退款记录不存在');
    }

    if (!refund.canCancel()) {
      throw new Error('当前状态不允许取消退款');
    }

    await refund.cancel(reason);

    return refund;
  }

  /**
   * 获取退款列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>} 退款列表和分页信息
   */
  async getRefunds(filters = {}) {
    const {
      userId,
      orderId,
      refundStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filters;

    const where = {};
    
    if (userId) where.userId = userId;
    if (orderId) where.orderId = orderId;
    if (refundStatus) where.refundStatus = refundStatus;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Refund.findAndCountAll({
      where,
      include: [{
        model: Order,
        as: 'order',
        attributes: ['id', 'orderNo', 'originalAmount', 'finalAmount', 'paymentMethod'],
        include: [{
          model: UserCoupon,
          as: 'coupon',
          attributes: ['couponCode'],
          include: [{
            model: CouponTemplate,
            as: 'template',
            attributes: ['name', 'type', 'value']
          }]
        }]
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      refunds: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 获取退款详情
   * @param {number} refundId - 退款ID
   * @returns {Promise<Refund>} 退款详情
   */
  async getRefundDetail(refundId) {
    const refund = await Refund.findByPk(refundId, {
      include: [{
        model: Order,
        as: 'order',
        include: [{
          model: UserCoupon,
          as: 'coupon',
          include: [{
            model: CouponTemplate,
            as: 'template'
          }]
        }]
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!refund) {
      throw new Error('退款记录不存在');
    }

    return refund;
  }

  /**
   * 获取退款统计
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>} 统计结果
   */
  async getRefundStats(filters = {}) {
    const { startDate, endDate, userId } = filters;
    
    const where = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) where.completedAt[Op.gte] = startDate;
      if (endDate) where.completedAt[Op.lte] = endDate;
    }

    const [totalRefunds, completedRefunds, totalRefundAmount, pendingRefunds] = await Promise.all([
      Refund.count({ where }),
      Refund.count({ where: { ...where, refundStatus: 'completed' } }),
      Refund.sum('refundAmount', { where: { ...where, refundStatus: 'completed' } }),
      Refund.count({ where: { ...where, refundStatus: 'pending' } })
    ]);

    return {
      totalRefunds,
      completedRefunds,
      totalRefundAmount: totalRefundAmount || 0,
      pendingRefunds,
      completionRate: totalRefunds > 0 ? (completedRefunds / totalRefunds * 100).toFixed(2) : 0
    };
  }

  /**
   * 批量处理退款
   * @param {Array} refundIds - 退款ID数组
   * @param {Object} processData - 处理数据
   * @returns {Promise<Object>} 批量处理结果
   */
  async batchProcessRefunds(refundIds, processData = {}) {
    const results = {
      success: [],
      failed: [],
      total: refundIds.length
    };

    for (const refundId of refundIds) {
      try {
        const result = await this.processRefund(refundId, processData);
        results.success.push({
          refundId,
          transactionId: result.transactionId
        });
      } catch (error) {
        results.failed.push({
          refundId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 自动处理超时的退款申请
   * @param {number} timeoutHours - 超时小时数，默认24小时
   * @returns {Promise<number>} 处理的退款数量
   */
  async autoProcessTimeoutRefunds(timeoutHours = 24) {
    const timeoutDate = moment().subtract(timeoutHours, 'hours').toDate();

    const timeoutRefunds = await Refund.findAll({
      where: {
        refundStatus: 'pending',
        createdAt: {
          [Op.lt]: timeoutDate
        }
      }
    });

    let processedCount = 0;

    for (const refund of timeoutRefunds) {
      try {
        await this.processRefund(refund.id, {
          adminId: null, // 系统自动处理
          approvalNote: '系统自动处理超时退款申请'
        });
        processedCount++;
      } catch (error) {
        console.error(`自动处理退款失败: ${error.message}`, {
          refundId: refund.id
        });
      }
    }

    return processedCount;
  }
}

module.exports = new RefundService();