const Joi = require('joi');

/**
 * 请求验证中间件
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // 返回所有错误
      allowUnknown: false, // 不允许未知字段
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        error: '请求参数验证失败',
        details: errors
      });
    }

    // 将验证后的值替换原始值
    req[property] = value;
    next();
  };
};

/**
 * 分页参数验证
 */
const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  });

  const { error, value } = schema.validate({
    page: req.query.page,
    limit: req.query.limit
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: '分页参数无效'
    });
  }

  req.pagination = value;
  next();
};

/**
 * 日期范围验证
 */
const validateDateRange = (req, res, next) => {
  const schema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  });

  const { error, value } = schema.validate({
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: '日期范围参数无效'
    });
  }

  if (value.startDate) req.query.startDate = value.startDate;
  if (value.endDate) req.query.endDate = value.endDate;
  
  next();
};

/**
 * ID参数验证
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: `无效的${paramName}参数`
      });
    }

    req.params[paramName] = id;
    next();
  };
};

/**
 * 优惠券码格式验证
 */
const validateCouponCode = (req, res, next) => {
  const { couponCode } = req.body;
  
  if (!couponCode) {
    return res.status(400).json({
      success: false,
      error: '优惠券码不能为空'
    });
  }

  // 优惠券码格式验证（假设格式为：CPN + 字母数字组合）
  const couponCodePattern = /^CPN[A-Z0-9]{8,}$/;
  if (!couponCodePattern.test(couponCode)) {
    return res.status(400).json({
      success: false,
      error: '优惠券码格式无效'
    });
  }

  next();
};

module.exports = {
  validateRequest,
  validatePagination,
  validateDateRange,
  validateId,
  validateCouponCode
};