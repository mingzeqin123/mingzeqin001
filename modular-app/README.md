# 模块化开发程序示例

这是一个展示如何构建模块化、可维护、可扩展的Node.js应用程序的完整示例。

## 🚀 项目特性

- **模块化架构**: 清晰的模块分离，便于维护和扩展
- **服务导向**: 每个模块提供独立的服务功能
- **配置管理**: 集中化的配置管理系统
- **错误处理**: 完善的错误处理和日志记录
- **数据验证**: 强大的数据验证和清理功能
- **API封装**: 统一的HTTP请求封装
- **测试支持**: 完整的测试框架和示例

## 📁 项目结构

```
modular-app/
├── src/                          # 源代码目录
│   ├── modules/                  # 功能模块
│   │   ├── user/                # 用户管理模块
│   │   │   └── userService.js   # 用户服务
│   │   ├── data/                # 数据处理模块
│   │   │   └── dataService.js   # 数据服务
│   │   ├── utils/               # 工具模块
│   │   │   ├── logger.js        # 日志工具
│   │   │   └── validator.js     # 验证工具
│   │   └── api/                 # API模块
│   │       └── apiService.js    # API服务
│   ├── config/                  # 配置模块
│   │   └── index.js             # 配置管理
│   └── app.js                   # 主应用程序
├── tests/                       # 测试文件
├── examples/                    # 使用示例
├── docs/                        # 文档
├── package.json                 # 项目配置
└── README.md                    # 项目说明
```

## 🛠️ 安装和运行

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
cd modular-app
npm install
```

### 运行应用

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 代码质量

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

## 📚 模块说明

### 1. 用户管理模块 (UserService)

提供用户注册、登录、信息管理等功能。

**主要功能:**
- 用户注册和登录
- 密码加密和验证
- 用户信息管理
- 会话管理

**使用示例:**
```javascript
const userService = new UserService();

// 注册用户
const result = await userService.register({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123'
});

// 用户登录
const loginResult = await userService.login('john@example.com', 'password123');
```

### 2. 数据处理模块 (DataService)

提供数据存储、查询、分析等功能。

**主要功能:**
- 数据存储和检索
- 数据类型验证
- 数据查询和过滤
- 数据分析和统计

**使用示例:**
```javascript
const dataService = new DataService();

// 存储数据
await dataService.store('user:123', { name: 'John', age: 30 });

// 获取数据
const data = await dataService.get('user:123');

// 查询数据
const results = await dataService.query({ type: 'object' });
```

### 3. 日志工具模块 (Logger)

提供统一的日志记录功能。

**主要功能:**
- 多级别日志记录
- 日志格式化
- 日志过滤和查询
- 子日志器支持

**使用示例:**
```javascript
const logger = new Logger({ level: 'info' });

logger.info('应用启动', { port: 3000 });
logger.error('数据库连接失败', { error: 'Connection timeout' });

// 创建子日志器
const userLogger = logger.child('user-service');
userLogger.debug('用户验证完成');
```

### 4. 验证工具模块 (Validator)

提供数据验证和清理功能。

**主要功能:**
- 常用格式验证
- 自定义验证规则
- 数据清理和转换
- 模式验证

**使用示例:**
```javascript
const validator = new Validator();

// 验证邮箱
const isEmail = validator.isEmail('user@example.com');

// 验证密码强度
const passwordResult = validator.validatePassword('password123', {
    minLength: 8,
    requireUppercase: true
});

// 模式验证
const schema = {
    name: { type: 'string', required: true, minLength: 2 },
    age: { type: 'number', min: 0, max: 150 }
};
const result = validator.validateSchema({ name: 'John', age: 30 }, schema);
```

### 5. API服务模块 (ApiService)

提供HTTP请求封装和API管理功能。

**主要功能:**
- HTTP请求封装
- 请求/响应拦截器
- 错误处理
- 超时控制

**使用示例:**
```javascript
const apiService = new ApiService({ baseURL: 'https://api.example.com' });

// GET请求
const response = await apiService.get('/users');

// POST请求
const result = await apiService.post('/users', { name: 'John' });

// 添加拦截器
apiService.addRequestInterceptor((options, data) => {
    options.headers.Authorization = 'Bearer token';
    return { options, data };
});
```

## 🔧 配置管理

应用使用集中化的配置管理系统，支持环境变量和默认配置。

**配置文件:** `src/config/index.js`

**环境变量支持:**
- `NODE_ENV`: 运行环境 (development/production)
- `PORT`: 服务端口
- `LOG_LEVEL`: 日志级别
- `DB_HOST`: 数据库主机
- `JWT_SECRET`: JWT密钥

**使用示例:**
```javascript
const { getConfig, getEnvConfig } = require('./src/config');

// 获取配置
const appName = getConfig('app.name');
const port = getEnvConfig('app.port');
```

## 🧪 测试

项目包含完整的测试框架，支持单元测试和集成测试。

**测试文件位置:**
- `tests/` - 测试文件目录
- `src/**/*.test.js` - 模块测试文件

**运行测试:**
```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 📖 使用示例

查看 `examples/` 目录中的完整使用示例：

- `basic-usage.js` - 基础使用示例
- `advanced-features.js` - 高级功能示例
- `integration-example.js` - 集成示例

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址: [GitHub Repository](https://github.com/your-username/modular-app)
- 问题反馈: [Issues](https://github.com/your-username/modular-app/issues)
- 邮箱: your-email@example.com

---

**Happy Coding! 🎉**