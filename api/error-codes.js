/**
 * Sono接口错误代码定义
 * 提供标准化的错误处理和错误码
 */

/**
 * 错误代码枚举
 */
const ERROR_CODES = {
  // 初始化相关错误 (1000-1099)
  NOT_INITIALIZED: 'SONO_1000',
  INVALID_CONFIG: 'SONO_1001',
  INITIALIZATION_FAILED: 'SONO_1002',
  
  // 水印相关错误 (2000-2099)
  WATERMARK_TEXT_ERROR: 'SONO_2000',
  WATERMARK_IMAGE_ERROR: 'SONO_2001',
  WATERMARK_BATCH_ERROR: 'SONO_2002',
  INVALID_IMAGE_PATH: 'SONO_2003',
  INVALID_WATERMARK_CONFIG: 'SONO_2004',
  CANVAS_CREATION_FAILED: 'SONO_2005',
  IMAGE_LOAD_FAILED: 'SONO_2006',
  
  // 游戏引擎相关错误 (3000-3099)
  GAME_ENGINE_ERROR: 'SONO_3000',
  GAME_UTILS_ERROR: 'SONO_3001',
  GAME_PLAYER_ERROR: 'SONO_3002',
  GAME_BLOCK_ERROR: 'SONO_3003',
  WEBGL_NOT_SUPPORTED: 'SONO_3004',
  THREE_JS_NOT_LOADED: 'SONO_3005',
  
  // 存储相关错误 (4000-4099)
  STORAGE_SET_ERROR: 'SONO_4000',
  STORAGE_GET_ERROR: 'SONO_4001',
  STORAGE_REMOVE_ERROR: 'SONO_4002',
  STORAGE_CLEAR_ERROR: 'SONO_4003',
  STORAGE_QUOTA_EXCEEDED: 'SONO_4004',
  STORAGE_NOT_AVAILABLE: 'SONO_4005',
  
  // 工具函数相关错误 (5000-5099)
  PERFORMANCE_MONITOR_ERROR: 'SONO_5000',
  MATH_CALCULATION_ERROR: 'SONO_5001',
  COLOR_CONVERSION_ERROR: 'SONO_5002',
  EASING_FUNCTION_ERROR: 'SONO_5003',
  
  // 事件系统相关错误 (6000-6099)
  EVENT_LISTENER_ERROR: 'SONO_6000',
  EVENT_EMISSION_ERROR: 'SONO_6001',
  INVALID_EVENT_NAME: 'SONO_6002',
  
  // 网络和文件相关错误 (7000-7099)
  NETWORK_ERROR: 'SONO_7000',
  FILE_NOT_FOUND: 'SONO_7001',
  FILE_READ_ERROR: 'SONO_7002',
  FILE_WRITE_ERROR: 'SONO_7003',
  PERMISSION_DENIED: 'SONO_7004',
  
  // 验证相关错误 (8000-8099)
  VALIDATION_ERROR: 'SONO_8000',
  INVALID_PARAMETER: 'SONO_8001',
  MISSING_REQUIRED_PARAMETER: 'SONO_8002',
  PARAMETER_TYPE_ERROR: 'SONO_8003',
  
  // 平台兼容性错误 (9000-9099)
  PLATFORM_NOT_SUPPORTED: 'SONO_9000',
  FEATURE_NOT_AVAILABLE: 'SONO_9001',
  API_NOT_SUPPORTED: 'SONO_9002'
};

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.NOT_INITIALIZED]: 'Sono接口未初始化，请先调用initialize()方法',
  [ERROR_CODES.INVALID_CONFIG]: '无效的配置参数',
  [ERROR_CODES.INITIALIZATION_FAILED]: '接口初始化失败',
  
  [ERROR_CODES.WATERMARK_TEXT_ERROR]: '文字水印处理失败',
  [ERROR_CODES.WATERMARK_IMAGE_ERROR]: '图片水印处理失败',
  [ERROR_CODES.WATERMARK_BATCH_ERROR]: '批量水印处理失败',
  [ERROR_CODES.INVALID_IMAGE_PATH]: '无效的图片路径',
  [ERROR_CODES.INVALID_WATERMARK_CONFIG]: '无效的水印配置',
  [ERROR_CODES.CANVAS_CREATION_FAILED]: 'Canvas创建失败',
  [ERROR_CODES.IMAGE_LOAD_FAILED]: '图片加载失败',
  
  [ERROR_CODES.GAME_ENGINE_ERROR]: '游戏引擎错误',
  [ERROR_CODES.GAME_UTILS_ERROR]: '游戏工具函数错误',
  [ERROR_CODES.GAME_PLAYER_ERROR]: '游戏玩家对象错误',
  [ERROR_CODES.GAME_BLOCK_ERROR]: '游戏方块对象错误',
  [ERROR_CODES.WEBGL_NOT_SUPPORTED]: '当前环境不支持WebGL',
  [ERROR_CODES.THREE_JS_NOT_LOADED]: 'Three.js库未加载',
  
  [ERROR_CODES.STORAGE_SET_ERROR]: '存储数据失败',
  [ERROR_CODES.STORAGE_GET_ERROR]: '读取存储数据失败',
  [ERROR_CODES.STORAGE_REMOVE_ERROR]: '删除存储数据失败',
  [ERROR_CODES.STORAGE_CLEAR_ERROR]: '清空存储失败',
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: '存储空间不足',
  [ERROR_CODES.STORAGE_NOT_AVAILABLE]: '存储功能不可用',
  
  [ERROR_CODES.PERFORMANCE_MONITOR_ERROR]: '性能监控器错误',
  [ERROR_CODES.MATH_CALCULATION_ERROR]: '数学计算错误',
  [ERROR_CODES.COLOR_CONVERSION_ERROR]: '颜色转换错误',
  [ERROR_CODES.EASING_FUNCTION_ERROR]: '缓动函数错误',
  
  [ERROR_CODES.EVENT_LISTENER_ERROR]: '事件监听器错误',
  [ERROR_CODES.EVENT_EMISSION_ERROR]: '事件发射错误',
  [ERROR_CODES.INVALID_EVENT_NAME]: '无效的事件名称',
  
  [ERROR_CODES.NETWORK_ERROR]: '网络请求失败',
  [ERROR_CODES.FILE_NOT_FOUND]: '文件未找到',
  [ERROR_CODES.FILE_READ_ERROR]: '文件读取失败',
  [ERROR_CODES.FILE_WRITE_ERROR]: '文件写入失败',
  [ERROR_CODES.PERMISSION_DENIED]: '权限不足',
  
  [ERROR_CODES.VALIDATION_ERROR]: '数据验证失败',
  [ERROR_CODES.INVALID_PARAMETER]: '无效的参数',
  [ERROR_CODES.MISSING_REQUIRED_PARAMETER]: '缺少必需的参数',
  [ERROR_CODES.PARAMETER_TYPE_ERROR]: '参数类型错误',
  
  [ERROR_CODES.PLATFORM_NOT_SUPPORTED]: '当前平台不支持此功能',
  [ERROR_CODES.FEATURE_NOT_AVAILABLE]: '功能不可用',
  [ERROR_CODES.API_NOT_SUPPORTED]: 'API不支持'
};

