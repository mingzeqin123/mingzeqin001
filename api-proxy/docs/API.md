# API代理服务器 - API文档

## 概述

本文档描述了API代理服务器提供的所有HTTP端点和功能。

## 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **认证**: Bearer Token / API Key

## 端点列表

### 1. 根端点

#### GET /
获取服务器基本信息。

**响应**:
```json
{
  "name": "API Proxy Server",
  "version": "1.0.0",
  "description": "Universal API proxy supporting HTTP/HTTPS, GraphQL, gRPC and more",
  "endpoints": {
    "health": "/health",
    "config": "/config",
    "proxy": "/api/*"
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 2. 健康检查端点

#### GET /health
基础健康检查。

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

#### GET /health/detailed
详细健康检查，包含系统和适配器信息。

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "responseTime": "25ms",
  "system": {
    "pid": 12345,
    "memory": {
      "rss": 50331648,
      "heapTotal": 29360128,
      "heapUsed": 18874896,
      "external": 1089470
    },
    "uptime": 3600,
    "version": "v18.17.0",
    "platform": "linux",
    "arch": "x64"
  },
  "config": {
    "server": {
      "port": 3000,
      "host": "localhost",
      "timeout": 30000
    }
  },
  "adapters": {
    "health": {},
    "stats": {
      "total": 3,
      "byType": {
        "http": 2,
        "graphql": 1
      }
    }
  }
}
```

#### GET /health/ready
就绪检查，检查服务是否准备好处理请求。

**响应**:
```json
{
  "status": "ready",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "adapters": 3
}
```

#### GET /health/live
存活检查，检查服务是否仍在运行。

