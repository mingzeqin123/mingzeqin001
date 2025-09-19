const { v4: uuidv4 } = require('uuid');
const { Payment } = require('../models/payment');
const IdempotencyMiddleware = require('../middleware/idempotency');
const PaymentGateway = require('./paymentGateway');

/**
 * 支付服务类
 * 处理支付相关的业务逻辑，包含幂等性处理
 */
class PaymentService {
  
  /**
   * 创建支付订单
   * @param {Object} paymentData - 支付数据
   * @param {string} idempotencyKey - 幂等性键
   * @returns {Object} 支付结果
   */
  static async createPayment(paymentData, idempotencyKey) {
    const {
      userId,
      orderId,
      amount,
      currency = 'CNY',
      paymentMethod,
      description,
      callbackUrl,
      metadata = {}
    } = paymentData;
    
    try {
      // 验证支付参数
      PaymentService.validatePaymentData(paymentData);
      
      // 检查是否存在相同订单的未完成支付
      const existingPayment = await Payment.findOne({
        orderId,
        status: { $in: ['pending', 'processing'] }
      });
      
      if (existingPayment && existingPayment.idempotencyKey !== idempotencyKey) {
        throw new Error('该订单存在未完成的支付，请等待处理完成');
      }
      
      // 生成支付ID
      const paymentId = `pay_${Date.now()}_${uuidv4().substring(0, 8)}`;
      
      // 创建支付记录
      const payment = new Payment({
        paymentId,
        idempotencyKey,
        userId,
        orderId,
        amount,
        currency,
        paymentMethod,
        description,
        callbackUrl,
        metadata,
        status: 'pending'
      });
      
      await payment.save();
      
      // 调用第三方支付网关
      let gatewayResponse;
      try {
        gatewayResponse = await PaymentGateway.createPayment({
          paymentId,
          amount,
          currency,
          paymentMethod,
          description,
          callbackUrl: `${callbackUrl}?paymentId=${paymentId}`,
          metadata
        });
        
        // 更新支付状态和第三方交易号
        payment.status = 'processing';
        payment.thirdPartyTransactionId = gatewayResponse.transactionId;
        await payment.save();
        
      } catch (gatewayError) {
        // 网关调用失败，更新支付状态
        payment.status = 'failed';
        payment.failureReason = gatewayError.message;
        await payment.save();
        
        // 保存失败的幂等性响应
        await IdempotencyMiddleware.saveIdempotencyResponse(
          idempotencyKey,
          {
            success: false,
            error: 'GATEWAY_ERROR',
            message: '支付网关调用失败',
            paymentId
          },
          'failed',
          paymentId
        );
        
        throw new Error(`支付网关调用失败: ${gatewayError.message}`);
      }
      
      // 构造响应数据
      const response = {
        success: true,
        paymentId,
        status: payment.status,
        amount,
        currency,
        paymentMethod,
        paymentUrl: gatewayResponse.paymentUrl,
        qrCode: gatewayResponse.qrCode,
        expiresAt: gatewayResponse.expiresAt,
        createdAt: payment.createdAt
      };
      
      // 保存成功的幂等性响应
      await IdempotencyMiddleware.saveIdempotencyResponse(
        idempotencyKey,
        response,
        'completed',
        paymentId
      );
      
      return response;
      
    } catch (error) {
      console.error('创建支付失败:', error);
      
      // 保存失败的幂等性响应
      await IdempotencyMiddleware.saveIdempotencyResponse(
        idempotencyKey,
        {
          success: false,
          error: 'PAYMENT_CREATION_FAILED',
          message: error.message
        },
        'failed'
      );
      
      throw error;
    }
  }
  
  /**
   * 查询支付状态
   * @param {string} paymentId - 支付ID
   * @returns {Object} 支付信息
   */
  static async getPaymentStatus(paymentId) {
    try {
      const payment = await Payment.findOne({ paymentId });
      
      if (!payment) {
        throw new Error('支付记录不存在');
      }
      
      // 如果支付状态为处理中，尝试从第三方网关查询最新状态
      if (payment.status === 'processing' && payment.thirdPartyTransactionId) {
        try {
          const gatewayStatus = await PaymentGateway.queryPaymentStatus(
            payment.thirdPartyTransactionId
          );
          
          // 更新本地支付状态
          if (gatewayStatus.status !== payment.status) {
            payment.status = gatewayStatus.status;
            if (gatewayStatus.status === 'success') {
              payment.paidAt = new Date();
            } else if (gatewayStatus.status === 'failed') {
              payment.failureReason = gatewayStatus.failureReason;
            }
            await payment.save();
          }
        } catch (queryError) {
          console.error('查询第三方支付状态失败:', queryError);
        }
      }
      
      return {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        description: payment.description,
        paidAt: payment.paidAt,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      };
      
    } catch (error) {
      console.error('查询支付状态失败:', error);
      throw error;
    }
  }
  
