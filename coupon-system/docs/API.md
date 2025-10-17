# API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

## 认证

所有需要认证的接口都需要在请求头中包含 JWT token：

```
Authorization: Bearer {your-jwt-token}
```

## 响应格式

所有接口都返回统一的响应格式：

```json
{
  "success": true|false,
  "data": {}, // 成功时的数据
  "error": "错误信息", // 失败时的错误信息
  "details": [] // 详细错误信息（可选）
}
```

## 用户认证

### 用户注册

**POST** `/users/register`

请求体：
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "phone": "13800138000"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "phone": "13800138000",
      "status": "active",
      "createdAt": "2023-12-01T00:00:00.000Z",
      "updatedAt": "2023-12-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 用户登录

**POST** `/users/login`

请求体：
```json
{
  "username": "testuser", // 可以是用户名或邮箱
  "password": "password123"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 优惠券管理

### 创建优惠券模板

**POST** `/coupons/templates` 🔒 *需要管理员权限*

请求体：
```json
{
  "name": "新用户专享优惠券",
  "description": "新用户注册专享10元优惠券",
  "type": "fixed", // fixed|percentage|free_shipping
  "value": 10.00,
  "minOrderAmount": 50.00,
  "maxDiscountAmount": 10.00, // 百分比类型时的最大折扣
  "validDays": 30,
  "usageLimitPerUser": 1,
  "totalQuantity": 1000,
  "categoryIds": [1, 2], // 适用分类
  "productIds": [10, 20] // 适用商品
}
```

### 获取优惠券模板列表

**GET** `/coupons/templates` 🔒

查询参数：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `status`: 状态筛选（active|inactive|expired）

响应：
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "新用户专享优惠券",
        "type": "fixed",
        "value": 10.00,
        "minOrderAmount": 50.00,
        "status": "active",
        "createdAt": "2023-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 批量发放优惠券

**POST** `/coupons/distribute` 🔒 *需要管理员权限*

请求体：
```json
{
  "templateId": 1,
  "userIds": [1, 2, 3],
  "batchId": 1,
  "customExpiresAt": "2024-01-01T00:00:00.000Z"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "success": [
      {
        "userId": 1,
        "couponId": 1,
        "couponCode": "CPN123ABC456"
      }
    ],
    "failed": [
      {
        "userId": 999,
        "error": "用户不存在"
      }
    ],
    "total": 3
  }
}
```

## 用户优惠券操作

### 领取优惠券

**POST** `/coupons/claim` 🔒

请求体：
```json
{
  "templateId": 1
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "templateId": 1,
    "couponCode": "CPN123ABC456",
    "status": "unused",
    "obtainedAt": "2023-12-01T00:00:00.000Z",
    "expiresAt": "2023-12-31T23:59:59.000Z"
  }
}
```

### 获取我的优惠券

**GET** `/coupons/my` 🔒

查询参数：
- `status`: 状态筛选（unused|used|expired|refunded）
- `page`: 页码
- `limit`: 每页数量

响应：
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": 1,
        "couponCode": "CPN123ABC456",
        "status": "unused",
        "obtainedAt": "2023-12-01T00:00:00.000Z",
        "expiresAt": "2023-12-31T23:59:59.000Z",
        "template": {
          "name": "新用户专享优惠券",
          "type": "fixed",
          "value": 10.00,
          "minOrderAmount": 50.00
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 获取可用优惠券

**GET** `/coupons/available` 🔒

查询参数：
- `amount`: 订单金额
- `categoryIds`: 商品分类ID（逗号分隔）
- `productIds`: 商品ID（逗号分隔）

响应：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "couponCode": "CPN123ABC456",
      "discountAmount": 10.00,
      "template": {
        "name": "新用户专享优惠券",
        "type": "fixed",
        "value": 10.00
      }
    }
  ]
}
```

### 验证优惠券

**POST** `/coupons/validate` 🔒

请求体：
```json
{
  "couponCode": "CPN123ABC456",
  "amount": 100.00,
  "categoryIds": [1, 2],
  "productIds": [10, 20]
}
```

响应：
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountAmount": 10.00,
    "userCoupon": {
      "id": 1,
      "couponCode": "CPN123ABC456",
      "status": "unused"
    },
    "template": {
      "name": "新用户专享优惠券",
      "type": "fixed",
      "value": 10.00
    }
  }
}
```

### 获取最优优惠券推荐

**GET** `/coupons/best` 🔒

查询参数：
- `amount`: 订单金额（必需）
- `categoryIds`: 商品分类ID
- `productIds`: 商品ID

响应：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "couponCode": "CPN123ABC456",
    "discountAmount": 10.00,
    "template": {
      "name": "新用户专享优惠券",
      "type": "fixed",
      "value": 10.00
    }
  }
}
```

## 订单管理

### 创建订单

**POST** `/orders` 🔒

请求体：
```json
{
  "originalAmount": 100.00,
  "couponCode": "CPN123ABC456",
  "items": [
    {
      "productId": 1,
      "productName": "商品名称",
      "price": 50.00,
      "quantity": 2,
      "categoryId": 1
    }
  ],
  "paymentMethod": "alipay"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNo": "ORD20231201123456789",
      "userId": 1,
      "originalAmount": 100.00,
      "couponDiscount": 10.00,
      "finalAmount": 90.00,
      "paymentStatus": "pending",
      "createdAt": "2023-12-01T00:00:00.000Z"
    },
    "coupon": {
      "code": "CPN123ABC456",
      "discount": 10.00
    }
  }
}
```

### 处理支付

**POST** `/orders/{orderId}/pay` 🔒

请求体：
```json
{
  "paymentMethod": "alipay",
  "transactionId": "TXN123456789"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "paymentStatus": "paid",
      "paidAt": "2023-12-01T00:00:00.000Z"
    },
    "transactionId": "TXN_1701388800000_ABC123"
  }
}
```

### 获取订单列表

**GET** `/orders` 🔒

查询参数：
- `paymentStatus`: 支付状态
- `startDate`: 开始日期
- `endDate`: 结束日期
- `page`: 页码
- `limit`: 每页数量

### 取消订单

**POST** `/orders/{orderId}/cancel` 🔒

请求体：
```json
{
  "reason": "不想要了"
}
```

## 退款管理

### 创建退款申请

**POST** `/refunds` 🔒

请求体：
```json
{
  "orderId": 1,
  "refundAmount": 90.00,
  "refundReason": "商品质量问题",
  "couponRefundType": "restore" // restore|void|new_coupon
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "refundNo": "REF20231201123456789",
    "orderId": 1,
    "refundAmount": 90.00,
    "refundStatus": "pending",
    "createdAt": "2023-12-01T00:00:00.000Z"
  }
}
```

### 处理退款

**POST** `/refunds/{refundId}/process` 🔒 *需要管理员权限*

请求体：
```json
{
  "approvalNote": "同意退款"
}
```

### 获取退款列表

**GET** `/refunds` 🔒

查询参数：
- `orderId`: 订单ID
- `refundStatus`: 退款状态
- `startDate`: 开始日期
- `endDate`: 结束日期
- `page`: 页码
- `limit`: 每页数量

## 统计接口

### 优惠券使用统计

**GET** `/coupons/stats` 🔒

查询参数：
- `startDate`: 开始日期
- `endDate`: 结束日期

响应：
```json
{
  "success": true,
  "data": {
    "total": 10,
    "unused": 5,
    "used": 4,
    "expired": 1,
    "totalSaved": 40.00,
    "usageRate": "40.00"
  }
}
```

### 支付统计

**GET** `/orders/stats` 🔒

### 退款统计

**GET** `/refunds/stats` 🔒

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 常见错误信息

- `未提供认证token` - 请求头缺少 Authorization
- `token已过期` - JWT token 已过期，需要重新登录
- `权限不足` - 当前用户没有执行该操作的权限
- `优惠券不存在或不属于当前用户` - 优惠券码无效
- `优惠券已使用` - 优惠券已被使用过
- `优惠券已过期` - 优惠券超过有效期
- `订单金额不满足最小消费要求` - 订单金额低于优惠券使用门槛
- `用户已达到该优惠券的最大拥有数量限制` - 超出单用户持有限制

## 速率限制

- 普通 API：每 15 分钟最多 100 次请求
- 敏感操作（登录、注册等）：每 15 分钟最多 5 次请求

## 测试

可以使用以下工具测试 API：

- Postman
- curl
- HTTPie

示例 curl 请求：

```bash
# 用户登录
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# 获取优惠券列表
curl -X GET http://localhost:3000/api/v1/coupons/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```