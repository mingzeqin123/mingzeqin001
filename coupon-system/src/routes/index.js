const express = require('express');
const couponRoutes = require('./couponRoutes');
const orderRoutes = require('./orderRoutes');
const refundRoutes = require('./refundRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// API版本前缀
const API_VERSION = '/api/v1';

// 路由注册
router.use(`${API_VERSION}/coupons`, couponRoutes);
router.use(`${API_VERSION}/orders`, orderRoutes);
router.use(`${API_VERSION}/refunds`, refundRoutes);
router.use(`${API_VERSION}/users`, userRoutes);

// 健康检查接口
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '优惠券系统运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API文档说明
router.get(`${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: '优惠券系统 API v1.0',
    endpoints: {
      coupons: {
        'GET /api/v1/coupons/templates': '获取优惠券模板列表',
        'POST /api/v1/coupons/templates': '创建优惠券模板',
        'POST /api/v1/coupons/distribute': '发放优惠券',
        'POST /api/v1/coupons/claim': '用户领取优惠券',
        'GET /api/v1/coupons/my': '获取我的优惠券',
        'GET /api/v1/coupons/available': '获取可用优惠券',
        'POST /api/v1/coupons/validate': '验证优惠券',
        'GET /api/v1/coupons/best': '获取最优优惠券推荐',
        'GET /api/v1/coupons/stats': '获取优惠券统计',
        'GET /api/v1/coupons/expiring': '获取即将过期的优惠券'
      },
      orders: {
        'POST /api/v1/orders': '创建订单',
        'POST /api/v1/orders/:id/pay': '处理支付',
        'GET /api/v1/orders/:id/status': '获取支付状态',
        'POST /api/v1/orders/:id/cancel': '取消订单',
        'GET /api/v1/orders': '获取订单列表',
        'GET /api/v1/orders/:id': '获取订单详情',
        'POST /api/v1/orders/:id/retry': '重新支付',
        'GET /api/v1/orders/stats': '获取支付统计'
      },
      refunds: {
        'POST /api/v1/refunds': '创建退款申请',
        'POST /api/v1/refunds/:id/process': '处理退款',
        'POST /api/v1/refunds/:id/cancel': '取消退款',
        'GET /api/v1/refunds': '获取退款列表',
        'GET /api/v1/refunds/:id': '获取退款详情',
        'GET /api/v1/refunds/stats': '获取退款统计'
      },
      users: {
        'POST /api/v1/users/register': '用户注册',
        'POST /api/v1/users/login': '用户登录',
        'GET /api/v1/users/profile': '获取用户信息',
        'PUT /api/v1/users/profile': '更新用户信息'
      }
    }
  });
});

module.exports = router;