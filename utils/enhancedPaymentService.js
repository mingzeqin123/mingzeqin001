/**
 * 增强版支付服务 - 集成状态管理和幂等性处理
 * 提供完整的支付解决方案，包括状态跟踪、重试机制和错误处理
 */

const PaymentStateManager = require('./paymentStateManager');

class EnhancedPaymentService {
  constructor() {
    this.stateManager = new PaymentStateManager();
    this.pendingPayments = new Map();
    this.paymentResults = new Map();
    this.maxRetryTimes = 3;
    this.retryDelay = 1000;
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
   * 支付接口 - 支持幂等性和状态管理
   * @param {Object} paymentData - 支付数据
   * @param {string} paymentData.userId - 用户ID
   * @param {string} paymentData.orderId - 订单ID
   * @param {number} paymentData.amount - 支付金额(分)
   * @param {string} paymentData.productId - 商品ID
   * @param {string} paymentData.description - 支付描述
   * @param {string} paymentData.idempotencyId - 幂等性ID(可选)
   * @param {boolean} paymentData.enableRetry - 是否启用重试(默认true)
   * @returns {Promise<Object>} 支付结果
   */
  async processPayment(paymentData) {
    const {
      userId,
      orderId,
      amount,
      productId,
      description,
      idempotencyId,
      enableRetry = true
    } = paymentData;

    // 生成或使用提供的幂等性ID
    const finalIdempotencyId = idempotencyId || this.generateIdempotencyId(userId, orderId, amount, productId);

    // 检查是否已有相同幂等性ID的支付结果
    if (this.paymentResults.has(finalIdempotencyId)) {
      console.log(`[支付幂等性] 返回缓存结果: ${finalIdempotencyId}`);
      return this.paymentResults.get(finalIdempotencyId);
    }

    // 检查支付状态
    const existingState = this.stateManager.getPaymentState(finalIdempotencyId);
    if (existingState) {
      if (existingState.status === PaymentStateManager.PAYMENT_STATES.SUCCESS) {
        const result = this._buildSuccessResult(existingState);
        this.paymentResults.set(finalIdempotencyId, result);
        return result;
      } else if (existingState.status === PaymentStateManager.PAYMENT_STATES.FAILED) {
        if (enableRetry && this.stateManager.canRetry(finalIdempotencyId)) {
          console.log(`[支付重试] 准备重试支付: ${finalIdempotencyId}`);
          return await this._retryPayment(finalIdempotencyId, paymentData);
        } else {
          throw new Error(`支付失败: ${existingState.lastError || '未知错误'}`);
        }
      } else if (existingState.status === PaymentStateManager.PAYMENT_STATES.PROCESSING) {
        console.log(`[支付幂等性] 支付处理中，等待结果: ${finalIdempotencyId}`);
        return await this._waitForPaymentResult(finalIdempotencyId);
      }
    }

    // 检查是否有相同幂等性ID的支付正在进行中
    if (this.pendingPayments.has(finalIdempotencyId)) {
      console.log(`[支付幂等性] 等待进行中的支付: ${finalIdempotencyId}`);
      return await this.pendingPayments.get(finalIdempotencyId);
    }

    // 创建新的支付状态
    this.stateManager.createPaymentState(finalIdempotencyId, paymentData);

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

    // 更新状态为处理中
    this.stateManager.updatePaymentState(idempotencyId, PaymentStateManager.PAYMENT_STATES.PROCESSING);

    // 参数验证
    if (!userId || !orderId || !amount || !productId) {
      const error = new Error('支付参数不完整');
      this.stateManager.markPaymentFailed(idempotencyId, error.message);
      throw error;
    }

    if (amount <= 0) {
      const error = new Error('支付金额必须大于0');
      this.stateManager.markPaymentFailed(idempotencyId, error.message);
      throw error;
    }

    try {
      // 模拟支付处理时间
      await this._delay(1000 + Math.random() * 2000);

      // 模拟支付结果(90%成功率)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 标记支付成功
        this.stateManager.markPaymentSuccess(idempotencyId, paymentId, transactionId);
        
        const result = {
          success: true,
          idempotencyId,
          paymentId,
          orderId,
          amount,
          status: 'SUCCESS',
          message: '支付成功',
          timestamp: new Date().toISOString(),
          transactionId
        };
        
        console.log(`[支付成功] ID: ${idempotencyId}, 支付ID: ${paymentId}`);
        return result;
      } else {
        const errorMessage = '支付处理失败，请重试';
        this.stateManager.markPaymentFailed(idempotencyId, errorMessage);
        
        const result = {
          success: false,
          idempotencyId,
          orderId,
          amount,
          status: 'FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          errorCode: 'PAYMENT_FAILED',
          errorMessage
        };
        
        console.log(`[支付失败] ID: ${idempotencyId}, 错误: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } catch (error) {
      this.stateManager.markPaymentFailed(idempotencyId, error.message);
      throw error;
    }
  }

  /**
   * 重试支付
   * @param {string} idempotencyId - 幂等性ID
   * @param {Object} paymentData - 支付数据
   * @returns {Promise<Object>} 支付结果
   */
  async _retryPayment(idempotencyId, paymentData) {
    console.log(`[支付重试] 开始重试: ${idempotencyId}`);
    
    // 更新状态为待处理
    this.stateManager.updatePaymentState(idempotencyId, PaymentStateManager.PAYMENT_STATES.PENDING);
    
    // 添加重试任务
    this.stateManager.addRetryTask(idempotencyId, async () => {
      await this._executePayment({ ...paymentData, idempotencyId });
    });

    // 等待重试结果
    return await this._waitForPaymentResult(idempotencyId);
  }

  /**
   * 等待支付结果
   * @param {string} idempotencyId - 幂等性ID
   * @returns {Promise<Object>} 支付结果
   */
  async _waitForPaymentResult(idempotencyId) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const state = this.stateManager.getPaymentState(idempotencyId);
        
        if (!state) {
          clearInterval(checkInterval);
          reject(new Error('支付状态不存在'));
          return;
        }

        if (state.status === PaymentStateManager.PAYMENT_STATES.SUCCESS) {
          clearInterval(checkInterval);
          const result = this._buildSuccessResult(state);
          this.paymentResults.set(idempotencyId, result);
          resolve(result);
        } else if (state.status === PaymentStateManager.PAYMENT_STATES.FAILED) {
          clearInterval(checkInterval);
          reject(new Error(state.lastError || '支付失败'));
        } else if (state.status === PaymentStateManager.PAYMENT_STATES.TIMEOUT) {
          clearInterval(checkInterval);
          reject(new Error('支付超时'));
        }
      }, 1000); // 每秒检查一次

      // 设置超时
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('等待支付结果超时'));
      }, 30000); // 30秒超时
    });
  }

  /**
   * 构建成功结果
   * @param {Object} state - 支付状态
   * @returns {Object} 成功结果
   */
  _buildSuccessResult(state) {
    return {
      success: true,
      idempotencyId: state.idempotencyId,
      paymentId: state.paymentId,
      orderId: state.orderId,
      amount: state.amount,
      status: 'SUCCESS',
      message: '支付成功',
      timestamp: state.updatedAt,
      transactionId: state.transactionId
    };
  }

  /**
   * 查询支付状态
   * @param {string} idempotencyId - 幂等性ID
   * @returns {Object|null} 支付状态
   */
  getPaymentStatus(idempotencyId) {
    const state = this.stateManager.getPaymentState(idempotencyId);
    if (!state) return null;

    return {
      idempotencyId: state.idempotencyId,
      orderId: state.orderId,
      status: state.status,
      amount: state.amount,
      attempts: state.attempts,
      maxAttempts: state.maxAttempts,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      lastError: state.lastError,
      paymentId: state.paymentId,
      transactionId: state.transactionId
    };
  }

  /**
   * 取消支付
   * @param {string} idempotencyId - 幂等性ID
   * @returns {boolean} 是否成功取消
   */
  cancelPayment(idempotencyId) {
    const state = this.stateManager.getPaymentState(idempotencyId);
    if (!state) return false;

    if (state.status === PaymentStateManager.PAYMENT_STATES.SUCCESS) {
      console.log(`[支付取消] 支付已完成，无法取消: ${idempotencyId}`);
      return false;
    }

    this.stateManager.markPaymentCancelled(idempotencyId);
    console.log(`[支付取消] 已取消支付: ${idempotencyId}`);
    return true;
  }

  /**
   * 获取支付统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const stateStats = this.stateManager.getStats();
    return {
      ...stateStats,
      pendingPayments: this.pendingPayments.size,
      cachedResults: this.paymentResults.size,
      maxRetryTimes: this.maxRetryTimes,
      retryDelay: this.retryDelay
    };
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
}

// 创建单例实例
const enhancedPaymentService = new EnhancedPaymentService();

module.exports = enhancedPaymentService;