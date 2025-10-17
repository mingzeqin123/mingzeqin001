# 订单系统 API 文档

## 概述

订单系统提供RESTful API接口，支持商品管理、订单处理、用户认证等功能。

**基础URL**: `http://localhost:3000/api`

**认证方式**: Bearer Token (JWT)

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "details": "详细错误描述"
}
```

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 认证接口

### 用户注册

**POST** `/auth/register`

注册新用户账户。

**请求参数**:
```json
{
  "username": "string",      // 用户名，3-30个字符，字母数字
  "email": "string",         // 邮箱地址
  "password": "string",      // 密码，最少6个字符
  "full_name": "string",     // 姓名，2-100个字符
  "phone": "string",         // 电话，可选
  "address": "string"        // 地址，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone": "13800138000",
      "address": "北京市朝阳区"
    }
  }
}
```

### 用户登录

**POST** `/auth/login`

用户登录获取访问令牌。

**请求参数**:
```json
{
  "email": "string",         // 邮箱地址
  "password": "string"       // 密码
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "customer"
    }
  }
}
```

### 获取用户信息

**GET** `/auth/profile`

获取当前登录用户信息。

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "13800138000",
    "address": "北京市朝阳区",
    "role": "customer",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新用户信息

**PUT** `/auth/profile`

更新当前用户信息。

**请求头**:
```
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "full_name": "string",     // 姓名，可选
  "phone": "string",         // 电话，可选
  "address": "string"        // 地址，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Smith",
    "phone": "13900139000",
    "address": "上海市浦东新区"
  }
}
```

## 商品接口

### 获取商品列表

**GET** `/products`

获取商品列表，支持分页和筛选。

**查询参数**:
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| page | integer | 页码 | 1 |
| limit | integer | 每页数量 | 10 |
| category_id | integer | 分类ID | - |
| search | string | 搜索关键词 | - |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "iPhone 15 Pro",
        "description": "苹果最新旗舰手机",
        "price": "7999.00",
        "stock_quantity": 50,
        "category_id": 1,
        "category_name": "电子产品",
        "sku": "IPHONE15PRO",
        "image_url": "https://example.com/iphone15.jpg",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### 获取商品详情

**GET** `/products/:id`

获取指定商品的详细信息。

**路径参数**:
- `id`: 商品ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "description": "苹果最新旗舰手机",
    "price": "7999.00",
    "stock_quantity": 50,
    "category_id": 1,
    "category_name": "电子产品",
    "sku": "IPHONE15PRO",
    "image_url": "https://example.com/iphone15.jpg",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 创建商品

**POST** `/products`

创建新商品（管理员权限）。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```json
{
  "name": "string",          // 商品名称，必填
  "description": "string",   // 商品描述，可选
  "price": "number",         // 价格，必填
  "stock_quantity": "integer", // 库存数量，必填
  "category_id": "integer",  // 分类ID，可选
  "sku": "string",           // 商品编码，可选
  "image_url": "string"      // 图片URL，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "商品创建成功",
  "data": {
    "id": 2,
    "name": "MacBook Air M2",
    "description": "苹果笔记本电脑",
    "price": "8999.00",
    "stock_quantity": 30,
    "category_id": 1,
    "category_name": "电子产品",
    "sku": "MACBOOKAIRM2",
    "image_url": "https://example.com/macbook.jpg",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新商品

**PUT** `/products/:id`

更新商品信息（管理员权限）。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
- `id`: 商品ID

**请求参数**:
```json
{
  "name": "string",          // 商品名称，可选
  "description": "string",   // 商品描述，可选
  "price": "number",         // 价格，可选
  "stock_quantity": "integer", // 库存数量，可选
  "category_id": "integer",  // 分类ID，可选
  "sku": "string",           // 商品编码，可选
  "image_url": "string",     // 图片URL，可选
  "status": "string"         // 状态，可选
}
```

### 删除商品

**DELETE** `/products/:id`

删除商品（管理员权限）。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 商品ID

**响应示例**:
```json
{
  "success": true,
  "message": "商品删除成功"
}
```

### 更新商品库存

**PUT** `/products/:id/stock`

更新商品库存（管理员/员工权限）。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
- `id`: 商品ID

**请求参数**:
```json
{
  "quantity": "integer"      // 库存变化量（正数增加，负数减少）
}
```

### 获取商品分类

**GET** `/products/categories/list`

获取所有商品分类。

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "电子产品",
      "description": "手机、电脑、平板等电子设备",
      "parent_id": null,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 订单接口

### 创建订单

**POST** `/orders`

创建新订单。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```json
{
  "items": [                 // 订单商品，必填
    {
      "product_id": "integer", // 商品ID
      "quantity": "integer"    // 数量
    }
  ],
  "shipping_address": "string", // 收货地址，必填
  "billing_address": "string",  // 账单地址，可选
  "payment_method": "string",   // 支付方式，必填
  "notes": "string"             // 备注，可选
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "order_id": 1,
    "order_number": "ORD1704067200000ABC123",
    "total_amount": "15998.00"
  }
}
```

### 获取订单列表

**GET** `/orders`

获取当前用户的订单列表。

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| page | integer | 页码 | 1 |
| limit | integer | 每页数量 | 10 |
| status | string | 订单状态 | - |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "ORD1704067200000ABC123",
        "user_id": 1,
        "status": "pending",
        "total_amount": "15998.00",
        "shipping_fee": "0.00",
        "discount_amount": "0.00",
        "payment_status": "pending",
        "payment_method": "credit_card",
        "shipping_address": "北京市朝阳区",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 获取订单详情

**GET** `/orders/:id`

获取指定订单的详细信息。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 订单ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD1704067200000ABC123",
    "user_id": 1,
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "13800138000",
    "status": "pending",
    "total_amount": "15998.00",
    "shipping_fee": "0.00",
    "discount_amount": "0.00",
    "payment_status": "pending",
    "payment_method": "credit_card",
    "shipping_address": "北京市朝阳区",
    "billing_address": "北京市朝阳区",
    "notes": "请尽快发货",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "iPhone 15 Pro",
        "sku": "IPHONE15PRO",
        "image_url": "https://example.com/iphone15.jpg",
        "quantity": 2,
        "unit_price": "7999.00",
        "total_price": "15998.00"
      }
    ]
  }
}
```

### 根据订单号获取订单

**GET** `/orders/number/:orderNumber`

根据订单号获取订单详情。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `orderNumber`: 订单号

### 更新订单状态

**PUT** `/orders/:id/status`

更新订单状态（管理员/员工权限）。

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
- `id`: 订单ID

**请求参数**:
```json
{
  "status": "string",        // 订单状态，必填
  "notes": "string"          // 备注，可选
}
```

**订单状态**:
- `pending`: 待确认
- `confirmed`: 已确认
- `processing`: 处理中
- `shipped`: 已发货
- `delivered`: 已送达
- `cancelled`: 已取消
- `refunded`: 已退款

### 取消订单

**PUT** `/orders/:id/cancel`

取消订单。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 订单ID

**响应示例**:
```json
{
  "success": true,
  "message": "订单取消成功"
}
```

### 获取订单状态历史

**GET** `/orders/:id/history`

获取订单状态变更历史。

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
- `id`: 订单ID

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 1,
      "status": "pending",
      "notes": null,
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "order_id": 1,
      "status": "confirmed",
      "notes": "订单已确认",
      "created_by": 2,
      "created_at": "2024-01-01T01:00:00.000Z"
    }
  ]
}
```

