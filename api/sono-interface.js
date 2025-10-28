/**
 * Sono公开接口 - 统一API入口
 * 提供水印处理、游戏引擎、工具函数等核心能力
 * @version 1.0.0
 * @author Sono Team
 */

const WatermarkUtil = require('../utils/watermark.js');
const { ERROR_CODES, createError, globalErrorHandler } = require('./error-codes.js');

/**
 * Sono公开接口类
 * 统一管理和暴露应用核心功能
 */
class SonoInterface {
  constructor() {
    this.version = '1.0.0';
    this.initialized = false;
    this.capabilities = {
      watermark: true,
      gameEngine: true,
      utilities: true,
      storage: true
    };
  }

  /**
   * 初始化接口
   * @param {Object} config - 配置选项
   * @param {boolean} config.enableWatermark - 是否启用水印功能
   * @param {boolean} config.enableGameEngine - 是否启用游戏引擎
   * @param {Object} config.apiKeys - API密钥配置
   * @returns {Promise<boolean>} 初始化结果
   */
  async initialize(config = {}) {
    try {
      this.config = {
        enableWatermark: true,
        enableGameEngine: true,
        enableUtilities: true,
        enableStorage: true,
        ...config
      };

      // 验证配置
      if (!this._validateConfig(this.config)) {
        throw createError(ERROR_CODES.INVALID_CONFIG, 'Invalid configuration provided');
      }

      this.initialized = true;
      console.log(`Sono Interface v${this.version} initialized successfully`);
      return true;
    } catch (error) {
      const sonoError = error instanceof Error && error.code 
        ? error 
        : createError(ERROR_CODES.INITIALIZATION_FAILED, error.message, error);
      globalErrorHandler.handleError(sonoError);
      throw sonoError;
    }
  }

  /**
   * 获取接口信息
   * @returns {Object} 接口基本信息
   */
  getInfo() {
    return {
      name: 'Sono Public Interface',
      version: this.version,
      initialized: this.initialized,
      capabilities: this.capabilities,
      config: this.config || {}
    };
  }

