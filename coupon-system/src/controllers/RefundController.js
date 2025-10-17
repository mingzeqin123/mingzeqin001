const RefundService = require('../services/RefundService');
const { Refund } = require('../models');
const Joi = require('joi');

class RefundController {
  /**
   * 创建退款申请
   */
  async createRefund(req, res) {
    try {
      const schema = Joi.object({
        orderId: Joi.number().integer().required(),
        refundAmount: Joi.number().positive().required(),
        refundReason: Joi.string().required(),
        couponRefundType: Joi.string().valid('restore', 'void', 'new_coupon').default('restore')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const userId = req.user.id;
      const refundData = {
        ...value,
        userId
      };

      const refund = await RefundService.createRefund(refundData);

      res.status(201).json({
        success: true,
        data: refund
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 处理退款（管理员接口）
   */
  async processRefund(req, res) {
    try {
      const schema = Joi.object({
        approvalNote: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { refundId } = req.params;
      const adminId = req.user.id; // 管理员ID

      const result = await RefundService.processRefund(parseInt(refundId), {
        adminId,
        approvalNote: value.approvalNote
      });

      if (result.success) {
        res.json({
          success: true,
          data: {
            refund: result.refund,
            transactionId: result.transactionId
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          data: {
            refund: result.refund
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
   * 取消退款申请
   */
  async cancelRefund(req, res) {
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

      const { refundId } = req.params;
      const refund = await RefundService.cancelRefund(parseInt(refundId), value.reason);

      res.json({
        success: true,
        data: refund
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取退款列表
   */
  async getRefunds(req, res) {
    try {
      const userId = req.user.id;
      const { orderId, refundStatus, startDate, endDate, page = 1, limit = 20 } = req.query;

      const filters = {
        userId,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (orderId) filters.orderId = parseInt(orderId);
      if (refundStatus) filters.refundStatus = refundStatus;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await RefundService.getRefunds(filters);

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
   * 获取退款详情
   */
  async getRefundDetail(req, res) {
    try {
      const { refundId } = req.params;
      const userId = req.user.id;

      const refund = await RefundService.getRefundDetail(parseInt(refundId));

      // 验证退款记录是否属于当前用户
      if (refund.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: '无权访问该退款记录'
        });
      }

      res.json({
        success: true,
        data: refund
      });
    } catch (error) {
      if (error.message === '退款记录不存在') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取退款统计
   */
  async getRefundStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const filters = { userId };
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const stats = await RefundService.getRefundStats(filters);

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

  /**
   * 批量处理退款（管理员接口）
   */
  async batchProcessRefunds(req, res) {
    try {
      const schema = Joi.object({
        refundIds: Joi.array().items(Joi.number().integer()).required(),
        approvalNote: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const adminId = req.user.id;
      const result = await RefundService.batchProcessRefunds(value.refundIds, {
        adminId,
        approvalNote: value.approvalNote
      });

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
   * 获取所有退款列表（管理员接口）
   */
  async getAllRefunds(req, res) {
    try {
      const { userId, orderId, refundStatus, startDate, endDate, page = 1, limit = 20 } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      if (userId) filters.userId = parseInt(userId);
      if (orderId) filters.orderId = parseInt(orderId);
      if (refundStatus) filters.refundStatus = refundStatus;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const result = await RefundService.getRefunds(filters);

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
   * 获取全局退款统计（管理员接口）
   */
  async getGlobalRefundStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const filters = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);

      const stats = await RefundService.getRefundStats(filters);

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

module.exports = new RefundController();