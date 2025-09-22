class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (err) => {
  const message = `无效的 ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `重复的字段值: ${value}，请使用其他值`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `无效的输入数据: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('无效的令牌，请重新登录', 401);

const handleJWTExpiredError = () =>
  new AppError('令牌已过期，请重新登录', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // 操作性错误，可信任的错误：发送消息给客户端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } 
  // 编程或其他未知错误：不要泄露错误详情
  else {
    // 1) 记录错误
    console.error('ERROR 💥', err);
    
    // 2) 发送通用消息
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  globalErrorHandler
};