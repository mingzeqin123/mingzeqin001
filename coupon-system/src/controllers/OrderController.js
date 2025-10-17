const PaymentService = require('../services/PaymentService');
const { Order } = require('../models');
const Joi = require('joi');

class OrderController {
  /**
   * 创建订单
   */
  async createOrder(req, res) {
    try {
      const schema = Joi.object({
        originalAmount: Joi.number().positive().required(),
        couponCode: Joi.string().optional(),
        items: Joi.array().items(Joi.object({
          productId: Joi.number().integer().required(),
          productName: Joi.string().required(),
          price: Joi.number().positive().required(),
          quantity: Joi.number().integer().positive().required(),
          categoryId: Joi.number().integer().optional()
        })).required(),
        paymentMethod: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const userId = req.user.id;
      const orderData = {
        ...value,
        userId
      };

      const { order, userCoupon } = await PaymentService.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: {
          order,
          coupon: userCoupon ? {
            code: userCoupon.couponCode,
            discount: order.couponDiscount
          } : null
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 处理支付
   */
  async processPayment(req, res) {
    try {
      const schema = Joi.object({
        paymentMethod: Joi.string().required(),
        transactionId: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { orderId } = req.params;
      const result = await PaymentService.processPayment(parseInt(orderId), value);

      if (result.success) {
        res.json({
          success: true,
          data: {
            order: result.order,
            transactionId: result.transactionId
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          data: {
            order: result.order
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取支付状态
   */
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const status = await PaymentService.getPaymentStatus(parseInt(orderId));

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(req, res) {
    try {
      const schema = Joi.object({
        reason: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { orderId } = req.params;
      const order = await PaymentService.cancelOrder(parseInt(orderId), value.reason);

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取订单列表
   */
  async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const { paymentStatus, startDate, endDate, page = 1, limit = 20 } = req.query;

      const filters = {
        userId,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await PaymentService.getOrders(filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: {
          id: parseInt(orderId),
          userId
        },
        include: ['coupon', 'user']
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: '订单不存在'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 重新支付
   */
  async retryPayment(req, res) {
    try {
      const schema = Joi.object({
        paymentMethod: Joi.string().required(),
        transactionId: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { orderId } = req.params;
      const result = await PaymentService.retryPayment(parseInt(orderId), value);

      if (result.success) {
        res.json({
          success: true,
          data: {
            order: result.order,
            transactionId: result.transactionId
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          data: {
            order: result.order
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取支付统计
   */
  async getPaymentStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const filters = { userId };
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const stats = await PaymentService.getPaymentStats(filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();