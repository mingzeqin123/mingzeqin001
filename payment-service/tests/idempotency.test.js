const request = require('supertest');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { Payment, IdempotencyRecord } = require('../models/payment');

describe('支付接口幂等性测试', () => {
  let server;

  beforeAll(async () => {
    // 连接测试数据库
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/payment_service_test';
    await mongoose.connect(mongoUri);
    
    // 启动服务器
    server = app.listen(0);
  });

  afterAll(async () => {
    // 关闭服务器和数据库连接
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await Payment.deleteMany({});
    await IdempotencyRecord.deleteMany({});
  });

  describe('幂等性键验证', () => {
    test('缺少幂等性键应返回400错误', async () => {
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_1',
        amount: 1000,
        paymentMethod: 'alipay',
        description: '测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const response = await request(app)
        .post('/api/payment/create')
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('MISSING_IDEMPOTENCY_KEY');
    });

    test('无效格式的幂等性键应返回400错误', async () => {
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_2',
        amount: 1000,
        paymentMethod: 'alipay',
        description: '测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const response = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', 'invalid-key-format')
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_IDEMPOTENCY_KEY');
    });

    test('有效的UUID格式幂等性键应被接受', async () => {
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_3',
        amount: 1000,
        paymentMethod: 'alipay',
        description: '测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const idempotencyKey = uuidv4();

      const response = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', idempotencyKey)
        .send(paymentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('重复请求处理', () => {
    test('相同幂等性键的相同请求应返回相同结果', async () => {
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_duplicate',
        amount: 2000,
        paymentMethod: 'wechat',
        description: '重复测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const idempotencyKey = uuidv4();

      // 第一次请求
      const response1 = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', idempotencyKey)
        .send(paymentData);

      expect(response1.status).toBe(201);
      expect(response1.body.success).toBe(true);

      const paymentId1 = response1.body.data.paymentId;

      // 等待一小段时间确保第一次请求完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 第二次请求（相同幂等性键和参数）
      const response2 = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', idempotencyKey)
        .send(paymentData);

      expect(response2.status).toBe(200);
      expect(response2.body.paymentId).toBe(paymentId1);

      // 验证数据库中只有一条支付记录
      const paymentCount = await Payment.countDocuments({ paymentId: paymentId1 });
      expect(paymentCount).toBe(1);
    });

    test('相同幂等性键但不同参数应返回422错误', async () => {
      const paymentData1 = {
        userId: 'test_user',
        orderId: 'test_order_mismatch_1',
        amount: 1500,
        paymentMethod: 'alipay',
        description: '第一个订单',
        callbackUrl: 'https://example.com/callback'
      };

      const paymentData2 = {
        userId: 'test_user',
        orderId: 'test_order_mismatch_2', // 不同的订单ID
        amount: 1500,
        paymentMethod: 'alipay',
        description: '第二个订单',
        callbackUrl: 'https://example.com/callback'
      };

      const idempotencyKey = uuidv4();

      // 第一次请求
      const response1 = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', idempotencyKey)
        .send(paymentData1);

      expect(response1.status).toBe(201);

      // 等待第一次请求完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 第二次请求（相同幂等性键，不同参数）
      const response2 = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', idempotencyKey)
        .send(paymentData2);

      expect(response2.status).toBe(422);
      expect(response2.body.error).toBe('IDEMPOTENCY_KEY_MISMATCH');
    });
  });

  describe('并发请求处理', () => {
    test('并发的相同请求应只创建一个支付记录', async () => {
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_concurrent',
        amount: 3000,
        paymentMethod: 'unionpay',
        description: '并发测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const idempotencyKey = uuidv4();

      // 发送5个并发请求
      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/api/payment/create')
          .set('idempotency-key', idempotencyKey)
          .send(paymentData)
      );

      const responses = await Promise.all(promises);

      // 统计响应状态
      const successResponses = responses.filter(r => r.status === 201);
      const duplicateResponses = responses.filter(r => r.status === 200);
      const conflictResponses = responses.filter(r => r.status === 409);

      // 应该有一个成功创建，其他的要么返回重复结果，要么返回冲突
      expect(successResponses.length).toBe(1);
      expect(successResponses.length + duplicateResponses.length + conflictResponses.length).toBe(5);

      // 验证数据库中只有一条支付记录
      const paymentCount = await Payment.countDocuments({});
      expect(paymentCount).toBe(1);

      // 验证所有成功响应返回相同的支付ID
      const allPaymentIds = responses
        .filter(r => r.status === 201 || r.status === 200)
        .map(r => r.body.data ? r.body.data.paymentId : r.body.paymentId);

      const uniquePaymentIds = [...new Set(allPaymentIds)];
      expect(uniquePaymentIds.length).toBe(1);
    });
  });

  describe('支付重试幂等性', () => {
    test('支付重试应使用新的幂等性键', async () => {
      // 先创建一个支付
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_retry',
        amount: 2500,
        paymentMethod: 'alipay',
        description: '重试测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const originalIdempotencyKey = uuidv4();

      const createResponse = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', originalIdempotencyKey)
        .send(paymentData);

      expect(createResponse.status).toBe(201);
      const paymentId = createResponse.body.data.paymentId;

      // 重试支付
      const retryIdempotencyKey = uuidv4();

      const retryResponse = await request(app)
        .post(`/api/payment/retry/${paymentId}`)
        .set('idempotency-key', retryIdempotencyKey)
        .send({});

      expect(retryResponse.status).toBe(200);
      expect(retryResponse.body.success).toBe(true);

      // 验证幂等性记录
      const idempotencyRecords = await IdempotencyRecord.find({});
      expect(idempotencyRecords.length).toBe(2); // 原始请求 + 重试请求

      const keys = idempotencyRecords.map(r => r.key);
      expect(keys).toContain(originalIdempotencyKey);
      expect(keys).toContain(retryIdempotencyKey);
    });

    test('重复的重试请求应返回相同结果', async () => {
      // 先创建一个支付
      const paymentData = {
        userId: 'test_user',
        orderId: 'test_order_retry_duplicate',
        amount: 1800,
        paymentMethod: 'wechat',
        description: '重复重试测试订单',
        callbackUrl: 'https://example.com/callback'
      };

      const createResponse = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', uuidv4())
        .send(paymentData);

      const paymentId = createResponse.body.data.paymentId;

      // 第一次重试
      const retryIdempotencyKey = uuidv4();

      const retryResponse1 = await request(app)
        .post(`/api/payment/retry/${paymentId}`)
        .set('idempotency-key', retryIdempotencyKey)
        .send({});

      expect(retryResponse1.status).toBe(200);

      // 等待第一次重试完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 第二次重试（相同幂等性键）
      const retryResponse2 = await request(app)
        .post(`/api/payment/retry/${paymentId}`)
        .set('idempotency-key', retryIdempotencyKey)
        .send({});

      expect(retryResponse2.status).toBe(200);
      expect(retryResponse2.body.data.paymentId).toBe(paymentId);

      // 验证支付记录的重试次数没有重复增加
      const payment = await Payment.findOne({ paymentId });
      expect(payment.retryCount).toBe(1);
    });
  });

  describe('幂等性记录清理', () => {
    test('过期的幂等性记录应被清理', async () => {
      const IdempotencyMiddleware = require('../middleware/idempotency');

      // 创建一个过期的幂等性记录
      const expiredRecord = new IdempotencyRecord({
        key: uuidv4(),
        requestFingerprint: 'test_fingerprint',
        status: 'completed',
        response: { test: 'data' },
        expiresAt: new Date(Date.now() - 1000) // 1秒前过期
      });

      await expiredRecord.save();

      // 创建一个未过期的记录
      const validRecord = new IdempotencyRecord({
        key: uuidv4(),
        requestFingerprint: 'test_fingerprint_2',
        status: 'completed',
        response: { test: 'data2' },
        expiresAt: new Date(Date.now() + 86400000) // 1天后过期
      });

      await validRecord.save();

      // 执行清理
      await IdempotencyMiddleware.cleanupExpiredRecords();

      // 验证只有未过期的记录保留
      const remainingRecords = await IdempotencyRecord.find({});
      expect(remainingRecords.length).toBe(1);
      expect(remainingRecords[0].key).toBe(validRecord.key);
    });
  });

  describe('错误处理', () => {
    test('无效的支付数据应返回错误', async () => {
      const invalidPaymentData = {
        userId: 'test_user',
        orderId: 'test_order_invalid',
        amount: -100, // 无效金额
        paymentMethod: 'alipay',
        description: '无效订单',
        callbackUrl: 'https://example.com/callback'
      };

      const response = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', uuidv4())
        .send(invalidPaymentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('失败的请求应在幂等性记录中标记为失败', async () => {
      const invalidPaymentData = {
        userId: '', // 无效用户ID
        orderId: 'test_order_fail',
        amount: 1000,
        paymentMethod: 'alipay',
        description: '失败订单',
        callbackUrl: 'https://example.com/callback'
      };

      const idempotencyKey = uuidv4();

      const response = await request(app)
        .post('/api/payment/create')
        .set('idempotency-key', idempotencyKey)
        .send(invalidPaymentData);

      expect(response.status).toBe(400);

      // 验证幂等性记录状态
      const idempotencyRecord = await IdempotencyRecord.findOne({ key: idempotencyKey });
      expect(idempotencyRecord.status).toBe('failed');
    });
  });
});