### 获取订单统计

**GET** `/orders/admin/stats`

获取订单统计信息（管理员/员工权限）。

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| start_date | string | 开始日期 (YYYY-MM-DD) |
| end_date | string | 结束日期 (YYYY-MM-DD) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_orders": 100,
    "pending_orders": 10,
    "confirmed_orders": 20,
    "processing_orders": 15,
    "shipped_orders": 25,
    "delivered_orders": 25,
    "cancelled_orders": 5,
    "total_revenue": "159980.00"
  }
}
```

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必填字段 |
| 401 | 未授权 | 检查Authorization头是否正确 |
| 403 | 权限不足 | 检查用户角色权限 |
| 404 | 资源不存在 | 检查请求的资源ID是否存在 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应示例

```json
{
  "success": false,
  "message": "用户名或邮箱已存在",
  "details": "email field must be unique"
}
```

## 认证和权限

### 用户角色

| 角色 | 权限 |
|------|------|
| `customer` | 查看商品、创建订单、管理自己的订单 |
| `staff` | 所有customer权限 + 管理订单状态、查看所有订单 |
| `admin` | 所有权限 + 管理商品、管理用户 |

### JWT Token

JWT Token包含以下信息：
```json
{
  "userId": 1,
  "email": "user@example.com",
  "iat": 1704067200,
  "exp": 1704153600
}
```

Token有效期：24小时（可配置）

## 限流和配额

### 请求限制
- 每个IP每15分钟最多100个请求
- 登录接口：每IP每分钟最多5次尝试
- 注册接口：每IP每小时最多3次尝试

### 响应头
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704153600
```

## 数据格式

### 日期时间
所有日期时间使用ISO 8601格式：
```
2024-01-01T00:00:00.000Z
```

### 金额
所有金额使用字符串格式，保留2位小数：
```
"7999.00"
```

### 分页
分页参数：
- `page`: 页码，从1开始
- `limit`: 每页数量，最大100
- `total`: 总记录数
- `pages`: 总页数

## 测试

### 使用curl测试

```bash
# 用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# 用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 获取商品列表
curl -X GET http://localhost:3000/api/products?page=1&limit=10

# 创建订单
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [{"product_id": 1, "quantity": 2}],
    "shipping_address": "北京市朝阳区",
    "payment_method": "credit_card"
  }'
```

### 使用Postman测试

1. 导入API集合
2. 设置环境变量
3. 配置认证Token
4. 运行测试用例

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持用户认证
- 支持商品管理
- 支持订单管理
- 支持购物车功能

## 支持

如有问题，请联系：
- 邮箱：api-support@example.com
- 文档：https://docs.example.com/api
- 状态页：https://status.example.com