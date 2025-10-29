# 直播系统后端服务

基于Node.js + Express + Socket.IO + Redis的直播系统后端服务，集成网易云推流平台。

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- Redis 6.0+
- MongoDB 4.4+ (可选)

### 安装依赖

```bash
cd server
npm install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置必要的环境变量：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# 网易云推流配置
NETEASE_APP_KEY=your-netease-app-key
NETEASE_APP_SECRET=your-netease-app-secret
NETEASE_BASE_URL=https://vcloud.163.com
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📁 项目结构

```
server/
├── app.js                 # 应用入口文件
├── package.json           # 依赖配置
├── .env.example          # 环境变量示例
├── routes/               # 路由模块
│   ├── auth.js          # 认证路由
│   ├── live.js          # 直播路由
│   ├── user.js          # 用户路由
│   └── gift.js          # 礼物路由
├── services/            # 服务模块
│   ├── LiveService.js   # 直播服务
│   ├── NeteaseService.js # 网易云服务
│   └── WebSocketService.js # WebSocket服务
└── uploads/             # 文件上传目录
```

## 🔧 核心功能

### 1. 用户认证
- 微信小程序登录
- JWT Token认证
- 用户信息管理

### 2. 直播管理
- 创建/删除直播间
- 开始/停止直播
- 推流地址生成
- 直播状态管理

### 3. 实时通信
- WebSocket连接管理
- 弹幕系统
- 礼物系统
- 用户互动

### 4. 网易云集成
- 推流频道创建
- 推流地址生成
- 直播状态监控
- 录制功能

## 📡 API接口

### 认证接口

#### 微信登录
```
POST /api/auth/wechat-login
```

**请求参数：**
```json
{
  "code": "微信授权码",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

**响应数据：**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "用户ID",
      "nickname": "用户昵称",
      "avatar": "头像URL",
      "level": 1,
      "coins": 100
    },
    "token": "JWT Token"
  }
}
```

### 直播接口

#### 创建直播间
```
POST /api/live/create
```

**请求参数：**
```json
{
  "title": "直播标题",
  "cover": "封面图片URL",
  "hostId": "主播ID",
  "hostInfo": {
    "nickname": "主播昵称",
    "avatar": "主播头像"
  }
}
```

#### 获取推流地址
```
POST /api/live/push-url
```

**请求参数：**
```json
{
  "roomId": "直播间ID",
  "title": "直播标题",
  "cover": "封面图片URL"
}
```

**响应数据：**
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "pushUrl": "推流地址",
    "streamUrl": "拉流地址",
    "hlsUrl": "HLS地址",
    "rtmpUrl": "RTMP地址"
  }
}
```

#### 开始直播
```
POST /api/live/start
```

#### 停止直播
```
POST /api/live/stop
```

#### 获取直播列表
```
GET /api/live/rooms?page=1&limit=20
```

### 用户接口

#### 获取用户信息
```
GET /api/user/info/:userId
```

#### 更新用户信息
```
PUT /api/user/info/:userId
```

### 礼物接口

#### 获取礼物列表
```
GET /api/gift/list
```

#### 发送礼物
```
POST /api/gift/send
```

## 🔌 WebSocket事件

### 客户端事件

#### 加入直播间
```javascript
socket.emit('join_room', {
  roomId: '直播间ID',
  userId: '用户ID',
  userInfo: {
    nickname: '用户昵称',
    avatar: '用户头像'
  }
});
```

#### 发送弹幕
```javascript
socket.emit('send_danmaku', {
  content: '弹幕内容',
  color: '#ffffff'
});
```

#### 发送礼物
```javascript
socket.emit('send_gift', {
  giftId: '礼物ID',
  giftName: '礼物名称',
  giftValue: 10
});
```

### 服务端事件

#### 用户加入
```javascript
socket.on('user_joined', (data) => {
  console.log('用户加入:', data);
});
```

#### 弹幕消息
```javascript
socket.on('danmaku', (data) => {
  console.log('收到弹幕:', data);
});
```

#### 礼物消息
```javascript
socket.on('gift', (data) => {
  console.log('收到礼物:', data);
});
```

## 🛠️ 开发指南

### 添加新功能

1. 在 `routes/` 目录下创建新的路由文件
2. 在 `services/` 目录下创建对应的服务类
3. 在 `app.js` 中注册路由

### 数据库操作

本系统使用Redis作为主要数据存储，支持以下操作：

```javascript
// 设置数据
await redisClient.hSet('key', data);

// 获取数据
const data = await redisClient.hGetAll('key');

// 删除数据
await redisClient.del('key');
```

### 错误处理

所有API接口都遵循统一的错误响应格式：

```json
{
  "code": 错误码,
  "message": "错误信息",
  "data": null
}
```

## 🚀 部署指南

### Docker部署

1. 创建Dockerfile：
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. 构建镜像：
```bash
docker build -t live-streaming-server .
```

3. 运行容器：
```bash
docker run -d -p 3000:3000 --name live-server live-streaming-server
```

### PM2部署

1. 安装PM2：
```bash
npm install -g pm2
```

2. 创建PM2配置文件：
```json
{
  "apps": [{
    "name": "live-streaming-server",
    "script": "app.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

3. 启动服务：
```bash
pm2 start ecosystem.config.json
```

## 📊 监控和日志

### 健康检查

访问 `/health` 端点检查服务状态：

```bash
curl http://localhost:3000/health
```

### 日志管理

使用Morgan中间件记录HTTP请求日志，支持以下格式：
- combined
- common
- dev
- short
- tiny

### 性能监控

建议使用以下工具监控服务性能：
- PM2监控
- Redis监控
- 系统资源监控

## 🔒 安全配置

### JWT配置

确保JWT密钥足够复杂，建议使用随机生成的字符串：

```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### CORS配置

根据实际需求配置CORS策略：

```javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

### 限流配置

使用express-rate-limit限制API请求频率：

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});

app.use('/api/', limiter);
```

## 🐛 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务是否启动
   - 验证连接配置是否正确

2. **网易云API调用失败**
   - 检查AppKey和AppSecret是否正确
   - 验证网络连接是否正常

3. **WebSocket连接失败**
   - 检查端口是否被占用
   - 验证防火墙设置

### 调试模式

设置环境变量启用调试模式：

```bash
DEBUG=* npm run dev
```

## 📝 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 实现基础直播功能
- 集成网易云推流平台
- 支持微信小程序登录
- 实现实时弹幕和礼物系统

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱：your-email@example.com