const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const IdempotencyMiddleware = require('../middleware/idempotency');

/**
 * 创建支付订单
 * POST /api/payment/create
 * 
 * Headers:
 *   idempotency-key: UUID格式的幂等性键
 * 
 * Body:
 *   userId: 用户ID
 *   orderId: 订单ID
 *   amount: 支付金额（分）
 *   currency: 货币类型（可选，默认CNY）
 *   paymentMethod: 支付方式（alipay/wechat/unionpay/credit_card）
 *   description: 支付描述
 *   callbackUrl: 回调地址
 *   metadata: 元数据（可选）
 */
router.post('/create', IdempotencyMiddleware.checkIdempotency, async (req, res) => {
  try {
    const idempotencyKey = req.idempotency.key;
    const paymentData = req.body;
    
    const result = await PaymentService.createPayment(paymentData, idempotencyKey);
    
    res.status(201).json({
      success: true,
      data: result,
      message: '支付订单创建成功'
    });
    
  } catch (error) {
    console.error('创建支付订单失败:', error);
    
    // 保存失败的幂等性响应
    if (req.idempotency) {
      await IdempotencyMiddleware.saveIdempotencyResponse(
        req.idempotency.key,
        {
          success: false,
          error: 'PAYMENT_CREATION_FAILED',
          message: error.message
        },
        'failed'
      );
    }
    
    res.status(400).json({
      success: false,
      error: 'PAYMENT_CREATION_FAILED',
      message: error.message
    });
  }
});

/**
 * 查询支付状态
 * GET /api/payment/status/:paymentId
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PAYMENT_ID',
        message: '支付ID不能为空'
      });
    }
    
    const paymentInfo = await PaymentService.getPaymentStatus(paymentId);
    
    res.json({
      success: true,
      data: paymentInfo,
      message: '查询成功'
    });
    
  } catch (error) {
    console.error('查询支付状态失败:', error);
    
    if (error.message === '支付记录不存在') {
      return res.status(404).json({
        success: false,
        error: 'PAYMENT_NOT_FOUND',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'QUERY_FAILED',
      message: '查询支付状态失败'
    });
  }
});

/**
 * 支付回调处理
 * POST /api/payment/callback
 */
router.post('/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    const result = await PaymentService.handlePaymentCallback(callbackData);
    
    res.json({
      success: true,
      data: result,
      message: '回调处理成功'
    });
    
  } catch (error) {
    console.error('处理支付回调失败:', error);
    
    res.status(400).json({
      success: false,
      error: 'CALLBACK_PROCESSING_FAILED',
      message: error.message
    });
  }
});

/**
 * 支付重试
 * POST /api/payment/retry/:paymentId
 * 
 * Headers:
 *   idempotency-key: 新的UUID格式幂等性键
 */
router.post('/retry/:paymentId', IdempotencyMiddleware.checkIdempotency, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const idempotencyKey = req.idempotency.key;
    
    const result = await PaymentService.retryPayment(paymentId, idempotencyKey);
    
    res.json({
      success: true,
      data: result,
      message: '支付重试成功'
    });
    
  } catch (error) {
    console.error('支付重试失败:', error);
    
    // 保存失败的幂等性响应
    if (req.idempotency) {
      await IdempotencyMiddleware.saveIdempotencyResponse(
        req.idempotency.key,
        {
          success: false,
          error: 'PAYMENT_RETRY_FAILED',
          message: error.message
        },
        'failed'
      );
    }
    
    res.status(400).json({
      success: false,
      error: 'PAYMENT_RETRY_FAILED',
      message: error.message
    });
  }
});

/**
 * 获取用户支付历史
 * GET /api/payment/history/:userId
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const skip = (page - 1) * limit;
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    const { Payment } = require('../models/payment');
    
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-metadata -__v'),
      Payment.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: '查询成功'
    });
    
  } catch (error) {
    console.error('查询支付历史失败:', error);
    
    res.status(500).json({
      success: false,
      error: 'QUERY_FAILED',
      message: '查询支付历史失败'
    });
  }
});

/**
 * 支付统计
 * GET /api/payment/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;
    
    const { Payment } = require('../models/payment');
    
    // 构建查询条件
    const matchCondition = {};
    
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (paymentMethod) {
      matchCondition.paymentMethod = paymentMethod;
    }
    
    // 聚合统计
    const statistics = await Payment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    // 按支付方式统计
    const methodStats = await Payment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        statusStatistics: statistics,
        methodStatistics: methodStats
      },
      message: '统计查询成功'
    });
    
  } catch (error) {
    console.error('查询支付统计失败:', error);
    
    res.status(500).json({
      success: false,
      error: 'STATISTICS_QUERY_FAILED',
      message: '查询支付统计失败'
    });
  }
});

module.exports = router;