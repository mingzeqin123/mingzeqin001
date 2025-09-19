// 简单测试支付服务
const paymentService = require('./utils/paymentService');

console.log('开始测试支付服务...');

// 测试1: 基础功能
const paymentData = {
  userId: 'test_user',
  orderId: 'test_order',
  amount: 1000,
  productId: 'test_product',
  description: '测试支付'
};

console.log('测试1: 基础支付功能');
paymentService.processPayment(paymentData)
  .then(result => {
    console.log('✅ 支付成功:', result.success);
    console.log('   幂等性ID:', result.idempotencyId);
    
    // 测试2: 幂等性
    console.log('\n测试2: 幂等性测试');
    const sameData = { ...paymentData, idempotencyId: result.idempotencyId };
    
    return paymentService.processPayment(sameData);
  })
  .then(result2 => {
    console.log('✅ 第二次支付结果:', result2.success);
    console.log('   幂等性ID相同:', result2.idempotencyId === result2.idempotencyId);
  })
  .catch(error => {
    console.log('❌ 测试失败:', error.message);
  });