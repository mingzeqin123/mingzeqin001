const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * 支付服务使用示例
 * 展示如何正确使用幂等性处理的支付接口
 */

const API_BASE_URL = 'http://localhost:3000/api/payment';

class PaymentClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.axios = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 创建支付订单
   * @param {Object} paymentData - 支付数据
   * @param {string} idempotencyKey - 幂等性键（可选，自动生成）
   * @returns {Promise<Object>} 支付结果
   */
  async createPayment(paymentData, idempotencyKey = null) {
    try {
      // 如果没有提供幂等性键，自动生成一个
      const iKey = idempotencyKey || uuidv4();
      
      const response = await this.axios.post('/create', paymentData, {
        headers: {
          'idempotency-key': iKey
        }
      });
      
      return {
        success: true,
        data: response.data,
        idempotencyKey: iKey
      };
      
    } catch (error) {
      console.error('创建支付失败:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || { message: error.message }
      };
    }
  }

  /**
   * 查询支付状态
   * @param {string} paymentId - 支付ID
   * @returns {Promise<Object>} 支付状态
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.axios.get(`/status/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('查询支付状态失败:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 支付重试
   * @param {string} paymentId - 支付ID
   * @param {string} idempotencyKey - 新的幂等性键（可选）
   * @returns {Promise<Object>} 重试结果
   */
  async retryPayment(paymentId, idempotencyKey = null) {
    try {
      const iKey = idempotencyKey || uuidv4();
      
      const response = await this.axios.post(`/retry/${paymentId}`, {}, {
        headers: {
          'idempotency-key': iKey
        }
      });
      
      return {
        success: true,
        data: response.data,
        idempotencyKey: iKey
      };
      
    } catch (error) {
      console.error('支付重试失败:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || { message: error.message }
      };
    }
  }
}

/**
 * 示例1: 基本支付流程
 */
async function basicPaymentExample() {
  console.log('\n=== 示例1: 基本支付流程 ===');
  
  const client = new PaymentClient();
  
  // 准备支付数据
  const paymentData = {
    userId: 'user_123456',
    orderId: `order_${Date.now()}`,
    amount: 9900, // 99.00元，单位为分
    currency: 'CNY',
    paymentMethod: 'alipay',
    description: '商品购买 - iPhone 15',
    callbackUrl: 'https://example.com/payment/callback',
    metadata: {
      productId: 'iphone_15_128gb',
      couponCode: 'DISCOUNT10'
    }
  };
  
  // 创建支付
  const result = await client.createPayment(paymentData);
  
  if (result.success) {
    console.log('支付创建成功:');
    console.log('- 支付ID:', result.data.data.paymentId);
    console.log('- 支付URL:', result.data.data.paymentUrl);
    console.log('- 幂等性键:', result.idempotencyKey);
    
    // 查询支付状态
    const status = await client.getPaymentStatus(result.data.data.paymentId);
    console.log('- 支付状态:', status.data.status);
  } else {
    console.log('支付创建失败:', result.error.message);
  }
}

/**
 * 示例2: 幂等性测试 - 重复请求
 */
async function idempotencyExample() {
  console.log('\n=== 示例2: 幂等性测试 ===');
  
  const client = new PaymentClient();
  const idempotencyKey = uuidv4();
  
  const paymentData = {
    userId: 'user_789012',
    orderId: `order_${Date.now()}_idempotency_test`,
    amount: 5000, // 50.00元
    currency: 'CNY',
    paymentMethod: 'wechat',
    description: '幂等性测试订单',
    callbackUrl: 'https://example.com/payment/callback'
  };
  
  console.log('使用相同的幂等性键发送两次相同请求...');
  console.log('幂等性键:', idempotencyKey);
  
  // 第一次请求
  console.log('\n第一次请求:');
  const result1 = await client.createPayment(paymentData, idempotencyKey);
  console.log('结果:', result1.success ? '成功' : '失败');
  if (result1.success) {
    console.log('支付ID:', result1.data.data.paymentId);
  }
  
  // 第二次请求（相同幂等性键）
  console.log('\n第二次请求（相同幂等性键）:');
  const result2 = await client.createPayment(paymentData, idempotencyKey);
  console.log('结果:', result2.success ? '成功（返回缓存结果）' : '失败');
  if (result2.success) {
    console.log('支付ID:', result2.data.data.paymentId);
    console.log('两次请求返回的支付ID是否相同:', result1.data.data.paymentId === result2.data.data.paymentId);
  }
}

/**
 * 示例3: 参数不匹配的幂等性键
 */
