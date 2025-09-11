// 开票系统配置文件
const InvoiceConfig = {
  // API配置
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 10000,
    retryCount: 3
  },

  // 发票配置
  invoice: {
    // 默认税率
    defaultTaxRate: 0.13,
    // 支持的开票类型
    supportedTypes: ['normal', 'special'],
    // 发票状态
    status: {
      DRAFT: 'draft',
      PENDING: 'pending',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled'
    },
    // 状态文本映射
    statusText: {
      draft: '草稿',
      pending: '待开票',
      completed: '已开票',
      cancelled: '已作废'
    },
    // 类型文本映射
    typeText: {
      normal: '普通发票',
      special: '专用发票'
    }
  },

  // 客户配置
  customer: {
    // 必填字段
    requiredFields: ['name'],
    // 专用发票必填字段
    specialRequiredFields: ['name', 'taxNumber'],
    // 字段验证规则
    validation: {
      name: {
        minLength: 2,
        maxLength: 100
      },
      taxNumber: {
        pattern: /^[0-9A-HJ-NPQRTUWXY]{2}[0-9]{6}[0-9A-HJ-NPQRTUWXY]{10}$/
      },
      phone: {
        pattern: /^1[3-9]\d{9}$/
      },
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    }
  },

  // 税率配置
  taxRates: [
    { value: 0.03, label: '3%', text: '3%' },
    { value: 0.06, label: '6%', text: '6%' },
    { value: 0.09, label: '9%', text: '9%' },
    { value: 0.13, label: '13%', text: '13%' }
  ],

  // 分页配置
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },

  // 文件上传配置
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxCount: 5
  },

  // 打印配置
  print: {
    paperSize: 'A4',
    orientation: 'portrait',
    margin: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  },

  // 主题配置
  theme: {
    primaryColor: '#007aff',
    successColor: '#28a745',
    warningColor: '#ffc107',
    dangerColor: '#dc3545',
    infoColor: '#17a2b8',
    lightColor: '#f8f9fa',
    darkColor: '#343a40'
  },

  // 权限配置
  permissions: {
    // 发票权限
    invoice: {
      create: true,
      read: true,
      update: true,
      delete: true,
      print: true,
      download: true
    },
    // 客户权限
    customer: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    // 统计权限
    statistics: {
      view: true,
      export: true
    }
  },

  // 缓存配置
  cache: {
    // 缓存时间（毫秒）
    invoiceList: 5 * 60 * 1000, // 5分钟
    customerList: 10 * 60 * 1000, // 10分钟
    userInfo: 30 * 60 * 1000 // 30分钟
  },

  // 错误配置
  error: {
    // 是否显示详细错误信息
    showDetail: false,
    // 错误重试次数
    retryCount: 3,
    // 错误提示延迟时间
    toastDelay: 2000
  },

  // 调试配置
  debug: {
    // 是否开启调试模式
    enabled: false,
    // 是否打印API请求日志
    logApi: false,
    // 是否打印用户操作日志
    logAction: false
  }
};

// 导出配置
module.exports = InvoiceConfig;