const CouponDistributionService = require('../services/CouponDistributionService');
const CouponUsageService = require('../services/CouponUsageService');
const { CouponTemplate, UserCoupon } = require('../models');
const Joi = require('joi');

class CouponController {
  /**
   * 创建优惠券模板
   */
  async createTemplate(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        description: Joi.string().optional(),
        type: Joi.string().valid('fixed', 'percentage', 'free_shipping').required(),
        value: Joi.number().positive().required(),
        minOrderAmount: Joi.number().min(0).default(0),
        maxDiscountAmount: Joi.number().positive().optional(),
        validDays: Joi.number().integer().min(1).max(365).default(30),
        usageLimitPerUser: Joi.number().integer().min(1).default(1),
        totalQuantity: Joi.number().integer().positive().optional(),
        categoryIds: Joi.array().items(Joi.number().integer()).optional(),
        productIds: Joi.array().items(Joi.number().integer()).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const template = await CouponTemplate.create(value);

      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取优惠券模板列表
   */
  async getTemplates(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      
      const where = {};
      if (status) where.status = status;

      const offset = (page - 1) * limit;
      const { count, rows } = await CouponTemplate.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          templates: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 发放优惠券给用户
   */
  async distributeCoupons(req, res) {
    try {
      const schema = Joi.object({
        templateId: Joi.number().integer().required(),
        userIds: Joi.array().items(Joi.number().integer()).required(),
        batchId: Joi.number().integer().optional(),
        customExpiresAt: Joi.date().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const result = await CouponDistributionService.distributeToUsers(
        value.templateId,
        value.userIds,
        {
          batchId: value.batchId,
          customExpiresAt: value.customExpiresAt
        }
      );

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
   * 用户领取优惠券
   */
  async claimCoupon(req, res) {
    try {
      const schema = Joi.object({
        templateId: Joi.number().integer().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const userId = req.user.id; // 从JWT中获取用户ID
      const userCoupon = await CouponDistributionService.claimCoupon(value.templateId, userId);

      res.json({
        success: true,
        data: userCoupon
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取用户优惠券列表
   */
  async getUserCoupons(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const where = { userId };
      if (status) where.status = status;

      const offset = (page - 1) * limit;
      const { count, rows } = await UserCoupon.findAndCountAll({
        where,
        include: [{
          model: CouponTemplate,
          as: 'template'
        }],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          coupons: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取用户可用优惠券
   */
  async getAvailableCoupons(req, res) {
    try {
      const userId = req.user.id;
      const { amount, categoryIds, productIds } = req.query;

      const orderInfo = {};
      if (amount) orderInfo.amount = parseFloat(amount);
      if (categoryIds) orderInfo.categoryIds = categoryIds.split(',').map(id => parseInt(id));
      if (productIds) orderInfo.productIds = productIds.split(',').map(id => parseInt(id));

      const coupons = await CouponUsageService.getUserAvailableCoupons(userId, orderInfo);

      res.json({
        success: true,
        data: coupons
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 验证优惠券
   */
  async validateCoupon(req, res) {
    try {
      const schema = Joi.object({
        couponCode: Joi.string().required(),
        amount: Joi.number().positive().required(),
        categoryIds: Joi.array().items(Joi.number().integer()).optional(),
        productIds: Joi.array().items(Joi.number().integer()).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const userId = req.user.id;
      const validation = await CouponUsageService.validateCoupon(
        value.couponCode,
        userId,
        {
          amount: value.amount,
          categoryIds: value.categoryIds,
          productIds: value.productIds
        }
      );

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取最优优惠券推荐
   */
  async getBestCoupon(req, res) {
    try {
      const userId = req.user.id;
      const { amount, categoryIds, productIds } = req.query;

      if (!amount) {
        return res.status(400).json({
          success: false,
          error: '订单金额不能为空'
        });
      }

      const orderInfo = {
        amount: parseFloat(amount),
        categoryIds: categoryIds ? categoryIds.split(',').map(id => parseInt(id)) : [],
        productIds: productIds ? productIds.split(',').map(id => parseInt(id)) : []
      };

      const bestCoupon = await CouponUsageService.getBestCouponRecommendation(userId, orderInfo);

      res.json({
        success: true,
        data: bestCoupon
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取用户优惠券统计
   */
  async getCouponStats(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      const options = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const stats = await CouponUsageService.getUserCouponStats(userId, options);

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
   * 获取即将过期的优惠券
   */
  async getExpiringCoupons(req, res) {
    try {
      const userId = req.user.id;
      const { days = 7 } = req.query;

      const expiringCoupons = await CouponUsageService.getExpiringCoupons(
        userId,
        parseInt(days)
      );

      res.json({
        success: true,
        data: expiringCoupons
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取可领取的优惠券
   */
  async getAvailableTemplates(req, res) {
    try {
      const userId = req.user.id;
      const templates = await CouponDistributionService.getAvailableCouponsForUser(userId);

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CouponController();