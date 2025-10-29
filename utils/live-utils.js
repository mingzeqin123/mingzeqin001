// 直播系统工具函数
const LIVE_CONFIG = require('../config/live-config.js');

/**
 * 格式化数字显示
 * @param {number} num 数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber(num) {
  if (num < 1000) {
    return num.toString();
  } else if (num < 10000) {
    return (num / 1000).toFixed(1) + 'k';
  } else if (num < 100000000) {
    return (num / 10000).toFixed(1) + 'w';
  } else {
    return (num / 100000000).toFixed(1) + '亿';
  }
}

/**
 * 格式化时长显示
 * @param {number} seconds 秒数
 * @returns {string} 格式化后的时长
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化时间戳
 * @param {number} timestamp 时间戳
 * @param {string} format 格式类型 'full' | 'time' | 'relative'
 * @returns {string} 格式化后的时间
 */
function formatTime(timestamp, format = 'time') {
  const date = new Date(timestamp);
  const now = new Date();
  
  switch (format) {
    case 'full':
      return date.toLocaleString('zh-CN');
    
    case 'time':
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    
    case 'relative':
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      return '刚刚';
    
    default:
      return date.toLocaleTimeString('zh-CN');
  }
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成唯一ID
 * @param {string} prefix 前缀
 * @returns {string} 唯一ID
 */
function generateUniqueId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${generateRandomString(6)}`;
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
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
    const clonedObj = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 验证网络连接状态
 * @returns {Promise<boolean>} 网络状态
 */
function checkNetworkStatus() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none');
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 获取设备信息
 * @returns {Promise<Object>} 设备信息
 */
function getDeviceInfo() {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success: (res) => {
        resolve({
          platform: res.platform,
          system: res.system,
          version: res.version,
          screenWidth: res.screenWidth,
          screenHeight: res.screenHeight,
          pixelRatio: res.pixelRatio,
          brand: res.brand,
          model: res.model
        });
      },
      fail: () => {
        resolve({});
      }
    });
  });
}

/**
 * 计算网络质量
 * @param {number} bitrate 码率 (kbps)
 * @param {number} fps 帧率
 * @param {number} rtt 往返时间 (ms)
 * @returns {string} 网络质量等级
 */
function calculateNetworkQuality(bitrate, fps, rtt) {
  let score = 0;
  
  // 码率评分 (40%)
  if (bitrate >= 1500) score += 40;
  else if (bitrate >= 1000) score += 30;
  else if (bitrate >= 500) score += 20;
  else score += 10;
  
  // 帧率评分 (30%)
  if (fps >= 25) score += 30;
  else if (fps >= 20) score += 25;
  else if (fps >= 15) score += 15;
  else score += 5;
  
  // 延迟评分 (30%)
  if (rtt <= 50) score += 30;
  else if (rtt <= 100) score += 25;
  else if (rtt <= 200) score += 15;
  else score += 5;
  
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * 获取网络质量描述
 * @param {string} quality 质量等级
 * @returns {Object} 质量描述
 */
function getNetworkQualityDescription(quality) {
  const descriptions = {
    excellent: { text: '网络极佳', color: '#2ed573', icon: '📶' },
    good: { text: '网络良好', color: '#ffa502', icon: '📶' },
    fair: { text: '网络一般', color: '#ff6348', icon: '📶' },
    poor: { text: '网络较差', color: '#ff4757', icon: '📶' }
  };
  
  return descriptions[quality] || descriptions.poor;
}

/**
 * 存储数据到本地
 * @param {string} key 键名
 * @param {any} data 数据
 * @returns {boolean} 是否成功
 */
function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data);
    return true;
  } catch (error) {
    console.error('Storage set error:', error);
    return false;
  }
}

/**
 * 从本地获取数据
 * @param {string} key 键名
 * @param {any} defaultValue 默认值
 * @returns {any} 数据
 */
function getStorage(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key);
    return data !== '' ? data : defaultValue;
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
}

/**
 * 删除本地数据
 * @param {string} key 键名
 * @returns {boolean} 是否成功
 */
function removeStorage(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (error) {
    console.error('Storage remove error:', error);
    return false;
  }
}

/**
 * 显示加载提示
 * @param {string} title 提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title: title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 * @param {string} title 提示文字
 */
function showSuccess(title) {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 显示错误提示
 * @param {string} title 提示文字
 */
function showError(title) {
  wx.showToast({
    title: title,
    icon: 'error',
    duration: 2000
  });
}

/**
 * 显示普通提示
 * @param {string} title 提示文字
 */
function showToast(title) {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 确认对话框
 * @param {string} title 标题
 * @param {string} content 内容
 * @returns {Promise<boolean>} 用户选择
 */
function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

module.exports = {
  formatNumber,
  formatDuration,
  formatFileSize,
  formatTime,
  generateRandomString,
  generateUniqueId,
  debounce,
  throttle,
  deepClone,
  checkNetworkStatus,
  getDeviceInfo,
  calculateNetworkQuality,
  getNetworkQualityDescription,
  setStorage,
  getStorage,
  removeStorage,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showToast,
  showConfirm
};