# API代理服务器

一个通用的API代理服务器，支持HTTP/HTTPS、GraphQL、gRPC等多种API类型的统一访问接口。

## 🚀 特性

- **多协议支持**: HTTP/HTTPS RESTful API、GraphQL、gRPC
- **统一接口**: 通过统一的HTTP接口访问不同类型的API
- **灵活配置**: 支持动态配置和热重载
- **认证支持**: JWT Token、API Key、Bearer Token、Basic Auth
- **安全特性**: CORS、Helmet、速率限制
- **监控日志**: 详细的请求日志和监控指标
- **错误处理**: 优雅的错误处理和重试机制
- **健康检查**: 完整的健康检查和状态监控

## 📋 目录结构

```
api-proxy/
├── src/
│   ├── adapters/           # API适配器
│   │   ├── BaseAdapter.js
│   │   ├── HttpAdapter.js
│   │   ├── GraphQLAdapter.js
│   │   ├── GrpcAdapter.js
│   │   └── AdapterFactory.js
│   ├── middleware/         # 中间件
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── routes/            # 路由
│   │   ├── proxy.js
│   │   ├── health.js
│   │   └── config.js
│   ├── utils/             # 工具
│   │   └── logger.js
│   ├── app.js             # Express应用
│   └── index.js           # 入口文件
├── config/                # 配置文件
│   └── default.json
├── examples/              # 使用示例
│   ├── client-examples.js
│   ├── python-client.py
│   ├── example-configs.json
│   └── protos/
├── tests/                 # 测试文件
├── logs/                  # 日志文件
├── package.json
└── README.md
```

## 🛠️ 安装

### 1. 克隆项目

```bash
git clone <repository-url>
cd api-proxy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量
```

### 4. 配置API端点

编辑 `config/default.json` 文件，添加您的API端点配置：

```json
{
  "apis": {
    "endpoints": [
      {
        "name": "my-api",
        "type": "http",
        "baseUrl": "https://api.example.com",
        "path": "/api/v1/my-api/*",
        "target": "/v1/*",
        "methods": ["GET", "POST"],
        "auth": {
          "type": "bearer",
          "token": "your-token"
        }
      }
    ]
  }
}
```

### 5. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器默认运行在 `http://localhost:3000`

## 📖 使用指南

### HTTP API代理

```javascript
// 通过代理访问RESTful API
const response = await fetch('http://localhost:3000/api/v1/my-api/users/1');
const user = await response.json();
```

### GraphQL API代理

```javascript
// GraphQL查询
const query = `
  query {
    user(id: "1") {
      name
      email
    }
  }
`;

const response = await fetch('http://localhost:3000/api/v1/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
});
```

### gRPC API代理

```javascript
// 通过HTTP接口调用gRPC服务
const response = await fetch('http://localhost:3000/api/v1/grpc/SayHello', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'World' })
});
```

## 🔧 配置说明

### 服务器配置

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "timeout": 30000
  }
}
```

### 安全配置

```json
{
  "security": {
    "corsEnabled": true,
    "helmetEnabled": true,
    "rateLimitEnabled": true,
    "rateLimit": {
      "windowMs": 900000,
      "max": 100
    }
  }
}
```

### 认证配置

```json
{
  "auth": {
    "enableAuth": false,
    "jwtSecret": "your-jwt-secret",
    "jwtExpiration": "1h"
  }
}
```

### API端点配置

#### HTTP API

```json
{
  "name": "rest-api",
  "type": "http",
  "baseUrl": "https://api.example.com",
  "path": "/api/v1/rest/*",
  "target": "/v1/*",
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "auth": {
    "type": "bearer",
    "token": "your-token"
  },
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### GraphQL API

```json
{
  "name": "graphql-api",
  "type": "graphql",
  "baseUrl": "https://api.github.com/graphql",
  "path": "/api/v1/graphql",
  "auth": {
    "type": "bearer",
    "token": "your-github-token"
  }
}
```

#### gRPC API

```json
{
  "name": "grpc-api",
  "type": "grpc",
  "host": "localhost:50051",
  "path": "/api/v1/grpc/*",
  "protoPath": "./protos/example.proto",
  "serviceName": "ExampleService",
  "packageName": "example"
}
```

## 🔐 认证方式

### Bearer Token

```json
{
  "auth": {
    "type": "bearer",
    "token": "your-bearer-token"
  }
}
```

### API Key

```json
{
  "auth": {
    "type": "apikey",
    "key": "X-API-Key",
    "value": "your-api-key"
  }
}
```

### Basic Auth

```json
{
  "auth": {
    "type": "basic",
    "username": "your-username",
    "password": "your-password"
  }
}
```

## 🏥 健康检查

### 基础健康检查

```bash
curl http://localhost:3000/health
```

### 详细健康检查

```bash
curl http://localhost:3000/health/detailed
```

### 就绪检查

```bash
curl http://localhost:3000/health/ready
```

## 📊 监控和日志

### 查看代理信息

```bash
curl http://localhost:3000/api/info
```

### 查看适配器健康状态

```bash
curl http://localhost:3000/api/health
```

### 日志文件

- `logs/api-proxy.log` - 所有日志
- `logs/api-proxy-error.log` - 错误日志

## 🎯 API端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/health` | GET | 健康检查 |
| `/health/detailed` | GET | 详细健康检查 |
| `/health/ready` | GET | 就绪检查 |
| `/health/live` | GET | 存活检查 |
| `/config` | GET | 获取配置 |
| `/api/*` | ALL | API代理 |
| `/api/info` | GET | 适配器信息 |
| `/api/health` | GET | 适配器健康检查 |
| `/api/reload` | POST | 重载配置 |

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试示例
node examples/client-examples.js

# Python客户端示例
python3 examples/python-client.py
```

## 🚧 开发

### 添加新的适配器

1. 继承 `BaseAdapter` 类
2. 实现 `handleRequest` 方法
3. 在 `AdapterFactory` 中注册新适配器

```javascript
class CustomAdapter extends BaseAdapter {
  async handleRequest(req, res) {
    // 实现自定义逻辑
  }
}
```

### 添加新的认证方式

在 `middleware/auth.js` 中添加新的认证逻辑：

```javascript
case 'custom':
  // 实现自定义认证
  break;
```

## ⚡ 性能优化

- 启用gzip压缩
- 配置适当的超时时间
- 使用连接池
- 实现缓存策略
- 监控和限制并发请求

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **gRPC连接失败**
   - 检查proto文件路径
   - 确认gRPC服务运行状态
   - 验证服务名和包名

3. **认证失败**
   - 检查token有效性
   - 确认认证类型配置
   - 查看日志获取详细错误信息

4. **超时错误**
   - 调整timeout配置
   - 检查目标API响应时间
   - 增加重试次数

## 📝 日志级别

- `error` - 错误信息
- `warn` - 警告信息  
- `info` - 一般信息
- `debug` - 调试信息

设置日志级别：
```bash
export LOG_LEVEL=debug
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到任何问题或有疑问，请：

1. 查看文档和示例
2. 检查日志文件
3. 创建 Issue
4. 联系维护者

---

**快速开始**: 参考 `examples/` 目录中的示例代码，快速了解如何使用API代理服务器！