  /**
   * 处理支付回调
   * @param {Object} callbackData - 回调数据
   * @returns {Object} 处理结果
   */
  static async handlePaymentCallback(callbackData) {
    try {
      const { paymentId, status, transactionId, failureReason } = callbackData;
      
      // 验证回调签名
      const isValidSignature = await PaymentGateway.verifyCallbackSignature(callbackData);
      if (!isValidSignature) {
        throw new Error('回调签名验证失败');
      }
      
      // 查找支付记录
      const payment = await Payment.findOne({ paymentId });
      if (!payment) {
        throw new Error('支付记录不存在');
      }
      
      // 防止重复处理回调
      if (payment.status === 'success' || payment.status === 'failed') {
        return {
          success: true,
          message: '回调已处理',
          paymentId,
          status: payment.status
        };
      }
      
      // 更新支付状态
      payment.status = status;
      payment.thirdPartyTransactionId = transactionId;
      
      if (status === 'success') {
        payment.paidAt = new Date();
      } else if (status === 'failed') {
        payment.failureReason = failureReason;
      }
      
      await payment.save();
      
      // 这里可以添加业务逻辑，如发送通知、更新订单状态等
      await PaymentService.handlePostPaymentActions(payment);
      
      return {
        success: true,
        message: '回调处理成功',
        paymentId,
        status: payment.status
      };
      
    } catch (error) {
      console.error('处理支付回调失败:', error);
      throw error;
    }
  }
  
  /**
   * 支付重试
   * @param {string} paymentId - 支付ID
   * @param {string} idempotencyKey - 新的幂等性键
   * @returns {Object} 重试结果
   */
  static async retryPayment(paymentId, idempotencyKey) {
    try {
      const payment = await Payment.findOne({ paymentId });
      
      if (!payment) {
        throw new Error('支付记录不存在');
      }
      
      if (payment.status === 'success') {
        throw new Error('支付已成功，无需重试');
      }
      
      if (payment.retryCount >= 3) {
        throw new Error('重试次数已达上限');
      }
      
      // 更新重试计数和幂等性键
      payment.retryCount += 1;
      payment.idempotencyKey = idempotencyKey;
      payment.status = 'pending';
      payment.failureReason = null;
      await payment.save();
      
      // 重新调用支付网关
      const gatewayResponse = await PaymentGateway.createPayment({
        paymentId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        callbackUrl: payment.callbackUrl,
        metadata: payment.metadata
      });
      
      // 更新支付状态
      payment.status = 'processing';
      payment.thirdPartyTransactionId = gatewayResponse.transactionId;
      await payment.save();
      
      const response = {
        success: true,
        paymentId,
        status: payment.status,
        retryCount: payment.retryCount,
        paymentUrl: gatewayResponse.paymentUrl,
        qrCode: gatewayResponse.qrCode,
        expiresAt: gatewayResponse.expiresAt
      };
      
      // 保存幂等性响应
      await IdempotencyMiddleware.saveIdempotencyResponse(
        idempotencyKey,
        response,
        'completed',
        paymentId
      );
      
      return response;
      
    } catch (error) {
      console.error('支付重试失败:', error);
      throw error;
    }
  }
  
  /**
   * 验证支付数据
   * @param {Object} paymentData - 支付数据
   */
  static validatePaymentData(paymentData) {
    const { userId, orderId, amount, paymentMethod } = paymentData;
    
    if (!userId || typeof userId !== 'string') {
      throw new Error('用户ID无效');
    }
    
    if (!orderId || typeof orderId !== 'string') {
      throw new Error('订单ID无效');
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('支付金额无效');
    }
    
    if (!paymentMethod || !['alipay', 'wechat', 'unionpay', 'credit_card'].includes(paymentMethod)) {
      throw new Error('支付方式无效');
    }
  }
  
  /**
   * 处理支付后续动作
   * @param {Object} payment - 支付记录
   */
  static async handlePostPaymentActions(payment) {
    try {
      if (payment.status === 'success') {
        // 发送支付成功通知
        console.log(`支付成功通知: 支付ID ${payment.paymentId}, 订单ID ${payment.orderId}`);
        
        // 这里可以添加更多业务逻辑
        // 例如：更新订单状态、发送邮件/短信、积分奖励等
      }
    } catch (error) {
      console.error('处理支付后续动作失败:', error);
    }
  }
}

module.exports = PaymentService;