# 多租户后台管理系统

一个基于 Node.js + Express + MongoDB 的现代化多租户后台管理系统，支持完整的租户隔离、用户管理和权限控制。

## 🚀 特性

### 🏢 多租户架构
- **租户隔离**: 完整的数据隔离和权限隔离
- **灵活识别**: 支持子域名、路径参数、请求头等多种租户识别方式
- **订阅管理**: 支持不同订阅计划和资源限制
- **状态管理**: 租户激活、暂停、试用等状态控制

### 👥 用户管理
- **多角色系统**: 超级管理员、租户管理员、普通管理员、用户
- **权限控制**: 细粒度的权限管理和访问控制
- **用户资料**: 完整的用户信息和个人资料管理
- **状态管理**: 用户激活、禁用、暂停等状态控制

### 🔐 安全特性
- **JWT 认证**: 安全的 Token 认证机制
- **密码加密**: BCrypt 密码哈希加密
- **速率限制**: API 访问频率限制
- **CORS 保护**: 跨域请求安全控制
- **Helmet 安全**: HTTP 安全头保护

### 📊 管理功能
- **租户统计**: 用户数量、存储使用量等统计信息
- **使用报告**: 详细的租户使用情况报告
- **批量操作**: 支持批量用户管理操作
- **搜索过滤**: 强大的搜索和过滤功能

## 📁 项目结构

```
admin-backend/
├── controllers/          # 控制器
│   ├── authController.js  # 认证控制器
│   ├── tenantController.js # 租户控制器
│   └── userController.js   # 用户控制器
├── middleware/           # 中间件
│   ├── auth.js          # 认证中间件
│   └── tenant.js        # 租户中间件
├── models/              # 数据模型
│   ├── Tenant.js        # 租户模型
│   └── User.js          # 用户模型
├── routes/              # 路由
│   ├── auth.js          # 认证路由
│   ├── tenants.js       # 租户路由
│   └── users.js         # 用户路由
├── scripts/             # 脚本
│   ├── migrate.js       # 数据迁移脚本
│   └── seed.js          # 数据初始化脚本
├── utils/               # 工具函数
│   ├── catchAsync.js    # 异步错误处理
│   └── errors.js        # 错误处理
├── validators/          # 数据验证
│   ├── tenantValidator.js # 租户验证
│   └── userValidator.js   # 用户验证
├── .env.example         # 环境变量示例
├── package.json         # 项目配置
└── server.js           # 主服务器文件
```

## 🛠️ 安装和运行

### 环境要求
- Node.js 16+ 
- MongoDB 4.4+
- npm 或 yarn

### 安装步骤

1. **安装依赖**
   ```bash
   cd admin-backend
   npm install
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接和其他参数
   ```

3. **数据库初始化**
   ```bash
   # 运行迁移脚本创建索引
   npm run migrate
   
   # 初始化示例数据
   npm run seed
   ```

4. **启动服务**
   ```bash
   # 开发模式
   npm run dev
   
   # 生产模式
   npm start
   ```

5. **访问服务**
   - API 文档: http://localhost:3000/api
   - 健康检查: http://localhost:3000/health

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `MONGODB_URI` | MongoDB 连接字符串 | mongodb://localhost:27017/multi_tenant_admin |
| `JWT_SECRET` | JWT 密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 24h |
| `SUPER_ADMIN_EMAIL` | 超级管理员邮箱 | admin@example.com |
| `SUPER_ADMIN_PASSWORD` | 超级管理员密码 | admin123456 |

### 租户识别方式

系统支持多种租户识别方式，按优先级排序：

1. **子域名识别**: `tenant.example.com`
2. **路径参数**: `/api/tenants/:tenantSlug/users`
3. **请求头**: `X-Tenant-ID: tenant-slug`
4. **查询参数**: `?tenant=tenant-slug`

## 📖 API 文档

### 认证接口

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company-a.com",
  "password": "admin123456",
  "tenantSlug": "company-a"  // 可选，超级管理员不需要
}
```

#### 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 租户管理接口

#### 获取所有租户（超级管理员）
```http
GET /api/tenants/super-admin
Authorization: Bearer <token>
```

#### 创建租户（超级管理员）
```http
POST /api/tenants/super-admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "新租户",
  "slug": "new-tenant",
  "contact": {
    "email": "admin@new-tenant.com"
  },
  "adminUser": {
    "username": "admin",
    "email": "admin@new-tenant.com",
    "password": "password123"
  }
}
```

#### 获取当前租户信息
```http
GET /api/tenants/company-a/current
Authorization: Bearer <token>
```

### 用户管理接口

#### 获取用户列表
```http
GET /api/users/company-a
Authorization: Bearer <token>
```

#### 创建用户
```http
POST /api/users/company-a
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@company-a.com",
  "password": "password123",
  "role": "user"
}
```

## 🏗️ 多租户架构设计

### 数据隔离策略

系统采用**共享数据库，共享表结构**的多租户架构：

1. **租户标识**: 每个业务数据都包含 `tenantId` 字段
2. **查询过滤**: 所有查询自动添加租户过滤条件
3. **索引优化**: 复合索引确保查询性能
4. **权限隔离**: 中间件层面强制租户隔离

### 权限系统

```
super_admin     # 超级管理员 - 全局权限
├── tenant_admin    # 租户管理员 - 租户内全权限
├── admin          # 普通管理员 - 有限管理权限
└── user           # 普通用户 - 基础权限
```

### 订阅计划

| 计划 | 用户数量 | 存储空间 | 功能特性 |
|------|----------|----------|----------|
| Free | 5 | 1GB | 基础功能 |
| Basic | 20 | 5GB | 用户管理 |
| Premium | 100 | 20GB | 高级功能 |
| Enterprise | 无限 | 无限 | 全部功能 |

## 🧪 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

## 🚀 部署

### Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "multi-tenant-admin"

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

## 🔍 监控和日志

系统内置了详细的日志记录：

- **租户上下文日志**: 记录每个请求的租户信息
- **错误日志**: 详细的错误堆栈和上下文
- **性能监控**: 请求响应时间和数据库查询统计
- **安全日志**: 登录尝试和权限检查记录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 提交 GitHub Issue
- 邮箱: support@example.com

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！