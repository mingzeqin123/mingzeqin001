# 模块化任务管理系统

一个展示现代模块化开发最佳实践的任务管理系统，采用Node.js + Express构建，具有清晰的模块化架构和完善的功能。

## ✨ 特性

- 🏗️ **模块化架构** - 清晰的模块分离，易于维护和扩展
- 🔐 **JWT认证** - 安全的用户认证和授权机制
- 📝 **任务管理** - 完整的CRUD操作，支持状态管理和优先级
- 🛡️ **数据验证** - 完善的请求数据验证和错误处理
- 📊 **统计分析** - 任务统计和过期任务提醒
- 🔍 **搜索功能** - 支持任务标题和内容搜索
- 📖 **API文档** - 完整的RESTful API接口
- 🚀 **性能优化** - 内置缓存和优化机制

## 🏛️ 项目架构

```
src/
├── app.js              # 主应用入口
├── config/             # 配置管理
│   └── index.js
├── controllers/        # 控制器层
│   ├── AuthController.js
│   └── TaskController.js
├── data/               # 数据访问层
│   └── DataStore.js
├── middleware/         # 中间件
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── models/             # 数据模型
│   ├── Task.js
│   └── User.js
├── routes/             # 路由定义
│   ├── auth.js
│   ├── index.js
│   └── tasks.js
├── services/           # 业务逻辑层
│   ├── TaskService.js
│   └── UserService.js
└── utils/              # 工具函数
    ├── logger.js
    ├── response.js
    └── validation.js
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd modular-app
npm install
```

### 配置环境变量

复制环境变量示例文件并根据需要修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# API配置
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
```

### 启动应用

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

应用将在 http://localhost:3000 启动

## 📚 API文档

### 认证相关

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 | ❌ |
| POST | `/api/v1/auth/login` | 用户登录 | ❌ |
| GET | `/api/v1/auth/me` | 获取当前用户信息 | ✅ |
| PUT | `/api/v1/auth/me` | 更新用户信息 | ✅ |
| POST | `/api/v1/auth/change-password` | 修改密码 | ✅ |
| POST | `/api/v1/auth/refresh` | 刷新令牌 | ✅ |
| POST | `/api/v1/auth/logout` | 用户登出 | ✅ |

### 任务管理

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/v1/tasks` | 创建任务 | ✅ |
| GET | `/api/v1/tasks` | 获取任务列表 | ✅ |
| GET | `/api/v1/tasks/:id` | 获取任务详情 | ✅ |
| PUT | `/api/v1/tasks/:id` | 更新任务 | ✅ |
| DELETE | `/api/v1/tasks/:id` | 删除任务 | ✅ |
| PATCH | `/api/v1/tasks/:id/status` | 更新任务状态 | ✅ |
| PATCH | `/api/v1/tasks/:id/assign` | 分配任务 | ✅ |
| GET | `/api/v1/tasks/stats` | 获取任务统计 | ✅ |
| GET | `/api/v1/tasks/search` | 搜索任务 | ✅ |
| GET | `/api/v1/tasks/overdue` | 获取过期任务 | ✅ |
| PATCH | `/api/v1/tasks/batch/status` | 批量更新任务状态 | ✅ |

## 🔧 开发指南

### 添加新模块

1. **创建模型** - 在 `src/models/` 中定义数据结构
2. **实现服务** - 在 `src/services/` 中编写业务逻辑
3. **创建控制器** - 在 `src/controllers/` 中处理HTTP请求
4. **定义路由** - 在 `src/routes/` 中配置API端点
5. **注册路由** - 在 `src/routes/index.js` 中注册新路由

### 代码风格

- 使用ES6+语法和模块
- 采用异步/等待模式处理异步操作
- 遵循RESTful API设计原则
- 使用JSDoc注释文档化代码
- 保持单一职责原则

### 错误处理

- 使用统一的错误处理中间件
- 定义自定义错误类型
- 记录详细的错误日志
- 返回用户友好的错误信息

## 🧪 测试

```bash
# 运行测试
npm test

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 📦 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm start
```

## 🔒 安全性

- JWT令牌认证
- 密码加密存储
- 请求数据验证
- CORS配置
- 安全头部设置
- 输入数据清理

## 📈 性能优化

- 内存数据存储（可扩展为数据库）
- 请求日志记录
- 错误监控
- 优雅关闭处理

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

---

**模块化开发的核心优势：**

1. **可维护性** - 模块间职责清晰，便于维护
2. **可扩展性** - 易于添加新功能模块
3. **可测试性** - 模块独立，便于单元测试
4. **可重用性** - 模块可在不同项目中重用
5. **团队协作** - 不同开发者可并行开发不同模块