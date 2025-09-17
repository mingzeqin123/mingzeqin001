/**
 * 日志工具模块
 * 提供统一的日志记录功能
 */
import { config } from '../config/index.js';

/**
 * 日志级别
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * 当前日志级别
 */
const currentLevel = config.server.env === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * 格式化时间戳
 */
const formatTimestamp = () => {
  return new Date().toISOString();
};

/**
 * 格式化日志消息
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = formatTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
};

/**
 * 日志记录器类
 */
class Logger {
  /**
   * 错误日志
   */
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  }

  /**
   * 警告日志
   */
  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  }

  /**
   * 信息日志
   */
  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.info(formatMessage('INFO', message, meta));
    }
  }

  /**
   * 调试日志
   */
  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  }
}

// 导出单例实例
export const logger = new Logger();
export default logger;