/**
 * 支付状态管理器
 * 负责管理支付状态、重试机制和状态持久化
 */

class PaymentStateManager {
  constructor() {
    this.states = new Map(); // 存储支付状态
    this.retryQueues = new Map(); // 存储重试队列
    this.maxRetryAttempts = 3;
    this.retryIntervals = [1000, 3000, 5000]; // 重试间隔(ms)
    this.stateTimeout = 30 * 60 * 1000; // 状态超时时间(30分钟)
    
    // 启动清理定时器
    this.startCleanupTimer();
  }

  /**
   * 支付状态枚举
   */
  static PAYMENT_STATES = {
    PENDING: 'PENDING',           // 待处理
    PROCESSING: 'PROCESSING',     // 处理中
    SUCCESS: 'SUCCESS',           // 成功
    FAILED: 'FAILED',             // 失败
    CANCELLED: 'CANCELLED',       // 已取消
    TIMEOUT: 'TIMEOUT'            // 超时
  };

  /**
   * 创建支付状态记录
   * @param {string} idempotencyId - 幂等性ID
   * @param {Object} paymentData - 支付数据
   * @returns {Object} 状态记录
   */
  createPaymentState(idempotencyId, paymentData) {
    const state = {
      idempotencyId,
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      productId: paymentData.productId,
      status: PaymentStateManager.PAYMENT_STATES.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: this.maxRetryAttempts,
      lastError: null,
      paymentId: null,
      transactionId: null,
      metadata: {
        description: paymentData.description || '',
        source: paymentData.source || 'unknown'
      }
    };

    this.states.set(idempotencyId, state);
    console.log(`[状态管理] 创建支付状态: ${idempotencyId}`);
    return state;
  }

  /**
   * 更新支付状态
   * @param {string} idempotencyId - 幂等性ID
   * @param {string} status - 新状态
   * @param {Object} additionalData - 额外数据
   */
  updatePaymentState(idempotencyId, status, additionalData = {}) {
    const state = this.states.get(idempotencyId);
    if (!state) {
      console.warn(`[状态管理] 未找到支付状态: ${idempotencyId}`);
      return null;
    }

    const oldStatus = state.status;
    state.status = status;
    state.updatedAt = new Date().toISOString();
    state.attempts += 1;

    // 更新额外数据
    Object.assign(state, additionalData);

    console.log(`[状态管理] 更新支付状态: ${idempotencyId}, ${oldStatus} -> ${status}`);
    return state;
  }

  /**
   * 获取支付状态
   * @param {string} idempotencyId - 幂等性ID
   * @returns {Object|null} 支付状态
   */
  getPaymentState(idempotencyId) {
    return this.states.get(idempotencyId) || null;
  }

  /**
   * 检查是否可以重试
   * @param {string} idempotencyId - 幂等性ID
   * @returns {boolean} 是否可以重试
   */
  canRetry(idempotencyId) {
    const state = this.getPaymentState(idempotencyId);
    if (!state) return false;

    return state.status === PaymentStateManager.PAYMENT_STATES.FAILED && 
           state.attempts < state.maxAttempts;
  }

  /**
   * 获取下次重试延迟时间
   * @param {string} idempotencyId - 幂等性ID
   * @returns {number} 延迟时间(ms)
   */
  getRetryDelay(idempotencyId) {
    const state = this.getPaymentState(idempotencyId);
    if (!state) return 0;

    const attemptIndex = Math.min(state.attempts - 1, this.retryIntervals.length - 1);
    return this.retryIntervals[attemptIndex] || this.retryIntervals[this.retryIntervals.length - 1];
  }

  /**
   * 添加重试任务
   * @param {string} idempotencyId - 幂等性ID
   * @param {Function} retryFunction - 重试函数
   */
  addRetryTask(idempotencyId, retryFunction) {
    if (!this.canRetry(idempotencyId)) {
      console.log(`[重试管理] 不能重试支付: ${idempotencyId}`);
      return;
    }

    const delay = this.getRetryDelay(idempotencyId);
    console.log(`[重试管理] 添加重试任务: ${idempotencyId}, 延迟: ${delay}ms`);

    const timeoutId = setTimeout(async () => {
      try {
        await retryFunction();
      } catch (error) {
        console.error(`[重试管理] 重试失败: ${idempotencyId}`, error);
        this.updatePaymentState(idempotencyId, PaymentStateManager.PAYMENT_STATES.FAILED, {
          lastError: error.message
        });
      }
    }, delay);

    this.retryQueues.set(idempotencyId, timeoutId);
  }

