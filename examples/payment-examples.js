/**
 * 支付接口使用示例
 * 演示如何使用支付服务的幂等性功能
 */

const paymentService = require('../utils/paymentService');
const enhancedPaymentService = require('../utils/enhancedPaymentService');

// 示例1: 基础支付服务使用
async function basicPaymentExample() {
  console.log('\n=== 基础支付服务示例 ===');
  
  const paymentData = {
    userId: 'user123',
    orderId: 'order456',
    amount: 1000, // 10元(分)
    productId: 'product789',
    description: '购买商品A'
  };

  try {
    console.log('发起支付请求...');
    const result = await paymentService.processPayment(paymentData);
    console.log('支付结果:', result);
  } catch (error) {
    console.error('支付失败:', error.message);
  }
}

// 示例2: 幂等性测试 - 相同请求多次调用
async function idempotencyTest() {
  console.log('\n=== 幂等性测试 ===');
  
  const paymentData = {
    userId: 'user123',
    orderId: 'order789',
    amount: 2000, // 20元(分)
    productId: 'product999',
    description: '购买商品B',
    idempotencyId: 'test_idempotency_123' // 手动指定幂等性ID
  };

  try {
    console.log('第一次支付请求...');
    const result1 = await paymentService.processPayment(paymentData);
    console.log('第一次结果:', result1);

    console.log('第二次相同支付请求(应该返回缓存结果)...');
    const result2 = await paymentService.processPayment(paymentData);
    console.log('第二次结果:', result2);

    console.log('结果是否相同:', JSON.stringify(result1) === JSON.stringify(result2));
  } catch (error) {
    console.error('幂等性测试失败:', error.message);
  }
}

// 示例3: 并发支付测试
async function concurrentPaymentTest() {
  console.log('\n=== 并发支付测试 ===');
  
  const paymentData = {
    userId: 'user456',
    orderId: 'order999',
    amount: 3000, // 30元(分)
    productId: 'product888',
    description: '购买商品C',
    idempotencyId: 'test_concurrent_123'
  };

  try {
    console.log('同时发起3个相同的支付请求...');
    const promises = [
      paymentService.processPayment(paymentData),
      paymentService.processPayment(paymentData),
      paymentService.processPayment(paymentData)
    ];

    const results = await Promise.all(promises);
    console.log('并发结果:');
    results.forEach((result, index) => {
      console.log(`请求${index + 1}:`, result);
    });

    // 检查所有结果是否相同
    const allSame = results.every(result => 
      JSON.stringify(result) === JSON.stringify(results[0])
    );
    console.log('所有结果是否相同:', allSame);
  } catch (error) {
    console.error('并发测试失败:', error.message);
  }
}

// 示例4: 增强版支付服务使用
async function enhancedPaymentExample() {
  console.log('\n=== 增强版支付服务示例 ===');
  
  const paymentData = {
    userId: 'user789',
    orderId: 'order111',
    amount: 5000, // 50元(分)
    productId: 'product222',
    description: '购买商品D',
    enableRetry: true
  };

  try {
    console.log('发起增强版支付请求...');
    const result = await enhancedPaymentService.processPayment(paymentData);
    console.log('支付结果:', result);

    // 查询支付状态
    const status = enhancedPaymentService.getPaymentStatus(result.idempotencyId);
    console.log('支付状态:', status);

    // 获取统计信息
    const stats = enhancedPaymentService.getStats();
    console.log('支付统计:', stats);
  } catch (error) {
    console.error('增强版支付失败:', error.message);
  }
}

// 示例5: 支付重试测试
async function paymentRetryTest() {
  console.log('\n=== 支付重试测试 ===');
  
  const paymentData = {
    userId: 'user999',
    orderId: 'order333',
    amount: 100, // 1元(分) - 小金额更容易失败
    productId: 'product444',
    description: '购买商品E',
    enableRetry: true
  };

  try {
    console.log('发起可能失败的支付请求...');
    const result = await enhancedPaymentService.processPayment(paymentData);
    console.log('支付结果:', result);
  } catch (error) {
    console.error('支付最终失败:', error.message);
    
    // 查询失败状态
    const status = enhancedPaymentService.getPaymentStatus(paymentData.idempotencyId);
    console.log('失败状态:', status);
  }
}

// 示例6: 支付状态管理测试
async function paymentStateManagementTest() {
  console.log('\n=== 支付状态管理测试 ===');
  
  const paymentData = {
    userId: 'user555',
    orderId: 'order666',
    amount: 1500, // 15元(分)
    productId: 'product777',
    description: '购买商品F'
  };

  try {
    console.log('发起支付请求...');
    const result = await enhancedPaymentService.processPayment(paymentData);
    console.log('支付结果:', result);

    // 测试取消支付
    console.log('尝试取消支付...');
    const cancelResult = enhancedPaymentService.cancelPayment(result.idempotencyId);
    console.log('取消结果:', cancelResult);

    // 获取所有支付状态
    const allStates = enhancedPaymentService.stateManager.getAllPaymentStates();
    console.log('所有支付状态数量:', allStates.length);

    // 获取统计信息
    const stats = enhancedPaymentService.getStats();
    console.log('详细统计:', stats);
  } catch (error) {
    console.error('状态管理测试失败:', error.message);
  }
}

// 示例7: 错误处理测试
async function errorHandlingTest() {
  console.log('\n=== 错误处理测试 ===');
  
  // 测试参数错误
  try {
    console.log('测试参数错误...');
    await paymentService.processPayment({
      userId: 'user123',
      // 缺少必要参数
      amount: 1000
    });
  } catch (error) {
    console.log('参数错误捕获:', error.message);
  }

  // 测试金额错误
  try {
    console.log('测试金额错误...');
    await paymentService.processPayment({
      userId: 'user123',
      orderId: 'order123',
      amount: -100, // 负数金额
      productId: 'product123'
    });
  } catch (error) {
    console.log('金额错误捕获:', error.message);
  }
}

// 运行所有示例
async function runAllExamples() {
  console.log('开始支付接口示例测试...\n');
  
  try {
    await basicPaymentExample();
    await idempotencyTest();
    await concurrentPaymentTest();
    await enhancedPaymentExample();
    await paymentRetryTest();
    await paymentStateManagementTest();
    await errorHandlingTest();
    
    console.log('\n=== 所有示例测试完成 ===');
  } catch (error) {
    console.error('示例测试失败:', error);
  }
}

// 如果直接运行此文件，则执行示例
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  basicPaymentExample,
  idempotencyTest,
  concurrentPaymentTest,
  enhancedPaymentExample,
  paymentRetryTest,
  paymentStateManagementTest,
  errorHandlingTest,
  runAllExamples
};