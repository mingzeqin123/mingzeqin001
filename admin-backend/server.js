require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { globalErrorHandler } = require('./utils/errors');
const { logTenantContext } = require('./middleware/tenant');

// 路由导入
const tenantRoutes = require('./routes/tenants');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

const app = express();

// 信任代理（用于获取真实 IP）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:8080'];
    
    // 允许没有 origin 的请求（如移动应用、Postman 等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不被 CORS 策略允许'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
};

app.use(cors(corsOptions));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// 登录接口特殊限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试'
  },
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', authLimiter);

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 租户上下文日志
app.use('/api/', logTenantContext);

// API 路由
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 文档端点
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '多租户管理系统 API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile'
      },
      tenants: {
        list: 'GET /api/tenants/super-admin',
        create: 'POST /api/tenants/super-admin',
        get: 'GET /api/tenants/super-admin/:id',
        update: 'PUT /api/tenants/super-admin/:id',
        delete: 'DELETE /api/tenants/super-admin/:id',
        current: 'GET /api/tenants/:tenantSlug/current'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      }
    }
  });
});

// 404 处理
app.all('*', (req, res, next) => {
  const error = new Error(`找不到路由 ${req.originalUrl}`);
  error.status = 'fail';
  error.statusCode = 404;
  next(error);
});

// 全局错误处理中间件
app.use(globalErrorHandler);

// 数据库连接
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi_tenant_admin';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ MongoDB 连接成功');
    
    // 设置数据库连接事件监听
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 连接错误:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB 连接断开');
    });
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 优雅关闭处理
const gracefulShutdown = (signal) => {
  console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`);
  
  server.close(() => {
    console.log('HTTP 服务器已关闭');
    
    mongoose.connection.close(false, () => {
      console.log('MongoDB 连接已关闭');
      process.exit(0);
    });
  });
  
  // 强制退出（如果优雅关闭超时）
  setTimeout(() => {
    console.error('强制退出进程');
    process.exit(1);
  }, 10000);
};

// 启动服务器
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📝 API 文档: http://localhost:${PORT}/api`);
    console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  });
  
  // 注册信号处理器
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // 未处理的 Promise 拒绝
  process.on('unhandledRejection', (err, promise) => {
    console.error('未处理的 Promise 拒绝:', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
  
  return server;
};

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = app;