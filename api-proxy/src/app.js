const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const config = require('config');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { authMiddleware } = require('./middleware/auth');
const proxyRouter = require('./routes/proxy');
const healthRouter = require('./routes/health');
const configRouter = require('./routes/config');

const app = express();

// 基础中间件
app.use(compression());
app.use(bodyParser.json({ limit: config.get('server.bodyLimit') }));
app.use(bodyParser.urlencoded({ extended: true, limit: config.get('server.bodyLimit') }));

// 安全中间件
if (config.get('security.corsEnabled')) {
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  }));
}

if (config.get('security.helmetEnabled')) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
}

// 速率限制
if (config.get('security.rateLimitEnabled')) {
  const rateLimitConfig = config.get('security.rateLimit');
  app.use(rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    message: { error: rateLimitConfig.message },
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

// 请求日志
app.use(requestLogger);

// 设置请求超时
app.use((req, res, next) => {
  req.setTimeout(config.get('server.timeout'), () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// 路由
app.use('/health', healthRouter);
app.use('/config', configRouter);
app.use('/api', authMiddleware, proxyRouter);

// 根路径信息
app.get('/', (req, res) => {
  res.json({
    name: 'API Proxy Server',
    version: '1.0.0',
    description: 'Universal API proxy supporting HTTP/HTTPS, GraphQL, gRPC and more',
    endpoints: {
      health: '/health',
      config: '/config',
      proxy: '/api/*'
    },
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app;