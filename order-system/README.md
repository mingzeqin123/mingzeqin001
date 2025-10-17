# 订单管理系统

一个功能完整的订单管理系统，包含前端界面、后端API和数据库设计。

## 功能特性

### 🛍️ 商品管理
- 商品列表展示和搜索
- 商品分类管理
- 商品库存管理
- 商品添加、编辑、删除（管理员）

### 📦 订单管理
- 订单创建和查看
- 订单状态管理（待确认、已确认、处理中、已发货、已送达、已取消）
- 订单详情查看
- 订单统计和分析

### 🛒 购物车功能
- 商品添加到购物车
- 购物车商品数量调整
- 购物车结算
- 本地存储购物车数据

### 👤 用户管理
- 用户注册和登录
- 用户信息管理
- 角色权限控制（管理员、员工、客户）

### 🔐 安全特性
- JWT身份验证
- 密码加密存储
- API请求限制
- 输入数据验证

## 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **MySQL** - 数据库
- **JWT** - 身份验证
- **bcryptjs** - 密码加密
- **Joi** - 数据验证

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript (ES6+)** - 交互逻辑
- **Font Awesome** - 图标库

### 数据库
- **MySQL 8.0+** - 关系型数据库
- 支持事务处理
- 外键约束
- 索引优化

## 项目结构

```
order-system/
├── backend/                 # 后端API服务
│   ├── config/             # 配置文件
│   │   └── database.js     # 数据库配置
│   ├── controllers/        # 控制器
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   └── productController.js
│   ├── middleware/         # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   └── validation.js   # 验证中间件
│   ├── models/            # 数据模型
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/            # 路由
│   │   ├── auth.js
│   │   ├── orders.js
│   │   └── products.js
│   ├── .env.example       # 环境变量示例
│   ├── package.json       # 依赖配置
│   └── server.js          # 服务器入口
├── frontend/              # 前端界面
│   ├── js/               # JavaScript文件
│   │   ├── api.js        # API接口
│   │   ├── auth.js       # 认证管理
│   │   ├── products.js   # 商品管理
│   │   ├── orders.js     # 订单管理
│   │   ├── cart.js       # 购物车管理
│   │   └── main.js       # 主应用逻辑
│   ├── styles/           # 样式文件
│   │   └── main.css      # 主样式
│   └── index.html        # 主页面
├── database/             # 数据库文件
│   └── schema.sql        # 数据库结构
└── README.md            # 项目说明
```

## 快速开始

### 1. 环境要求

- Node.js 16.0+
- MySQL 8.0+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 2. 数据库设置

1. 创建MySQL数据库：
```sql
CREATE DATABASE order_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：
```bash
mysql -u root -p order_system < database/schema.sql
```

### 3. 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，设置数据库连接信息
```

4. 启动服务器：
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 前端设置

1. 打开前端页面：
```bash
# 直接打开 frontend/index.html
# 或使用本地服务器
cd frontend
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## API文档

### 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string",
  "phone": "string",
  "address": "string"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### 获取用户信息
```
GET /api/auth/profile
Authorization: Bearer <token>
```

### 商品接口

#### 获取商品列表
```
GET /api/products?page=1&limit=10&category_id=1&search=keyword
```

#### 获取商品详情
```
GET /api/products/:id
```

#### 创建商品（管理员）
```
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "price": "number",
  "stock_quantity": "number",
  "category_id": "number",
  "sku": "string",
  "image_url": "string"
}
```

### 订单接口

#### 创建订单
```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": "number",
      "quantity": "number"
    }
  ],
  "shipping_address": "string",
  "billing_address": "string",
  "payment_method": "string",
  "notes": "string"
}
```

#### 获取订单列表
```
GET /api/orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### 获取订单详情
```
GET /api/orders/:id
Authorization: Bearer <token>
```

#### 更新订单状态（管理员）
```
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "string",
  "notes": "string"
}
```

## 数据库设计

### 主要表结构

#### 用户表 (users)
- id: 主键
- username: 用户名
- email: 邮箱
- password_hash: 密码哈希
- full_name: 姓名
- phone: 电话
- address: 地址
- role: 角色（admin/customer/staff）
- status: 状态（active/inactive/suspended）

#### 商品表 (products)
- id: 主键
- name: 商品名称
- description: 商品描述
- price: 价格
- stock_quantity: 库存数量
- category_id: 分类ID
- sku: 商品编码
- image_url: 图片URL
- status: 状态（active/inactive/discontinued）

#### 订单表 (orders)
- id: 主键
- order_number: 订单号
- user_id: 用户ID
- status: 订单状态
- total_amount: 总金额
- shipping_address: 收货地址
- payment_method: 支付方式
- created_at: 创建时间

#### 订单商品表 (order_items)
- id: 主键
- order_id: 订单ID
- product_id: 商品ID
- quantity: 数量
- unit_price: 单价
- total_price: 小计

## 部署说明

### 生产环境部署

1. **服务器要求**：
   - Ubuntu 20.04+ 或 CentOS 8+
   - Node.js 16.0+
   - MySQL 8.0+
   - Nginx（可选）

2. **部署步骤**：
   ```bash
   # 1. 克隆项目
   git clone <repository-url>
   cd order-system
   
   # 2. 安装后端依赖
   cd backend
   npm install --production
   
   # 3. 配置环境变量
   cp .env.example .env
   # 编辑 .env 文件
   
   # 4. 启动后端服务
   npm start
   
   # 5. 配置Nginx（可选）
   # 将前端文件部署到Web服务器
   ```

3. **使用PM2管理进程**：
   ```bash
   npm install -g pm2
   pm2 start server.js --name "order-system"
   pm2 save
   pm2 startup
   ```

## 开发指南

### 添加新功能

1. **后端**：
   - 在 `models/` 中创建数据模型
   - 在 `controllers/` 中创建控制器
   - 在 `routes/` 中添加路由
   - 在 `middleware/` 中添加中间件（如需要）

2. **前端**：
   - 在 `js/` 中创建功能模块
   - 在 `index.html` 中添加UI元素
   - 在 `styles/main.css` 中添加样式

### 代码规范

- 使用ES6+语法
- 遵循RESTful API设计
- 添加适当的错误处理
- 编写清晰的注释
- 使用有意义的变量名

## 常见问题

### Q: 如何重置管理员密码？
A: 直接在数据库中更新users表的password_hash字段，使用bcrypt加密新密码。

### Q: 如何备份数据？
A: 使用mysqldump命令：
```bash
mysqldump -u root -p order_system > backup.sql
```

### Q: 如何修改端口？
A: 在backend/.env文件中修改PORT变量，或设置环境变量。

### Q: 前端无法连接后端？
A: 检查CORS配置，确保前端URL在后端允许的源列表中。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如有问题，请通过以下方式联系：
- 邮箱: your-email@example.com
- GitHub: https://github.com/your-username/order-system