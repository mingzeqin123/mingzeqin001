# 支付服务 - 幂等性处理

一个完整的支付服务系统，实现了强大的幂等性处理机制，确保支付请求的安全性和一致性。

## 功能特性

### 核心功能
- ✅ 完整的支付流程管理
- ✅ 多种支付方式支持（支付宝、微信、银联、信用卡）
- ✅ 支付状态查询和管理
- ✅ 支付回调处理
- ✅ 支付重试机制

### 幂等性处理
- ✅ 基于UUID的幂等性键验证
- ✅ 请求指纹生成和验证
- ✅ 重复请求检测和处理
- ✅ 并发请求安全处理
- ✅ 自动过期清理机制

### 安全特性
- ✅ 请求签名验证
- ✅ 速率限制
- ✅ 输入参数验证
- ✅ 错误处理和日志记录

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- MongoDB >= 4.0
- npm >= 6.0.0

### 安装依赖
```bash
cd payment-service
npm install
```

### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## API 文档

### 1. 创建支付订单

**POST** `/api/payment/create`

**Headers:**
```
Content-Type: application/json
idempotency-key: 550e8400-e29b-41d4-a716-446655440000
```

**Request Body:**
```json
{
  "userId": "user_123456",
  "orderId": "order_20231215_001",
  "amount": 9900,
  "currency": "CNY",
  "paymentMethod": "alipay",
  "description": "商品购买 - iPhone 15",
  "callbackUrl": "https://example.com/payment/callback",
  "metadata": {
    "productId": "iphone_15_128gb",
    "couponCode": "DISCOUNT10"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1702633200000_abc12345",
    "status": "processing",
    "amount": 9900,
    "currency": "CNY",
    "paymentMethod": "alipay",
    "paymentUrl": "https://openapi.alipay.com/gateway.do?mock_payment=pay_1702633200000_abc12345",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...",
    "expiresAt": "2023-12-15T15:15:00.000Z",
    "createdAt": "2023-12-15T15:00:00.000Z"
  },
  "message": "支付订单创建成功"
}
```

### 2. 查询支付状态

**GET** `/api/payment/status/{paymentId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1702633200000_abc12345",
    "orderId": "order_20231215_001",
    "amount": 9900,
    "currency": "CNY",
    "paymentMethod": "alipay",
    "status": "success",
    "description": "商品购买 - iPhone 15",
    "paidAt": "2023-12-15T15:05:00.000Z",
    "createdAt": "2023-12-15T15:00:00.000Z",
    "updatedAt": "2023-12-15T15:05:00.000Z"
  },
  "message": "查询成功"
}
```

### 3. 支付重试

**POST** `/api/payment/retry/{paymentId}`

**Headers:**
```
idempotency-key: 550e8400-e29b-41d4-a716-446655440001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1702633200000_abc12345",
    "status": "processing",
    "retryCount": 1,
    "paymentUrl": "https://openapi.alipay.com/gateway.do?mock_payment=pay_1702633200000_abc12345",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...",
    "expiresAt": "2023-12-15T15:30:00.000Z"
  },
  "message": "支付重试成功"
}
```

### 4. 支付回调

**POST** `/api/payment/callback`

**Request Body:**
```json
{
  "paymentId": "pay_1702633200000_abc12345",
  "status": "success",
  "transactionId": "alipay_1702633500000_xyz98765",
  "paidAt": "2023-12-15T15:05:00.000Z",
  "signature": "calculated_signature_hash"
}
```

## 幂等性处理详解

### 幂等性键规则
1. **格式要求**: 必须使用标准UUID格式（如：`550e8400-e29b-41d4-a716-446655440000`）
2. **唯一性**: 每个请求必须使用唯一的幂等性键
3. **一致性**: 相同的幂等性键必须对应相同的请求参数

### 处理逻辑
1. **首次请求**: 创建幂等性记录，处理业务逻辑，保存结果
2. **重复请求**: 返回已保存的处理结果，不重复执行业务逻辑
3. **参数不匹配**: 返回422错误，提示幂等性键与参数不匹配
4. **并发请求**: 通过数据库唯一约束确保只有一个请求被处理

