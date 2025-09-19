/**
 * 支付接口幂等性处理演示脚本
 */

const paymentService = require('./utils/paymentService');
const enhancedPaymentService = require('./utils/enhancedPaymentService');

async function runDemo() {
  console.log('=== 支付接口幂等性处理演示 ===\n');

  // 演示1: 基础支付服务
  console.log('1. 基础支付服务演示');
  console.log('-------------------');
  
  const basicPaymentData = {
    userId: 'demo_user_1',
    orderId: 'demo_order_001',
    amount: 1000,
    productId: 'demo_product',
    description: '基础支付演示'
  };

  try {
    const result = await paymentService.processPayment(basicPaymentData);
    console.log('✅ 支付成功:', result.success);
    console.log('   幂等性ID:', result.idempotencyId);
    console.log('   支付ID:', result.paymentId);
  } catch (error) {
    console.log('❌ 支付失败:', error.message);
  }

  // 演示2: 幂等性测试
  console.log('\n2. 幂等性测试');
  console.log('-------------');
  
  const idempotencyData = {
    userId: 'demo_user_2',
    orderId: 'demo_order_002',
    amount: 2000,
    productId: 'demo_product',
    description: '幂等性测试',
    idempotencyId: 'demo_idempotency_123'
  };

  try {
    console.log('发起第一次支付...');
    const result1 = await paymentService.processPayment(idempotencyData);
    console.log('✅ 第一次结果:', result1.success ? '成功' : '失败');

    console.log('发起第二次相同支付(应返回缓存结果)...');
    const result2 = await paymentService.processPayment(idempotencyData);
    console.log('✅ 第二次结果:', result2.success ? '成功' : '失败');

    console.log('📊 幂等性验证:');
    console.log('   幂等性ID相同:', result1.idempotencyId === result2.idempotencyId);
    console.log('   结果完全相同:', JSON.stringify(result1) === JSON.stringify(result2));
  } catch (error) {
    console.log('❌ 幂等性测试失败:', error.message);
  }

  // 演示3: 增强版支付服务
  console.log('\n3. 增强版支付服务演示');
  console.log('---------------------');
  
  const enhancedData = {
    userId: 'demo_user_3',
    orderId: 'demo_order_003',
    amount: 3000,
    productId: 'demo_product',
    description: '增强版支付演示',
    enableRetry: true
  };

  try {
    const result = await enhancedPaymentService.processPayment(enhancedData);
    console.log('✅ 支付结果:', result.success ? '成功' : '失败');
    console.log('   幂等性ID:', result.idempotencyId);

    // 查询支付状态
    const status = enhancedPaymentService.getPaymentStatus(result.idempotencyId);
    if (status) {
      console.log('📊 支付状态:', status.status);
      console.log('   尝试次数:', status.attempts);
      console.log('   创建时间:', status.createdAt);
    }

    // 获取统计信息
    const stats = enhancedPaymentService.getStats();
    console.log('📈 支付统计:');
    console.log('   总支付数:', stats.total);
    console.log('   成功数:', stats.success);
    console.log('   失败数:', stats.failed);
    console.log('   进行中:', stats.processing);
  } catch (error) {
    console.log('❌ 增强版支付失败:', error.message);
  }

  // 演示4: 错误处理
  console.log('\n4. 错误处理演示');
  console.log('----------------');
  
  try {
    console.log('测试参数错误...');
    await paymentService.processPayment({
      userId: 'test_user',
      // 缺少必要参数
      amount: 1000
    });
  } catch (error) {
    console.log('✅ 参数错误捕获:', error.message);
  }

  try {
    console.log('测试金额错误...');
    await paymentService.processPayment({
      userId: 'test_user',
      orderId: 'test_order',
      amount: -100, // 负数金额
      productId: 'test_product'
    });
  } catch (error) {
    console.log('✅ 金额错误捕获:', error.message);
  }

  console.log('\n=== 演示完成 ===');
  console.log('📝 功能总结:');
  console.log('   ✅ 基础支付功能');
  console.log('   ✅ 幂等性保证');
  console.log('   ✅ 状态管理');
  console.log('   ✅ 错误处理');
  console.log('   ✅ 统计监控');
}

// 运行演示
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };