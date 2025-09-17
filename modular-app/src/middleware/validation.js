/**
 * 请求验证中间件模块
 * 提供通用的请求数据验证功能
 */
import { validationErrorResponse } from '../utils/response.js';
import { 
  isValidEmail, 
  isValidPassword, 
  isValidUsername,
  isValidTaskTitle,
  isValidTaskStatus,
  isValidPriority,
  validateRequired,
  sanitizeString
} from '../utils/validation.js';

/**
 * 通用验证中间件工厂
 */
export const validateRequest = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    const { body, params, query } = req;

    // 验证请求体
    if (validationRules.body) {
      const bodyErrors = validateObject(body, validationRules.body, 'body');
      errors.push(...bodyErrors);
    }

    // 验证路径参数
    if (validationRules.params) {
      const paramErrors = validateObject(params, validationRules.params, 'params');
      errors.push(...paramErrors);
    }

    // 验证查询参数
    if (validationRules.query) {
      const queryErrors = validateObject(query, validationRules.query, 'query');
      errors.push(...queryErrors);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // 清理和标准化数据
    if (validationRules.sanitize) {
      sanitizeRequestData(req, validationRules.sanitize);
    }

    next();
  };
};

/**
 * 验证对象
 */
const validateObject = (obj, rules, source) => {
  const errors = [];

  // 检查必需字段
  if (rules.required) {
    const validation = validateRequired(obj, rules.required);
    if (!validation.isValid) {
      validation.missing.forEach(field => {
        errors.push({
          field: `${source}.${field}`,
          message: `${field} 是必需的`
        });
      });
    }
  }

  // 检查字段规则
  if (rules.fields) {
    for (const [field, fieldRules] of Object.entries(rules.fields)) {
      const value = obj[field];
      
      if (value !== undefined && value !== null) {
        const fieldErrors = validateField(field, value, fieldRules, source);
        errors.push(...fieldErrors);
      }
    }
  }

  return errors;
};

/**
 * 验证单个字段
 */
const validateField = (field, value, rules, source) => {
  const errors = [];

  // 类型验证
  if (rules.type) {
    if (!validateType(value, rules.type)) {
      errors.push({
        field: `${source}.${field}`,
        message: `${field} 类型应为 ${rules.type}`
      });
      return errors; // 类型错误时不继续其他验证
    }
  }

  // 长度验证
  if (rules.minLength && value.length < rules.minLength) {
    errors.push({
      field: `${source}.${field}`,
      message: `${field} 长度不能少于 ${rules.minLength} 个字符`
    });
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push({
      field: `${source}.${field}`,
      message: `${field} 长度不能超过 ${rules.maxLength} 个字符`
    });
  }

  // 自定义验证
  if (rules.validator) {
    const customErrors = rules.validator(value, field);
    if (customErrors && customErrors.length > 0) {
      errors.push(...customErrors.map(error => ({
        field: `${source}.${field}`,
        message: error
      })));
    }
  }

  return errors;
};

/**
 * 验证类型
 */
const validateType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'email':
      return typeof value === 'string' && isValidEmail(value);
    case 'date':
      return !isNaN(Date.parse(value));
    default:
      return true;
  }
};

/**
 * 清理请求数据
 */
const sanitizeRequestData = (req, rules) => {
  if (rules.body) {
    sanitizeObject(req.body, rules.body);
  }
  
  if (rules.query) {
    sanitizeObject(req.query, rules.query);
  }
};

/**
 * 清理对象
 */
const sanitizeObject = (obj, fields) => {
  for (const field of fields) {
    if (obj[field] && typeof obj[field] === 'string') {
      obj[field] = sanitizeString(obj[field]);
    }
  }
};

/**
 * 预定义的验证规则
 */
export const validationRules = {
  // 用户注册验证
  userRegistration: {
    body: {
      required: ['username', 'email', 'password'],
      fields: {
        username: {
          type: 'string',
          minLength: 3,
          maxLength: 20,
          validator: (value) => isValidUsername(value) ? [] : ['用户名格式无效，只能包含字母、数字和下划线']
        },
        email: {
          type: 'email',
          validator: (value) => isValidEmail(value) ? [] : ['邮箱格式无效']
        },
        password: {
          type: 'string',
          minLength: 8,
          validator: (value) => isValidPassword(value) ? [] : ['密码格式无效，至少8位，需包含字母和数字']
        },
        firstName: {
          type: 'string',
          maxLength: 50
        },
        lastName: {
          type: 'string',
          maxLength: 50
        }
      }
    },
    sanitize: {
      body: ['username', 'email', 'firstName', 'lastName']
    }
  },

  // 用户登录验证
  userLogin: {
    body: {
      required: ['usernameOrEmail', 'password'],
      fields: {
        usernameOrEmail: {
          type: 'string',
          minLength: 3
        },
        password: {
          type: 'string',
          minLength: 1
        }
      }
    },
    sanitize: {
      body: ['usernameOrEmail']
    }
  },

  // 任务创建验证
  taskCreation: {
    body: {
      required: ['title'],
      fields: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          validator: (value) => isValidTaskTitle(value) ? [] : ['任务标题格式无效']
        },
        description: {
          type: 'string',
          maxLength: 1000
        },
        priority: {
          type: 'string',
          validator: (value) => isValidPriority(value) ? [] : ['任务优先级无效']
        },
        dueDate: {
          type: 'date'
        },
        tags: {
          type: 'array'
        }
      }
    },
    sanitize: {
      body: ['title', 'description']
    }
  },

  // 任务更新验证
  taskUpdate: {
    body: {
      fields: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          validator: (value) => isValidTaskTitle(value) ? [] : ['任务标题格式无效']
        },
        description: {
          type: 'string',
          maxLength: 1000
        },
        status: {
          type: 'string',
          validator: (value) => isValidTaskStatus(value) ? [] : ['任务状态无效']
        },
        priority: {
          type: 'string',
          validator: (value) => isValidPriority(value) ? [] : ['任务优先级无效']
        },
        dueDate: {
          type: 'date'
        },
        tags: {
          type: 'array'
        }
      }
    },
    sanitize: {
      body: ['title', 'description']
    }
  },

  // ID参数验证
  idParam: {
    params: {
      required: ['id'],
      fields: {
        id: {
          type: 'string',
          minLength: 1
        }
      }
    }
  }
};

export default {
  validateRequest,
  validationRules
};