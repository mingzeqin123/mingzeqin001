#!/usr/bin/env node

/**
 * API代理客户端使用示例
 * 展示如何通过代理服务器访问不同类型的API
 */

const axios = require('axios');

// 代理服务器配置
const PROXY_BASE_URL = 'http://localhost:3000';

/**
 * HTTP API示例 - 通过代理访问RESTful API
 */
async function httpApiExample() {
  console.log('\n=== HTTP API Example ===');
  
  try {
    // GET请求示例
    const getResponse = await axios.get(`${PROXY_BASE_URL}/api/v1/rest/1`);
    console.log('GET Response:', getResponse.data);

    // POST请求示例
    const postData = {
      title: 'New Post via Proxy',
      body: 'This post was created through the API proxy',
      userId: 1
    };
    
    const postResponse = await axios.post(`${PROXY_BASE_URL}/api/v1/rest`, postData);
    console.log('POST Response:', postResponse.data);
    
  } catch (error) {
    console.error('HTTP API Error:', error.response?.data || error.message);
  }
}

/**
 * GraphQL API示例
 */
async function graphqlApiExample() {
  console.log('\n=== GraphQL API Example ===');
  
  try {
    // GraphQL查询示例
    const query = `
      query {
        viewer {
          login
          name
          bio
        }
      }
    `;

    const response = await axios.post(`${PROXY_BASE_URL}/api/v1/graphql`, {
      query: query
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-github-token' // 需要替换为实际token
      }
    });

    console.log('GraphQL Response:', JSON.stringify(response.data, null, 2));
    
    // GraphQL变更示例
    const mutation = `
      mutation {
        createIssue(input: {
          repositoryId: "repository-id"
          title: "Issue created via proxy"
          body: "This issue was created through the API proxy"
        }) {
          issue {
            id
            title
            body
          }
        }
      }
    `;

    // 注意：这个mutation需要有效的GitHub token和repository ID
    console.log('GraphQL Mutation Query:', mutation);
    
  } catch (error) {
    console.error('GraphQL API Error:', error.response?.data || error.message);
  }
}

/**
 * gRPC API示例 - 通过HTTP调用gRPC服务
 */
async function grpcApiExample() {
  console.log('\n=== gRPC API Example ===');
  
  try {
    // gRPC服务调用示例（通过HTTP接口）
    const grpcRequest = {
      name: 'World',
      message: 'Hello from API Proxy'
    };

    const response = await axios.post(`${PROXY_BASE_URL}/api/v1/grpc/SayHello`, grpcRequest, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('gRPC Response:', response.data);
    
  } catch (error) {
    console.error('gRPC API Error:', error.response?.data || error.message);
  }
}

/**
 * 带认证的API调用示例
 */
async function authenticatedApiExample() {
  console.log('\n=== Authenticated API Example ===');
  
  try {
    // 首先获取JWT token（如果启用了认证）
    const loginResponse = await axios.post(`${PROXY_BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'testpass'
    });

    const token = loginResponse.data.token;
    console.log('Received JWT token');

    // 使用token访问受保护的API
    const protectedResponse = await axios.get(`${PROXY_BASE_URL}/api/v1/rest/protected`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Protected API Response:', protectedResponse.data);
    
  } catch (error) {
    console.error('Authentication Error:', error.response?.data || error.message);
  }
}

/**
 * 使用API Key认证
 */
async function apiKeyExample() {
  console.log('\n=== API Key Authentication Example ===');
  
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/api/v1/rest/1`, {
      headers: {
        'X-API-Key': 'your-api-key-here'
      }
    });

    console.log('API Key Response:', response.data);
    
  } catch (error) {
    console.error('API Key Error:', error.response?.data || error.message);
  }
}

/**
 * 批量请求示例
 */
async function batchRequestExample() {
  console.log('\n=== Batch Request Example ===');
  
  try {
    // 并发请求多个API
    const requests = [
      axios.get(`${PROXY_BASE_URL}/api/v1/rest/1`),
      axios.get(`${PROXY_BASE_URL}/api/v1/rest/2`),
      axios.get(`${PROXY_BASE_URL}/api/v1/rest/3`)
    ];

    const responses = await Promise.all(requests);
    
    responses.forEach((response, index) => {
      console.log(`Request ${index + 1} Response:`, response.data.title);
    });
    
  } catch (error) {
    console.error('Batch Request Error:', error.message);
  }
}

/**
 * 错误处理示例
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===');
  
  try {
    // 故意访问不存在的端点
    await axios.get(`${PROXY_BASE_URL}/api/v1/nonexistent`);
    
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.request);
    } else {
      console.log('Request setup error:', error.message);
    }
  }
}

/**
 * 文件上传示例
 */
async function fileUploadExample() {
  console.log('\n=== File Upload Example ===');
  
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    
    // 创建一个示例文件
    fs.writeFileSync('/tmp/example.txt', 'Hello, this is a test file!');
    
    const form = new FormData();
    form.append('file', fs.createReadStream('/tmp/example.txt'));
    form.append('description', 'Test file upload via proxy');

    const response = await axios.post(`${PROXY_BASE_URL}/api/v1/rest/upload`, form, {
      headers: {
        ...form.getHeaders()
      }
    });

    console.log('File Upload Response:', response.data);
    
    // 清理临时文件
    fs.unlinkSync('/tmp/example.txt');
    
  } catch (error) {
    console.error('File Upload Error:', error.response?.data || error.message);
  }
}