/**
 * 错误严重程度
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * 错误严重程度映射
 */
const ERROR_SEVERITY_MAP = {
  [ERROR_CODES.NOT_INITIALIZED]: ERROR_SEVERITY.CRITICAL,
  [ERROR_CODES.INVALID_CONFIG]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.INITIALIZATION_FAILED]: ERROR_SEVERITY.CRITICAL,
  
  [ERROR_CODES.WATERMARK_TEXT_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.WATERMARK_IMAGE_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.WATERMARK_BATCH_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.INVALID_IMAGE_PATH]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.INVALID_WATERMARK_CONFIG]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.CANVAS_CREATION_FAILED]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.IMAGE_LOAD_FAILED]: ERROR_SEVERITY.MEDIUM,
  
  [ERROR_CODES.GAME_ENGINE_ERROR]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.GAME_UTILS_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.GAME_PLAYER_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.GAME_BLOCK_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.WEBGL_NOT_SUPPORTED]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.THREE_JS_NOT_LOADED]: ERROR_SEVERITY.CRITICAL,
  
  [ERROR_CODES.STORAGE_SET_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.STORAGE_GET_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.STORAGE_REMOVE_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.STORAGE_CLEAR_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.STORAGE_NOT_AVAILABLE]: ERROR_SEVERITY.HIGH,
  
  [ERROR_CODES.PERFORMANCE_MONITOR_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.MATH_CALCULATION_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.COLOR_CONVERSION_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.EASING_FUNCTION_ERROR]: ERROR_SEVERITY.LOW,
  
  [ERROR_CODES.EVENT_LISTENER_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.EVENT_EMISSION_ERROR]: ERROR_SEVERITY.LOW,
  [ERROR_CODES.INVALID_EVENT_NAME]: ERROR_SEVERITY.MEDIUM,
  
  [ERROR_CODES.NETWORK_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.FILE_NOT_FOUND]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.FILE_READ_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.FILE_WRITE_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.PERMISSION_DENIED]: ERROR_SEVERITY.HIGH,
  
  [ERROR_CODES.VALIDATION_ERROR]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.INVALID_PARAMETER]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.MISSING_REQUIRED_PARAMETER]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.PARAMETER_TYPE_ERROR]: ERROR_SEVERITY.MEDIUM,
  
  [ERROR_CODES.PLATFORM_NOT_SUPPORTED]: ERROR_SEVERITY.HIGH,
  [ERROR_CODES.FEATURE_NOT_AVAILABLE]: ERROR_SEVERITY.MEDIUM,
  [ERROR_CODES.API_NOT_SUPPORTED]: ERROR_SEVERITY.HIGH
};

