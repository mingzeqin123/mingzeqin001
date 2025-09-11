# 开票系统使用指南

## 📋 系统概述

本开票系统是一个完整的微信小程序发票管理解决方案，支持普通发票和专用发票的开具、管理、查询等功能。

## 🚀 功能特性

### 核心功能
- **发票管理**：创建、编辑、删除、查看发票
- **客户管理**：客户信息维护和选择
- **发票预览**：实时预览发票样式
- **状态管理**：草稿、待开票、已开票、已作废状态流转
- **搜索筛选**：支持多条件搜索和筛选
- **批量操作**：支持批量处理发票

### 发票类型
- **普通发票**：适用于一般业务场景
- **专用发票**：适用于需要抵扣税款的场景

### 发票状态
- **草稿**：未提交的发票，可编辑
- **待开票**：已提交待处理的发票
- **已开票**：已成功开具的发票
- **已作废**：已作废的发票

## 📱 页面结构

```
pages/invoice/
├── invoice/              # 发票列表页
│   ├── invoice.js
│   ├── invoice.wxml
│   ├── invoice.wxss
│   └── invoice.json
├── create/               # 创建发票页
│   ├── create.js
│   ├── create.wxml
│   ├── create.wxss
│   └── create.json
├── detail/               # 发票详情页
│   ├── detail.js
│   ├── detail.wxml
│   ├── detail.wxss
│   └── detail.json
├── customer/             # 客户管理页
│   ├── customer.js
│   ├── customer.wxml
│   ├── customer.wxss
│   └── customer.json
├── preview/              # 发票预览页
│   ├── preview.js
│   ├── preview.wxml
│   ├── preview.wxss
│   └── preview.json
└── config.js             # 配置文件
```

## 🔧 配置说明

### API配置
```javascript
// 在 config.js 中配置API地址
api: {
  baseUrl: 'https://api.example.com',
  timeout: 10000,
  retryCount: 3
}
```

### 权限配置
```javascript
// 配置用户权限
permissions: {
  invoice: {
    create: true,
    read: true,
    update: true,
    delete: true,
    print: true,
    download: true
  }
}
```

## 📖 使用流程

### 1. 创建发票
1. 进入发票列表页
2. 点击"创建发票"按钮
3. 填写发票信息：
   - 选择发票类型（普通/专用）
   - 填写客户信息
   - 填写开票内容
   - 设置金额和税率
   - 添加备注（可选）
4. 保存草稿或直接提交

### 2. 管理发票
1. 在发票列表页查看所有发票
2. 使用搜索和筛选功能快速定位
3. 点击发票查看详情
4. 根据状态执行相应操作

### 3. 客户管理
1. 在创建发票时选择客户
2. 可以添加新客户信息
3. 客户信息会自动保存供下次使用

## 🎨 界面说明

### 发票列表页
- **搜索栏**：支持按发票号、客户名称搜索
- **标签页**：按状态筛选发票
- **筛选器**：高级筛选条件
- **发票卡片**：显示发票基本信息
- **操作按钮**：编辑、删除等操作

### 创建发票页
- **发票类型**：选择普通或专用发票
- **客户信息**：填写或选择客户
- **开票信息**：填写开票内容和金额
- **自动计算**：税额和总金额自动计算
- **操作按钮**：保存草稿、提交发票

### 发票详情页
- **状态显示**：当前发票状态
- **详细信息**：完整的发票信息
- **操作记录**：发票操作历史
- **操作按钮**：根据状态显示可用操作

## 🔌 API接口

### 发票相关接口
```javascript
// 获取发票列表
GET /api/invoices?page=1&pageSize=10&status=pending

// 获取发票详情
GET /api/invoices/{id}

// 创建发票
POST /api/invoices
{
  "customerName": "客户名称",
  "invoiceType": "normal",
  "amount": 1000.00,
  "taxRate": 0.13
}

// 更新发票
PUT /api/invoices/{id}

// 删除发票
DELETE /api/invoices/{id}

// 更新发票状态
PUT /api/invoices/{id}/status
{
  "status": "completed"
}
```

### 客户相关接口
```javascript
// 获取客户列表
GET /api/customers?keyword=客户名称

// 创建客户
POST /api/customers
{
  "name": "客户名称",
  "taxNumber": "纳税人识别号",
  "phone": "联系电话"
}
```

## 🛠️ 开发说明

### 环境要求
- 微信开发者工具 1.05.0+
- 小程序基础库 2.9.0+
- Node.js 12.0+（用于构建工具）

### 安装步骤
1. 克隆项目到本地
2. 使用微信开发者工具打开项目
3. 配置API接口地址
4. 编译并预览

### 自定义配置
1. 修改 `config.js` 文件调整系统配置
2. 修改样式文件自定义界面外观
3. 扩展API接口支持更多功能

## 📊 数据结构

### 发票数据模型
```javascript
{
  id: "发票ID",
  invoiceNumber: "发票号码",
  invoiceType: "发票类型",
  status: "发票状态",
  customerName: "客户名称",
  customerTaxNumber: "纳税人识别号",
  customerAddress: "客户地址",
  customerPhone: "联系电话",
  customerBank: "开户银行",
  customerAccount: "银行账号",
  invoiceContent: "开票内容",
  amount: "开票金额",
  taxRate: "税率",
  taxAmount: "税额",
  totalAmount: "价税合计",
  invoiceDate: "开票日期",
  remark: "备注",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

### 客户数据模型
```javascript
{
  id: "客户ID",
  name: "客户名称",
  taxNumber: "纳税人识别号",
  address: "客户地址",
  phone: "联系电话",
  email: "邮箱地址",
  bank: "开户银行",
  account: "银行账号",
  createTime: "创建时间",
  updateTime: "更新时间"
}
```

## 🔒 安全说明

### 数据安全
- 所有API请求都需要身份验证
- 敏感信息传输使用HTTPS加密
- 用户数据本地存储加密

### 权限控制
- 基于角色的权限管理
- 操作权限细粒度控制
- 数据访问权限验证

## 🐛 常见问题

### Q: 如何修改API接口地址？
A: 在 `config.js` 文件中修改 `api.baseUrl` 配置。

### Q: 如何自定义发票样式？
A: 修改 `preview.wxss` 文件中的样式定义。

### Q: 如何添加新的发票状态？
A: 在 `config.js` 中的 `invoice.status` 和 `invoice.statusText` 添加新状态。

### Q: 如何扩展客户字段？
A: 修改客户相关的页面和API接口，添加新字段。

## 📞 技术支持

如有问题或建议，请联系开发团队：
- 邮箱：support@example.com
- 电话：400-123-4567
- 微信：InvoiceSupport

## 📄 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持普通发票和专用发票
- 完整的发票管理功能
- 客户管理功能
- 发票预览功能

---

⭐ 如果这个开票系统对您有帮助，请给个星星支持一下！