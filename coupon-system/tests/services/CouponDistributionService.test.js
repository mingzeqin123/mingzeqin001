const { sequelize, User, CouponTemplate, UserCoupon } = require('../../src/models');
const CouponDistributionService = require('../../src/services/CouponDistributionService');

describe('CouponDistributionService', () => {
  let testUser;
  let testTemplate;

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
      usageLimitPerUser: 1,
      totalQuantity: 100
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

  describe('distributeToUser', () => {
    test('应该成功发放优惠券给用户', async () => {
      const userCoupon = await CouponDistributionService.distributeToUser(
        testTemplate.id,
        testUser.id
      );

      expect(userCoupon).toBeDefined();
      expect(userCoupon.userId).toBe(testUser.id);
      expect(userCoupon.templateId).toBe(testTemplate.id);
      expect(userCoupon.status).toBe('unused');
      expect(userCoupon.couponCode).toMatch(/^CPN/);
    });

    test('应该拒绝给不存在的用户发放优惠券', async () => {
      await expect(
        CouponDistributionService.distributeToUser(testTemplate.id, 99999)
      ).rejects.toThrow('用户不存在');
    });

    test('应该拒绝使用不存在的模板发放优惠券', async () => {
      await expect(
        CouponDistributionService.distributeToUser(99999, testUser.id)
      ).rejects.toThrow('优惠券模板不存在');
    });

    test('应该限制用户获取同一模板优惠券的数量', async () => {
      // 第一次发放应该成功
      await CouponDistributionService.distributeToUser(testTemplate.id, testUser.id);

      // 第二次发放应该失败（因为usageLimitPerUser为1）
      await expect(
        CouponDistributionService.distributeToUser(testTemplate.id, testUser.id)
      ).rejects.toThrow('用户已达到该优惠券的最大拥有数量限制');
    });
  });

  describe('distributeToUsers', () => {
    test('应该批量发放优惠券给多个用户', async () => {
      const user2 = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123'
      });

      const result = await CouponDistributionService.distributeToUsers(
        testTemplate.id,
        [testUser.id, user2.id]
      );

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.total).toBe(2);
    });

    test('应该正确处理部分失败的情况', async () => {
      const result = await CouponDistributionService.distributeToUsers(
        testTemplate.id,
        [testUser.id, 99999] // 第二个用户不存在
      );

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.failed[0].error).toContain('用户不存在');
    });
  });

  describe('claimCoupon', () => {
    test('用户应该能够主动领取优惠券', async () => {
      const userCoupon = await CouponDistributionService.claimCoupon(
        testTemplate.id,
        testUser.id
      );

      expect(userCoupon).toBeDefined();
      expect(userCoupon.userId).toBe(testUser.id);
      expect(userCoupon.templateId).toBe(testTemplate.id);
    });
  });

  describe('getAvailableCouponsForUser', () => {
    test('应该返回用户可领取的优惠券模板', async () => {
      const templates = await CouponDistributionService.getAvailableCouponsForUser(
        testUser.id
      );

      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe(testTemplate.id);
    });

    test('用户已达到限制时不应该返回该模板', async () => {
      // 先领取一张优惠券
      await CouponDistributionService.claimCoupon(testTemplate.id, testUser.id);

      const templates = await CouponDistributionService.getAvailableCouponsForUser(
        testUser.id
      );

      expect(templates).toHaveLength(0);
    });
  });
});