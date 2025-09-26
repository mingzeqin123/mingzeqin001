# 用户注册自动邮件发送系统

这是一个完整的用户注册系统，当用户注册成功后，系统会自动发送包含用户名、随机密码和登录地址的邮件。

## 🌟 功能特性

- ✅ 用户注册表单验证
- ✅ 自动生成随机密码
- ✅ 发送精美的HTML邮件
- ✅ 包含用户名、密码、登录地址
- ✅ 响应式前端界面
- ✅ 错误处理和用户反馈
- ✅ 邮件模板美观专业

## 🚀 快速开始

### 1. 环境要求

- Node.js (版本 14 或更高)
- npm 或 yarn
- 邮件服务账户 (Gmail, Outlook, 等)

### 2. 安装和配置

```bash
# 1. 安装依赖
cd backend
npm install

# 2. 配置邮件服务
cp .env.example .env
# 编辑 .env 文件，填入您的邮件服务信息
```

### 3. 配置邮件服务

编辑 `backend/.env` 文件：

```env
# Gmail 配置示例
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# 系统配置
PORT=3000
SYSTEM_LOGIN_URL=https://your-platform.com/login
SYSTEM_NAME=您的平台名称
```

**重要提示：**
- 对于Gmail，需要使用应用专用密码，不是您的登录密码
- 需要在Gmail中启用"两步验证"并生成应用专用密码

### 4. 启动服务

```bash
# 使用启动脚本
./start-server.sh

# 或手动启动
cd backend
npm start
```

### 5. 访问前端

打开 `frontend/index.html` 文件在浏览器中访问注册页面。

## 📧 邮件模板

系统会发送包含以下信息的精美邮件：

- 🎉 欢迎信息
- 👤 用户名
- 🔑 随机生成的密码
- 🌐 登录地址
- 📋 使用说明
- ⚠️ 安全提示

## 🔧 API 接口

### 用户注册

**POST** `/api/register`

请求体：
```json
{
  "username": "用户名",
  "email": "user@example.com"
}
```

响应：
```json
{
  "success": true,
  "message": "注册成功！账户信息已发送到您的邮箱",
  "data": {
    "username": "用户名",
    "email": "user@example.com",
    "messageId": "邮件ID"
  }
}
```

### 健康检查

**GET** `/api/health`

响应：
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🛠️ 技术栈

### 后端
- **Node.js** - 服务器运行环境
- **Express.js** - Web框架
- **Nodemailer** - 邮件发送库
- **CORS** - 跨域支持
- **dotenv** - 环境变量管理

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式和动画
- **JavaScript (ES6+)** - 交互逻辑
- **响应式设计** - 移动端适配

## 📁 项目结构

```
workspace/
├── backend/
│   ├── package.json          # 依赖配置
│   ├── server.js            # 服务器主文件
│   ├── .env.example         # 环境变量示例
│   └── .env                 # 环境变量配置
├── frontend/
│   └── index.html           # 前端注册页面
├── start-server.sh          # 启动脚本
└── README_EMAIL_SERVICE.md  # 说明文档
```

## 🔒 安全考虑

1. **密码生成**：使用加密安全的随机数生成器
2. **输入验证**：前后端双重验证
3. **错误处理**：不暴露敏感信息
4. **HTTPS**：生产环境建议使用HTTPS
5. **邮件安全**：使用应用专用密码

## 🚨 故障排除

### 邮件发送失败
1. 检查邮件服务配置是否正确
2. 确认应用专用密码是否正确
3. 检查网络连接和防火墙设置
4. 查看服务器日志获取详细错误信息

### 前端无法连接后端
1. 确认后端服务正在运行
2. 检查端口是否被占用
3. 确认CORS配置正确
4. 检查浏览器控制台错误信息

## 📝 自定义配置

### 修改邮件模板
编辑 `backend/server.js` 中的 `sendRegistrationEmail` 函数。

### 修改密码规则
编辑 `generateRandomPassword` 函数中的字符集和长度。

### 修改前端样式
编辑 `frontend/index.html` 中的CSS样式。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License