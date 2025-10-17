const { sequelize, User, CouponTemplate, UserCoupon } = require('../../src/models');
const CouponUsageService = require('../../src/services/CouponUsageService');
const moment = require('moment');

describe('CouponUsageService', () => {
  let testUser;
  let testTemplate;
  let testUserCoupon;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    // 创建测试优惠券模板
    testTemplate = await CouponTemplate.create({
      name: '测试优惠券',
      description: '测试用优惠券',
      type: 'fixed',
      value: 10.00,
      minOrderAmount: 50.00,
      validDays: 30,
      usageLimitPerUser: 1
    });

    // 创建用户优惠券
    testUserCoupon = await UserCoupon.create({
      userId: testUser.id,
      templateId: testTemplate.id,
      expiresAt: moment().add(30, 'days').toDate()
    });
  });

  afterEach(async () => {
    await UserCoupon.destroy({ where: {} });
    await User.destroy({ where: {} });
    await CouponTemplate.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('validateCoupon', () => {
    test('应该验证有效的优惠券', async () => {
      const result = await CouponUsageService.validateCoupon(
        testUserCoupon.couponCode,
        testUser.id,
        { amount: 100 }
      );

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(10);
    });

    test('应该拒绝不存在的优惠券', async () => {
      const result = await CouponUsageService.validateCoupon(
        'INVALID_CODE',
        testUser.id,
        { amount: 100 }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('优惠券不存在');
    });

    test('应该拒绝不满足最小订单金额的订单', async () => {
      const result = await CouponUsageService.validateCoupon(
        testUserCoupon.couponCode,
        testUser.id,
        { amount: 30 } // 小于最小订单金额50
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('订单金额不满足最小消费要求');
    });

    test('应该拒绝已使用的优惠券', async () => {
      // 先使用优惠券
      await testUserCoupon.update({ status: 'used', usedAt: new Date() });

      const result = await CouponUsageService.validateCoupon(
        testUserCoupon.couponCode,
        testUser.id,
        { amount: 100 }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('优惠券已使用');
    });

    test('应该拒绝已过期的优惠券', async () => {
      // 设置优惠券为过期
      await testUserCoupon.update({ expiresAt: moment().subtract(1, 'day').toDate() });

      const result = await CouponUsageService.validateCoupon(
        testUserCoupon.couponCode,
        testUser.id,
        { amount: 100 }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('优惠券已过期');
    });
  });

  describe('useCoupon', () => {
    test('应该成功使用优惠券', async () => {
      const result = await CouponUsageService.useCoupon(
        testUserCoupon.couponCode,
        testUser.id,
        1, // orderId
        { amount: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.discountAmount).toBe(10);

      // 验证优惠券状态已更新
      await testUserCoupon.reload();
      expect(testUserCoupon.status).toBe('used');
      expect(testUserCoupon.orderId).toBe(1);
    });

    test('使用无效优惠券应该失败', async () => {
      await expect(
        CouponUsageService.useCoupon(
          'INVALID_CODE',
          testUser.id,
          1,
          { amount: 100 }
        )
      ).rejects.toThrow('优惠券不存在');
    });
  });

  describe('getUserAvailableCoupons', () => {
    test('应该返回用户可用的优惠券', async () => {
      const coupons = await CouponUsageService.getUserAvailableCoupons(
        testUser.id,
        { amount: 100 }
      );

      expect(coupons).toHaveLength(1);
      expect(coupons[0].id).toBe(testUserCoupon.id);
      expect(coupons[0].discountAmount).toBe(10);
    });

    test('不满足条件的优惠券不应该返回', async () => {
      const coupons = await CouponUsageService.getUserAvailableCoupons(
        testUser.id,
        { amount: 30 } // 小于最小订单金额
      );

      expect(coupons).toHaveLength(0);
    });
  });

  describe('getBestCouponRecommendation', () => {
    test('应该返回最优的优惠券推荐', async () => {
      // 创建另一个更优惠的优惠券
      const betterTemplate = await CouponTemplate.create({
        name: '更好的优惠券',
        type: 'fixed',
        value: 20.00,
        minOrderAmount: 50.00,
        validDays: 30
      });

      const betterCoupon = await UserCoupon.create({
        userId: testUser.id,
        templateId: betterTemplate.id,
        expiresAt: moment().add(30, 'days').toDate()
      });

      const bestCoupon = await CouponUsageService.getBestCouponRecommendation(
        testUser.id,
        { amount: 100 }
      );

      expect(bestCoupon).toBeDefined();
      expect(bestCoupon.id).toBe(betterCoupon.id);
      expect(bestCoupon.discountAmount).toBe(20);
    });

    test('没有可用优惠券时应该返回null', async () => {
      const bestCoupon = await CouponUsageService.getBestCouponRecommendation(
        testUser.id,
        { amount: 30 } // 不满足任何优惠券的最小订单金额
      );

      expect(bestCoupon).toBeNull();
    });
  });

  describe('getExpiringCoupons', () => {
    test('应该返回即将过期的优惠券', async () => {
      // 创建一个即将过期的优惠券
      const expiringSoon = await UserCoupon.create({
        userId: testUser.id,
        templateId: testTemplate.id,
        expiresAt: moment().add(3, 'days').toDate()
      });

      const expiringCoupons = await CouponUsageService.getExpiringCoupons(
        testUser.id,
        7 // 7天内过期
      );

      expect(expiringCoupons).toHaveLength(1);
      expect(expiringCoupons[0].id).toBe(expiringSoon.id);
    });
  });
});