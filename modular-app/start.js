#!/usr/bin/env node

/**
 * 快速启动脚本
 * 提供简化的应用启动方式
 */

const { main } = require('./src/index');

// 设置默认环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 启动应用
main().catch(console.error);