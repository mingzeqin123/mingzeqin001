const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cron = require('node-cron');

const paymentRoutes = require('./routes/payment');
const IdempotencyMiddleware = require('./middleware/idempotency');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_service', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('数据库连接成功');
})
.catch((error) => {
  console.error('数据库连接失败:', error);
  process.exit(1);
});

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
app.use(morgan('combined')); // 日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: '请求过于频繁，请稍后重试'
  }
});
app.use(limiter);

// API路由
app.use('/api/payment', paymentRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('未捕获的错误:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: '请求的资源不存在'
  });
});

// 定时任务：清理过期的幂等性记录
cron.schedule('0 */6 * * *', async () => {
  console.log('开始清理过期的幂等性记录...');
  try {
    await IdempotencyMiddleware.cleanupExpiredRecords();
  } catch (error) {
    console.error('清理过期记录失败:', error);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，开始优雅关闭...');
  mongoose.connection.close(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，开始优雅关闭...');
  mongoose.connection.close(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`支付服务已启动，端口: ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;