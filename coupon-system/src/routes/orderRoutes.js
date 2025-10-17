const express = require('express');
const OrderController = require('../controllers/OrderController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// 订单管理
router.post('/', authenticate, OrderController.createOrder);
router.get('/', authenticate, OrderController.getOrders);
router.get('/stats', authenticate, OrderController.getPaymentStats);
router.get('/:orderId', authenticate, OrderController.getOrderDetail);

// 支付相关
router.post('/:orderId/pay', authenticate, OrderController.processPayment);
router.get('/:orderId/status', authenticate, OrderController.getPaymentStatus);
router.post('/:orderId/retry', authenticate, OrderController.retryPayment);

// 订单取消
router.post('/:orderId/cancel', authenticate, OrderController.cancelOrder);

module.exports = router;