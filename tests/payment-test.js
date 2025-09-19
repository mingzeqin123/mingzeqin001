/**
 * 支付接口测试文件
 * 使用简单的测试框架进行单元测试
 */

const paymentService = require('../utils/paymentService');
const enhancedPaymentService = require('../utils/enhancedPaymentService');

// 简单的测试框架
class TestFramework {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  async run() {
    console.log('开始运行支付接口测试...\n');
    
    for (const test of this.tests) {
      try {
        console.log(`运行测试: ${test.name}`);
        await test.testFunction();
        console.log(`✅ 通过: ${test.name}\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ 失败: ${test.name}`);
        console.log(`   错误: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('=== 测试结果 ===');
    console.log(`总测试数: ${this.tests.length}`);
    console.log(`通过: ${this.passed}`);
    console.log(`失败: ${this.failed}`);
    console.log(`成功率: ${((this.passed / this.tests.length) * 100).toFixed(2)}%`);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || '断言失败');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `期望 ${expected}，实际 ${actual}`);
    }
  }

  assertTrue(condition, message) {
    this.assert(condition, message || '期望为真');
  }

  assertFalse(condition, message) {
    this.assert(!condition, message || '期望为假');
  }
}

const test = new TestFramework();

// 测试1: 基础支付功能
test.test('基础支付功能测试', async () => {
  const paymentData = {
    userId: 'test_user_1',
    orderId: 'test_order_1',
    amount: 1000,
    productId: 'test_product_1',
    description: '测试支付'
  };

  const result = await paymentService.processPayment(paymentData);
  
  test.assertTrue(result.success !== undefined, '结果应包含success字段');
  test.assertTrue(result.idempotencyId, '结果应包含idempotencyId');
  test.assertEqual(result.orderId, paymentData.orderId, '订单ID应匹配');
  test.assertEqual(result.amount, paymentData.amount, '金额应匹配');
});

// 测试2: 幂等性测试
test.test('幂等性测试', async () => {
  const paymentData = {
    userId: 'test_user_2',
    orderId: 'test_order_2',
    amount: 2000,
    productId: 'test_product_2',
    description: '幂等性测试',
    idempotencyId: 'test_idempotency_001'
  };

  const result1 = await paymentService.processPayment(paymentData);
  const result2 = await paymentService.processPayment(paymentData);
  
  test.assertEqual(result1.idempotencyId, result2.idempotencyId, '幂等性ID应相同');
  test.assertEqual(result1.success, result2.success, '成功状态应相同');
  test.assertEqual(result1.amount, result2.amount, '金额应相同');
});

// 测试3: 并发支付测试
test.test('并发支付测试', async () => {
  const paymentData = {
    userId: 'test_user_3',
    orderId: 'test_order_3',
    amount: 3000,
    productId: 'test_product_3',
    description: '并发测试',
    idempotencyId: 'test_concurrent_001'
  };

  const promises = [
    paymentService.processPayment(paymentData),
    paymentService.processPayment(paymentData),
    paymentService.processPayment(paymentData)
  ];

  const results = await Promise.all(promises);
  
  // 所有结果应该相同
  for (let i = 1; i < results.length; i++) {
    test.assertEqual(results[i].idempotencyId, results[0].idempotencyId, '所有结果的幂等性ID应相同');
    test.assertEqual(results[i].success, results[0].success, '所有结果的成功状态应相同');
  }
});

// 测试4: 参数验证测试
test.test('参数验证测试', async () => {
  // 测试缺少必要参数
  try {
    await paymentService.processPayment({
      userId: 'test_user',
      // 缺少orderId, amount, productId
    });
    test.assertTrue(false, '应该抛出参数错误');
  } catch (error) {
    test.assertTrue(error.message.includes('参数不完整'), '应抛出参数不完整错误');
  }

  // 测试金额为0
  try {
    await paymentService.processPayment({
      userId: 'test_user',
      orderId: 'test_order',
      amount: 0,
      productId: 'test_product'
    });
    test.assertTrue(false, '应该抛出金额错误');
  } catch (error) {
    test.assertTrue(error.message.includes('金额必须大于0'), '应抛出金额错误');
  }
});

// 测试5: 增强版支付服务测试
test.test('增强版支付服务测试', async () => {
  const paymentData = {
    userId: 'test_user_4',
    orderId: 'test_order_4',
    amount: 4000,
    productId: 'test_product_4',
    description: '增强版测试'
  };

  const result = await enhancedPaymentService.processPayment(paymentData);
  
  test.assertTrue(result.success !== undefined, '结果应包含success字段');
  test.assertTrue(result.idempotencyId, '结果应包含idempotencyId');
  
  // 测试状态查询
  const status = enhancedPaymentService.getPaymentStatus(result.idempotencyId);
  test.assertTrue(status !== null, '应能查询到支付状态');
  test.assertEqual(status.idempotencyId, result.idempotencyId, '状态ID应匹配');
});

// 测试6: 支付状态管理测试
test.test('支付状态管理测试', async () => {
  const paymentData = {
    userId: 'test_user_5',
    orderId: 'test_order_5',
    amount: 5000,
    productId: 'test_product_5',
    description: '状态管理测试'
  };

  const result = await enhancedPaymentService.processPayment(paymentData);
  
  // 测试取消支付
  const cancelResult = enhancedPaymentService.cancelPayment(result.idempotencyId);
  test.assertTrue(cancelResult === false, '已完成的支付不应能取消');
  
  // 测试统计信息
  const stats = enhancedPaymentService.getStats();
  test.assertTrue(typeof stats.total === 'number', '统计信息应包含total字段');
  test.assertTrue(stats.total >= 1, '总支付数应至少为1');
});

// 测试7: 缓存清理测试
test.test('缓存清理测试', async () => {
  const paymentData = {
    userId: 'test_user_6',
    orderId: 'test_order_6',
    amount: 6000,
    productId: 'test_product_6',
    description: '缓存清理测试'
  };

  await paymentService.processPayment(paymentData);
  
  const initialStats = paymentService.getStats();
  test.assertTrue(initialStats.cachedResults >= 1, '应有缓存的支付结果');
  
  // 清理过期结果(设置为立即过期)
  const cleanedCount = paymentService.cleanupExpiredResults(0);
  test.assertTrue(cleanedCount >= 1, '应清理至少1个过期结果');
});

// 测试8: 错误处理测试
test.test('错误处理测试', async () => {
  // 测试无效的幂等性ID查询
  const status = enhancedPaymentService.getPaymentStatus('invalid_id');
  test.assertTrue(status === null, '无效ID应返回null');
  
  // 测试取消不存在的支付
  const cancelResult = enhancedPaymentService.cancelPayment('invalid_id');
  test.assertTrue(cancelResult === false, '取消不存在的支付应返回false');
});

// 测试9: 重试机制测试
test.test('重试机制测试', async () => {
  const paymentData = {
    userId: 'test_user_7',
    orderId: 'test_order_7',
    amount: 100, // 小金额，更容易失败
    productId: 'test_product_7',
    description: '重试测试',
    enableRetry: true
  };

  try {
    const result = await enhancedPaymentService.processPayment(paymentData);
    test.assertTrue(result.success !== undefined, '应返回支付结果');
  } catch (error) {
    // 如果支付失败，检查状态
    const status = enhancedPaymentService.getPaymentStatus(paymentData.idempotencyId);
    if (status) {
      test.assertTrue(['FAILED', 'SUCCESS'].includes(status.status), '状态应为FAILED或SUCCESS');
    }
  }
});

// 测试10: 性能测试
test.test('性能测试', async () => {
  const startTime = Date.now();
  const promises = [];
  
  // 创建10个并发支付请求
  for (let i = 0; i < 10; i++) {
    const paymentData = {
      userId: `perf_user_${i}`,
      orderId: `perf_order_${i}`,
      amount: 1000 + i * 100,
      productId: `perf_product_${i}`,
      description: `性能测试${i}`
    };
    promises.push(paymentService.processPayment(paymentData));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  test.assertEqual(results.length, 10, '应返回10个结果');
  test.assertTrue(duration < 10000, '10个并发请求应在10秒内完成');
  
  console.log(`    性能测试: 10个并发请求耗时 ${duration}ms`);
});

// 运行所有测试
if (require.main === module) {
  test.run();
}

module.exports = test;