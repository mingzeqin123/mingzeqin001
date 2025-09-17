/**
 * 路由索引模块
 * 统一管理和配置所有API路由
 */
import express from 'express';
import { config } from '../config/index.js';
import authRoutes from './auth.js';
import taskRoutes from './tasks.js';
import { successResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * API根路径响应
 */
router.get('/', (req, res) => {
  return successResponse(res, {
    message: '欢迎使用模块化任务管理系统 API',
    version: config.api.version,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        me: 'GET /auth/me',
        updateProfile: 'PUT /auth/me',
        changePassword: 'POST /auth/change-password',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout'
      },
      tasks: {
        create: 'POST /tasks',
        list: 'GET /tasks',
        get: 'GET /tasks/:id',
        update: 'PUT /tasks/:id',
        updateStatus: 'PATCH /tasks/:id/status',
        assign: 'PATCH /tasks/:id/assign',
        delete: 'DELETE /tasks/:id',
        stats: 'GET /tasks/stats',
        search: 'GET /tasks/search',
        overdue: 'GET /tasks/overdue',
        batchUpdateStatus: 'PATCH /tasks/batch/status'
      }
    }
  }, 'API服务运行正常');
});

/**
 * 健康检查端点
 */
router.get('/health', (req, res) => {
  return successResponse(res, {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: config.api.version,
    environment: config.server.env
  }, '服务健康状态正常');
});

/**
 * API信息端点
 */
router.get('/info', (req, res) => {
  return successResponse(res, {
    name: '模块化任务管理系统',
    version: config.api.version,
    description: '一个展示模块化开发的任务管理系统',
    environment: config.server.env,
    node_version: process.version,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  }, 'API信息获取成功');
});

/**
 * 注册子路由
 */
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

/**
 * 路由使用情况记录中间件
 */
router.use((req, res, next) => {
  logger.debug('API请求', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  next();
});

export default router;