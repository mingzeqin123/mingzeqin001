# 优惠券系统

一套完整的优惠券系统，支持优惠券的发放、领取、使用、付款、退款等核心功能。

## 功能特性

### 核心功能
- **优惠券管理**: 创建、查询、更新、删除优惠券
- **用户优惠券**: 用户领取、查询、使用优惠券
- **订单管理**: 创建订单、使用优惠券、计算价格
- **支付处理**: 支付记录、支付状态管理
- **退款处理**: 退款申请、退款处理、优惠券退款

### 优惠券类型
- **固定金额**: 满减优惠券（如：满100减20）
- **百分比折扣**: 按比例折扣（如：8折优惠，最高减50元）
- **免运费**: 满足条件免运费

### 业务规则
- 优惠券有效期管理
- 每用户领取限制
- 订单金额门槛
- 库存管理
- 退款时间限制

## 技术栈

- **后端框架**: FastAPI
- **数据库**: SQLAlchemy (支持SQLite/MySQL/PostgreSQL)
- **数据验证**: Pydantic
- **API文档**: 自动生成Swagger文档

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置数据库

默认使用SQLite数据库，如需使用其他数据库，请修改 `database.py` 中的 `DATABASE_URL`。

```python
# 使用MySQL
DATABASE_URL = "mysql+pymysql://user:password@localhost/coupon_system"

# 使用PostgreSQL
DATABASE_URL = "postgresql://user:password@localhost/coupon_system"
```

### 3. 启动服务

```bash
python api.py
```

服务将在 `http://localhost:8000` 启动。

### 4. 查看API文档

访问 `http://localhost:8000/docs` 查看自动生成的API文档。

## API接口

### 优惠券管理

#### 创建优惠券
```http
POST /coupons/
Content-Type: application/json

{
    "name": "新用户专享优惠券",
    "description": "新用户注册即可领取，满100减20",
    "type": "fixed_amount",
    "discount_value": 20.00,
    "min_order_amount": 100.00,
    "total_quantity": 1000,
    "per_user_limit": 1,
    "valid_from": "2024-01-01T00:00:00",
    "valid_until": "2024-01-31T23:59:59"
}
```

#### 查询优惠券列表
```http
GET /coupons/?status=active&page=1&page_size=20
```

#### 更新优惠券
```http
PUT /coupons/{coupon_id}
Content-Type: application/json

{
    "name": "更新后的优惠券名称",
    "status": "inactive"
}
```

### 用户优惠券

#### 领取优惠券
```http
POST /users/{user_id}/coupons/claim?coupon_code=COUPON123
```

#### 查询用户优惠券
```http
GET /users/{user_id}/coupons/?status=available&page=1&page_size=20
```

#### 查询可用优惠券
```http
GET /users/{user_id}/coupons/available?order_amount=150.00
```

### 订单管理

#### 创建订单
```http
POST /orders/
Content-Type: application/json

{
    "user_id": 1001,
    "items": [
        {
            "product_id": 1001,
            "product_name": "iPhone 15",
            "quantity": 1,
            "unit_price": 5999.00
        }
    ],
    "user_coupon_id": 123
}
```

#### 查询订单
```http
GET /orders/{order_id}
```

#### 取消订单
```http
POST /orders/{order_id}/cancel?user_id=1001
```

### 支付处理

#### 创建支付
```http
POST /payments/
Content-Type: application/json

{
    "order_id": 123,
    "payment_method": "alipay",
    "payment_channel": "web"
}
```

#### 处理支付成功
```http
POST /payments/{payment_id}/success?transaction_id=ALIPAY_123456
```

#### 处理支付失败
```http
POST /payments/{payment_id}/failure?failure_reason=余额不足
```

### 退款处理

#### 创建退款申请
```http
POST /refunds/
Content-Type: application/json

{
    "order_id": 123,
    "refund_type": "full",
    "reason": "商品质量问题，要求退款",
    "refund_method": "alipay"
}
```

#### 处理退款
```http
POST /refunds/{refund_id}/process?transaction_id=REFUND_123456
```

#### 拒绝退款
```http
POST /refunds/{refund_id}/reject?reason=不符合退款条件
```

## 数据库模型

### 核心表结构

#### coupons (优惠券表)
- `id`: 主键
- `code`: 优惠券代码（唯一）
- `name`: 优惠券名称
- `type`: 优惠券类型（fixed_amount/percentage/free_shipping）
- `discount_value`: 折扣值
- `min_order_amount`: 最低订单金额
- `max_discount_amount`: 最大折扣金额
- `total_quantity`: 总发放数量
- `used_quantity`: 已使用数量
- `per_user_limit`: 每用户限领数量
- `valid_from`: 有效期开始
- `valid_until`: 有效期结束
- `status`: 优惠券状态

#### user_coupons (用户优惠券表)
- `id`: 主键
- `user_id`: 用户ID
- `coupon_id`: 优惠券ID
- `status`: 用户优惠券状态
- `used_at`: 使用时间
- `order_id`: 使用的订单ID

#### orders (订单表)
- `id`: 主键
- `order_no`: 订单号（唯一）
- `user_id`: 用户ID
- `subtotal`: 商品小计
- `discount_amount`: 优惠金额
- `shipping_fee`: 运费
- `total_amount`: 订单总金额
- `status`: 订单状态

#### payments (支付记录表)
- `id`: 主键
- `payment_no`: 支付单号（唯一）
- `order_id`: 订单ID
- `amount`: 支付金额
- `payment_method`: 支付方式
- `status`: 支付状态

#### refunds (退款记录表)
- `id`: 主键
- `refund_no`: 退款单号（唯一）
- `payment_id`: 支付ID
- `refund_amount`: 退款金额
- `refund_reason`: 退款原因
- `status`: 退款状态

## 业务规则

### 优惠券规则
- 优惠券有效期最长1年
- 每用户每种优惠券最多领取10张
- 固定金额优惠券最大折扣10000元
- 百分比优惠券必须设置最大折扣金额

### 订单规则
- 订单金额最大100万元
- 订单创建后30分钟内可取消
- 订单商品数量最大100个

### 支付规则
- 支付超时时间30分钟
- 支持支付宝、微信、银行卡、余额支付

### 退款规则
- 支付后7天内可申请退款
- 退款原因不能超过500字符
- 每天最多申请5次退款

## 使用示例

运行示例代码：

```bash
python example_usage.py
```

示例包含：
- 优惠券创建和管理
- 用户优惠券领取和使用
- 订单创建和支付
- 退款申请和处理
- 业务规则验证

## 部署建议

### 生产环境配置
1. 使用MySQL或PostgreSQL数据库
2. 配置Redis缓存
3. 设置数据库连接池
4. 配置日志记录
5. 添加监控和告警

### 安全考虑
1. 添加用户认证和授权
2. 实现API限流
3. 敏感数据加密
4. 输入验证和SQL注入防护

### 性能优化
1. 数据库索引优化
2. 查询优化
3. 缓存热点数据
4. 异步处理耗时操作

## 扩展功能

### 可扩展的功能
- 优惠券模板系统
- 批量发放优惠券
- 优惠券使用统计
- 营销活动管理
- 积分系统集成
- 消息通知系统

### 监控和运维
- 系统健康检查
- 性能监控
- 错误日志收集
- 自动化部署

## 许可证

MIT License