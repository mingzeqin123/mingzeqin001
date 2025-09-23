#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, expectedStatus = 200) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    console.log(`✅ ${endpoint}: ${response.status} - ${response.data?.status || 'OK'}`);
    return true;
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    const message = error.response?.data?.error || error.message;
    console.log(`❌ ${endpoint}: ${status} - ${message}`);
    return false;
  }
}

async function testServer() {
  console.log('🧪 测试API代理服务器');
  console.log('===================');
  
  const endpoints = [
    '/',
    '/health',
    '/health/detailed',
    '/health/ready',
    '/config',
    '/api/info',
    '/api/health'
  ];

  let passed = 0;
  let total = endpoints.length;

  for (const endpoint of endpoints) {
    if (await testEndpoint(endpoint)) {
      passed++;
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // 小延迟
  }

  console.log('\n📊 测试结果:');
  console.log(`✅ 通过: ${passed}/${total}`);
  console.log(`❌ 失败: ${total - passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️ 有些测试失败，请检查服务器配置。');
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('检查服务器状态...');
  
  if (await checkServer()) {
    console.log('✅ 服务器正在运行');
    await testServer();
  } else {
    console.log('❌ 服务器未运行或无法连接');
    console.log('请先启动服务器: npm start 或 ./scripts/start.sh');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testServer, checkServer };