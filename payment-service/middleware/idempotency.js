const crypto = require('crypto');
const { IdempotencyRecord } = require('../models/payment');

/**
 * 幂等性中间件
 * 通过幂等性键防止重复请求
 */
class IdempotencyMiddleware {
  
  /**
   * 生成请求指纹
   * @param {Object} requestData - 请求数据
   * @returns {string} 请求指纹
   */
  static generateFingerprint(requestData) {
    const normalizedData = JSON.stringify(requestData, Object.keys(requestData).sort());
    return crypto.createHash('sha256').update(normalizedData).digest('hex');
  }
  
  /**
   * 幂等性检查中间件
   */
  static async checkIdempotency(req, res, next) {
    try {
      const idempotencyKey = req.headers['idempotency-key'];
      
      // 检查是否提供了幂等性键
      if (!idempotencyKey) {
        return res.status(400).json({
          error: 'MISSING_IDEMPOTENCY_KEY',
          message: '请求头中缺少 idempotency-key'
        });
      }
      
      // 验证幂等性键格式（建议使用UUID）
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
        return res.status(400).json({
          error: 'INVALID_IDEMPOTENCY_KEY',
          message: '幂等性键格式无效，请使用UUID格式'
        });
      }
      
      // 生成请求指纹
      const requestFingerprint = IdempotencyMiddleware.generateFingerprint({
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query
      });
      
      // 查找现有的幂等性记录
      const existingRecord = await IdempotencyRecord.findOne({ key: idempotencyKey });
      
      if (existingRecord) {
        // 检查请求指纹是否匹配
        if (existingRecord.requestFingerprint !== requestFingerprint) {
          return res.status(422).json({
            error: 'IDEMPOTENCY_KEY_MISMATCH',
            message: '相同的幂等性键对应不同的请求参数'
          });
        }
        
        // 如果请求仍在处理中
        if (existingRecord.status === 'processing') {
          return res.status(409).json({
            error: 'REQUEST_IN_PROGRESS',
            message: '相同的请求正在处理中，请稍后重试'
          });
        }
        
        // 如果请求已完成，直接返回之前的响应
        if (existingRecord.status === 'completed') {
          return res.status(200).json(existingRecord.response);
        }
        
        // 如果请求失败，允许重试
        if (existingRecord.status === 'failed') {
          // 删除失败的记录，允许重试
          await IdempotencyRecord.deleteOne({ key: idempotencyKey });
        }
      }
      
      // 创建新的幂等性记录
      const idempotencyRecord = new IdempotencyRecord({
        key: idempotencyKey,
        requestFingerprint,
        status: 'processing'
      });
      
      await idempotencyRecord.save();
      
      // 将幂等性相关信息添加到请求对象
      req.idempotency = {
        key: idempotencyKey,
        record: idempotencyRecord,
        fingerprint: requestFingerprint
      };
      
      next();
      
    } catch (error) {
      console.error('幂等性检查失败:', error);
      return res.status(500).json({
        error: 'IDEMPOTENCY_CHECK_FAILED',
        message: '幂等性检查失败'
      });
    }
  }
  
  /**
   * 保存幂等性响应
   * @param {string} idempotencyKey - 幂等性键
   * @param {Object} response - 响应数据
   * @param {string} status - 状态 ('completed' | 'failed')
   * @param {string} paymentId - 支付ID（可选）
   */
  static async saveIdempotencyResponse(idempotencyKey, response, status = 'completed', paymentId = null) {
    try {
      await IdempotencyRecord.findOneAndUpdate(
        { key: idempotencyKey },
        {
          response,
          status,
          paymentId,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      console.error('保存幂等性响应失败:', error);
    }
  }
  
  /**
   * 清理过期的幂等性记录
   */
  static async cleanupExpiredRecords() {
    try {
      const result = await IdempotencyRecord.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`清理了 ${result.deletedCount} 条过期的幂等性记录`);
    } catch (error) {
      console.error('清理过期记录失败:', error);
    }
  }
}

module.exports = IdempotencyMiddleware;