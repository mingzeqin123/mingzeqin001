/**
 * Sono公开接口 - 主入口文件
 * 提供统一的导出和快速访问方式
 */

const sonoInterface = require('./sono-interface.js');

// 导出主接口
module.exports = sonoInterface;

// 同时提供命名导出，方便不同的使用方式
module.exports.SonoInterface = sonoInterface;
module.exports.default = sonoInterface;

// 提供快速初始化函数
module.exports.quickStart = async (config = {}) => {
  const defaultConfig = {
    enableWatermark: true,
    enableGameEngine: true,
    enableUtilities: true,
    enableStorage: true,
    ...config
  };
  
  await sonoInterface.initialize(defaultConfig);
  return sonoInterface;
};

// 提供版本信息
module.exports.version = '1.0.0';

// 提供能力检测函数
module.exports.checkCapabilities = () => {
  const capabilities = {
    watermark: typeof require !== 'undefined',
    gameEngine: typeof require !== 'undefined' && typeof window !== 'undefined',
    storage: typeof wx !== 'undefined' || typeof localStorage !== 'undefined',
    utilities: true
  };
  
  return capabilities;
};

// 如果在浏览器环境中，添加到全局对象
if (typeof window !== 'undefined') {
  window.Sono = module.exports;
}

// 如果在微信小程序环境中，添加到全局对象
if (typeof getApp !== 'undefined') {
  try {
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.Sono = module.exports;
    }
  } catch (e) {
    // 忽略错误，可能是在组件初始化之前
  }
}