**响应**:
```json
{
  "status": "alive",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /health/metrics
获取性能指标。

**响应**:
```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "process": {
    "pid": 12345,
    "uptime": 3600,
    "memory": {},
    "cpu": {}
  },
  "adapters": {
    "total": 3,
    "byType": {
      "http": 2,
      "graphql": 1
    }
  }
}
```

### 3. 配置管理端点

#### GET /config
获取当前完整配置（敏感信息已隐藏）。

**响应**:
```json
{
  "success": true,
  "data": {
    "server": {
      "port": 3000,
      "host": "localhost",
      "timeout": 30000
    },
    "security": {
      "corsEnabled": true,
      "helmetEnabled": true,
      "rateLimitEnabled": true
    },
    "apis": {
      "endpoints": [
        {
          "name": "example-api",
          "type": "http",
          "baseUrl": "https://api.example.com",
          "path": "/api/v1/example/*"
        }
      ]
    }
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /config/{section}
获取特定配置部分。

**路径参数**:
- `section`: 配置部分名称 (server, security, logging, auth, apis)

**示例**: `GET /config/server`

**响应**:
```json
{
  "success": true,
  "section": "server",
  "data": {
    "port": 3000,
    "host": "localhost",
    "timeout": 30000,
    "bodyLimit": "10mb"
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /config/apis/endpoints
获取所有API端点配置。

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "name": "example-api",
      "type": "http",
      "baseUrl": "https://api.example.com",
      "path": "/api/v1/example/*",
      "target": "/v1/*",
      "methods": ["GET", "POST"]
    }
  ],
  "count": 1,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /config/apis/endpoints/{name}
获取特定端点配置。

**路径参数**:
- `name`: 端点名称

**响应**:
```json
{
  "success": true,
  "data": {
    "name": "example-api",
    "type": "http",
    "baseUrl": "https://api.example.com",
    "path": "/api/v1/example/*",
    "target": "/v1/*",
    "methods": ["GET", "POST"]
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### POST /config/validate
验证配置。

**请求体**:
```json
{
  "apis": {
    "endpoints": [
      {
        "name": "test-api",
        "type": "http",
        "baseUrl": "https://api.test.com",
        "path": "/api/test/*"
      }
    ]
  }
}
```

**响应**:
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /config/schema
获取配置架构。

**响应**:
```json
{
  "success": true,
  "data": {
    "server": {
      "port": {
        "type": "number",
        "description": "Server port",
        "default": 3000,
        "min": 1,
        "max": 65535
      }
    }
  }
}
```

### 4. 代理端点

#### GET /api/info
获取适配器信息和统计。

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 3,
    "byType": {
      "http": 2,
      "graphql": 1
    },
    "adapters": [
      {
        "name": "example-api",
        "type": "http",
        "baseUrl": "https://api.example.com",
        "path": "/api/v1/example/*",
        "initialized": true
      }
    ]
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### GET /api/health
适配器健康检查。

**响应**:
```json
{
  "success": true,
  "overall": "healthy",
  "adapters": {
    "example-api": {
      "status": "healthy"
    }
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### POST /api/reload
重新加载所有适配器配置。

**响应**:
```json
{
  "success": true,
  "message": "Adapters reloaded successfully",
  "results": [
    {
      "name": "example-api",
      "success": true
    }
  ],
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### POST /api/adapters
动态添加新的适配器。

**请求体**:
```json
{
  "name": "new-api",
  "type": "http",
  "baseUrl": "https://new-api.example.com",
  "path": "/api/v1/new/*",
  "methods": ["GET", "POST"]
}
```

**响应**:
```json
{
  "success": true,
  "message": "Adapter created successfully",
  "adapter": {
    "name": "new-api",
    "type": "http",
    "baseUrl": "https://new-api.example.com"
  },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

#### DELETE /api/adapters/{name}
删除适配器。

**路径参数**:
- `name`: 适配器名称

**响应**:
```json
{
  "success": true,
  "message": "Adapter example-api removed successfully",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 5. API代理端点

#### ALL /api/*
通用代理端点，支持所有HTTP方法。

根据请求路径自动匹配对应的适配器并转发请求。

**请求示例**:
```bash
# HTTP API
GET /api/v1/rest/users/1
POST /api/v1/rest/users
PUT /api/v1/rest/users/1
DELETE /api/v1/rest/users/1

# GraphQL API
POST /api/v1/graphql
GET /api/v1/graphql?query=...

# gRPC API
POST /api/v1/grpc/SayHello
```

**认证头**:
```http
Authorization: Bearer your-jwt-token
X-API-Key: your-api-key
```

### 6. GraphQL特殊端点

#### GET /api/*/introspect
GraphQL内省查询。

**示例**: `GET /api/v1/graphql/introspect`

**响应**:
```json
{
  "data": {
    "__schema": {
      "types": [...]
    }
  },
  "extensions": {
    "proxy": {
      "adapter": "github-graphql",
      "type": "GraphQL",
      "operationType": "introspection"
    }
  }
}
```

## 错误响应

所有端点在出错时都会返回统一格式的错误响应：

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 常见错误代码

- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证或认证失败
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源或端点不存在
- `429 Too Many Requests` - 超出速率限制
- `500 Internal Server Error` - 服务器内部错误
- `502 Bad Gateway` - 目标API错误
- `503 Service Unavailable` - 服务不可用
- `504 Gateway Timeout` - 目标API超时

## 认证

### Bearer Token

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key

```http
X-API-Key: your-secret-api-key
```

### 自定义头部

根据目标API要求，可能需要添加其他认证头部：

```http
Authorization: Token your-token
X-RapidAPI-Key: your-rapidapi-key
```

## 速率限制

默认速率限制：
- 时间窗口：15分钟
- 最大请求数：100

超出限制时返回 `429 Too Many Requests`。

## 请求/响应头

### 通用响应头

- `X-Proxy-By: API-Proxy` - 标识代理服务器
- `X-Target-API: adapter-name` - 目标适配器名称
- `X-API-Type: HTTP|GraphQL|gRPC` - API类型

### CORS头

服务器支持CORS，允许跨域请求：

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key`

## 示例代码

### JavaScript/Node.js

```javascript
// GET请求
const response = await fetch('http://localhost:3000/api/v1/rest/users/1');
const user = await response.json();

// POST请求
const newUser = await fetch('http://localhost:3000/api/v1/rest/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
```

### Python

```python
import requests

# GET请求
response = requests.get('http://localhost:3000/api/v1/rest/users/1')
user = response.json()

# POST请求
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
}
data = {'name': 'John', 'email': 'john@example.com'}
response = requests.post('http://localhost:3000/api/v1/rest/users', 
                        json=data, headers=headers)
```

### cURL

```bash
# GET请求
curl -H "Authorization: Bearer your-token" \
     http://localhost:3000/api/v1/rest/users/1

# POST请求
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your-token" \
     -d '{"name":"John","email":"john@example.com"}' \
     http://localhost:3000/api/v1/rest/users
```

## WebSocket支持

如果配置了WebSocket端点，可以通过以下方式连接：

```javascript
const ws = new WebSocket('ws://localhost:3000/api/v1/websocket');

ws.onopen = function() {
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = function(event) {
  console.log('Received:', JSON.parse(event.data));
};
```

## 流式响应

对于支持流式响应的API（如Server-Sent Events），代理服务器会保持连接并转发流式数据：

```javascript
const eventSource = new EventSource('http://localhost:3000/api/v1/events');
eventSource.onmessage = function(event) {
  console.log('Event:', event.data);
};
```

---

更多详细信息和示例，请参考 `examples/` 目录下的示例代码。