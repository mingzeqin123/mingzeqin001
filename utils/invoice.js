// 开票系统工具类
class InvoiceUtils {
  constructor() {
    this.baseUrl = 'https://api.example.com';
    this.token = wx.getStorageSync('token') || '';
  }

  // 设置token
  setToken(token) {
    this.token = token;
    wx.setStorageSync('token', token);
  }

  // 通用请求方法
  async request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Authorization': this.token,
          'Content-Type': 'application/json',
          ...options.header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    });
  }

  // 发票相关API
  invoice = {
    // 获取发票列表
    getList: (params) => {
      return this.request({
        url: '/invoices',
        method: 'GET',
        data: params
      });
    },

    // 获取发票详情
    getDetail: (id) => {
      return this.request({
        url: `/invoices/${id}`,
        method: 'GET'
      });
    },

    // 创建发票
    create: (data) => {
      return this.request({
        url: '/invoices',
        method: 'POST',
        data
      });
    },

    // 更新发票
    update: (id, data) => {
      return this.request({
        url: `/invoices/${id}`,
        method: 'PUT',
        data
      });
    },

    // 删除发票
    delete: (id) => {
      return this.request({
        url: `/invoices/${id}`,
        method: 'DELETE'
      });
    },

    // 更新发票状态
    updateStatus: (id, status) => {
      return this.request({
        url: `/invoices/${id}/status`,
        method: 'PUT',
        data: { status }
      });
    },

    // 批量操作
    batchOperation: (ids, operation) => {
      return this.request({
        url: '/invoices/batch',
        method: 'POST',
        data: { ids, operation }
      });
    }
  };

  // 客户相关API
  customer = {
    // 获取客户列表
    getList: (params) => {
      return this.request({
        url: '/customers',
        method: 'GET',
        data: params
      });
    },

    // 获取客户详情
    getDetail: (id) => {
      return this.request({
        url: `/customers/${id}`,
        method: 'GET'
      });
    },

    // 创建客户
    create: (data) => {
      return this.request({
        url: '/customers',
        method: 'POST',
        data
      });
    },

    // 更新客户
    update: (id, data) => {
      return this.request({
        url: `/customers/${id}`,
        method: 'PUT',
        data
      });
    },

    // 删除客户
    delete: (id) => {
      return this.request({
        url: `/customers/${id}`,
        method: 'DELETE'
      });
    }
  };

  // 发票模板相关API
  template = {
    // 获取发票模板列表
    getList: () => {
      return this.request({
        url: '/invoice-templates',
        method: 'GET'
      });
    },

    // 获取发票模板详情
    getDetail: (id) => {
      return this.request({
        url: `/invoice-templates/${id}`,
        method: 'GET'
      });
    }
  };

  // 统计相关API
  statistics = {
    // 获取发票统计
    getInvoiceStats: (params) => {
      return this.request({
        url: '/statistics/invoices',
        method: 'GET',
        data: params
      });
    },

    // 获取收入统计
    getRevenueStats: (params) => {
      return this.request({
        url: '/statistics/revenue',
        method: 'GET',
        data: params
      });
    }
  };
}

// 发票状态常量
const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// 发票状态文本映射
const INVOICE_STATUS_TEXT = {
  [INVOICE_STATUS.DRAFT]: '草稿',
  [INVOICE_STATUS.PENDING]: '待开票',
  [INVOICE_STATUS.COMPLETED]: '已开票',
  [INVOICE_STATUS.CANCELLED]: '已作废'
};

// 发票类型常量
const INVOICE_TYPE = {
  NORMAL: 'normal',
  SPECIAL: 'special'
};

// 发票类型文本映射
const INVOICE_TYPE_TEXT = {
  [INVOICE_TYPE.NORMAL]: '普通发票',
  [INVOICE_TYPE.SPECIAL]: '专用发票'
};

// 税率常量
const TAX_RATES = [
  { value: 0.03, label: '3%', text: '3%' },
  { value: 0.06, label: '6%', text: '6%' },
  { value: 0.09, label: '9%', text: '9%' },
  { value: 0.13, label: '13%', text: '13%' }
];

// 工具函数
const utils = {
  // 格式化金额
  formatAmount: (amount, decimals = 2) => {
    return parseFloat(amount || 0).toFixed(decimals);
  },

  // 计算税额
  calculateTax: (amount, taxRate) => {
    const amt = parseFloat(amount || 0);
    const rate = parseFloat(taxRate || 0);
    return (amt * rate).toFixed(2);
  },

  // 计算总金额
  calculateTotal: (amount, taxAmount) => {
    const amt = parseFloat(amount || 0);
    const tax = parseFloat(taxAmount || 0);
    return (amt + tax).toFixed(2);
  },

  // 格式化日期
  formatDate: (date, format = 'YYYY-MM-DD') => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
  },

  // 生成发票号
  generateInvoiceNumber: (prefix = 'INV') => {
    const now = new Date();
    const timestamp = now.getTime();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  },

  // 验证税号
  validateTaxNumber: (taxNumber) => {
    if (!taxNumber) return false;
    // 简单的税号验证规则
    const pattern = /^[0-9A-HJ-NPQRTUWXY]{2}[0-9]{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
    return pattern.test(taxNumber);
  },

  // 验证手机号
  validatePhone: (phone) => {
    if (!phone) return false;
    const pattern = /^1[3-9]\d{9}$/;
    return pattern.test(phone);
  },

  // 验证邮箱
  validateEmail: (email) => {
    if (!email) return false;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  },

  // 深拷贝
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => utils.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = utils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // 防抖函数
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 导出
module.exports = {
  InvoiceUtils,
  INVOICE_STATUS,
  INVOICE_STATUS_TEXT,
  INVOICE_TYPE,
  INVOICE_TYPE_TEXT,
  TAX_RATES,
  utils
};