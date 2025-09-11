/**
 * 开票系统工具函数
 */

/**
 * 验证纳税人识别号
 * @param {string} taxNumber 纳税人识别号
 * @returns {boolean} 是否有效
 */
function validateTaxNumber(taxNumber) {
  if (!taxNumber || typeof taxNumber !== 'string') {
    return false;
  }
  
  // 移除空格和特殊字符
  const cleanNumber = taxNumber.replace(/\s+/g, '').toUpperCase();
  
  // 统一社会信用代码：18位
  const socialCreditRegex = /^[0-9A-HJ-NPQRTUWXY]{2}[0-9]{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
  
  // 纳税人识别号：15位或20位
  const taxIdRegex = /^[0-9A-Z]{15}$|^[0-9A-Z]{20}$/;
  
  return socialCreditRegex.test(cleanNumber) || taxIdRegex.test(cleanNumber);
}

/**
 * 验证开票金额
 * @param {number|string} amount 金额
 * @returns {boolean} 是否有效
 */
function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 999999.99;
}

/**
 * 格式化金额显示
 * @param {number|string} amount 金额
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的金额
 */
function formatAmount(amount, decimals = 2) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 金额转中文大写
 * @param {number|string} amount 金额
 * @returns {string} 中文大写金额
 */
function amountToChinese(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) return '';
  
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿', '兆'];
  const decimalUnits = ['角', '分'];
  
  if (num === 0) return '零元整';
  
  let integerPart = Math.floor(num);
  let decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  let unitIndex = 0;
  
  // 处理整数部分
  if (integerPart === 0) {
    result = '零';
  } else {
    while (integerPart > 0) {
      let section = integerPart % 10000;
      if (section !== 0) {
        let sectionStr = convertSection(section, digits, units);
        result = sectionStr + bigUnits[unitIndex] + result;
      } else if (result !== '' && !result.startsWith('零')) {
        result = '零' + result;
      }
      integerPart = Math.floor(integerPart / 10000);
      unitIndex++;
    }
  }
  
  result += '元';
  
  // 处理小数部分
  if (decimalPart === 0) {
    result += '整';
  } else {
    if (Math.floor(decimalPart / 10) > 0) {
      result += digits[Math.floor(decimalPart / 10)] + decimalUnits[0];
    }
    if (decimalPart % 10 > 0) {
      result += digits[decimalPart % 10] + decimalUnits[1];
    }
  }
  
  return result;
}

/**
 * 转换数字段为中文
 * @param {number} section 数字段
 * @param {Array} digits 数字数组
 * @param {Array} units 单位数组
 * @returns {string} 中文数字段
 */
function convertSection(section, digits, units) {
  let result = '';
  let unitIndex = 0;
  let hasZero = false;
  
  while (section > 0) {
    let digit = section % 10;
    if (digit === 0) {
      hasZero = true;
    } else {
      if (hasZero && result !== '') {
        result = '零' + result;
      }
      result = digits[digit] + units[unitIndex] + result;
      hasZero = false;
    }
    section = Math.floor(section / 10);
    unitIndex++;
  }
  
  return result;
}

/**
 * 生成请求ID
 * @returns {string} 唯一请求ID
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `req_${timestamp}_${random}`;
}

/**
 * 生成发票编号
 * @returns {string} 发票编号
 */
function generateInvoiceNumber() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
                  (date.getMonth() + 1).toString().padStart(2, '0') + 
                  date.getDate().toString().padStart(2, '0');
  const timeStr = date.getHours().toString().padStart(2, '0') + 
                  date.getMinutes().toString().padStart(2, '0') + 
                  date.getSeconds().toString().padStart(2, '0');
  const random = Math.random().toString().substr(2, 4);
  
  return `INV${dateStr}${timeStr}${random}`;
}

/**
 * 格式化日期时间
 * @param {Date|string} date 日期
 * @param {string} format 格式
 * @returns {string} 格式化后的日期
 */
function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  const second = d.getSeconds().toString().padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 计算税额
 * @param {number} amount 不含税金额
 * @param {number} taxRate 税率
 * @returns {Object} 税额计算结果
 */
function calculateTax(amount, taxRate) {
  const num = parseFloat(amount);
  const rate = parseFloat(taxRate);
  
  if (isNaN(num) || isNaN(rate)) {
    return {
      amount: 0,
      tax: 0,
      total: 0
    };
  }
  
  const tax = Math.round(num * rate * 100) / 100;
  const total = Math.round((num + tax) * 100) / 100;
  
  return {
    amount: num,      // 不含税金额
    tax: tax,         // 税额
    total: total      // 含税金额
  };
}

/**
 * 压缩图片
 * @param {string} filePath 文件路径
 * @param {Object} options 压缩选项
 * @returns {Promise} 压缩结果
 */
function compressImage(filePath, options = {}) {
  const {
    quality = 0.8,
    width = 800,
    height = 600
  } = options;
  
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: Math.round(quality * 100),
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间间隔
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深度克隆对象
 * @param {*} obj 要克隆的对象
 * @returns {*} 克隆后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  
  return obj;
}

/**
 * 验证手机号
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱
 * @param {string} email 邮箱
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @returns {string} 扩展名
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 字节转换为可读格式
 * @param {number} bytes 字节数
 * @returns {string} 可读格式
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  validateTaxNumber,
  validateAmount,
  formatAmount,
  amountToChinese,
  generateRequestId,
  generateInvoiceNumber,
  formatDateTime,
  calculateTax,
  compressImage,
  debounce,
  throttle,
  deepClone,
  validatePhone,
  validateEmail,
  getFileExtension,
  formatBytes
};