const Joi = require('joi');

// 用户注册验证
const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    address: Joi.string().max(500).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      details: error.details[0].message
    });
  }
  next();
};

// 用户登录验证
const validateUserLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: '输入数据验证失败',
      details: error.details[0].message
    });
  }
  next();
};

// 商品创建验证
const validateProduct = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    price: Joi.number().positive().precision(2).required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    category_id: Joi.number().integer().positive().optional(),
    sku: Joi.string().max(50).optional(),
    image_url: Joi.string().uri().max(500).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: '商品数据验证失败',
      details: error.details[0].message
    });
  }
  next();
};

// 订单创建验证
const validateOrder = (req, res, next) => {
  const schema = Joi.object({
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required()
      })
    ).min(1).required(),
    shipping_address: Joi.string().min(10).max(500).required(),
    billing_address: Joi.string().max(500).optional(),
    payment_method: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'alipay', 'wechat_pay').required(),
    notes: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: '订单数据验证失败',
      details: error.details[0].message
    });
  }
  next();
};

// 订单状态更新验证
const validateOrderStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded').required(),
    notes: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: '订单状态数据验证失败',
      details: error.details[0].message
    });
  }
  next();
};

// 购物车项目验证
const validateCartItem = (req, res, next) => {
  const schema = Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: '购物车数据验证失败',
      details: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateOrder,
  validateOrderStatusUpdate,
  validateCartItem
};