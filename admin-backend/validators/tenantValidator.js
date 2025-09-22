const Joi = require('joi');

const tenantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': '租户名称不能为空',
      'string.min': '租户名称至少需要2个字符',
      'string.max': '租户名称不能超过100个字符',
      'any.required': '租户名称是必填项'
    }),
    
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).min(3).max(50).required()
    .messages({
      'string.empty': '租户标识符不能为空',
      'string.pattern.base': '租户标识符只能包含小写字母、数字和连字符',
      'string.min': '租户标识符至少需要3个字符',
      'string.max': '租户标识符不能超过50个字符',
      'any.required': '租户标识符是必填项'
    }),
    
  domain: Joi.string().domain().optional()
    .messages({
      'string.domain': '请输入有效的域名'
    }),
    
  status: Joi.string().valid('active', 'inactive', 'suspended', 'trial').default('trial'),
  
  contact: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '联系邮箱是必填项'
      }),
    phone: Joi.string().optional(),
    address: Joi.string().optional()
  }).required(),
  
  subscription: Joi.object({
    plan: Joi.string().valid('free', 'basic', 'premium', 'enterprise').default('free'),
    startDate: Joi.date().default(Date.now),
    endDate: Joi.date().greater('now').optional(),
    maxUsers: Joi.number().integer().min(1).default(5),
    maxStorage: Joi.number().integer().min(100).default(1024) // MB
  }).optional(),
  
  settings: Joi.object({
    theme: Joi.string().default('default'),
    language: Joi.string().default('zh-CN'),
    timezone: Joi.string().default('Asia/Shanghai'),
    features: Joi.array().items(Joi.string()).default([])
  }).optional(),
  
  // 创建租户时可以同时创建管理员用户
  adminUser: Joi.object({
    username: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }).optional()
});

const tenantUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).min(3).max(50).optional(),
  domain: Joi.string().domain().allow('').optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'trial').optional(),
  
  contact: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional()
  }).optional(),
  
  subscription: Joi.object({
    plan: Joi.string().valid('free', 'basic', 'premium', 'enterprise').optional(),
    endDate: Joi.date().allow(null).optional(),
    maxUsers: Joi.number().integer().min(1).optional(),
    maxStorage: Joi.number().integer().min(100).optional()
  }).optional(),
  
  settings: Joi.object({
    theme: Joi.string().optional(),
    language: Joi.string().optional(),
    timezone: Joi.string().optional(),
    features: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const validateTenant = (data) => {
  return tenantSchema.validate(data, { abortEarly: false });
};

const validateTenantUpdate = (data) => {
  return tenantUpdateSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateTenant,
  validateTenantUpdate
};