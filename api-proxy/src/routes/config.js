const express = require('express');
const config = require('config');
const AdapterFactory = require('../adapters/AdapterFactory');
const logger = require('../utils/logger');

const router = express.Router();

// 获取当前配置
router.get('/', (req, res) => {
  try {
    const currentConfig = {
      server: config.get('server'),
      security: config.get('security'),
      logging: config.get('logging'),
      auth: {
        enableAuth: config.get('auth.enableAuth'),
        jwtExpiration: config.get('auth.jwtExpiration')
        // 不返回敏感信息如JWT密钥
      },
      apis: {
        default: config.get('apis.default'),
        endpoints: config.get('apis.endpoints').map(endpoint => ({
          ...endpoint,
          // 隐藏敏感的认证信息
          auth: endpoint.auth ? {
            type: endpoint.auth.type,
            // 不返回实际的token或密码
          } : undefined
        }))
      }
    };

    res.json({
      success: true,
      data: currentConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取特定配置部分
router.get('/:section', (req, res) => {
  try {
    const { section } = req.params;
    
    const validSections = ['server', 'security', 'logging', 'auth', 'apis'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: `Invalid config section. Valid sections: ${validSections.join(', ')}`
      });
    }

    let sectionConfig;
    
    if (section === 'auth') {
      // 对于认证配置，不返回敏感信息
      sectionConfig = {
        enableAuth: config.get('auth.enableAuth'),
        jwtExpiration: config.get('auth.jwtExpiration')
      };
    } else {
      sectionConfig = config.get(section);
    }

    res.json({
      success: true,
      section,
      data: sectionConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to get ${req.params.section} configuration:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有端点配置
router.get('/apis/endpoints', (req, res) => {
  try {
    const endpoints = config.get('apis.endpoints');
    
    // 清理敏感信息
    const cleanEndpoints = endpoints.map(endpoint => ({
      ...endpoint,
      auth: endpoint.auth ? {
        type: endpoint.auth.type,
        // 移除实际的认证凭据
        ...(endpoint.auth.key && { key: endpoint.auth.key })
      } : undefined
    }));

    res.json({
      success: true,
      data: cleanEndpoints,
      count: cleanEndpoints.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取特定端点配置
router.get('/apis/endpoints/:name', (req, res) => {
  try {
    const { name } = req.params;
    const endpoints = config.get('apis.endpoints');
    
    const endpoint = endpoints.find(ep => ep.name === name);
    
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        error: `Endpoint ${name} not found`
      });
    }

    // 清理敏感信息
    const cleanEndpoint = {
      ...endpoint,
      auth: endpoint.auth ? {
        type: endpoint.auth.type,
        ...(endpoint.auth.key && { key: endpoint.auth.key })
      } : undefined
    };

    res.json({
      success: true,
      data: cleanEndpoint,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 验证配置
router.post('/validate', (req, res) => {
  try {
    const configToValidate = req.body;
    
    // 基础验证
    const validationResults = [];
    
    // 验证服务器配置
    if (configToValidate.server) {
      if (configToValidate.server.port && 
          (configToValidate.server.port < 1 || configToValidate.server.port > 65535)) {
        validationResults.push({
          section: 'server',
          field: 'port',
          error: 'Port must be between 1 and 65535'
        });
      }
    }

    // 验证端点配置
    if (configToValidate.apis && configToValidate.apis.endpoints) {
      configToValidate.apis.endpoints.forEach((endpoint, index) => {
        try {
          AdapterFactory.validateConfig(endpoint);
        } catch (error) {
          validationResults.push({
            section: 'apis.endpoints',
            index,
            name: endpoint.name,
            error: error.message
          });
        }
      });
    }

    const isValid = validationResults.length === 0;
    
    res.json({
      success: true,
      valid: isValid,
      errors: validationResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取配置架构
router.get('/schema', (req, res) => {
  const schema = {
    server: {
      port: {
        type: 'number',
        description: 'Server port',
        default: 3000,
        min: 1,
        max: 65535
      },
      host: {
        type: 'string',
        description: 'Server host',
        default: 'localhost'
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 30000
      }
    },
    security: {
      corsEnabled: {
        type: 'boolean',
        description: 'Enable CORS',
        default: true
      },
      helmetEnabled: {
        type: 'boolean',
        description: 'Enable Helmet security headers',
        default: true
      },
      rateLimitEnabled: {
        type: 'boolean',
        description: 'Enable rate limiting',
        default: true
      }
    },
    auth: {
      enableAuth: {
        type: 'boolean',
        description: 'Enable JWT authentication',
        default: false
      },
      jwtSecret: {
        type: 'string',
        description: 'JWT secret key',
        sensitive: true
      },
      jwtExpiration: {
        type: 'string',
        description: 'JWT token expiration time',
        default: '1h'
      }
    },
    apis: {
      endpoints: {
        type: 'array',
        description: 'API endpoint configurations',
        items: {
          name: {
            type: 'string',
            required: true,
            description: 'Endpoint name'
          },
          type: {
            type: 'string',
            required: true,
            enum: ['http', 'https', 'rest', 'graphql', 'grpc'],
            description: 'API type'
          },
          path: {
            type: 'string',
            required: true,
            description: 'API path pattern'
          },
          baseUrl: {
            type: 'string',
            description: 'Base URL for HTTP/GraphQL APIs'
          },
          host: {
            type: 'string',
            description: 'Host for gRPC APIs'
          }
        }
      }
    }
  };

  res.json({
    success: true,
    data: schema,
    timestamp: new Date().toISOString()
  });
});

// 获取环境变量
router.get('/env', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    LOG_LEVEL: process.env.LOG_LEVEL,
    // 不返回敏感的环境变量
  };

  res.json({
    success: true,
    data: envVars,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;