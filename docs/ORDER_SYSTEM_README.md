# 微信小程序订单管理系统

## 📋 项目概述

本项目是一个完整的微信小程序订单管理系统，提供了从商品浏览、购物车管理到订单处理的完整电商流程。系统采用模块化设计，具有良好的可扩展性和维护性。

## 🏗️ 系统架构

### 技术栈
- **前端**: 微信小程序原生框架
- **后端**: Node.js (模拟API层)
- **数据存储**: 内存存储 (可扩展为数据库)
- **测试**: Jest 测试框架

### 架构层次
```
┌─────────────────────────────────────┐
│              前端界面层               │
├─────────────────────────────────────┤
│              API接口层               │
├─────────────────────────────────────┤
│              业务逻辑层               │
├─────────────────────────────────────┤
│              数据模型层               │
└─────────────────────────────────────┘
```

## 🚀 核心功能

### 1. 购物车管理
- ✅ 添加商品到购物车
- ✅ 更新商品数量
- ✅ 删除购物车商品
- ✅ 批量选择/取消选择
- ✅ 购物车统计信息

### 2. 订单管理
- ✅ 创建订单
- ✅ 订单支付
- ✅ 订单状态流转
- ✅ 取消订单
- ✅ 确认收货
- ✅ 订单查询

### 3. 商品管理
- ✅ 商品信息展示
- ✅ 库存管理
- ✅ 价格管理
- ✅ SKU规格管理

### 4. 用户管理
- ✅ 收货地址管理
- ✅ 订单历史
- ✅ 用户权限控制

## 📁 项目结构

```
├── models/                 # 数据模型
│   ├── order.js           # 订单相关模型
│   └── product.js         # 商品相关模型
├── services/              # 业务服务层
│   └── orderService.js    # 订单业务逻辑
├── api/                   # API接口层
│   └── orderApi.js        # 订单API接口
├── pages/                 # 小程序页面
│   ├── orders/            # 订单列表页面
│   └── cart/              # 购物车页面
├── tests/                 # 测试用例
│   ├── orderService.test.js
│   ├── orderApi.test.js
│   └── order.model.test.js
└── docs/                  # 文档
    └── ORDER_SYSTEM_README.md
```

## 🔧 快速开始

### 环境要求
- Node.js 14+
- 微信开发者工具
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 运行测试
```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 代码检查
```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix
```

## 📊 数据模型

### 订单模型 (Order)
```javascript
{
  id: String,              // 订单ID
  orderNo: String,         // 订单号
  userId: String,          // 用户ID
  status: String,          // 订单状态
  items: Array,            // 订单商品列表
  totalAmount: Number,     // 商品总金额
  discountAmount: Number,  // 优惠金额
  shippingFee: Number,     // 运费
  finalAmount: Number,     // 实付金额
  paymentMethod: String,   // 支付方式
  shippingAddress: Object, // 收货地址
  createTime: String,      // 创建时间
  expireTime: String       // 过期时间
}
```

### 购物车模型 (CartItem)
```javascript
{
  id: String,              // 购物车项ID
  userId: String,          // 用户ID
  productId: String,       // 商品ID
  skuId: String,          // SKU ID
  productName: String,     // 商品名称
  price: Number,           // 商品价格
  quantity: Number,        // 数量
  selected: Boolean        // 是否选中
}
```

### 商品模型 (Product)
```javascript
{
  id: String,              // 商品ID
  name: String,            // 商品名称
  price: Number,           // 商品价格
  stock: Number,           // 库存数量
  images: Array,           // 商品图片
  specifications: Array,   // 规格信息
  status: String           // 商品状态
}
```

## 🔄 订单状态流转

```
待付款 (pending) → 已付款 (paid) → 处理中 (processing) → 已发货 (shipped) → 已送达 (delivered)
    ↓                ↓                    ↓
