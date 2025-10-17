# 微信小程序订单管理系统

## 📋 项目简介

这是一个功能完整的微信小程序订单管理系统，基于原有的跳一跳游戏项目扩展而来。系统提供了完整的电商功能，包括商品管理、购物车、订单处理、支付集成等核心功能。

## ✨ 主要特性

### 🛍️ 核心功能
- **购物车管理**: 添加商品、数量调整、批量操作
- **订单系统**: 订单创建、状态流转、支付处理
- **商品管理**: 商品展示、库存管理、SKU规格
- **用户管理**: 收货地址、订单历史、权限控制
- **支付集成**: 微信支付、支付回调处理
- **状态管理**: 完整的订单状态流转机制

### 🎮 原有功能
- **3D跳一跳游戏**: 使用Three.js实现的3D小游戏
- **水印功能**: 图片水印添加功能
- **用户系统**: 微信登录、用户信息管理

### 🏗️ 技术特点
- **模块化设计**: 清晰的代码结构和模块划分
- **完整测试**: 单元测试、集成测试、API测试
- **类型安全**: 完善的数据模型和验证机制
- **错误处理**: 全面的异常处理和用户友好提示
- **性能优化**: 分页加载、缓存机制、资源优化

## 🚀 快速开始

### 环境要求
- 微信开发者工具 1.05.0+
- Node.js 14.0+
- 小程序基础库 2.9.0+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <项目地址>
   cd wechat-miniprogram-order-system
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置小程序**
   - 用微信开发者工具打开项目
   - 配置AppID和服务器域名
   - 添加必要的图片资源

4. **运行测试**
   ```bash
   npm test
   ```

5. **启动开发**
   - 在微信开发者工具中编译
   - 在模拟器或真机上预览

## 📁 项目结构

```
├── models/                 # 数据模型层
│   ├── order.js           # 订单相关模型
│   └── product.js         # 商品相关模型
├── services/              # 业务逻辑层
│   └── orderService.js    # 订单业务服务
├── api/                   # API接口层
│   └── orderApi.js        # 订单API接口
├── pages/                 # 小程序页面
│   ├── game/              # 游戏页面
│   ├── watermark/         # 水印页面
│   ├── orders/            # 订单列表页面
│   └── cart/              # 购物车页面
├── utils/                 # 工具函数
│   └── watermark.js       # 水印工具
├── tests/                 # 测试用例
│   ├── orderService.test.js
│   ├── orderApi.test.js
│   └── order.model.test.js
├── docs/                  # 项目文档
│   ├── ORDER_SYSTEM_README.md
│   ├── API_DOCUMENTATION.md
│   └── DEPLOYMENT_GUIDE.md
├── images/                # 图片资源
├── sounds/                # 音频资源
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
├── app.wxss               # 全局样式
└── package.json           # 项目配置
```

## 🎯 功能模块

### 订单管理
- ✅ 订单创建和编辑
- ✅ 订单状态流转 (待付款→已付款→已发货→已完成)
- ✅ 订单取消和退款
- ✅ 订单搜索和筛选
- ✅ 订单详情查看

### 购物车系统
- ✅ 商品添加到购物车
- ✅ 购物车商品管理 (增删改查)
- ✅ 批量选择和操作
- ✅ 购物车统计和结算
- ✅ 商品规格选择

### 商品管理
- ✅ 商品信息展示
- ✅ 商品分类管理
- ✅ SKU规格管理
- ✅ 库存实时更新
- ✅ 价格和优惠管理

### 用户功能
- ✅ 微信登录授权
- ✅ 收货地址管理
- ✅ 订单历史查看
- ✅ 个人信息管理

## 🔄 订单状态流转

```
创建订单 → 待付款 → 已付款 → 处理中 → 已发货 → 已完成
   ↓         ↓        ↓        ↓
 取消      取消     退款     取消
```

### 状态说明
- **pending**: 待付款 - 订单已创建，等待用户付款
- **paid**: 已付款 - 用户已付款，等待商家处理
- **processing**: 处理中 - 商家正在处理订单
- **shipped**: 已发货 - 商品已发货，等待用户确认
- **delivered**: 已完成 - 用户确认收货，交易完成
- **cancelled**: 已取消 - 订单被取消
- **refunded**: 已退款 - 订单已退款

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 测试覆盖
- **模型测试**: 数据模型的创建、验证、转换
- **服务测试**: 业务逻辑的完整性和正确性
- **API测试**: 接口的请求响应和错误处理
- **集成测试**: 完整业务流程的端到端测试

## 📱 页面展示

### 订单列表页面
- 订单状态选项卡切换
- 订单信息完整展示
- 操作按钮 (支付、取消、确认收货等)
- 下拉刷新和分页加载

### 购物车页面
- 商品列表展示
- 数量调整控件
- 全选和批量操作
- 价格统计和结算按钮
- 编辑模式切换

### 游戏页面 (原有功能)
- 3D跳一跳游戏
- 分数记录和排行
- 游戏设置和帮助

## 🔌 API接口

### 订单相关
```
POST   /api/orders              # 创建订单
GET    /api/orders              # 获取订单列表  
GET    /api/orders/:id          # 获取订单详情
POST   /api/orders/:id/pay      # 支付订单
POST   /api/orders/:id/cancel   # 取消订单
POST   /api/orders/:id/confirm  # 确认收货
```

### 购物车相关
```
POST   /api/cart/add            # 添加到购物车
GET    /api/cart               # 获取购物车
PUT    /api/cart/:productId    # 更新商品数量
DELETE /api/cart/:productId    # 删除商品
POST   /api/cart/:productId/toggle # 切换选中状态
```

详细的API文档请参考: [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

## 🚀 部署指南

### 开发环境
1. 配置微信开发者工具
2. 设置AppID和服务器域名
3. 添加测试数据和图片资源

### 生产环境
1. 配置真实的后端服务
2. 设置支付接口和回调
3. 配置域名和SSL证书
4. 提交小程序审核

详细的部署指南请参考: [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## 🛡️ 安全机制

- **用户权限**: 用户只能访问自己的数据
- **数据验证**: 所有输入进行严格验证
- **状态控制**: 订单状态流转严格按业务规则
- **支付安全**: 集成微信支付安全机制
- **错误处理**: 友好的错误提示和日志记录

## 📊 性能优化

- **分页加载**: 大列表采用分页机制
- **图片优化**: 图片压缩和懒加载
- **缓存机制**: 合理使用本地缓存
- **代码分割**: 按需加载减少包体积
- **网络优化**: 请求合并和重试机制

## 🔄 扩展功能

### 计划中的功能
- 🔲 优惠券系统
- 🔲 积分和会员系统
- 🔲 商品评价和评分
- 🔲 物流跟踪
- 🔲 售后服务
- 🔲 营销活动
- 🔲 数据统计和分析
- 🔲 消息推送

### 技术优化
- 🔲 数据库集成
- 🔲 Redis缓存
- 🔲 消息队列
- 🔲 微服务架构
- 🔲 CDN加速

## 📄 文档

- [系统设计文档](docs/ORDER_SYSTEM_README.md)
- [API接口文档](docs/API_DOCUMENTATION.md)
- [部署指南](docs/DEPLOYMENT_GUIDE.md)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 支持

- 📧 邮箱: support@example.com
- 📱 微信群: 扫码加入技术交流群
- 🐛 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 文档: [项目Wiki](https://github.com/your-repo/wiki)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🎉 致谢

感谢所有为这个项目做出贡献的开发者！

---

**⭐ 如果这个项目对你有帮助，请给个星星支持一下！**