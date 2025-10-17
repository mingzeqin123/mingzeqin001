# 优惠券系统

一个完整的优惠券系统，支持优惠券的发放、领取、使用、付款和退款等功能。

## 功能特性

### 核心功能
- ✅ **优惠券发放**：支持批量发放、自动发放、活动发放等多种方式
- ✅ **优惠券领取**：用户主动领取、系统自动发放
- ✅ **优惠券使用**：订单使用优惠券、折扣计算、使用限制
- ✅ **支付处理**：订单创建、支付处理、支付状态管理
- ✅ **退款处理**：退款申请、退款处理、优惠券恢复

### 优惠券类型
- **固定金额优惠券**：减免固定金额
- **百分比优惠券**：按比例减免，支持最大减免限制
- **免运费优惠券**：免除运费

### 使用限制
- 最小订单金额限制
- 商品分类限制
- 指定商品限制
- 用户使用次数限制
- 总发行量限制
- 有效期限制

### 管理功能
- 优惠券模板管理
- 批量发放管理
- 使用统计分析
- 退款处理管理

## 技术栈

- **后端框架**：Node.js + Express
- **数据库**：MySQL + Sequelize ORM
- **认证**：JWT
- **验证**：Joi
- **日志**：Winston
- **测试**：Jest + Supertest
- **安全**：Helmet + CORS + Rate Limiting

## 项目结构

```
coupon-system/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑服务
│   └── app.js          # 应用入口
├── tests/              # 测试文件
├── database/           # 数据库相关
├── logs/              # 日志文件
└── docs/              # 文档
```

## 快速开始

### 1. 安装依赖

```bash
cd coupon-system
npm install
```

### 2. 环境配置

复制环境变量文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=coupon_system
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 3. 数据库设置

创建数据库：

```sql
CREATE DATABASE coupon_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

运行数据库迁移：

```bash
npm run migrate
```

### 4. 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

### 5. 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## API 文档

### 认证相关

#### 用户注册
```http
POST /api/v1/users/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "phone": "13800138000"
}
```

#### 用户登录
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### 优惠券相关

#### 获取优惠券模板列表
```http
GET /api/v1/coupons/templates
Authorization: Bearer {token}
```

#### 用户领取优惠券
```http
POST /api/v1/coupons/claim
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": 1
}
```

#### 获取用户优惠券
```http
GET /api/v1/coupons/my
Authorization: Bearer {token}
```

#### 验证优惠券
```http
POST /api/v1/coupons/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "couponCode": "CPN123456789",
  "amount": 100.00,
  "categoryIds": [1, 2],
  "productIds": [10, 20]
}
```

#### 获取最优优惠券推荐
```http
GET /api/v1/coupons/best?amount=100&categoryIds=1,2&productIds=10,20
Authorization: Bearer {token}
```

### 订单相关

#### 创建订单
```http
POST /api/v1/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "originalAmount": 100.00,
  "couponCode": "CPN123456789",
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

#### 处理支付
```http
POST /api/v1/orders/{orderId}/pay
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "alipay",
  "transactionId": "TXN123456789"
}
```

#### 获取支付状态
```http
GET /api/v1/orders/{orderId}/status
Authorization: Bearer {token}
```

### 退款相关

#### 创建退款申请
```http
POST /api/v1/refunds
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 1,
  "refundAmount": 90.00,
  "refundReason": "商品质量问题",
  "couponRefundType": "restore"
}
```

#### 获取退款列表
```http
GET /api/v1/refunds
Authorization: Bearer {token}
```

## 数据库设计

### 主要数据表

1. **users** - 用户表
2. **coupon_templates** - 优惠券模板表
3. **user_coupons** - 用户优惠券表
4. **orders** - 订单表
5. **refunds** - 退款表

详细的数据库设计请查看 `database/schema.sql` 文件。

## 业务流程

### 优惠券发放流程
1. 创建优惠券模板
2. 设置发放规则和限制
3. 批量发放或用户主动领取
4. 系统验证发放条件
5. 生成用户优惠券记录

### 优惠券使用流程
1. 用户创建订单
2. 选择要使用的优惠券
3. 系统验证优惠券有效性
4. 计算折扣金额
5. 更新订单金额
6. 处理支付
7. 标记优惠券为已使用

### 退款处理流程
1. 用户申请退款
2. 系统验证退款条件
3. 管理员审核退款
4. 调用支付网关退款
5. 处理优惠券恢复/作废
6. 更新订单状态

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t coupon-system .

# 运行容器
docker run -d \
  --name coupon-system \
  -p 3000:3000 \
  -e DB_HOST=mysql \
  -e DB_PASSWORD=password \
  coupon-system
```

### PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name coupon-system

# 查看状态
pm2 status

# 查看日志
pm2 logs coupon-system
```

## 监控和日志

系统使用 Winston 进行日志记录，日志文件存储在 `logs/` 目录下：

- `error.log` - 错误日志
- `combined.log` - 综合日志

可以通过环境变量 `LOG_LEVEL` 设置日志级别。

## 安全考虑

1. **认证和授权**：使用 JWT 进行用户认证
2. **输入验证**：使用 Joi 进行请求参数验证
3. **速率限制**：防止 API 滥用
4. **SQL 注入防护**：使用 Sequelize ORM
5. **XSS 防护**：使用 Helmet 中间件
6. **CORS 配置**：限制跨域访问

## 性能优化

1. **数据库索引**：为常用查询字段添加索引
2. **连接池**：使用数据库连接池
3. **缓存**：可集成 Redis 进行缓存
4. **分页查询**：大数据量查询使用分页
5. **异步处理**：耗时操作使用异步处理

## 扩展功能

### 可扩展的功能点

1. **优惠券分享**：用户可以分享优惠券给好友
2. **积分兑换**：使用积分兑换优惠券
3. **优惠券组合**：多张优惠券叠加使用
4. **地理位置限制**：基于地理位置的优惠券
5. **A/B 测试**：不同优惠券策略的效果测试
6. **实时通知**：优惠券到期提醒、新券发放通知
7. **数据分析**：优惠券使用效果分析和报表

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱：your-email@example.com
- GitHub Issues：[项目地址](https://github.com/your-username/coupon-system)

---

## 更新日志

### v1.0.0 (2023-12-01)
- 初始版本发布
- 实现基础的优惠券发放、使用、退款功能
- 完整的 API 接口和文档
- 单元测试和集成测试覆盖