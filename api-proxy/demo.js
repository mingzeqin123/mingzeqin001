#!/usr/bin/env node

/**
 * API代理服务器演示
 * 这个脚本演示了如何使用API代理服务器的核心功能
 */

const express = require('express');
const axios = require('axios');

// 简化版的演示服务器
function createDemoApp() {
  const app = express();
  app.use(express.json());

  // 演示端点
  app.get('/', (req, res) => {
    res.json({
      name: 'API Proxy Server Demo',
      version: '1.0.0',
      description: 'Universal API proxy demonstration',
      features: [
        'HTTP/HTTPS API Proxy',
        'GraphQL API Proxy', 
        'gRPC API Proxy',
        'Authentication Support',
        'Request Logging',
        'Error Handling',
        'Health Checks'
      ]
    });
  });

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // 简单的HTTP代理演示
  app.all('/proxy/*', async (req, res) => {
    try {
      const targetUrl = 'https://jsonplaceholder.typicode.com' + req.path.replace('/proxy', '');
      
      console.log(`代理请求: ${req.method} ${req.path} -> ${targetUrl}`);
      
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: {
          'Content-Type': req.get('Content-Type') || 'application/json',
          'User-Agent': 'API-Proxy-Demo/1.0.0'
        }
      });

      res.json({
        success: true,
        data: response.data,
        proxy: {
          method: req.method,
          originalPath: req.path,
          targetUrl: targetUrl,
          statusCode: response.status
        }
      });
    } catch (error) {
      console.error('代理错误:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
        proxy: {
          method: req.method,
          originalPath: req.path
        }
      });
    }
  });

  // GraphQL演示端点
  app.post('/graphql', (req, res) => {
    const { query, variables } = req.body;
    
    // 这里只是一个模拟响应
    res.json({
      data: {
        message: 'GraphQL代理演示',
        query: query?.substring(0, 100) + (query?.length > 100 ? '...' : ''),
        variables: variables
      },
      extensions: {
        proxy: {
          type: 'GraphQL',
          demo: true
        }
      }
    });
  });

  return app;
}

// 客户端演示函数
async function demonstrateUsage() {
  console.log('\n🔥 API代理使用演示');
  console.log('==================');

  const baseUrl = 'http://localhost:3002';

  try {
    // 1. 基本信息
    console.log('\n1. 获取服务信息:');
    const info = await axios.get(`${baseUrl}/`);
    console.log(`   名称: ${info.data.name}`);
    console.log(`   版本: ${info.data.version}`);

    // 2. 健康检查
    console.log('\n2. 健康检查:');
    const health = await axios.get(`${baseUrl}/health`);
    console.log(`   状态: ${health.data.status}`);
    console.log(`   运行时间: ${Math.round(health.data.uptime)}秒`);

    // 3. HTTP代理演示
    console.log('\n3. HTTP代理演示:');
    const proxyResponse = await axios.get(`${baseUrl}/proxy/posts/1`);
    console.log(`   成功: ${proxyResponse.data.success}`);
    console.log(`   标题: ${proxyResponse.data.data.title}`);
    console.log(`   目标URL: ${proxyResponse.data.proxy.targetUrl}`);

    // 4. GraphQL演示
    console.log('\n4. GraphQL代理演示:');
    const graphqlResponse = await axios.post(`${baseUrl}/graphql`, {
      query: 'query { user { name email } }',
      variables: { id: 1 }
    });
    console.log(`   消息: ${graphqlResponse.data.data.message}`);
    console.log(`   查询: ${graphqlResponse.data.data.query}`);

    console.log('\n✅ 演示完成！');

  } catch (error) {
    console.error('❌ 演示出错:', error.message);
  }
}

async function main() {
  console.log('🚀 启动API代理演示服务器');
  console.log('=======================');

  const app = createDemoApp();
  const PORT = 3002;

  const server = app.listen(PORT, () => {
    console.log(`✅ 演示服务器运行在 http://localhost:${PORT}`);
    console.log('📝 可用端点:');
    console.log('   GET  /                   - 服务信息');
    console.log('   GET  /health             - 健康检查');  
    console.log('   ALL  /proxy/*            - HTTP代理');
    console.log('   POST /graphql            - GraphQL演示');
    
    // 启动客户端演示
    setTimeout(() => {
      demonstrateUsage().finally(() => {
        console.log('\n🛑 关闭演示服务器...');
        server.close(() => {
          console.log('✅ 演示完成');
          process.exit(0);
        });
      });
    }, 1000);
  });

  // 错误处理
  server.on('error', (error) => {
    console.error('❌ 服务器错误:', error.message);
    process.exit(1);
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n🛑 收到终止信号，关闭服务器...');
    server.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createDemoApp, demonstrateUsage };