/**
 * 支付服务 - 支持幂等性处理
 * 提供统一的支付接口，确保重复请求不会产生重复扣款
 */

class PaymentService {
  constructor() {
    this.pendingPayments = new Map(); // 存储进行中的支付请求
    this.paymentResults = new Map();  // 存储支付结果缓存
    this.maxRetryTimes = 3;          // 最大重试次数
    this.retryDelay = 1000;          // 重试延迟时间(ms)
  }

  /**
   * 生成支付幂等性ID
   * @param {string} userId - 用户ID
   * @param {string} orderId - 订单ID
   * @param {number} amount - 支付金额(分)
   * @param {string} productId - 商品ID
   * @returns {string} 幂等性ID
   */
  generateIdempotencyId(userId, orderId, amount, productId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `pay_${userId}_${orderId}_${amount}_${productId}_${timestamp}_${random}`;
  }

  /**
   * 支付接口 - 支持幂等性
   * @param {Object} paymentData - 支付数据
   * @param {string} paymentData.userId - 用户ID
   * @param {string} paymentData.orderId - 订单ID
   * @param {number} paymentData.amount - 支付金额(分)
   * @param {string} paymentData.productId - 商品ID
   * @param {string} paymentData.description - 支付描述
   * @param {string} paymentData.idempotencyId - 幂等性ID(可选，不传则自动生成)
   * @returns {Promise<Object>} 支付结果
   */
  async processPayment(paymentData) {
    const {
      userId,
      orderId,
      amount,
      productId,
      description,
      idempotencyId
    } = paymentData;

    // 生成或使用提供的幂等性ID
    const finalIdempotencyId = idempotencyId || this.generateIdempotencyId(userId, orderId, amount, productId);

    // 检查是否已有相同幂等性ID的支付结果
    if (this.paymentResults.has(finalIdempotencyId)) {
      console.log(`[支付幂等性] 返回缓存结果: ${finalIdempotencyId}`);
      return this.paymentResults.get(finalIdempotencyId);
    }

    // 检查是否有相同幂等性ID的支付正在进行中
    if (this.pendingPayments.has(finalIdempotencyId)) {
      console.log(`[支付幂等性] 等待进行中的支付: ${finalIdempotencyId}`);
      return await this.pendingPayments.get(finalIdempotencyId);
    }

    // 创建支付Promise并存储
    const paymentPromise = this._executePayment({
      ...paymentData,
      idempotencyId: finalIdempotencyId
    });

    this.pendingPayments.set(finalIdempotencyId, paymentPromise);

    try {
      const result = await paymentPromise;
      // 存储支付结果
      this.paymentResults.set(finalIdempotencyId, result);
      return result;
    } finally {
      // 清理进行中的支付记录
      this.pendingPayments.delete(finalIdempotencyId);
    }
  }

  /**
   * 执行实际支付逻辑
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 支付结果
   */
  async _executePayment(paymentData) {
    const { idempotencyId, userId, orderId, amount, productId, description } = paymentData;
    
    console.log(`[支付开始] ID: ${idempotencyId}, 用户: ${userId}, 订单: ${orderId}, 金额: ${amount}分`);

    // 参数验证
    if (!userId || !orderId || !amount || !productId) {
      throw new Error('支付参数不完整');
    }

    if (amount <= 0) {
      throw new Error('支付金额必须大于0');
    }

    // 模拟支付处理时间
    await this._delay(1000 + Math.random() * 2000);

    // 模拟支付结果(90%成功率)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      const result = {
        success: true,
        idempotencyId,
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        amount,
        status: 'SUCCESS',
        message: '支付成功',
        timestamp: new Date().toISOString(),
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log(`[支付成功] ID: ${idempotencyId}, 支付ID: ${result.paymentId}`);
      return result;
    } else {
      const result = {
        success: false,
        idempotencyId,
        orderId,
        amount,
        status: 'FAILED',
        message: '支付失败',
        timestamp: new Date().toISOString(),
        errorCode: 'PAYMENT_FAILED',
        errorMessage: '支付处理失败，请重试'
      };
      
      console.log(`[支付失败] ID: ${idempotencyId}, 错误: ${result.errorMessage}`);
      throw new Error(result.errorMessage);
    }
  }

  /**
   * 带重试的支付接口
   * @param {Object} paymentData - 支付数据
   * @param {number} retryTimes - 重试次数(可选)
   * @returns {Promise<Object>} 支付结果
   */
  async processPaymentWithRetry(paymentData, retryTimes = this.maxRetryTimes) {
    let lastError;
    
    for (let attempt = 0; attempt <= retryTimes; attempt++) {
      try {
        return await this.processPayment(paymentData);
      } catch (error) {
        lastError = error;
        console.log(`[支付重试] 第${attempt + 1}次尝试失败: ${error.message}`);
        
        if (attempt < retryTimes) {
          // 等待后重试
          await this._delay(this.retryDelay * Math.pow(2, attempt)); // 指数退避
        }
      }
    }
    
    throw new Error(`支付失败，已重试${retryTimes}次: ${lastError.message}`);
  }

  /**
   * 查询支付状态
   * @param {string} idempotencyId - 幂等性ID
   * @returns {Object|null} 支付结果
   */
  getPaymentStatus(idempotencyId) {
    return this.paymentResults.get(idempotencyId) || null;
  }

  /**
   * 清理过期的支付结果缓存
   * @param {number} maxAge - 最大缓存时间(ms)，默认1小时
   */
  cleanupExpiredResults(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    const expiredIds = [];
    
    for (const [id, result] of this.paymentResults.entries()) {
      const resultTime = new Date(result.timestamp).getTime();
      if (now - resultTime > maxAge) {
        expiredIds.push(id);
      }
    }
    
    expiredIds.forEach(id => {
      this.paymentResults.delete(id);
      console.log(`[缓存清理] 删除过期支付结果: ${id}`);
    });
    
    return expiredIds.length;
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟时间(毫秒)
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取支付统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      pendingPayments: this.pendingPayments.size,
      cachedResults: this.paymentResults.size,
      maxRetryTimes: this.maxRetryTimes,
      retryDelay: this.retryDelay
    };
  }
}

// 创建单例实例
const paymentService = new PaymentService();

module.exports = paymentService;