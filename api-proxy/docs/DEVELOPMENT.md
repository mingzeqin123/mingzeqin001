# 开发指南

本文档为API代理服务器的开发人员提供详细的开发指南和贡献指南。

## 🛠️ 开发环境设置

### 环境要求

- **Node.js**: 16.0.0 或更高版本
- **npm**: 7.0.0 或更高版本
- **Git**: 最新版本
- **IDE**: VS Code (推荐) 或其他支持JavaScript/Node.js的IDE

### 本地开发设置

```bash
# 1. 克隆项目
git clone <repository-url>
cd api-proxy

# 2. 安装依赖
npm install

# 3. 复制环境变量文件
cp .env.example .env

# 4. 编辑环境变量
nano .env

# 5. 创建日志目录
mkdir -p logs

# 6. 启动开发服务器
npm run dev
```

### 开发依赖说明

```json
{
  "devDependencies": {
    "nodemon": "自动重启开发服务器",
    "jest": "单元测试框架",
    "supertest": "HTTP断言库",
    "eslint": "代码检查工具"
  }
}
```

### VS Code推荐扩展

在 `.vscode/extensions.json` 中配置：

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### VS Code设置

在 `.vscode/settings.json` 中配置：

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "javascript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "node_modules": true,
    "logs": true,
    "*.log": true
  }
}
```

## 📁 项目结构详解

```
api-proxy/
├── src/                    # 源代码目录
│   ├── adapters/          # API适配器
│   │   ├── BaseAdapter.js     # 基础适配器类
│   │   ├── HttpAdapter.js     # HTTP/REST适配器
│   │   ├── GraphQLAdapter.js  # GraphQL适配器
│   │   ├── GrpcAdapter.js     # gRPC适配器
│   │   └── AdapterFactory.js  # 适配器工厂
│   ├── middleware/        # Express中间件
│   │   ├── auth.js           # 认证中间件
│   │   ├── errorHandler.js   # 错误处理
│   │   └── requestLogger.js  # 请求日志
│   ├── routes/           # 路由定义
│   │   ├── proxy.js         # 代理路由
│   │   ├── health.js        # 健康检查路由
│   │   └── config.js        # 配置管理路由
│   ├── utils/            # 工具函数
│   │   └── logger.js        # 日志工具
│   ├── app.js            # Express应用设置
│   └── index.js          # 应用入口点
├── config/               # 配置文件
│   └── default.json         # 默认配置
├── examples/             # 示例代码
├── tests/                # 测试文件
├── docs/                 # 文档
├── logs/                 # 日志文件 (运行时创建)
└── package.json          # 项目配置
```

## 🏗️ 架构设计

### 核心组件

1. **适配器模式**
   - `BaseAdapter`: 所有适配器的基类
   - 具体适配器: `HttpAdapter`, `GraphQLAdapter`, `GrpcAdapter`
   - `AdapterFactory`: 创建和管理适配器实例

2. **中间件系统**
   - 认证中间件: 处理JWT、API Key等认证
   - 日志中间件: 记录请求和响应
   - 错误处理: 统一错误处理和响应格式

3. **路由系统**
   - 代理路由: 处理API转发
   - 管理路由: 健康检查、配置管理
   - 动态路由: 支持路径匹配和参数提取

### 数据流

```
Client Request
      ↓
   Express App
      ↓
   Middleware
   (Auth, Logger)
      ↓
  Router Handler
      ↓
  Adapter Factory
      ↓
  Specific Adapter
      ↓
  Target API
      ↓
   Response
      ↓
    Client
```

## 🔧 开发指南

### 添加新的适配器

1. **创建适配器类**

```javascript
// src/adapters/MyCustomAdapter.js
const BaseAdapter = require('./BaseAdapter');

class MyCustomAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    // 初始化特定逻辑
  }

  async handleRequest(req, res) {
    try {
      // 实现请求处理逻辑
      const response = await this.makeCustomRequest(req);
      return res.json(response);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  async makeCustomRequest(req) {
    // 具体的API调用逻辑
  }

  validateRequest(req) {
    super.validateRequest(req);
    // 添加特定验证
    return true;
  }
}

module.exports = MyCustomAdapter;
```

2. **注册适配器**

在 `AdapterFactory.js` 中添加：

```javascript
const MyCustomAdapter = require('./MyCustomAdapter');

// 在 createAdapter 方法中添加
case 'mycustom':
  adapter = new MyCustomAdapter(config);
  break;
```

3. **添加配置验证**

在 `validateConfig` 方法中添加验证逻辑。

### 添加新的认证方式

在 `middleware/auth.js` 中添加：

```javascript
// 在 authMiddleware 函数中添加新的认证类型
case 'oauth2':
  // OAuth2认证逻辑
  token = await validateOAuth2Token(req.header('Authorization'));
  if (!token) {
    return res.status(401).json({ error: 'Invalid OAuth2 token' });
  }
  req.user = token.user;
  break;
```

### 添加新的中间件

1. **创建中间件文件**

```javascript
// src/middleware/customMiddleware.js
const logger = require('../utils/logger');

const customMiddleware = (options = {}) => {
  return (req, res, next) => {
    // 中间件逻辑
    logger.info('Custom middleware executed');
    next();
  };
};

module.exports = customMiddleware;
```

2. **在app.js中使用**

```javascript
const customMiddleware = require('./middleware/customMiddleware');
app.use(customMiddleware());
```

### 添加新的路由

1. **创建路由文件**

```javascript
// src/routes/myroute.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'My custom route' });
});

