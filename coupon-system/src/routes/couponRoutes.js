const express = require('express');
const CouponController = require('../controllers/CouponController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// 优惠券模板管理（管理员）
router.post('/templates', authenticate, authorize('admin'), CouponController.createTemplate);
router.get('/templates', authenticate, CouponController.getTemplates);

// 优惠券发放（管理员）
router.post('/distribute', authenticate, authorize('admin'), CouponController.distributeCoupons);

// 用户优惠券操作
router.post('/claim', authenticate, CouponController.claimCoupon);
router.get('/my', authenticate, CouponController.getUserCoupons);
router.get('/available', authenticate, CouponController.getAvailableCoupons);
router.get('/templates/available', authenticate, CouponController.getAvailableTemplates);

// 优惠券验证和推荐
router.post('/validate', authenticate, CouponController.validateCoupon);
router.get('/best', authenticate, CouponController.getBestCoupon);

// 优惠券统计和提醒
router.get('/stats', authenticate, CouponController.getCouponStats);
router.get('/expiring', authenticate, CouponController.getExpiringCoupons);

module.exports = router;