const express = require('express');
const RefundController = require('../controllers/RefundController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// 用户退款操作
router.post('/', authenticate, RefundController.createRefund);
router.get('/', authenticate, RefundController.getRefunds);
router.get('/stats', authenticate, RefundController.getRefundStats);
router.get('/:refundId', authenticate, RefundController.getRefundDetail);
router.post('/:refundId/cancel', authenticate, RefundController.cancelRefund);

// 管理员退款操作
router.post('/:refundId/process', authenticate, authorize('admin'), RefundController.processRefund);
router.post('/batch/process', authenticate, authorize('admin'), RefundController.batchProcessRefunds);
router.get('/admin/all', authenticate, authorize('admin'), RefundController.getAllRefunds);
router.get('/admin/stats', authenticate, authorize('admin'), RefundController.getGlobalRefundStats);

module.exports = router;