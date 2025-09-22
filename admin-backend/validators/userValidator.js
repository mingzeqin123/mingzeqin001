const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.empty': '用户名不能为空',
      'string.min': '用户名至少需要3个字符',
      'string.max': '用户名不能超过50个字符',
      'any.required': '用户名是必填项'
    }),
    
  email: Joi.string().email().required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
    
  password: Joi.string().min(6).required()
    .messages({
      'string.min': '密码至少需要6个字符',
      'any.required': '密码是必填项'
    }),
    
  tenantId: Joi.string().hex().length(24).optional(),
  
  role: Joi.string().valid('super_admin', 'tenant_admin', 'admin', 'user').default('user'),
  
  permissions: Joi.array().items(Joi.string()).optional(),
  
  profile: Joi.object({
    firstName: Joi.string().trim().max(50).optional(),
    lastName: Joi.string().trim().max(50).optional(),
    avatar: Joi.string().uri().optional(),
    phone: Joi.string().optional(),
    department: Joi.string().trim().max(100).optional(),
    position: Joi.string().trim().max(100).optional()
  }).optional(),
  
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active')
});

const userUpdateSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('super_admin', 'tenant_admin', 'admin', 'user').optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
  
  profile: Joi.object({
    firstName: Joi.string().trim().max(50).allow('').optional(),
    lastName: Joi.string().trim().max(50).allow('').optional(),
    avatar: Joi.string().uri().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    department: Joi.string().trim().max(100).allow('').optional(),
    position: Joi.string().trim().max(100).allow('').optional()
  }).optional(),
  
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    }),
    
  password: Joi.string().required()
    .messages({
      'any.required': '密码是必填项'
    }),
    
  tenantSlug: Joi.string().optional() // 可选的租户标识符
});

const validateUser = (data) => {
  return userSchema.validate(data, { abortEarly: false });
};

const validateUserUpdate = (data) => {
  return userUpdateSchema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateUser,
  validateUserUpdate,
  validateLogin
};