/**
 * Sono错误类
 */
class SonoError extends Error {
  constructor(code, message, originalError = null) {
    // 如果没有提供消息，使用默认消息
    const errorMessage = message || ERROR_MESSAGES[code] || '未知错误';
    super(errorMessage);
    
    this.name = 'SonoError';
    this.code = code;
    this.severity = ERROR_SEVERITY_MAP[code] || ERROR_SEVERITY.MEDIUM;
    this.timestamp = new Date().toISOString();
    this.originalError = originalError;
    
    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SonoError);
    }
  }
  
  /**
   * 转换为JSON格式
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
  
  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage() {
    const friendlyMessages = {
      [ERROR_CODES.NOT_INITIALIZED]: '请先初始化Sono接口后再使用',
      [ERROR_CODES.INVALID_IMAGE_PATH]: '请检查图片路径是否正确',
      [ERROR_CODES.WEBGL_NOT_SUPPORTED]: '您的设备不支持3D功能，请使用支持WebGL的浏览器',
      [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: '存储空间不足，请清理一些数据后重试',
      [ERROR_CODES.PERMISSION_DENIED]: '需要相关权限才能执行此操作',
      [ERROR_CODES.NETWORK_ERROR]: '网络连接异常，请检查网络后重试'
    };
    
    return friendlyMessages[this.code] || this.message;
  }
}

/**
 * 错误工厂函数
 */
const createError = (code, customMessage = null, originalError = null) => {
  return new SonoError(code, customMessage, originalError);
};

/**
 * 错误处理器
 */
class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.errorHistory = [];
    this.maxHistorySize = 100;
  }
  
  /**
   * 添加错误监听器
   */
  onError(listener) {
    this.errorListeners.push(listener);
  }
  
  /**
   * 移除错误监听器
   */
  offError(listener) {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }
  
  /**
   * 处理错误
   */
  handleError(error) {
    // 记录错误历史
    this.errorHistory.push({
      error: error instanceof SonoError ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });
    
    // 限制历史记录大小
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
    
    // 通知所有监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
    
    // 根据严重程度决定是否输出到控制台
    if (error instanceof SonoError) {
      switch (error.severity) {
        case ERROR_SEVERITY.CRITICAL:
          console.error('🔴 CRITICAL:', error.message, error);
          break;
        case ERROR_SEVERITY.HIGH:
          console.error('🟠 HIGH:', error.message, error);
          break;
        case ERROR_SEVERITY.MEDIUM:
          console.warn('🟡 MEDIUM:', error.message);
          break;
        case ERROR_SEVERITY.LOW:
          console.log('🔵 LOW:', error.message);
          break;
      }
    } else {
      console.error('❌ ERROR:', error);
    }
  }
  
  /**
   * 获取错误历史
   */
  getErrorHistory() {
    return [...this.errorHistory];
  }
  
  /**
   * 清空错误历史
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }
  
  /**
   * 获取错误统计
   */
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      bySeverity: {},
      byCode: {},
      recent: this.errorHistory.slice(-10)
    };
    
    this.errorHistory.forEach(item => {
      const error = item.error;
      
      // 按严重程度统计
      if (error.severity) {
        stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      }
      
      // 按错误代码统计
      if (error.code) {
        stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
      }
    });
    
    return stats;
  }
}

// 创建全局错误处理器实例
const globalErrorHandler = new ErrorHandler();

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_SEVERITY,
  ERROR_SEVERITY_MAP,
  SonoError,
  createError,
  ErrorHandler,
  globalErrorHandler
};