# WebSocket聊天功能

这是一个基于WebSocket的实时聊天应用，包含服务端和微信小程序客户端。

## 功能特性

### 🚀 核心功能
- **实时消息** - 基于WebSocket的即时通信
- **多房间支持** - 用户可以加入不同的聊天房间
- **用户管理** - 显示在线用户列表
- **输入状态** - 显示正在输入的用户
- **消息历史** - 保存和显示聊天历史
- **自动重连** - 网络断开时自动重连

### 📱 微信小程序功能
- **登录页面** - 用户名和房间选择
- **聊天界面** - 现代化的聊天UI设计
- **用户列表** - 侧边栏显示在线用户
- **消息操作** - 长按消息可进行删除等操作
- **响应式设计** - 适配不同屏幕尺寸

### 🖥️ 服务端功能
- **Socket.io** - 基于Socket.io的WebSocket服务
- **房间管理** - 动态创建和管理聊天房间
- **消息存储** - 保存房间消息历史
- **REST API** - 提供房间信息查询接口
- **CORS支持** - 支持跨域请求

## 项目结构

```
websocket-chat/
├── websocket-server/          # 服务端代码
│   ├── server.js             # 主服务器文件
│   ├── package.json          # 依赖配置
│   └── start.sh              # 启动脚本
├── pages/                    # 微信小程序页面
│   ├── login/                # 登录页面
│   │   ├── login.js
│   │   ├── login.wxml
│   │   ├── login.wxss
│   │   └── login.json
│   └── chat/                 # 聊天页面
│       ├── chat.js
│       ├── chat.wxml
│       ├── chat.wxss
│       └── chat.json
├── utils/                    # 工具库
│   └── socket.io.min.js      # Socket.io客户端库
└── websocket-chat-README.md  # 说明文档
```

## 快速开始

### 1. 启动服务端

```bash
# 进入服务端目录
cd websocket-server

# 运行启动脚本
./start.sh

# 或者手动启动
npm install
npm start
```

服务端将在 `http://localhost:3000` 启动

### 2. 配置微信小程序

1. 在微信开发者工具中打开项目
2. 确保 `app.json` 中已添加登录和聊天页面
3. 修改 `pages/chat/chat.js` 中的服务器地址（如果需要）

### 3. 使用聊天功能

1. 打开微信小程序
2. 在登录页面输入用户名和选择房间
3. 点击"进入聊天室"开始聊天

## API接口

### WebSocket事件

#### 客户端发送事件
- `join` - 加入房间
  ```javascript
  socket.emit('join', {
    username: '用户名',
    room: '房间名'
  });
  ```

- `sendMessage` - 发送消息
  ```javascript
  socket.emit('sendMessage', {
    content: '消息内容',
    type: 'text'
  });
  ```

- `typing` - 输入状态
  ```javascript
  socket.emit('typing', {
    isTyping: true/false
  });
  ```

#### 服务端发送事件
- `connect` - 连接成功
- `disconnect` - 连接断开
- `newMessage` - 新消息
- `userJoined` - 用户加入
- `userLeft` - 用户离开
- `userList` - 用户列表更新
- `userTyping` - 用户输入状态
- `roomHistory` - 房间历史消息

### REST API

- `GET /api/rooms` - 获取房间列表
- `GET /api/rooms/:roomName` - 获取房间详情

## 配置说明

### 服务端配置

在 `websocket-server/server.js` 中可以修改：

```javascript
const PORT = process.env.PORT || 3000;  // 端口号
const maxMessages = 100;                // 房间最大消息数
const maxReconnectAttempts = 5;         // 最大重连次数
```

### 客户端配置

在 `pages/chat/chat.js` 中可以修改：

```javascript
// 服务器地址
this.socket = io('http://localhost:3000', {
  transports: ['websocket']
});
```

## 技术栈

### 服务端
- **Node.js** - JavaScript运行时
- **Express** - Web框架
- **Socket.io** - WebSocket库
- **CORS** - 跨域支持

### 客户端
- **微信小程序** - 前端框架
- **Socket.io Client** - WebSocket客户端
- **WXML/WXSS** - 页面结构和样式

## 部署说明

### 服务端部署

1. 上传 `websocket-server` 目录到服务器
2. 安装Node.js和npm
3. 运行 `npm install` 安装依赖
4. 运行 `npm start` 启动服务
5. 配置反向代理（如Nginx）

### 小程序部署

1. 在微信开发者工具中上传代码
2. 修改服务器地址为生产环境地址
3. 提交审核并发布

## 注意事项

1. **网络配置** - 确保服务器端口可访问
2. **HTTPS要求** - 生产环境需要HTTPS
3. **域名配置** - 小程序需要配置合法域名
4. **性能优化** - 大量用户时考虑负载均衡

## 扩展功能

可以进一步添加的功能：

- 私聊功能
- 文件传输
- 表情包支持
- 消息加密
- 用户认证
- 消息推送
- 聊天记录导出
- 管理员功能

## 故障排除

### 常见问题

1. **连接失败** - 检查服务器地址和端口
2. **消息不显示** - 检查WebSocket连接状态
3. **用户列表为空** - 检查用户加入逻辑
4. **样式问题** - 检查WXSS文件是否正确加载

### 调试方法

1. 查看控制台日志
2. 检查网络请求
3. 验证WebSocket连接
4. 测试API接口

## 许可证

MIT License