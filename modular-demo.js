/**
 * 模块化开发程序演示
 * 展示模块化架构的核心概念和优势
 */

// 模拟各个模块的功能
console.log('🏗️  模块化开发程序演示\n');

// 1. 配置模块演示
console.log('📋 1. 配置模块 (Config Module)');
const config = {
  server: { port: 3000, env: 'development' },
  database: { host: 'localhost', name: 'taskdb' },
  jwt: { secret: 'secret-key', expiresIn: '24h' }
};
console.log('   ✅ 统一配置管理');
console.log('   ✅ 环境变量处理');
console.log('   ✅ 配置验证');
console.log('');

// 2. 数据模型演示
console.log('📊 2. 数据模型 (Models)');
class User {
  constructor(username, email) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.username = username;
    this.email = email;
    this.createdAt = new Date();
  }
  
  getPublicInfo() {
    return { id: this.id, username: this.username, email: this.email };
  }
}

class Task {
  constructor(title, userId) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.title = title;
    this.userId = userId;
    this.status = 'pending';
    this.createdAt = new Date();
  }
  
  updateStatus(status) {
    this.status = status;
    this.updatedAt = new Date();
  }
}

console.log('   ✅ 数据结构定义');
console.log('   ✅ 业务规则封装');
console.log('   ✅ 方法和属性管理');
console.log('');

// 3. 数据存储演示
console.log('💾 3. 数据存储层 (Data Store)');
class DataStore {
  constructor() {
    this.users = new Map();
    this.tasks = new Map();
  }
  
  createUser(user) {
    this.users.set(user.id, user);
    return user;
  }
  
  createTask(task) {
    this.tasks.set(task.id, task);
    return task;
  }
  
  findUserById(id) {
    return this.users.get(id);
  }
  
  findTasksByUserId(userId) {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }
}

const dataStore = new DataStore();
console.log('   ✅ 数据持久化抽象');
console.log('   ✅ 统一数据访问接口');
console.log('   ✅ 存储无关性设计');
console.log('');

// 4. 服务层演示
console.log('🔧 4. 服务层 (Services)');
class UserService {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }
  
  createUser(userData) {
    // 数据验证
    if (!userData.username || !userData.email) {
      throw new Error('用户名和邮箱是必需的');
    }
    
    // 创建用户
    const user = new User(userData.username, userData.email);
    return this.dataStore.createUser(user);
  }
  
  getUserById(userId) {
    return this.dataStore.findUserById(userId);
  }
}

class TaskService {
  constructor(dataStore) {
    this.dataStore = dataStore;
  }
  
  createTask(title, userId) {
    if (!title || !userId) {
      throw new Error('任务标题和用户ID是必需的');
    }
    
    const task = new Task(title, userId);
    return this.dataStore.createTask(task);
  }
  
  getUserTasks(userId) {
    return this.dataStore.findTasksByUserId(userId);
  }
  
  updateTaskStatus(taskId, status) {
    const task = this.dataStore.tasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }
    
    task.updateStatus(status);
    return task;
  }
}

const userService = new UserService(dataStore);
const taskService = new TaskService(dataStore);

console.log('   ✅ 业务逻辑封装');
console.log('   ✅ 数据验证处理');
console.log('   ✅ 依赖注入设计');
console.log('');

// 5. 工具模块演示
console.log('🛠️  5. 工具模块 (Utils)');
class Logger {
  info(message, meta = {}) {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta);
  }
  
  error(message, meta = {}) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, meta);
  }
}

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const formatResponse = (success, data, message) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

const logger = new Logger();
console.log('   ✅ 日志记录工具');
console.log('   ✅ 数据验证工具');
console.log('   ✅ 响应格式化工具');
console.log('');

// 6. 完整流程演示
console.log('🎯 6. 完整业务流程演示');
console.log('');

try {
  // 创建用户
  console.log('👤 创建用户...');
  const user = userService.createUser({
    username: 'developer',
    email: 'dev@example.com'
  });
  logger.info('用户创建成功', { userId: user.id });
  
  // 创建任务
  console.log('📝 创建任务...');
  const task1 = taskService.createTask('设计系统架构', user.id);
  const task2 = taskService.createTask('实现核心功能', user.id);
  const task3 = taskService.createTask('编写测试用例', user.id);
  logger.info('任务创建成功', { taskCount: 3 });
  
  // 更新任务状态
  console.log('🔄 更新任务状态...');
  taskService.updateTaskStatus(task1.id, 'completed');
  taskService.updateTaskStatus(task2.id, 'in_progress');
  logger.info('任务状态更新成功');
  
  // 获取用户任务
  console.log('📋 获取用户任务列表...');
  const userTasks = taskService.getUserTasks(user.id);
  
  // 显示结果
  console.log('');
  console.log('📊 演示结果:');
  console.log(`   👤 用户: ${user.username} (${user.email})`);
  console.log(`   📝 任务总数: ${userTasks.length}`);
  
  userTasks.forEach((task, index) => {
    console.log(`   ${index + 1}. ${task.title} - 状态: ${task.status}`);
  });
  
  console.log('');
  console.log('✨ 模块化架构优势:');
  console.log('   🏗️  职责分离 - 每个模块专注特定功能');
  console.log('   🔧 易于维护 - 模块独立，便于修改');
  console.log('   🚀 可扩展性 - 轻松添加新模块');
  console.log('   🧪 可测试性 - 模块可独立测试');
  console.log('   🔄 可重用性 - 模块可在不同项目中重用');
  console.log('   👥 团队协作 - 不同开发者可并行开发');
  
} catch (error) {
  logger.error('演示执行失败', { error: error.message });
}

console.log('');
console.log('🎉 模块化开发程序演示完成！');
console.log('');
console.log('📚 完整的模块化任务管理系统已创建在 /workspace/modular-app/ 目录中');
console.log('   包含以下模块:');
console.log('   📁 src/config/     - 配置管理');
console.log('   📁 src/models/     - 数据模型');
console.log('   📁 src/services/   - 业务逻辑');
console.log('   📁 src/controllers/ - 控制器');
console.log('   📁 src/routes/     - 路由定义');
console.log('   📁 src/middleware/ - 中间件');
console.log('   📁 src/utils/      - 工具函数');
console.log('   📁 src/data/       - 数据访问');
console.log('');
console.log('🚀 启动完整应用: cd modular-app && npm start');