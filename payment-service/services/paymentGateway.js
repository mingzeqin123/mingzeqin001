const crypto = require('crypto');
const axios = require('axios');

/**
 * 支付网关服务
 * 模拟第三方支付平台接口调用
 */
class PaymentGateway {
  
  constructor() {
    this.config = {
      alipay: {
        appId: process.env.ALIPAY_APP_ID,
        privateKey: process.env.ALIPAY_PRIVATE_KEY,
        publicKey: process.env.ALIPAY_PUBLIC_KEY,
        gatewayUrl: 'https://openapi.alipay.com/gateway.do'
      },
      wechat: {
        appId: process.env.WECHAT_APP_ID,
        mchId: process.env.WECHAT_MCH_ID,
        apiKey: process.env.WECHAT_API_KEY,
        gatewayUrl: 'https://api.mch.weixin.qq.com/pay/unifiedorder'
      },
      unionpay: {
        merId: process.env.UNIONPAY_MER_ID,
        privateKey: process.env.UNIONPAY_PRIVATE_KEY,
        gatewayUrl: 'https://gateway.95516.com/gateway/api/frontTransReq.do'
      }
    };
  }
  
  /**
   * 创建支付订单
   * @param {Object} paymentData - 支付数据
   * @returns {Object} 支付网关响应
   */
  static async createPayment(paymentData) {
    const {
      paymentId,
      amount,
      currency,
      paymentMethod,
      description,
      callbackUrl,
      metadata
    } = paymentData;
    
    try {
      switch (paymentMethod) {
        case 'alipay':
          return await PaymentGateway.createAlipayOrder(paymentData);
        case 'wechat':
          return await PaymentGateway.createWechatOrder(paymentData);
        case 'unionpay':
          return await PaymentGateway.createUnionpayOrder(paymentData);
        case 'credit_card':
          return await PaymentGateway.createCreditCardOrder(paymentData);
        default:
          throw new Error(`不支持的支付方式: ${paymentMethod}`);
      }
    } catch (error) {
      console.error(`${paymentMethod} 支付创建失败:`, error);
      throw new Error(`支付网关调用失败: ${error.message}`);
    }
  }
  
  /**
   * 创建支付宝订单
   */
  static async createAlipayOrder(paymentData) {
    const { paymentId, amount, description, callbackUrl } = paymentData;
    
    // 模拟支付宝API调用
    const orderData = {
      out_trade_no: paymentId,
      total_amount: (amount / 100).toFixed(2), // 转换为元
      subject: description,
      product_code: 'QUICK_WAP_WAY',
      notify_url: callbackUrl
    };
    
    // 这里应该调用真实的支付宝API
    // 现在返回模拟数据
    return {
      transactionId: `alipay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentUrl: `https://openapi.alipay.com/gateway.do?mock_payment=${paymentId}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15分钟后过期
    };
  }
  
  /**
   * 创建微信支付订单
   */
  static async createWechatOrder(paymentData) {
    const { paymentId, amount, description, callbackUrl } = paymentData;
    
    // 模拟微信支付API调用
    const orderData = {
      out_trade_no: paymentId,
      total_fee: amount, // 微信支付金额单位为分
      body: description,
      trade_type: 'NATIVE',
      notify_url: callbackUrl
    };
    
    return {
      transactionId: `wechat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentUrl: `weixin://wxpay/bizpayurl?mock_payment=${paymentId}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  }
  
  /**
   * 创建银联支付订单
   */
  static async createUnionpayOrder(paymentData) {
    const { paymentId, amount, description, callbackUrl } = paymentData;
    
    return {
      transactionId: `unionpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentUrl: `https://gateway.95516.com/gateway/api/frontTransReq.do?mock_payment=${paymentId}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    };
  }
  
  /**
   * 创建信用卡支付订单
   */
  static async createCreditCardOrder(paymentData) {
    const { paymentId, amount, description } = paymentData;
    
    return {
      transactionId: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentUrl: `https://payment-gateway.example.com/card/pay?order=${paymentId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期
    };
  }
  
  /**
   * 查询支付状态
   * @param {string} transactionId - 第三方交易ID
   * @returns {Object} 支付状态
   */
  static async queryPaymentStatus(transactionId) {
    try {
      // 模拟查询第三方支付状态
      // 实际应用中应该调用相应的第三方API
      
      // 从交易ID判断支付方式
      let paymentMethod = 'unknown';
      if (transactionId.startsWith('alipay_')) {
        paymentMethod = 'alipay';
      } else if (transactionId.startsWith('wechat_')) {
        paymentMethod = 'wechat';
      } else if (transactionId.startsWith('unionpay_')) {
        paymentMethod = 'unionpay';
      } else if (transactionId.startsWith('card_')) {
        paymentMethod = 'credit_card';
      }
      
      // 模拟不同的支付状态
      const random = Math.random();
      let status, failureReason = null;
      
      if (random < 0.7) {
        status = 'success';
      } else if (random < 0.9) {
        status = 'processing';
      } else {
        status = 'failed';
        failureReason = '支付失败：余额不足';
      }
      
      return {
        transactionId,
        status,
        failureReason,
        paidAt: status === 'success' ? new Date() : null
      };
      
    } catch (error) {
      console.error('查询支付状态失败:', error);
      throw new Error('查询支付状态失败');
    }
  }
  
  /**
   * 验证回调签名
   * @param {Object} callbackData - 回调数据
   * @returns {boolean} 签名是否有效
   */
  static async verifyCallbackSignature(callbackData) {
    try {
      const { signature, ...data } = callbackData;
      
      // 这里应该根据不同的支付方式使用相应的签名验证逻辑
      // 现在返回模拟验证结果
      
      // 生成预期签名
      const sortedKeys = Object.keys(data).sort();
      const signString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
      const expectedSignature = crypto
        .createHmac('sha256', 'mock_secret_key')
        .update(signString)
        .digest('hex');
      
      return signature === expectedSignature;
      
    } catch (error) {
      console.error('验证回调签名失败:', error);
      return false;
    }
  }
  
  /**
   * 生成回调签名（用于测试）
   * @param {Object} data - 回调数据
   * @returns {string} 签名
   */
  static generateCallbackSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map(key => `${key}=${data[key]}`).join('&');
    return crypto
      .createHmac('sha256', 'mock_secret_key')
      .update(signString)
      .digest('hex');
  }
  
  /**
   * 处理支付退款
   * @param {Object} refundData - 退款数据
   * @returns {Object} 退款结果
   */
  static async processRefund(refundData) {
    const { transactionId, refundAmount, reason } = refundData;
    
    try {
      // 模拟退款处理
      const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        refundId,
        transactionId,
        refundAmount,
        status: 'success',
        refundedAt: new Date()
      };
      
    } catch (error) {
      console.error('退款处理失败:', error);
      throw new Error('退款处理失败');
    }
  }
}

module.exports = PaymentGateway;