const { Order, UserCoupon, User } = require('../models');
const CouponUsageService = require('./CouponUsageService');
const { sequelize } = require('../models');
const moment = require('moment');

class PaymentService {
  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Order>} 创建的订单
   */
  async createOrder(orderData) {
    const {
      userId,
      originalAmount,
      couponCode,
      items = [],
      paymentMethod
    } = orderData;

    // 验证用户
    const user = await User.findByPk(userId);
    if (!user || user.status !== 'active') {
      throw new Error('用户不存在或状态异常');
    }

    let couponDiscount = 0;
    let couponId = null;
    let userCoupon = null;

    // 如果使用优惠券，验证并计算折扣
    if (couponCode) {
      const categoryIds = items.map(item => item.categoryId).filter(Boolean);
      const productIds = items.map(item => item.productId).filter(Boolean);

      const validation = await CouponUsageService.validateCoupon(couponCode, userId, {
        amount: originalAmount,
        categoryIds,
        productIds
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      couponDiscount = validation.discountAmount;
      couponId = validation.userCoupon.id;
      userCoupon = validation.userCoupon;
    }

    // 计算最终金额
    const finalAmount = Math.max(0, originalAmount - couponDiscount);

    // 创建订单
    const order = await Order.create({
      userId,
      originalAmount,
      couponDiscount,
      finalAmount,
      couponId,
      paymentMethod,
      paymentStatus: 'pending'
    });

    return { order, userCoupon };
  }

  /**
   * 处理支付
   * @param {number} orderId - 订单ID
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 支付结果
   */
  async processPayment(orderId, paymentData) {
    const { paymentMethod, transactionId } = paymentData;

    const transaction = await sequelize.transaction();

    try {
      const order = await Order.findByPk(orderId, {
        include: [{
          model: UserCoupon,
          as: 'coupon'
        }],
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.paymentStatus !== 'pending') {
        throw new Error('订单状态不允许支付');
      }

      // 模拟支付网关处理
      const paymentResult = await this.callPaymentGateway({
        amount: order.finalAmount,
        paymentMethod,
        orderId: order.orderNo
      });

      if (!paymentResult.success) {
        // 支付失败
        await order.update({
          paymentStatus: 'failed'
        }, { transaction });

        await transaction.commit();

        return {
          success: false,
          error: paymentResult.error,
          order
        };
      }

      // 支付成功，更新订单状态
      await order.markAsPaid(paymentMethod, paymentResult.transactionId);

      // 如果使用了优惠券，标记为已使用
      if (order.coupon) {
        await CouponUsageService.useCoupon(
          order.coupon.couponCode,
          order.userId,
          order.id,
          {
            amount: order.originalAmount
          }
        );
      }

      await transaction.commit();

      return {
        success: true,
        order: await order.reload(),
        transactionId: paymentResult.transactionId
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 模拟支付网关调用
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 支付结果
   */
  async callPaymentGateway(paymentData) {
    const { amount, paymentMethod, orderId } = paymentData;

    // 模拟支付处理时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟支付结果（90%成功率）
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        paymentMethod,
        processedAt: new Date()
      };
    } else {
      return {
        success: false,
        error: '支付网关处理失败',
        errorCode: 'PAYMENT_GATEWAY_ERROR'
      };
    }
  }

  /**
   * 查询支付状态
   * @param {number} orderId - 订单ID
   * @returns {Promise<Object>} 支付状态
   */
  async getPaymentStatus(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [{
        model: UserCoupon,
        as: 'coupon'
      }]
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return {
      orderId: order.id,
      orderNo: order.orderNo,
      paymentStatus: order.paymentStatus,
      originalAmount: order.originalAmount,
      couponDiscount: order.couponDiscount,
      finalAmount: order.finalAmount,
      paymentMethod: order.paymentMethod,
      transactionId: order.paymentTransactionId,
      paidAt: order.paidAt,
      coupon: order.coupon ? {
        code: order.coupon.couponCode,
        discount: order.couponDiscount
      } : null
    };
  }

  /**
   * 取消订单
   * @param {number} orderId - 订单ID
   * @param {string} reason - 取消原因
   * @returns {Promise<Order>} 更新后的订单
   */
  async cancelOrder(orderId, reason = '') {
    const transaction = await sequelize.transaction();

    try {
      const order = await Order.findByPk(orderId, {
        include: [{
          model: UserCoupon,
          as: 'coupon'
        }],
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.paymentStatus !== 'pending') {
        throw new Error('只能取消待支付的订单');
      }

      // 如果订单使用了优惠券，需要恢复优惠券状态
      if (order.coupon && order.coupon.status === 'used') {
        await order.coupon.restore();
      }

      // 更新订单状态为取消
      await order.update({
        paymentStatus: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date()
      }, { transaction });

      await transaction.commit();

      return order;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 获取订单列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>} 订单列表和分页信息
   */
  async getOrders(filters = {}) {
    const {
      userId,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filters;

    const where = {};
    
    if (userId) where.userId = userId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = startDate;
      if (endDate) where.createdAt[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{
        model: UserCoupon,
        as: 'coupon',
        attributes: ['couponCode', 'status']
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
      orders: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 获取支付统计
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>} 统计结果
   */
  async getPaymentStats(filters = {}) {
    const { startDate, endDate, userId } = filters;
    
    const where = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.paidAt = {};
      if (startDate) where.paidAt[Op.gte] = startDate;
      if (endDate) where.paidAt[Op.lte] = endDate;
    }

    const [totalOrders, paidOrders, totalRevenue, couponSavings] = await Promise.all([
      Order.count({ where: { ...where, paymentStatus: { [Op.ne]: 'cancelled' } } }),
      Order.count({ where: { ...where, paymentStatus: 'paid' } }),
      Order.sum('finalAmount', { where: { ...where, paymentStatus: 'paid' } }),
      Order.sum('couponDiscount', { where: { ...where, paymentStatus: 'paid' } })
    ]);

    return {
      totalOrders,
      paidOrders,
      totalRevenue: totalRevenue || 0,
      couponSavings: couponSavings || 0,
      conversionRate: totalOrders > 0 ? (paidOrders / totalOrders * 100).toFixed(2) : 0
    };
  }

  /**
   * 重新支付
   * @param {number} orderId - 订单ID
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 支付结果
   */
  async retryPayment(orderId, paymentData) {
    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.paymentStatus !== 'failed' && order.paymentStatus !== 'pending') {
      throw new Error('订单状态不允许重新支付');
    }

    // 重置订单状态为待支付
    await order.update({
      paymentStatus: 'pending',
      paymentTransactionId: null
    });

    // 处理支付
    return await this.processPayment(orderId, paymentData);
  }
}

module.exports = new PaymentService();