  /**
   * 取消重试任务
   * @param {string} idempotencyId - 幂等性ID
   */
  cancelRetryTask(idempotencyId) {
    const timeoutId = this.retryQueues.get(idempotencyId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryQueues.delete(idempotencyId);
      console.log(`[重试管理] 取消重试任务: ${idempotencyId}`);
    }
  }

  /**
   * 标记支付为成功
   * @param {string} idempotencyId - 幂等性ID
   * @param {string} paymentId - 支付ID
   * @param {string} transactionId - 交易ID
   */
  markPaymentSuccess(idempotencyId, paymentId, transactionId) {
    this.updatePaymentState(idempotencyId, PaymentStateManager.PAYMENT_STATES.SUCCESS, {
      paymentId,
      transactionId,
      lastError: null
    });
    this.cancelRetryTask(idempotencyId);
  }

  /**
   * 标记支付为失败
   * @param {string} idempotencyId - 幂等性ID
   * @param {string} errorMessage - 错误信息
   */
  markPaymentFailed(idempotencyId, errorMessage) {
    this.updatePaymentState(idempotencyId, PaymentStateManager.PAYMENT_STATES.FAILED, {
      lastError: errorMessage
    });
  }

  /**
   * 标记支付为取消
   * @param {string} idempotencyId - 幂等性ID
   */
  markPaymentCancelled(idempotencyId) {
    this.updatePaymentState(idempotencyId, PaymentStateManager.PAYMENT_STATES.CANCELLED);
    this.cancelRetryTask(idempotencyId);
  }

  /**
   * 检查支付是否超时
   * @param {string} idempotencyId - 幂等性ID
   * @returns {boolean} 是否超时
   */
  isPaymentTimeout(idempotencyId) {
    const state = this.getPaymentState(idempotencyId);
    if (!state) return false;

    const now = new Date().getTime();
    const createdAt = new Date(state.createdAt).getTime();
    return (now - createdAt) > this.stateTimeout;
  }

  /**
   * 清理超时的支付状态
   */
  cleanupTimeoutStates() {
    const timeoutIds = [];
    
    for (const [id, state] of this.states.entries()) {
      if (this.isPaymentTimeout(id)) {
        this.updatePaymentState(id, PaymentStateManager.PAYMENT_STATES.TIMEOUT);
        this.cancelRetryTask(id);
        timeoutIds.push(id);
      }
    }

    if (timeoutIds.length > 0) {
      console.log(`[状态清理] 清理超时支付: ${timeoutIds.length}个`);
    }

    return timeoutIds;
  }

  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    // 每5分钟清理一次
    setInterval(() => {
      this.cleanupTimeoutStates();
    }, 5 * 60 * 1000);
  }

  /**
   * 获取所有支付状态
   * @param {string} status - 状态过滤(可选)
   * @returns {Array} 支付状态列表
   */
  getAllPaymentStates(status = null) {
    const states = Array.from(this.states.values());
    return status ? states.filter(state => state.status === status) : states;
  }

  /**
   * 获取支付统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const states = this.getAllPaymentStates();
    const stats = {
      total: states.length,
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0,
      cancelled: 0,
      timeout: 0,
      retryQueue: this.retryQueues.size
    };

    states.forEach(state => {
      switch (state.status) {
        case PaymentStateManager.PAYMENT_STATES.PENDING:
          stats.pending++;
          break;
        case PaymentStateManager.PAYMENT_STATES.PROCESSING:
          stats.processing++;
          break;
        case PaymentStateManager.PAYMENT_STATES.SUCCESS:
          stats.success++;
          break;
        case PaymentStateManager.PAYMENT_STATES.FAILED:
          stats.failed++;
          break;
        case PaymentStateManager.PAYMENT_STATES.CANCELLED:
          stats.cancelled++;
          break;
        case PaymentStateManager.PAYMENT_STATES.TIMEOUT:
          stats.timeout++;
          break;
      }
    });

    return stats;
  }

  /**
   * 清理所有状态(用于测试)
   */
  clearAllStates() {
    this.states.clear();
    this.retryQueues.forEach(timeoutId => clearTimeout(timeoutId));
    this.retryQueues.clear();
    console.log('[状态管理] 清理所有状态');
  }
}

module.exports = PaymentStateManager;