const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, CouponTemplate } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('CouponController', () => {
  let testUser;
  let authToken;
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

    // 生成认证token
    authToken = jwt.sign(
      { userId: testUser.id, username: testUser.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

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
  });

  afterEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/v1/coupons/templates', () => {
    test('应该返回优惠券模板列表', async () => {
      const response = await request(app)
        .get('/api/v1/coupons/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toHaveLength(1);
      expect(response.body.data.templates[0].name).toBe('测试优惠券');
    });

    test('未认证用户应该被拒绝', async () => {
      const response = await request(app)
        .get('/api/v1/coupons/templates')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('未提供认证token');
    });
  });

  describe('POST /api/v1/coupons/claim', () => {
    test('应该成功领取优惠券', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: testTemplate.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(testUser.id);
      expect(response.body.data.templateId).toBe(testTemplate.id);
    });

    test('无效的模板ID应该返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: 99999 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('优惠券模板不存在');
    });

    test('缺少必需参数应该返回验证错误', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /api/v1/coupons/my', () => {
    test('应该返回用户的优惠券列表', async () => {
      // 先领取一张优惠券
      await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: testTemplate.id });

      const response = await request(app)
        .get('/api/v1/coupons/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coupons).toHaveLength(1);
      expect(response.body.data.coupons[0].userId).toBe(testUser.id);
    });

    test('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/coupons/my?status=unused')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/coupons/validate', () => {
    test('应该验证有效的优惠券', async () => {
      // 先领取一张优惠券
      const claimResponse = await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: testTemplate.id });

      const couponCode = claimResponse.body.data.couponCode;

      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          couponCode,
          amount: 100
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.discountAmount).toBe(10);
    });

    test('应该拒绝无效的优惠券', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          couponCode: 'INVALID_CODE',
          amount: 100
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
    });
  });

  describe('GET /api/v1/coupons/available', () => {
    test('应该返回可用的优惠券', async () => {
      // 先领取一张优惠券
      await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: testTemplate.id });

      const response = await request(app)
        .get('/api/v1/coupons/available?amount=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/coupons/best', () => {
    test('应该返回最优优惠券推荐', async () => {
      // 先领取一张优惠券
      await request(app)
        .post('/api/v1/coupons/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ templateId: testTemplate.id });

      const response = await request(app)
        .get('/api/v1/coupons/best?amount=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.discountAmount).toBe(10);
    });

    test('缺少金额参数应该返回错误', async () => {
      const response = await request(app)
        .get('/api/v1/coupons/best')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('订单金额不能为空');
    });
  });
});