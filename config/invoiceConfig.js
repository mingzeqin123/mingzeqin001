/**
 * 开票系统配置文件
 */

const config = {
  // API配置
  API_BASE_URL: 'https://api.invoice-system.com',
  API_KEY: 'your-api-key-here', // 需要替换为实际的API密钥
  REQUEST_TIMEOUT: 30000, // 30秒超时
  CLIENT_VERSION: '1.0.0',
  
  // 业务配置
  MAX_INVOICE_AMOUNT: 999999.99, // 最大开票金额
  MAX_LOCAL_HISTORY: 100, // 最大本地历史记录数
  
  // 发票类型
  INVOICE_TYPES: {
    NORMAL: 1, // 增值税普通发票
    SPECIAL: 2 // 增值税专用发票
  },
  
  // 发票状态
  INVOICE_STATUS: {
    PENDING: 'pending',     // 待处理
    PROCESSING: 'processing', // 开票中
    COMPLETED: 'completed',  // 已完成
    FAILED: 'failed',       // 开票失败
    CANCELLED: 'cancelled'   // 已取消
  },
  
  // 税率配置
  TAX_RATES: {
    GENERAL: 0.13,    // 一般纳税人13%
    SMALL: 0.03,      // 小规模纳税人3%
    SERVICE: 0.06,    // 服务业6%
    ZERO: 0.00        // 零税率
  },
  
  // 开票内容预设
  INVOICE_CONTENT_PRESETS: [
    '技术服务费',
    '咨询服务费',
    '软件开发费',
    '信息技术服务',
    '系统维护费',
    '培训服务费',
    '设计服务费',
    '其他'
  ],
  
  // 文件上传配置
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    COMPRESS_QUALITY: 0.8
  },
  
  // 缓存配置
  CACHE_CONFIG: {
    INVOICE_DETAIL_TTL: 5 * 60 * 1000,    // 发票详情缓存5分钟
    HISTORY_LIST_TTL: 2 * 60 * 1000,      // 历史列表缓存2分钟
    USER_INFO_TTL: 30 * 60 * 1000         // 用户信息缓存30分钟
  },
  
  // 错误码映射
  ERROR_CODES: {
    INVALID_PARAMS: 1001,           // 参数错误
    INVALID_TAX_NUMBER: 1002,       // 纳税人识别号错误
    AMOUNT_EXCEEDED: 1003,          // 金额超限
    INSUFFICIENT_BALANCE: 1004,     // 余额不足
    DUPLICATE_INVOICE: 1005,        // 重复开票
    SYSTEM_ERROR: 2001,             // 系统错误
    NETWORK_ERROR: 2002,            // 网络错误
    API_LIMIT_EXCEEDED: 2003        // API调用频率超限
  },
  
  // 第三方开票平台配置
  THIRD_PARTY_PLATFORMS: {
    // 航天信息
    AISINO: {
      name: '航天信息',
      baseUrl: 'https://api.aisino.com',
      apiVersion: 'v1',
      timeout: 30000
    },
    // 百旺金赋
    BAIWANG: {
      name: '百旺金赋',
      baseUrl: 'https://api.baiwang.com',
      apiVersion: 'v2',
      timeout: 30000
    },
    // 税友软件
    SERVYOU: {
      name: '税友软件',
      baseUrl: 'https://api.servyou.com.cn',
      apiVersion: 'v1',
      timeout: 30000
    }
  },
  
  // 开发环境配置
  DEVELOPMENT: {
    MOCK_API: true,           // 是否使用模拟API
    LOG_LEVEL: 'debug',       // 日志级别
    CACHE_DISABLED: false     // 是否禁用缓存
  },
  
  // 生产环境配置
  PRODUCTION: {
    MOCK_API: false,
    LOG_LEVEL: 'error',
    CACHE_DISABLED: false
  }
};

// 根据环境变量选择配置
const env = process.env.NODE_ENV || 'development';
const envConfig = config[env.toUpperCase()] || config.DEVELOPMENT;

// 合并配置
const finalConfig = {
  ...config,
  ...envConfig,
  ENV: env
};

module.exports = finalConfig;