async function idempotencyMismatchExample() {
  console.log('\n=== 示例3: 参数不匹配的幂等性键 ===');
  
  const client = new PaymentClient();
  const idempotencyKey = uuidv4();
  
  const paymentData1 = {
    userId: 'user_345678',
    orderId: `order_${Date.now()}_mismatch_test`,
    amount: 3000,
    currency: 'CNY',
    paymentMethod: 'alipay',
    description: '第一个订单',
    callbackUrl: 'https://example.com/payment/callback'
  };
  
  const paymentData2 = {
    ...paymentData1,
    amount: 4000, // 不同的金额
    description: '第二个订单' // 不同的描述
  };
  
  console.log('使用相同幂等性键但不同参数...');
  
  // 第一次请求
  const result1 = await client.createPayment(paymentData1, idempotencyKey);
  console.log('第一次请求结果:', result1.success ? '成功' : '失败');
  
  // 第二次请求（相同幂等性键，不同参数）
  const result2 = await client.createPayment(paymentData2, idempotencyKey);
  console.log('第二次请求结果:', result2.success ? '成功' : '失败');
  if (!result2.success) {
    console.log('错误信息:', result2.error.message);
  }
}

/**
 * 示例4: 支付重试
 */
async function paymentRetryExample() {
  console.log('\n=== 示例4: 支付重试 ===');
  
  const client = new PaymentClient();
  
  // 创建一个支付
  const paymentData = {
    userId: 'user_retry_test',
    orderId: `order_${Date.now()}_retry`,
    amount: 1500,
    currency: 'CNY',
    paymentMethod: 'unionpay',
    description: '重试测试订单',
    callbackUrl: 'https://example.com/payment/callback'
  };
  
  const result = await client.createPayment(paymentData);
  
  if (result.success) {
    const paymentId = result.data.data.paymentId;
    console.log('原始支付创建成功，支付ID:', paymentId);
    
    // 模拟支付失败，然后重试
    console.log('\n尝试重试支付...');
    const retryResult = await client.retryPayment(paymentId);
    
    if (retryResult.success) {
      console.log('重试成功');
      console.log('重试次数:', retryResult.data.data.retryCount);
    } else {
      console.log('重试失败:', retryResult.error.message);
    }
  }
}

/**
 * 示例5: 并发请求测试
 */
async function concurrentRequestsExample() {
  console.log('\n=== 示例5: 并发请求测试 ===');
  
  const client = new PaymentClient();
  const idempotencyKey = uuidv4();
  
  const paymentData = {
    userId: 'user_concurrent_test',
    orderId: `order_${Date.now()}_concurrent`,
    amount: 2000,
    currency: 'CNY',
    paymentMethod: 'alipay',
    description: '并发测试订单',
    callbackUrl: 'https://example.com/payment/callback'
  };
  
  console.log('发送5个并发请求（相同幂等性键）...');
  
  // 发送多个并发请求
  const promises = Array(5).fill().map((_, index) => 
    client.createPayment(paymentData, idempotencyKey)
      .then(result => ({ index, result }))
  );
  
  const results = await Promise.all(promises);
  
  let successCount = 0;
  let conflictCount = 0;
  let paymentIds = new Set();
  
  results.forEach(({ index, result }) => {
    console.log(`请求 ${index + 1}:`, result.success ? '成功' : '失败');
    if (result.success) {
      successCount++;
      paymentIds.add(result.data.data.paymentId);
    } else if (result.error.error === 'REQUEST_IN_PROGRESS') {
      conflictCount++;
    }
  });
  
  console.log(`\n结果统计:`);
  console.log(`- 成功请求: ${successCount}`);
  console.log(`- 冲突请求: ${conflictCount}`);
  console.log(`- 唯一支付ID数量: ${paymentIds.size}`);
  console.log(`- 幂等性验证: ${paymentIds.size === 1 ? '通过' : '失败'}`);
}

/**
 * 模拟支付回调
 */
async function simulatePaymentCallback(paymentId, status = 'success') {
  const callbackData = {
    paymentId,
    status,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    paidAt: new Date().toISOString()
  };
  
  // 生成签名
  const PaymentGateway = require('../services/paymentGateway');
  callbackData.signature = PaymentGateway.generateCallbackSignature(callbackData);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/callback`, callbackData);
    console.log('回调处理结果:', response.data);
    return response.data;
  } catch (error) {
    console.error('回调处理失败:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
  console.log('支付服务幂等性处理示例');
  console.log('================================');
  
  try {
    await basicPaymentExample();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    
    await idempotencyExample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await idempotencyMismatchExample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await paymentRetryExample();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await concurrentRequestsExample();
    
    console.log('\n=== 所有示例执行完成 ===');
    
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

// 如果直接运行此文件，执行所有示例
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  PaymentClient,
  basicPaymentExample,
  idempotencyExample,
  idempotencyMismatchExample,
  paymentRetryExample,
  concurrentRequestsExample,
  simulatePaymentCallback,
  runAllExamples
};