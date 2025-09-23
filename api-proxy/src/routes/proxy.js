const express = require('express');
const config = require('config');
const AdapterFactory = require('../adapters/AdapterFactory');
const logger = require('../utils/logger');

const router = express.Router();

// 初始化适配器
async function initializeAdapters() {
  try {
    const endpoints = config.get('apis.endpoints');
    const results = await AdapterFactory.createAdapters(endpoints);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    logger.info(`Adapters initialized: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      const failedNames = results.filter(r => !r.success).map(r => r.name);
      logger.warn(`Failed adapters: ${failedNames.join(', ')}`);
    }
    
    return results;
  } catch (error) {
    logger.error('Failed to initialize adapters:', error);
    throw error;
  }
}

// 在模块加载时初始化适配器
initializeAdapters().catch(error => {
  logger.error('Adapter initialization failed:', error);
});

/**
 * 通用代理处理器
 */
async function proxyHandler(req, res, next) {
  try {
    // 查找匹配的适配器
    const adapter = AdapterFactory.findAdapterByPath(req.path);
    
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: 'No adapter found for this path',
        path: req.path,
        availableEndpoints: AdapterFactory.getAllAdapters().map(a => ({
          name: a.name,
          type: a.type,
          path: a.config.path
        }))
      });
    }

    // 记录请求信息
    logger.info(`Proxying request to ${adapter.name}`, {
      method: req.method,
      path: req.path,
      adapter: adapter.name,
      type: adapter.type
    });

    // 使用适配器处理请求
    await adapter.handleRequest(req, res);
    
  } catch (error) {
    logger.error('Proxy handler error:', {
      error: error.message,
      path: req.path,
      method: req.method,
      stack: error.stack
    });
    
    next(error);
  }
}

// 为所有HTTP方法设置代理路由
router.all('/*', proxyHandler);

// 特殊路由：GraphQL introspection
router.get('/*/introspect', async (req, res, next) => {
  try {
    const basePath = req.path.replace('/introspect', '');
    const adapter = AdapterFactory.findAdapterByPath(basePath);
    
    if (!adapter) {
      return res.status(404).json({
        success: false,
        error: 'No GraphQL adapter found for this path'
      });
    }

    if (adapter.type !== 'graphql') {
      return res.status(400).json({
        success: false,
        error: 'Introspection is only available for GraphQL adapters'
      });
    }

    if (typeof adapter.handleIntrospection === 'function') {
      await adapter.handleIntrospection(req, res);
    } else {
      return res.status(501).json({
        success: false,
        error: 'Introspection not implemented for this adapter'
      });
    }
    
  } catch (error) {
    next(error);
  }
});

// 适配器信息路由
router.get('/info', (req, res) => {
  try {
    const stats = AdapterFactory.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 健康检查路由
router.get('/health', async (req, res) => {
  try {
    const healthResults = await AdapterFactory.healthCheck();
    
    const overallHealth = Object.values(healthResults).every(
      result => result.status === 'healthy' || result.status === 'unknown'
    );
    
    res.status(overallHealth ? 200 : 503).json({
      success: true,
      overall: overallHealth ? 'healthy' : 'unhealthy',
      adapters: healthResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 重新加载适配器配置
router.post('/reload', async (req, res) => {
  try {
    // 清理现有适配器
    AdapterFactory.clearAll();
    
    // 重新初始化
    const results = await initializeAdapters();
    
    res.json({
      success: true,
      message: 'Adapters reloaded successfully',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to reload adapters:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加新的适配器端点
router.post('/adapters', async (req, res) => {
  try {
    const adapterConfig = req.body;
    
    // 验证配置
    AdapterFactory.validateConfig(adapterConfig);
    
    // 创建适配器
    const adapter = AdapterFactory.createAdapter(adapterConfig);
    
    // 如果是gRPC适配器，进行初始化
    if (adapter.type === 'grpc' && typeof adapter.initialize === 'function') {
      await adapter.initialize();
    }
    
    res.json({
      success: true,
      message: 'Adapter created successfully',
      adapter: adapter.getInfo(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create adapter:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 删除适配器
router.delete('/adapters/:name', (req, res) => {
  try {
    const { name } = req.params;
    const removed = AdapterFactory.removeAdapter(name);
    
    if (removed) {
      res.json({
        success: true,
        message: `Adapter ${name} removed successfully`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Adapter ${name} not found`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;