已取消 (cancelled)  已退款 (refunded)  已取消 (cancelled)
```

### 状态说明
- **pending**: 订单已创建，等待用户付款
- **paid**: 用户已付款，等待商家处理
- **processing**: 商家正在处理订单
- **shipped**: 订单已发货，等待用户确认收货
- **delivered**: 用户已确认收货，订单完成
- **cancelled**: 订单已取消
- **refunded**: 订单已退款

## 🛡️ 安全机制

### 1. 用户权限控制
- 用户只能访问自己的订单和购物车
- 管理员接口需要权限验证
- 敏感操作需要用户确认

### 2. 数据验证
- 所有输入数据进行格式验证
- 商品库存实时检查
- 订单金额重新计算验证

### 3. 状态控制
- 订单状态流转严格按照业务规则
- 防止无效的状态转换
- 关键操作记录日志

## 🧪 测试策略

### 测试覆盖范围
- **单元测试**: 模型类、服务类、API类
- **集成测试**: 完整业务流程测试
- **错误处理测试**: 异常情况处理

### 测试用例
- ✅ 购物车增删改查
- ✅ 订单创建和状态流转
- ✅ 支付流程测试
- ✅ 库存管理测试
- ✅ 权限控制测试
- ✅ 错误处理测试

### 运行测试
```bash
# 运行所有测试
npm test

# 查看测试覆盖率
npm run test:coverage
```

## 📱 页面功能

### 订单列表页面 (/pages/orders/)
- 订单状态筛选
- 订单列表展示
- 订单操作按钮
- 分页加载
- 下拉刷新

### 购物车页面 (/pages/cart/)
- 商品列表展示
- 数量修改
- 批量选择
- 结算功能
- 编辑模式

## 🔌 API 接口

### 订单相关接口
```
POST   /api/orders              # 创建订单
GET    /api/orders              # 获取订单列表
GET    /api/orders/:id          # 获取订单详情
POST   /api/orders/:id/pay      # 支付订单
POST   /api/orders/:id/cancel   # 取消订单
POST   /api/orders/:id/confirm  # 确认收货
```

### 购物车相关接口
```
POST   /api/cart/add            # 添加到购物车
GET    /api/cart               # 获取购物车
PUT    /api/cart/:productId    # 更新商品数量
DELETE /api/cart/:productId    # 删除购物车商品
POST   /api/cart/:productId/toggle # 切换选中状态
```

### 管理员接口
```
GET    /api/admin/orders        # 获取所有订单
PUT    /api/admin/orders/:id/status # 更新订单状态
```

## 🚀 部署指南

### 开发环境
1. 克隆项目到本地
2. 安装依赖: `npm install`
3. 用微信开发者工具打开项目
4. 配置AppID和服务器域名
5. 编译运行

### 生产环境
1. 配置真实的后端API服务
2. 配置数据库连接
3. 设置支付接口
4. 配置域名和SSL证书
5. 提交微信小程序审核

## 🔄 扩展功能

### 可扩展的功能模块
- 🔲 优惠券系统
- 🔲 积分系统
- 🔲 会员等级
- 🔲 商品评价
- 🔲 物流跟踪
- 🔲 售后服务
- 🔲 营销活动
- 🔲 数据统计

### 技术优化
- 🔲 数据库集成 (MySQL/MongoDB)
- 🔲 Redis缓存
- 🔲 消息队列
- 🔲 微服务架构
- 🔲 CDN加速
- 🔲 性能监控

## 📞 技术支持

### 常见问题
1. **订单创建失败**: 检查购物车是否有选中商品，商品库存是否充足
2. **支付失败**: 检查支付配置和网络连接
3. **状态更新失败**: 检查状态流转规则是否正确

### 联系方式
- 技术文档: [项目Wiki](https://github.com/your-repo/wiki)
- 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱支持: support@yourcompany.com

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](../LICENSE) 文件。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📈 版本历史

### v1.0.0 (2024-01-15)
- ✅ 完整的订单管理系统
- ✅ 购物车功能
- ✅ 用户权限控制
- ✅ 完整的测试覆盖
- ✅ API接口文档

---

**感谢使用微信小程序订单管理系统！** 🎉