module.exports = router;
```

2. **在app.js中注册路由**

```javascript
const myRoute = require('./routes/myroute');
app.use('/myroute', myRoute);
```

### 配置管理

1. **添加新的配置项**

在 `config/default.json` 中添加：

```json
{
  "myFeature": {
    "enabled": true,
    "options": {
      "timeout": 5000
    }
  }
}
```

2. **在代码中使用配置**

```javascript
const config = require('config');

const myFeatureEnabled = config.get('myFeature.enabled');
const timeout = config.get('myFeature.options.timeout');
```

## 🧪 测试

### 单元测试

创建测试文件 `tests/adapters/HttpAdapter.test.js`：

```javascript
const HttpAdapter = require('../../src/adapters/HttpAdapter');
const request = require('supertest');

describe('HttpAdapter', () => {
  let adapter;

  beforeEach(() => {
    const config = {
      name: 'test-adapter',
      type: 'http',
      baseUrl: 'https://jsonplaceholder.typicode.com',
      path: '/api/test/*',
      target: '/posts/*'
    };
    adapter = new HttpAdapter(config);
  });

  test('should create adapter instance', () => {
    expect(adapter).toBeInstanceOf(HttpAdapter);
    expect(adapter.name).toBe('test-adapter');
  });

  test('should validate request', () => {
    const mockReq = { method: 'GET' };
    expect(adapter.validateRequest(mockReq)).toBe(true);
  });

  // 更多测试...
});
```

### 集成测试

创建 `tests/integration/api.test.js`：

```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('API Integration Tests', () => {
  test('GET /health should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
  });

  test('GET /api/info should return adapter information', async () => {
    const response = await request(app)
      .get('/api/info')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('total');
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- --testPathPattern=HttpAdapter

# 运行测试并查看覆盖率
npm test -- --coverage

# 监视模式
npm test -- --watch
```

## 📋 代码规范

### ESLint配置

创建 `.eslintrc.js`：

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': 'warn'
  }
};
```

### Prettier配置

创建 `.prettierrc`：

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 提交规范

使用 Conventional Commits 规范：

```bash
# 功能
git commit -m "feat: add GraphQL introspection support"

# 修复
git commit -m "fix: resolve gRPC connection timeout issue"

# 文档
git commit -m "docs: update API documentation"

# 样式
git commit -m "style: fix code formatting"

# 重构
git commit -m "refactor: simplify adapter factory logic"

# 测试
git commit -m "test: add unit tests for HttpAdapter"
```

## 🐛 调试

### 本地调试

1. **使用VS Code调试**

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Proxy",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.js",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["--inspect"]
    }
  ]
}
```

2. **使用Node.js调试器**

```bash
node --inspect-brk src/index.js
```

然后在Chrome中打开 `chrome://inspect`

### 日志调试

```javascript
const logger = require('./utils/logger');

// 不同级别的日志
logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');

// 结构化日志
logger.info('Request processed', {
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  responseTime: '150ms'
});
```

### 性能分析

```bash
# 使用clinic.js进行性能分析
npm install -g clinic
clinic doctor -- node src/index.js
```

## 📦 构建和发布

### 构建Docker镜像

```bash
# 构建
docker build -t api-proxy:latest .

# 多架构构建
docker buildx build --platform linux/amd64,linux/arm64 -t api-proxy:latest .
```

### 发布到npm

```bash
# 更新版本
npm version patch|minor|major

# 发布
npm publish
```

### 创建Release

```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
```

## 🤝 贡献指南

### 贡献流程

1. **Fork项目**
2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交更改**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **创建Pull Request**

### Pull Request要求

- 包含清晰的描述和测试用例
- 通过所有CI检查
- 遵循代码规范
- 更新相关文档

### 代码审查

所有Pull Request都需要至少一个维护者的审查：

- 代码质量和风格
- 测试覆盖率
- 性能影响
- 安全考虑
- 向后兼容性

## 🔧 开发工具

### 推荐的工具

1. **代码质量**
   - ESLint: 代码检查
   - Prettier: 代码格式化
   - Husky: Git钩子

2. **测试工具**
   - Jest: 测试框架
   - Supertest: API测试
   - Istanbul: 覆盖率报告

3. **开发辅助**
   - Nodemon: 自动重启
   - Debug: 调试工具
   - Postman: API测试

### Git钩子设置

```bash
# 安装husky
npm install --save-dev husky

# 初始化
npx husky install

# 添加pre-commit钩子
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## 📚 学习资源

### 相关技术文档

- [Express.js官方文档](https://expressjs.com/)
- [Node.js官方文档](https://nodejs.org/docs/)
- [GraphQL规范](https://graphql.org/learn/)
- [gRPC文档](https://grpc.io/docs/)

### 最佳实践

- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [RESTful API设计指南](https://restfulapi.net/)
- [GraphQL最佳实践](https://graphql.org/learn/best-practices/)

---

欢迎贡献代码、报告问题或提出改进建议！请遵循本指南以确保代码质量和项目的一致性。