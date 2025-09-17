/**
 * 配置管理模块
 * 统一管理应用程序的所有配置
 */
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 应用配置对象
 */
export const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'task_manager',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password'
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // API配置
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: `/api/${process.env.API_VERSION || 'v1'}`
  }
};

/**
 * 验证必需的环境变量
 */
export const validateConfig = () => {
  const required = [
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
};

export default config;