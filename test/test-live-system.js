/**
 * 直播系统测试脚本
 * 用于测试直播系统的各项功能
 */

const axios = require('axios');
const WebSocket = require('ws');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3000',
  testUser: {
    username: 'testuser',
    password: 'testpass123',
    nickname: '测试用户',
    avatar: 'https://via.placeholder.com/100'
  }
};

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * 测试工具函数
 */
class TestUtils {
  static async request(method, url, data = {}) {
    try {
      const response = await axios({
        method,
        url: `${config.baseUrl}${url}`,
        data: method === 'GET' ? undefined : data,
        params: method === 'GET' ? data : undefined,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`请求失败: ${error.message}`);
    }
  }

  static async test(name, testFn) {
    testResults.total++;
    console.log(`\n🧪 测试: ${name}`);
    
    try {
      await testFn();
      console.log(`✅ 通过: ${name}`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ 失败: ${name} - ${error.message}`);
      testResults.failed++;
    }
  }

  static printSummary() {
    console.log('\n📊 测试结果汇总:');
    console.log(`总测试数: ${testResults.total}`);
    console.log(`通过: ${testResults.passed}`);
    console.log(`失败: ${testResults.failed}`);
    console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  }
}

/**
 * 认证测试
 */
class AuthTests {
  static async testUserRegistration() {
    await TestUtils.test('用户注册', async () => {
      const result = await TestUtils.request('POST', '/api/auth/register', {
        username: config.testUser.username,
        password: config.testUser.password,
        nickname: config.testUser.nickname,
        avatar: config.testUser.avatar
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!result.data.user || !result.data.token) {
        throw new Error('注册响应数据不完整');
      }
      
      // 保存token用于后续测试
      global.testToken = result.data.token;
      global.testUserId = result.data.user.id;
    });
  }

  static async testUserLogin() {
    await TestUtils.test('用户登录', async () => {
      const result = await TestUtils.request('POST', '/api/auth/login', {
        username: config.testUser.username,
        password: config.testUser.password
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!result.data.user || !result.data.token) {
        throw new Error('登录响应数据不完整');
      }
    });
  }

  static async testTokenVerification() {
    await TestUtils.test('Token验证', async () => {
      if (!global.testToken) {
        throw new Error('没有有效的token');
      }
      
      const result = await TestUtils.request('GET', '/api/auth/verify', {}, {
        headers: {
          'Authorization': `Bearer ${global.testToken}`
        }
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
    });
  }
}

/**
 * 直播功能测试
 */
class LiveTests {
  static async testCreateRoom() {
    await TestUtils.test('创建直播间', async () => {
      const result = await TestUtils.request('POST', '/api/live/create', {
        title: '测试直播间',
        cover: 'https://via.placeholder.com/400x300',
        hostId: global.testUserId,
        hostInfo: {
          nickname: config.testUser.nickname,
          avatar: config.testUser.avatar
        }
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!result.data.roomId) {
        throw new Error('创建直播间失败，未返回房间ID');
      }
      
      // 保存房间ID用于后续测试
      global.testRoomId = result.data.roomId;
    });
  }

  static async testGetRoomInfo() {
    await TestUtils.test('获取直播间信息', async () => {
      if (!global.testRoomId) {
        throw new Error('没有有效的房间ID');
      }
      
      const result = await TestUtils.request('GET', `/api/live/room/${global.testRoomId}`);
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!result.data.roomId) {
        throw new Error('获取直播间信息失败');
      }
    });
  }

  static async testGetPushUrl() {
    await TestUtils.test('获取推流地址', async () => {
      if (!global.testRoomId) {
        throw new Error('没有有效的房间ID');
      }
      
      const result = await TestUtils.request('POST', '/api/live/push-url', {
        roomId: global.testRoomId,
        title: '测试直播',
        cover: 'https://via.placeholder.com/400x300'
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!result.data.pushUrl || !result.data.streamUrl) {
        throw new Error('获取推流地址失败，地址不完整');
      }
    });
  }

  static async testStartLive() {
    await TestUtils.test('开始直播', async () => {
      if (!global.testRoomId) {
        throw new Error('没有有效的房间ID');
      }
      
      const result = await TestUtils.request('POST', '/api/live/start', {
        roomId: global.testRoomId,
        title: '测试直播',
        cover: 'https://via.placeholder.com/400x300'
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
    });
  }

  static async testStopLive() {
    await TestUtils.test('停止直播', async () => {
      if (!global.testRoomId) {
        throw new Error('没有有效的房间ID');
      }
      
      const result = await TestUtils.request('POST', '/api/live/stop', {
        roomId: global.testRoomId
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
    });
  }

  static async testGetLiveList() {
    await TestUtils.test('获取直播列表', async () => {
      const result = await TestUtils.request('GET', '/api/live/rooms', {
        page: 1,
        limit: 10
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!Array.isArray(result.data.rooms)) {
        throw new Error('直播列表数据格式错误');
      }
    });
  }
}

/**
 * 礼物功能测试
 */
class GiftTests {
  static async testGetGiftList() {
    await TestUtils.test('获取礼物列表', async () => {
      const result = await TestUtils.request('GET', '/api/gift/list');
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
      
      if (!Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('礼物列表为空或格式错误');
      }
    });
  }

  static async testSendGift() {
    await TestUtils.test('发送礼物', async () => {
      if (!global.testRoomId || !global.testUserId) {
        throw new Error('缺少必要的测试数据');
      }
      
      const result = await TestUtils.request('POST', '/api/gift/send', {
        roomId: global.testRoomId,
        giftId: 1,
        userId: global.testUserId,
        userInfo: {
          nickname: config.testUser.nickname,
          avatar: config.testUser.avatar
        }
      });
      
      if (result.code !== 0) {
        throw new Error(result.message);
      }
    });
  }
}

/**
 * WebSocket测试
 */
class WebSocketTests {
  static async testWebSocketConnection() {
    await TestUtils.test('WebSocket连接', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${config.wsUrl}/socket.io/?EIO=4&transport=websocket`);
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket连接超时'));
        }, 5000);
        
        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        });
        
        ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket连接失败: ${error.message}`));
        });
      });
    });
  }
}

/**
 * 健康检查测试
 */
class HealthTests {
  static async testHealthCheck() {
    await TestUtils.test('健康检查', async () => {
      const result = await TestUtils.request('GET', '/health');
      
      if (result.status !== 'ok') {
        throw new Error('健康检查失败');
      }
    });
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始直播系统测试...\n');
  
  // 健康检查
  await HealthTests.testHealthCheck();
  
  // 认证测试
  await AuthTests.testUserRegistration();
  await AuthTests.testUserLogin();
  await AuthTests.testTokenVerification();
  
  // 直播功能测试
  await LiveTests.testCreateRoom();
  await LiveTests.testGetRoomInfo();
  await LiveTests.testGetPushUrl();
  await LiveTests.testStartLive();
  await LiveTests.testStopLive();
  await LiveTests.testGetLiveList();
  
  // 礼物功能测试
  await GiftTests.testGetGiftList();
  await GiftTests.testSendGift();
  
  // WebSocket测试
  await WebSocketTests.testWebSocketConnection();
  
  // 打印测试结果
  TestUtils.printSummary();
}

/**
 * 清理测试数据
 */
async function cleanup() {
  console.log('\n🧹 清理测试数据...');
  
  try {
    if (global.testRoomId) {
      await TestUtils.request('DELETE', `/api/live/room/${global.testRoomId}`);
      console.log('✅ 测试直播间已删除');
    }
  } catch (error) {
    console.log('⚠️ 清理测试数据时出错:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await runAllTests();
  } catch (error) {
    console.error('❌ 测试运行失败:', error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  main();
}

module.exports = {
  TestUtils,
  AuthTests,
  LiveTests,
  GiftTests,
  WebSocketTests,
  HealthTests
};