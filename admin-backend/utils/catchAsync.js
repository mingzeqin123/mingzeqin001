/**
 * 异步错误处理包装器
 * 用于包装异步路由处理函数，自动捕获异常并传递给错误处理中间件
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  catchAsync
};