  /**
   * 水印处理API
   */
  get watermark() {
    this._checkInitialized();
    
    return {
      /**
       * 添加文字水印
       * @param {string} imagePath - 图片路径
       * @param {Object} options - 水印配置
       * @returns {Promise<string>} 处理后的图片路径
       */
      addText: async (imagePath, options = {}) => {
        try {
          this._validateImagePath(imagePath);
          return await WatermarkUtil.addTextWatermark(imagePath, options);
        } catch (error) {
          const sonoError = createError(ERROR_CODES.WATERMARK_TEXT_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 添加图片水印
       * @param {string} imagePath - 原图路径
       * @param {string} watermarkPath - 水印图片路径
       * @param {Object} options - 配置选项
       * @returns {Promise<string>} 处理后的图片路径
       */
      addImage: async (imagePath, watermarkPath, options = {}) => {
        try {
          this._validateImagePath(imagePath);
          this._validateImagePath(watermarkPath);
          return await WatermarkUtil.addImageWatermark(imagePath, watermarkPath, options);
        } catch (error) {
          const sonoError = createError(ERROR_CODES.WATERMARK_IMAGE_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 批量处理水印
       * @param {Array<string>} imagePaths - 图片路径数组
       * @param {Object} watermarkConfig - 水印配置
       * @param {Function} progressCallback - 进度回调
       * @returns {Promise<Array>} 处理结果数组
       */
      batchProcess: async (imagePaths, watermarkConfig, progressCallback) => {
        try {
          if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
            throw new Error('Invalid image paths array');
          }
          
          imagePaths.forEach(path => this._validateImagePath(path));
          return await WatermarkUtil.batchAddWatermark(imagePaths, watermarkConfig, progressCallback);
        } catch (error) {
          const sonoError = createError(ERROR_CODES.WATERMARK_BATCH_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 获取水印预设配置
       * @returns {Object} 预设配置选项
       */
      getPresets: () => {
        return {
          positions: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
          textStyles: {
            small: { fontSize: 16, opacity: 0.7 },
            medium: { fontSize: 20, opacity: 0.8 },
            large: { fontSize: 24, opacity: 0.9 }
          },
          colors: ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00']
        };
      }
    };
  }

  /**
   * 游戏引擎API
   */
  get gameEngine() {
    this._checkInitialized();
    
    return {
      /**
       * 创建游戏实例
       * @param {Object} config - 游戏配置
       * @returns {Object} 游戏引擎实例
       */
      createGame: (config = {}) => {
        try {
          // 动态导入游戏引擎（避免在非游戏环境下加载Three.js）
          const GameEngine = require('../pages/game/gameEngine.js');
          return new GameEngine.default(config);
        } catch (error) {
          const sonoError = createError(ERROR_CODES.GAME_ENGINE_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 获取游戏工具函数
       * @returns {Object} 工具函数集合
       */
      getUtils: () => {
        try {
          return require('../pages/game/utils.js');
        } catch (error) {
          const sonoError = createError(ERROR_CODES.GAME_UTILS_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 创建玩家实例
       * @param {Object} config - 玩家配置
       * @returns {Object} 玩家实例
       */
      createPlayer: (config = {}) => {
        try {
          const Player = require('../pages/game/player.js');
          return new Player.default(config);
        } catch (error) {
          const sonoError = createError(ERROR_CODES.GAME_PLAYER_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 创建方块实例
       * @param {Object} config - 方块配置
       * @returns {Object} 方块实例
       */
      createBlock: (config = {}) => {
        try {
          const Block = require('../pages/game/block.js');
          return new Block.default(config);
        } catch (error) {
          const sonoError = createError(ERROR_CODES.GAME_BLOCK_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      }
    };
  }

  /**
   * 工具函数API
   */
  get utils() {
    this._checkInitialized();
    
    return {
      /**
       * 数学工具
       */
      math: {
        lerp: (start, end, factor) => start + (end - start) * factor,
        clamp: (value, min, max) => Math.min(Math.max(value, min), max),
        random: (min, max) => Math.random() * (max - min) + min,
        randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        distance3D: (x1, y1, z1, x2, y2, z2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2),
        degToRad: (degrees) => degrees * (Math.PI / 180),
        radToDeg: (radians) => radians * (180 / Math.PI)
      },

      /**
       * 缓动函数
       */
      easing: {
        easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
        easeInQuart: (t) => t * t * t * t,
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeOutElastic: (t) => {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        },
        easeOutBounce: (t) => {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) return n1 * t * t;
          else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
          else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
          else return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      },

      /**
       * 颜色工具
       */
      color: {
        hexToRgb: (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        },
        rgbToHex: (r, g, b) => "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1),
        randomColor: () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      },

      /**
       * 性能监控
       */
      performance: {
        monitor: null, // 延迟加载
        createMonitor: () => {
          try {
            const { PerformanceMonitor } = require('../pages/game/utils.js');
            return new PerformanceMonitor();
        } catch (error) {
          const sonoError = createError(ERROR_CODES.PERFORMANCE_MONITOR_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
        }
      }
    };
  }

  /**
   * 存储API
   */
  get storage() {
    this._checkInitialized();
    
    return {
      /**
       * 设置存储值
       * @param {string} key - 键名
       * @param {any} value - 值
       * @returns {Promise<boolean>} 存储结果
       */
      set: async (key, value) => {
        try {
          if (typeof wx !== 'undefined') {
            wx.setStorageSync(key, value);
          } else {
            // 非微信环境下的存储实现
            localStorage.setItem(key, JSON.stringify(value));
          }
          return true;
        } catch (error) {
          const sonoError = createError(ERROR_CODES.STORAGE_SET_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 获取存储值
       * @param {string} key - 键名
       * @param {any} defaultValue - 默认值
       * @returns {Promise<any>} 存储的值
       */
      get: async (key, defaultValue = null) => {
        try {
          if (typeof wx !== 'undefined') {
            return wx.getStorageSync(key) || defaultValue;
          } else {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
          }
        } catch (error) {
          return defaultValue;
        }
      },

      /**
       * 删除存储值
       * @param {string} key - 键名
       * @returns {Promise<boolean>} 删除结果
       */
      remove: async (key) => {
        try {
          if (typeof wx !== 'undefined') {
            wx.removeStorageSync(key);
          } else {
            localStorage.removeItem(key);
          }
          return true;
        } catch (error) {
          const sonoError = createError(ERROR_CODES.STORAGE_REMOVE_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      },

      /**
       * 清空所有存储
       * @returns {Promise<boolean>} 清空结果
       */
      clear: async () => {
        try {
          if (typeof wx !== 'undefined') {
            wx.clearStorageSync();
          } else {
            localStorage.clear();
          }
          return true;
        } catch (error) {
          const sonoError = createError(ERROR_CODES.STORAGE_CLEAR_ERROR, error.message, error);
          globalErrorHandler.handleError(sonoError);
          throw sonoError;
        }
      }
    };
  }

  /**
   * 事件系统API
   */
  get events() {
    if (!this._eventEmitter) {
      this._eventEmitter = new EventEmitter();
    }
    return this._eventEmitter;
  }

  // 私有方法

  /**
   * 检查是否已初始化
   * @private
   */
  _checkInitialized() {
    if (!this.initialized) {
      const error = createError(ERROR_CODES.NOT_INITIALIZED);
      globalErrorHandler.handleError(error);
      throw error;
    }
  }

  /**
   * 验证配置
   * @private
   */
  _validateConfig(config) {
    return typeof config === 'object' && config !== null;
  }

  /**
   * 验证图片路径
   * @private
   */
  _validateImagePath(path) {
    if (!path || typeof path !== 'string') {
      const error = createError(ERROR_CODES.INVALID_IMAGE_PATH, 'Invalid image path provided');
      globalErrorHandler.handleError(error);
      throw error;
    }
  }

  /**
   * 获取错误处理器
   * @returns {ErrorHandler} 全局错误处理器
   */
  getErrorHandler() {
    return globalErrorHandler;
  }
}

/**
 * 简单事件发射器
 */
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.events[event]) return this;
    
    const index = this.events[event].indexOf(listener);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
    return true;
  }

  once(event, listener) {
    const onceListener = (...args) => {
      this.off(event, onceListener);
      listener.apply(this, args);
    };
    return this.on(event, onceListener);
  }
}

// 创建单例实例
const sonoInterface = new SonoInterface();

// 导出接口
module.exports = sonoInterface;

// 如果在浏览器环境中，也可以通过全局变量访问
if (typeof window !== 'undefined') {
  window.SonoInterface = sonoInterface;
}