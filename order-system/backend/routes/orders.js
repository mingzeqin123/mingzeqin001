const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateOrder, validateOrderStatusUpdate } = require('../middleware/validation');

// 创建订单
router.post('/', authenticateToken, validateOrder, orderController.createOrder);

// 获取订单详情
router.get('/:id', authenticateToken, orderController.getOrderById);

// 根据订单号获取订单
router.get('/number/:orderNumber', authenticateToken, orderController.getOrderByNumber);

// 获取用户订单列表
router.get('/', authenticateToken, orderController.getUserOrders);

// 获取所有订单列表（管理员）
router.get('/admin/all', authenticateToken, requireRole(['admin', 'staff']), orderController.getAllOrders);

// 更新订单状态（管理员）
router.put('/:id/status', authenticateToken, requireRole(['admin', 'staff']), validateOrderStatusUpdate, orderController.updateOrderStatus);

// 取消订单
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);

// 获取订单状态历史
router.get('/:id/history', authenticateToken, orderController.getOrderStatusHistory);

// 获取订单统计（管理员）
router.get('/admin/stats', authenticateToken, requireRole(['admin', 'staff']), orderController.getOrderStats);

module.exports = router;