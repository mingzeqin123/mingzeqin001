const express = require('express');
const config = require('config');
const AdapterFactory = require('../adapters/AdapterFactory');

const router = express.Router();

// 简单的健康检查
router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(healthData);
});

// 详细的健康检查
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // 基础系统信息
    const systemInfo = {
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };

    // 适配器健康检查
    const adapterHealth = await AdapterFactory.healthCheck();
    const adapterStats = AdapterFactory.getStats();

    // 配置信息
    const configInfo = {
      server: {
        port: config.get('server.port'),
        host: config.get('server.host'),
        timeout: config.get('server.timeout')
      },
      security: {
        corsEnabled: config.get('security.corsEnabled'),
        helmetEnabled: config.get('security.helmetEnabled'),
        rateLimitEnabled: config.get('security.rateLimitEnabled')
      },
      auth: {
        enableAuth: config.get('auth.enableAuth')
      }
    };

    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      system: systemInfo,
      config: configInfo,
      adapters: {
        health: adapterHealth,
        stats: adapterStats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 存活检查 (liveness probe)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// 就绪检查 (readiness probe)
router.get('/ready', async (req, res) => {
  try {
    // 检查所有关键服务是否就绪
    const adapterStats = AdapterFactory.getStats();
    const adaptersReady = adapterStats.total > 0;
    
    if (adaptersReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        adapters: adapterStats.total
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'No adapters configured'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 启动检查 (startup probe)
router.get('/startup', (req, res) => {
  // 检查应用是否已完成启动
  const isStarted = process.uptime() > 1; // 简单的启动时间检查
  
  if (isStarted) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

// 性能指标
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    adapters: AdapterFactory.getStats()
  };

  res.json(metrics);
});

module.exports = router;