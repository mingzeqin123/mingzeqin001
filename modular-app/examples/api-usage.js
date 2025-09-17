/**
 * API使用示例
 * 展示如何使用模块化任务管理系统的API
 */

// 基础配置
const API_BASE_URL = 'http://localhost:3000/api/v1';
let authToken = null;

/**
 * 发送HTTP请求的通用函数
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error(`API请求失败: ${endpoint}`, error.message);
    throw error;
  }
}

/**
 * 用户认证示例
 */
class AuthExample {
  // 用户注册
  static async register() {
    console.log('🔐 用户注册示例');
    
    try {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: '测试',
        lastName: '用户'
      };

      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      console.log('✅ 注册成功:', result.data.user);
      authToken = result.data.token;
      return result;
    } catch (error) {
      console.error('❌ 注册失败:', error.message);
    }
  }

  // 用户登录
  static async login() {
    console.log('🔐 用户登录示例');
    
    try {
      const loginData = {
        usernameOrEmail: 'testuser',
        password: 'password123'
      };

      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });

      console.log('✅ 登录成功:', result.data.user);
      authToken = result.data.token;
      return result;
    } catch (error) {
      console.error('❌ 登录失败:', error.message);
    }
  }

  // 获取当前用户信息
  static async getCurrentUser() {
    console.log('👤 获取当前用户信息');
    
    try {
      const result = await apiRequest('/auth/me');
      console.log('✅ 用户信息:', result.data);
      return result;
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error.message);
    }
  }
}

/**
 * 任务管理示例
 */
class TaskExample {
  // 创建任务
  static async createTask() {
    console.log('📝 创建任务示例');
    
    try {
      const taskData = {
        title: '完成项目文档',
        description: '编写完整的项目文档，包括API文档和用户手册',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后
        tags: ['文档', '项目', '重要']
      };

      const result = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      console.log('✅ 任务创建成功:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ 创建任务失败:', error.message);
    }
  }

  // 获取任务列表
  static async getTasks() {
    console.log('📋 获取任务列表示例');
    
    try {
      const result = await apiRequest('/tasks?page=1&limit=10&sortBy=createdAt&sortOrder=desc');
      console.log('✅ 任务列表:', result.data);
      console.log('📊 分页信息:', result.pagination);
      return result;
    } catch (error) {
      console.error('❌ 获取任务列表失败:', error.message);
    }
  }

  // 更新任务状态
  static async updateTaskStatus(taskId, status) {
    console.log(`🔄 更新任务状态: ${status}`);
    
    try {
      const result = await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      console.log('✅ 任务状态更新成功:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ 更新任务状态失败:', error.message);
    }
  }

  // 搜索任务
  static async searchTasks(query) {
    console.log(`🔍 搜索任务: "${query}"`);
    
    try {
      const result = await apiRequest(`/tasks/search?q=${encodeURIComponent(query)}&page=1&limit=10`);
      console.log('✅ 搜索结果:', result.data);
      return result;
    } catch (error) {
      console.error('❌ 搜索任务失败:', error.message);
    }
  }

  // 获取任务统计
  static async getTaskStats() {
    console.log('📊 获取任务统计信息');
    
    try {
      const result = await apiRequest('/tasks/stats');
      console.log('✅ 任务统计:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ 获取任务统计失败:', error.message);
    }
  }

  // 批量更新任务状态
  static async batchUpdateStatus(taskIds, status) {
    console.log(`🔄 批量更新任务状态: ${status}`);
    
    try {
      const result = await apiRequest('/tasks/batch/status', {
        method: 'PATCH',
        body: JSON.stringify({ taskIds, status })
      });

      console.log('✅ 批量更新成功:', result.data.summary);
      return result.data;
    } catch (error) {
      console.error('❌ 批量更新失败:', error.message);
    }
  }
}

/**
 * 完整的使用流程示例
 */
async function runCompleteExample() {
  console.log('🚀 开始完整的API使用示例\n');

  try {
    // 1. 用户注册
    await AuthExample.register();
    console.log('');

    // 2. 获取当前用户信息
    await AuthExample.getCurrentUser();
    console.log('');

    // 3. 创建几个任务
    const task1 = await TaskExample.createTask();
    console.log('');

    const task2 = await TaskExample.createTask();
    console.log('');

    // 4. 获取任务列表
    await TaskExample.getTasks();
    console.log('');

    // 5. 更新任务状态
    if (task1) {
      await TaskExample.updateTaskStatus(task1.id, 'in_progress');
      console.log('');
    }

    // 6. 搜索任务
    await TaskExample.searchTasks('项目');
    console.log('');

    // 7. 获取任务统计
    await TaskExample.getTaskStats();
    console.log('');

    // 8. 批量更新（如果有任务的话）
    if (task1 && task2) {
      await TaskExample.batchUpdateStatus([task1.id, task2.id], 'completed');
      console.log('');
    }

    console.log('🎉 完整示例执行完成!');

  } catch (error) {
    console.error('❌ 示例执行失败:', error.message);
  }
}

/**
 * 错误处理示例
 */
async function errorHandlingExample() {
  console.log('🚨 错误处理示例\n');

  // 1. 未认证访问
  console.log('测试未认证访问:');
  authToken = null;
  try {
    await apiRequest('/tasks');
  } catch (error) {
    console.log('预期的错误:', error.message);
  }
  console.log('');

  // 2. 无效数据
  console.log('测试无效数据:');
  await AuthExample.login(); // 重新登录获取token
  try {
    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '' }) // 空标题
    });
  } catch (error) {
    console.log('预期的错误:', error.message);
  }
  console.log('');

  // 3. 访问不存在的资源
  console.log('测试访问不存在的资源:');
  try {
    await apiRequest('/tasks/nonexistent-id');
  } catch (error) {
    console.log('预期的错误:', error.message);
  }
  console.log('');
}

// 导出示例函数
export {
  AuthExample,
  TaskExample,
  runCompleteExample,
  errorHandlingExample
};

// 如果直接运行此文件
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  // Node.js环境下运行示例
  console.log('请确保服务器已启动 (npm start)，然后在浏览器控制台中运行此示例');
  console.log('或者使用支持fetch的Node.js环境');
}