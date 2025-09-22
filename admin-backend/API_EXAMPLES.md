# API 使用示例

本文档提供了多租户后台管理系统的详细 API 使用示例。

## 🔐 认证流程

### 1. 超级管理员登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

响应:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "...",
      "username": "superadmin",
      "email": "admin@example.com",
      "role": "super_admin",
      "status": "active"
    }
  }
}
```

### 2. 租户用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company-a.com",
    "password": "admin123456",
    "tenantSlug": "company-a"
  }'
```

## 🏢 租户管理

### 1. 创建新租户（超级管理员）

```bash
curl -X POST http://localhost:3000/api/tenants/super-admin \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新科技公司",
    "slug": "new-tech-company",
    "domain": "newtech.example.com",
    "contact": {
      "email": "admin@newtech.com",
      "phone": "13800138000",
      "address": "北京市海淀区中关村大街1号"
    },
    "subscription": {
      "plan": "premium",
      "maxUsers": 50,
      "maxStorage": 5120
    },
    "settings": {
      "theme": "blue",
      "language": "zh-CN",
      "features": ["user_management", "reporting", "api_access"]
    },
    "adminUser": {
      "username": "admin",
      "email": "admin@newtech.com",
      "password": "secure123456"
    }
  }'
```

### 2. 获取所有租户列表

```bash
curl -X GET "http://localhost:3000/api/tenants/super-admin?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 更新租户状态

```bash
curl -X PATCH http://localhost:3000/api/tenants/super-admin/TENANT_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended"
  }'
```

### 4. 获取租户使用报告

```bash
curl -X GET http://localhost:3000/api/tenants/super-admin/TENANT_ID/usage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

响应示例:
```json
{
  "success": true,
  "data": {
    "tenant": {
      "name": "示例公司A",
      "slug": "company-a",
      "status": "active",
      "plan": "premium"
    },
    "usage": {
      "users": {
        "current": 25,
        "limit": 50,
        "percentage": 50
      },
      "storage": {
        "current": 2048,
        "limit": 5120,
        "percentage": 40
      }
    },
    "subscription": {
      "plan": "premium",
      "daysRemaining": 335,
      "isExpired": false
    }
  }
}
```

## 👥 用户管理

### 1. 创建用户（租户管理员）

```bash
curl -X POST http://localhost:3000/api/users/company-a \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@company-a.com",
    "password": "password123",
    "role": "user",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "department": "销售部",
      "position": "销售经理",
      "phone": "13900139001"
    },
    "permissions": ["user.read", "report.read"]
  }'
```

### 2. 获取用户列表

```bash
# 获取当前租户的用户列表
curl -X GET "http://localhost:3000/api/users/company-a?page=1&limit=20&role=user&status=active&search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 更新用户信息

```bash
curl -X PUT http://localhost:3000/api/users/company-a/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "firstName": "John Updated",
      "department": "市场部",
      "position": "市场总监"
    },
    "permissions": ["user.read", "user.create", "report.read"]
  }'
```

### 4. 批量更新用户状态

```bash
curl -X PATCH http://localhost:3000/api/users/company-a/USER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended"
  }'
```

### 5. 获取用户统计信息

```bash
curl -X GET http://localhost:3000/api/users/company-a/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 高级查询示例

### 1. 多条件筛选租户

```bash
curl -X GET "http://localhost:3000/api/tenants/super-admin?status=active&plan=premium&search=科技&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 复杂用户搜索

```bash
curl -X GET "http://localhost:3000/api/users/company-a?role=admin&status=active&search=张&department=技术部" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🌐 多租户访问方式

### 1. 子域名访问

```bash
# 通过子域名识别租户
curl -X GET http://company-a.localhost:3000/api/tenants/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 请求头方式

```bash
# 通过请求头识别租户
curl -X GET http://localhost:3000/api/tenants/current \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: company-a"
```

### 3. 查询参数方式

```bash
# 通过查询参数识别租户
curl -X GET "http://localhost:3000/api/tenants/current?tenant=company-a" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 系统监控接口

### 1. 健康检查

```bash
curl -X GET http://localhost:3000/health
```

响应:
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. API 信息

```bash
curl -X GET http://localhost:3000/api
```

## 🔧 错误处理示例

### 1. 认证失败

```json
{
  "success": false,
  "message": "请先登录"
}
```

### 2. 权限不足

```json
{
  "success": false,
  "message": "权限不足"
}
```

### 3. 租户不存在

```json
{
  "success": false,
  "message": "租户不存在"
}
```

### 4. 验证错误

```json
{
  "success": false,
  "message": "邮箱是必填项"
}
```

### 5. 资源限制

```json
{
  "success": false,
  "message": "已达到用户数量限制"
}
```

## 🚀 批量操作示例

### 1. 批量创建用户

```bash
# 注意：这需要在应用层实现批量接口
curl -X POST http://localhost:3000/api/users/company-a/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {
        "username": "user1",
        "email": "user1@company-a.com",
        "password": "password123",
        "role": "user"
      },
      {
        "username": "user2", 
        "email": "user2@company-a.com",
        "password": "password123",
        "role": "user"
      }
    ]
  }'
```

## 📱 前端集成示例

### JavaScript/Axios 示例

```javascript
// API 客户端配置
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 添加租户标识
  const tenantSlug = localStorage.getItem('tenantSlug');
  if (tenantSlug) {
    config.headers['X-Tenant-ID'] = tenantSlug;
  }
  
  return config;
});

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除令牌并跳转到登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 登录函数
async function login(email, password, tenantSlug = null) {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      tenantSlug
    });
    
    const { token, data } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    if (tenantSlug) {
      localStorage.setItem('tenantSlug', tenantSlug);
    }
    
    return data.user;
  } catch (error) {
    throw error.response?.data?.message || '登录失败';
  }
}

// 获取用户列表
async function getUsers(page = 1, limit = 10, filters = {}) {
  try {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters
    });
    
    const tenantSlug = localStorage.getItem('tenantSlug');
    const url = tenantSlug ? `/users/${tenantSlug}` : '/users';
    
    const response = await apiClient.get(`${url}?${params}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || '获取用户列表失败';
  }
}
```

## 🧪 测试用例示例

### Jest 测试示例

```javascript
const request = require('supertest');
const app = require('../server');

describe('租户管理 API', () => {
  let superAdminToken;
  let tenantId;
  
  beforeAll(async () => {
    // 登录获取超级管理员令牌
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123456'
      });
    
    superAdminToken = response.body.token;
  });
  
  test('创建租户', async () => {
    const response = await request(app)
      .post('/api/tenants/super-admin')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '测试租户',
        slug: 'test-tenant',
        contact: {
          email: 'admin@test-tenant.com'
        }
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tenant.name).toBe('测试租户');
    
    tenantId = response.body.data.tenant._id;
  });
  
  test('获取租户列表', async () => {
    const response = await request(app)
      .get('/api/tenants/super-admin')
      .set('Authorization', `Bearer ${superAdminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.tenants)).toBe(true);
  });
});
```

---

这些示例涵盖了系统的主要功能，可以帮助开发者快速集成和使用多租户后台管理系统的 API。