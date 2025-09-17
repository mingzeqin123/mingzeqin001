/**
 * 数据验证工具模块
 * 提供通用的数据验证功能
 */

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * 至少8位，包含字母和数字
 */
export const isValidPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    return false;
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasLetter && hasNumber;
};

/**
 * 验证用户名
 * 3-20位字符，只能包含字母、数字和下划线
 */
export const isValidUsername = (username) => {
  if (typeof username !== 'string') {
    return false;
  }
  
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * 验证任务标题
 */
export const isValidTaskTitle = (title) => {
  return typeof title === 'string' && title.trim().length >= 1 && title.length <= 200;
};

/**
 * 验证任务状态
 */
export const isValidTaskStatus = (status) => {
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  return validStatuses.includes(status);
};

/**
 * 验证优先级
 */
export const isValidPriority = (priority) => {
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  return validPriorities.includes(priority);
};

/**
 * 通用对象属性验证
 */
export const validateRequired = (obj, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!obj.hasOwnProperty(field) || obj[field] === undefined || obj[field] === null) {
      missing.push(field);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

/**
 * 清理和标准化字符串
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str.trim().replace(/\s+/g, ' ');
};