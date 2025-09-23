const logger = require('../utils/logger');

/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // 保存原始的res.end方法
  const originalEnd = res.end;
  
  // 重写res.end方法以记录响应时间
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
    
    // 调用原始的end方法
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestLogger;