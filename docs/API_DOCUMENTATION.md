# API 接口文档

## 📋 接口概览

本文档描述了订单管理系统的所有API接口，包括请求参数、响应格式和错误处理。

## 🔐 认证方式

所有需要用户身份验证的接口都需要在请求头中携带用户信息：

```javascript
// 请求头
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}

// 或在请求中携带用户信息
{
  "user": {
    "userId": "user_001"
  }
}
```

## 📦 响应格式

所有API接口都遵循统一的响应格式：

```javascript
// 成功响应
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}

// 错误响应
{
  "success": false,
  "message": "错误信息",
  "code": "ERROR_CODE"
}
```

## 🛒 订单管理接口

### 1. 创建订单

**接口地址**: `POST /api/orders`

**请求参数**:
```javascript
{
  "userInfo": {
    "id": "user_001",
    "name": "张三",
    "phone": "13800138000"
  },
  "shippingAddress": {
    "receiverName": "李四",
    "receiverPhone": "13900139000",
    "province": "广东省",
    "city": "深圳市",
    "district": "南山区",
    "detailAddress": "科技园南区A1栋"
  },
  "remark": "请尽快发货",
  "couponId": "coupon_001",
  "shippingFee": 10,
  "discountAmount": 20
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "id": "order_001",
    "orderNo": "ORD202401151234567890",
    "userId": "user_001",
    "status": "pending",
    "items": [
      {
        "productId": "prod_001",
        "productName": "iPhone 15 Pro",
        "price": 7999,
        "quantity": 1,
        "subtotal": 7999
      }
    ],
    "totalAmount": 7999,
    "discountAmount": 20,
    "shippingFee": 10,
    "finalAmount": 7989,
    "createTime": "2024-01-15T12:34:56.789Z",
    "expireTime": "2024-01-15T13:04:56.789Z"
  }
}
```

### 2. 获取订单列表

**接口地址**: `GET /api/orders`

**请求参数**:
```javascript
// Query参数
{
  "status": "pending",     // 可选，订单状态筛选
  "page": 1,              // 页码，默认1
  "pageSize": 10,         // 每页数量，默认10
  "sortBy": "createTime", // 排序字段
  "sortOrder": "desc"     // 排序方向
}
```

**响应示例**:
```javascript
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_001",
        "orderNo": "ORD202401151234567890",
        "status": "pending",
        "statusText": "待付款",
        "items": [...],
        "finalAmount": 7989,
        "createTime": "2024-01-15T12:34:56.789Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 3. 获取订单详情

**接口地址**: `GET /api/orders/:orderId`

**路径参数**:
- `orderId`: 订单ID

**响应示例**:
```javascript
{
  "success": true,
  "data": {
    "id": "order_001",
    "orderNo": "ORD202401151234567890",
    "userId": "user_001",
    "status": "pending",
    "items": [
      {
        "productId": "prod_001",
        "productName": "iPhone 15 Pro",
        "productImage": "/images/iphone15pro.jpg",
        "specifications": [
          {"name": "颜色", "value": "深空黑色"},
          {"name": "容量", "value": "256GB"}
        ],
        "price": 7999,
        "quantity": 1,
        "subtotal": 7999
      }
    ],
    "totalAmount": 7999,
    "discountAmount": 20,
    "shippingFee": 10,
    "finalAmount": 7989,
    "paymentMethod": "",
    "paymentTime": null,
    "shippingAddress": {
      "receiverName": "李四",
      "receiverPhone": "13900139000",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "detailAddress": "科技园南区A1栋"
    },
    "remark": "请尽快发货",
    "createTime": "2024-01-15T12:34:56.789Z",
    "expireTime": "2024-01-15T13:04:56.789Z"
  }
}
```

### 4. 支付订单

**接口地址**: `POST /api/orders/:orderId/pay`

**路径参数**:
- `orderId`: 订单ID

**请求参数**:
```javascript
{
  "paymentMethod": "wechat_pay",
  "paymentData": {
    "openid": "user_openid",
    "clientIp": "192.168.1.1"
  }
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "支付成功",
  "data": {
    "order": {
      "id": "order_001",
      "status": "paid",
      "paymentMethod": "wechat_pay",
      "paymentTime": "2024-01-15T12:40:00.000Z"
    },
    "paymentId": "PAY1705320000123456"
  }
}
```

### 5. 取消订单

**接口地址**: `POST /api/orders/:orderId/cancel`

**路径参数**:
- `orderId`: 订单ID

**请求参数**:
```javascript
{
  "reason": "用户主动取消"
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "订单取消成功",
  "data": {
    "id": "order_001",
    "status": "cancelled",
    "updateTime": "2024-01-15T12:45:00.000Z"
  }
}
```

### 6. 确认收货

**接口地址**: `POST /api/orders/:orderId/confirm`

**路径参数**:
- `orderId`: 订单ID

**响应示例**:
```javascript
{
  "success": true,
  "message": "确认收货成功",
  "data": {
    "id": "order_001",
    "status": "delivered",
    "updateTime": "2024-01-15T15:30:00.000Z"
  }
}
```

## 🛍️ 购物车管理接口

### 1. 添加商品到购物车

**接口地址**: `POST /api/cart/add`

**请求参数**:
```javascript
{
  "productId": "prod_001",
  "skuId": "sku_001",
  "quantity": 2
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "添加到购物车成功",
  "data": {
    "id": "cart_001",
    "userId": "user_001",
    "productId": "prod_001",
    "skuId": "sku_001",
    "productName": "iPhone 15 Pro 深空黑色 256GB",
    "productImage": "/images/iphone15pro.jpg",
    "price": 7999,
    "quantity": 2,
    "selected": true,
    "createTime": "2024-01-15T12:00:00.000Z"
  }
}
```

### 2. 获取购物车列表

**接口地址**: `GET /api/cart`

**响应示例**:
```javascript
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart_001",
        "productId": "prod_001",
        "skuId": "sku_001",
        "productName": "iPhone 15 Pro 深空黑色 256GB",
        "productImage": "/images/iphone15pro.jpg",
        "specifications": [
          {"name": "颜色", "value": "深空黑色"},
          {"name": "容量", "value": "256GB"}
        ],
        "price": 7999,
        "quantity": 1,
        "selected": true
      }
    ],
    "summary": {
      "totalItems": 2,
      "selectedItems": 1,
      "totalQuantity": 1,
      "totalAmount": 7999
    }
  }
}
```

### 3. 更新购物车商品数量

**接口地址**: `PUT /api/cart/:productId`

**路径参数**:
- `productId`: 商品ID

**请求参数**:
```javascript
{
  "skuId": "sku_001",
  "quantity": 3
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": "cart_001",
    "quantity": 3,
    "updateTime": "2024-01-15T12:30:00.000Z"
  }
}
```

### 4. 删除购物车商品

**接口地址**: `DELETE /api/cart/:productId`

**路径参数**:
- `productId`: 商品ID

**Query参数**:
- `skuId`: SKU ID (可选)

**响应示例**:
```javascript
{
  "success": true,
  "message": "删除成功"
}
```

### 5. 切换商品选中状态

**接口地址**: `POST /api/cart/:productId/toggle`

**路径参数**:
- `productId`: 商品ID

**请求参数**:
```javascript
{
  "skuId": "sku_001"
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": "cart_001",
    "selected": false,
    "updateTime": "2024-01-15T12:35:00.000Z"
  }
}
```

## 👨‍💼 管理员接口

### 1. 获取所有订单

**接口地址**: `GET /api/admin/orders`

**请求参数**:
```javascript
// Query参数
{
  "status": "pending",        // 可选，状态筛选
  "userId": "user_001",       // 可选，用户筛选
  "startDate": "2024-01-01",  // 可选，开始日期
  "endDate": "2024-01-31",    // 可选，结束日期
  "page": 1,
  "pageSize": 20
}
```

**响应示例**:
```javascript
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_001",
        "orderNo": "ORD202401151234567890",
        "userId": "user_001",
        "userInfo": {
          "name": "张三",
          "phone": "13800138000"
        },
        "status": "pending",
        "finalAmount": 7989,
        "createTime": "2024-01-15T12:34:56.789Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 2. 更新订单状态

**接口地址**: `PUT /api/admin/orders/:orderId/status`

**路径参数**:
- `orderId`: 订单ID

**请求参数**:
```javascript
{
  "status": "shipped",
  "remark": "商品已发货，快递单号：SF1234567890"
}
```

**响应示例**:
```javascript
{
  "success": true,
  "message": "订单状态更新成功",
  "data": {
    "id": "order_001",
    "status": "shipped",
    "remark": "商品已发货，快递单号：SF1234567890",
    "updateTime": "2024-01-15T14:00:00.000Z"
  }
}
```

## 📊 统计接口

### 1. 获取订单统计

**接口地址**: `GET /api/orders/statistics`

**请求参数**:
```javascript
// Query参数
{
  "startDate": "2024-01-01",  // 可选，统计开始日期
  "endDate": "2024-01-31"     // 可选，统计结束日期
}
```

**响应示例**:
```javascript
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalAmount": 299850.00,
    "averageOrderValue": 1999.00,
    "statusCounts": {
      "pending": 10,
      "paid": 25,
      "processing": 15,
      "shipped": 30,
      "delivered": 65,
      "cancelled": 3,
      "refunded": 2
    }
  }
}
```

## 💳 支付回调接口

### 1. 微信支付回调

**接口地址**: `POST /api/orders/wechat-pay-callback`

**请求参数**:
```javascript
{
  "out_trade_no": "ORD202401151234567890",
  "transaction_id": "wx_transaction_123456",
  "result_code": "SUCCESS",
  "total_fee": 798900
}
```

**响应示例**:
```javascript
{
  "return_code": "SUCCESS",
  "return_msg": "OK"
}
```

## ❌ 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| `UNAUTHORIZED` | 401 | 用户未登录或token无效 |
| `FORBIDDEN` | 403 | 用户无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `BUSINESS_ERROR` | 400 | 业务逻辑错误 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### 常见错误示例

```javascript
// 用户未登录
{
  "success": false,
  "message": "用户未登录",
  "code": "UNAUTHORIZED"
}

// 订单不存在
{
  "success": false,
  "message": "订单不存在",
  "code": "NOT_FOUND"
}

// 库存不足
{
  "success": false,
  "message": "商品库存不足",
  "code": "BUSINESS_ERROR"
}

// 参数验证失败
{
  "success": false,
  "message": "商品数量必须大于0",
  "code": "VALIDATION_ERROR"
}
```

## 🔧 调试工具

### 使用Postman测试

1. 导入API集合文件
2. 设置环境变量
3. 配置认证信息
4. 执行测试用例

### cURL示例

```bash
# 创建订单
curl -X POST "https://api.example.com/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userInfo": {
      "id": "user_001",
      "name": "张三"
    },
    "shippingAddress": {
      "receiverName": "李四",
      "receiverPhone": "13900139000",
      "province": "广东省",
      "city": "深圳市",
      "district": "南山区",
      "detailAddress": "科技园南区A1栋"
    }
  }'

# 获取订单列表
curl -X GET "https://api.example.com/api/orders?page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

## 📝 更新日志

### v1.0.0 (2024-01-15)
- 完整的订单管理API
- 购物车管理功能
- 管理员接口
- 统计分析接口
- 支付回调处理

---

**如有疑问，请联系技术支持团队。** 📞