### 错误码说明
- `MISSING_IDEMPOTENCY_KEY`: 缺少幂等性键
- `INVALID_IDEMPOTENCY_KEY`: 幂等性键格式无效
- `IDEMPOTENCY_KEY_MISMATCH`: 幂等性键与请求参数不匹配
- `REQUEST_IN_PROGRESS`: 相同请求正在处理中

## 使用示例

### 基本支付流程
```javascript
const { PaymentClient } = require('./examples/usage-examples');

const client = new PaymentClient('http://localhost:3000/api/payment');

// 创建支付
const result = await client.createPayment({
  userId: 'user_123',
  orderId: 'order_456',
  amount: 9900,
  paymentMethod: 'alipay',
  description: '商品购买',
  callbackUrl: 'https://example.com/callback'
});

if (result.success) {
  console.log('支付创建成功:', result.data.data.paymentId);
  
  // 查询支付状态
  const status = await client.getPaymentStatus(result.data.data.paymentId);
  console.log('支付状态:', status.data.status);
}
```

### 幂等性测试
```javascript
const idempotencyKey = uuidv4();

// 发送相同请求两次
const result1 = await client.createPayment(paymentData, idempotencyKey);
const result2 = await client.createPayment(paymentData, idempotencyKey);

// 两次请求返回相同的支付ID
console.log(result1.data.data.paymentId === result2.data.data.paymentId); // true
```

## 数据库设计

### 支付记录表 (payments)
```javascript
{
  paymentId: String,        // 支付ID
  idempotencyKey: String,   // 幂等性键
  userId: String,           // 用户ID
  orderId: String,          // 订单ID
  amount: Number,           // 支付金额（分）
  currency: String,         // 货币类型
  paymentMethod: String,    // 支付方式
  status: String,           // 支付状态
  thirdPartyTransactionId: String, // 第三方交易号
  description: String,      // 支付描述
  callbackUrl: String,      // 回调地址
  paidAt: Date,            // 支付完成时间
  failureReason: String,    // 失败原因
  retryCount: Number,       // 重试次数
  metadata: Map,           // 元数据
  createdAt: Date,         // 创建时间
  updatedAt: Date          // 更新时间
}
```

### 幂等性记录表 (idempotencyrecords)
```javascript
{
  key: String,              // 幂等性键
  requestFingerprint: String, // 请求指纹
  response: Mixed,          // 响应数据
  status: String,           // 处理状态
  paymentId: String,        // 关联的支付ID
  expiresAt: Date,         // 过期时间
  createdAt: Date,         // 创建时间
  updatedAt: Date          // 更新时间
}
```

## 监控和运维

### 健康检查
```bash
curl http://localhost:3000/health
```

### 清理过期记录
系统会自动清理过期的幂等性记录（每6小时执行一次），也可以手动执行：
```javascript
const IdempotencyMiddleware = require('./middleware/idempotency');
await IdempotencyMiddleware.cleanupExpiredRecords();
```

### 支付统计
```bash
curl "http://localhost:3000/api/payment/statistics?startDate=2023-12-01&endDate=2023-12-31"
```

## 最佳实践

### 1. 幂等性键管理
- 在客户端生成UUID格式的幂等性键
- 为每个独立的支付请求使用不同的幂等性键
- 重试时使用新的幂等性键

### 2. 错误处理
- 监听各种错误码并做相应处理
- 对于临时性错误（如网络超时），可以使用新的幂等性键重试
- 对于业务错误（如余额不足），不应该重试

### 3. 安全考虑
- 使用HTTPS传输敏感数据
- 验证回调请求的签名
- 设置合理的速率限制
- 记录详细的操作日志

### 4. 性能优化
- 定期清理过期的幂等性记录
- 为高频查询字段添加数据库索引
- 使用连接池管理数据库连接
- 考虑使用Redis等缓存系统

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件