/**
 * 代理服务器状态检查
 */
async function healthCheckExample() {
  console.log('\n=== Health Check Example ===');
  
  try {
    // 基础健康检查
    const healthResponse = await axios.get(`${PROXY_BASE_URL}/health`);
    console.log('Health Status:', healthResponse.data.status);

    // 详细健康检查
    const detailedHealthResponse = await axios.get(`${PROXY_BASE_URL}/health/detailed`);
    console.log('Adapter Count:', detailedHealthResponse.data.adapters.stats.total);

    // 代理信息
    const infoResponse = await axios.get(`${PROXY_BASE_URL}/api/info`);
    console.log('Available Adapters:', infoResponse.data.data.adapters.length);
    
  } catch (error) {
    console.error('Health Check Error:', error.response?.data || error.message);
  }
}

/**
 * WebSocket代理示例 (如果支持)
 */
function websocketExample() {
  console.log('\n=== WebSocket Example ===');
  
  try {
    const WebSocket = require('ws');
    
    // 连接到WebSocket代理端点
    const ws = new WebSocket(`ws://localhost:3000/api/v1/websocket`);

    ws.on('open', function open() {
      console.log('WebSocket connected via proxy');
      
      // 发送消息
      ws.send(JSON.stringify({
        type: 'message',
        data: 'Hello WebSocket via proxy!'
      }));
    });

    ws.on('message', function message(data) {
      console.log('Received WebSocket message:', data.toString());
      ws.close();
    });

    ws.on('error', function error(err) {
      console.error('WebSocket error:', err.message);
    });
    
  } catch (error) {
    console.log('WebSocket not available or not configured');
  }
}

/**
 * 主函数 - 运行所有示例
 */
async function main() {
  console.log('API Proxy Client Examples');
  console.log('========================');
  
  // 检查代理服务器是否可用
  try {
    const response = await axios.get(`${PROXY_BASE_URL}/health`);
    if (response.data.status !== 'healthy') {
      console.error('Proxy server is not healthy');
      return;
    }
  } catch (error) {
    console.error('Cannot connect to proxy server. Please ensure it is running on', PROXY_BASE_URL);
    return;
  }

  // 运行示例
  await healthCheckExample();
  await httpApiExample();
  await graphqlApiExample();
  await grpcApiExample();
  await apiKeyExample();
  await batchRequestExample();
  await errorHandlingExample();
  
  // 可选示例（需要特定配置）
  // await authenticatedApiExample();
  // await fileUploadExample();
  // websocketExample();

  console.log('\n=== Examples completed ===');
}

// 如果作为主程序运行
if (require.main === module) {
  main().catch(console.error);
}

// 导出函数供其他模块使用
module.exports = {
  httpApiExample,
  graphqlApiExample,
  grpcApiExample,
  authenticatedApiExample,
  apiKeyExample,
  batchRequestExample,
  errorHandlingExample,
  fileUploadExample,
  healthCheckExample,
  websocketExample
};