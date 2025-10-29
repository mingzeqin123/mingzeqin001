const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const liveRoutes = require('./routes/live');
const userRoutes = require('./routes/user');
const giftRoutes = require('./routes/gift');

const LiveService = require('./services/LiveService');
const WebSocketService = require('./services/WebSocketService');
const NeteaseService = require('./services/NeteaseService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/user', userRoutes);
app.use('/api/gift', giftRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 初始化服务
const liveService = new LiveService();
const webSocketService = new WebSocketService(io);
const neteaseService = new NeteaseService();

// 将服务注入到路由中
app.use((req, res, next) => {
  req.liveService = liveService;
  req.webSocketService = webSocketService;
  req.neteaseService = neteaseService;
  next();
});

// WebSocket连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 加入直播间
  socket.on('join_room', (data) => {
    const { roomId, userId, userInfo } = data;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    socket.userInfo = userInfo;
    
    console.log(`用户 ${userId} 加入直播间 ${roomId}`);
    
    // 通知其他用户
    socket.to(roomId).emit('user_joined', {
      userId,
      userInfo,
      timestamp: Date.now()
    });
    
    // 发送当前直播间信息
    liveService.getRoomInfo(roomId).then(roomInfo => {
      socket.emit('room_info', roomInfo);
    });
  });
  
  // 离开直播间
  socket.on('leave_room', () => {
    if (socket.roomId) {
      socket.leave(socket.roomId);
      console.log(`用户 ${socket.userId} 离开直播间 ${socket.roomId}`);
      
      // 通知其他用户
      socket.to(socket.roomId).emit('user_left', {
        userId: socket.userId,
        timestamp: Date.now()
      });
    }
  });
  
  // 发送弹幕
  socket.on('send_danmaku', (data) => {
    if (socket.roomId) {
      const danmaku = {
        id: Date.now(),
        content: data.content,
        user: socket.userInfo.nickname,
        avatar: socket.userInfo.avatar,
        userId: socket.userId,
        timestamp: Date.now(),
        color: data.color || '#ffffff'
      };
      
      // 广播弹幕
      io.to(socket.roomId).emit('danmaku', danmaku);
      
      // 保存弹幕到数据库
      liveService.saveDanmaku(socket.roomId, danmaku);
    }
  });
  
  // 发送礼物
  socket.on('send_gift', (data) => {
    if (socket.roomId) {
      const gift = {
        id: Date.now(),
        giftId: data.giftId,
        giftName: data.giftName,
        giftValue: data.giftValue,
        user: socket.userInfo.nickname,
        avatar: socket.userInfo.avatar,
        userId: socket.userId,
        timestamp: Date.now()
      };
      
      // 广播礼物
      io.to(socket.roomId).emit('gift', gift);
      
      // 保存礼物记录
      liveService.saveGift(socket.roomId, gift);
      
      // 更新主播收益
      liveService.updateHostEarnings(socket.roomId, gift.giftValue);
    }
  });
  
  // 开始直播
  socket.on('start_live', async (data) => {
    if (socket.roomId) {
      try {
        const { title, cover } = data;
        
        // 获取推流地址
        const pushInfo = await neteaseService.getPushUrl(socket.roomId, title);
        
        // 更新直播间状态
        await liveService.startLive(socket.roomId, {
          title,
          cover,
          pushUrl: pushInfo.pushUrl,
          streamUrl: pushInfo.streamUrl,
          hostId: socket.userId,
          hostInfo: socket.userInfo
        });
        
        // 通知所有用户直播开始
        io.to(socket.roomId).emit('live_started', {
          roomId: socket.roomId,
          title,
          pushInfo,
          hostInfo: socket.userInfo
        });
        
        console.log(`直播间 ${socket.roomId} 开始直播`);
      } catch (error) {
        console.error('开始直播失败:', error);
        socket.emit('error', { message: '开始直播失败' });
      }
    }
  });
  
  // 停止直播
  socket.on('stop_live', async () => {
    if (socket.roomId) {
      try {
        // 更新直播间状态
        await liveService.stopLive(socket.roomId);
        
        // 通知所有用户直播结束
        io.to(socket.roomId).emit('live_stopped', {
          roomId: socket.roomId,
          timestamp: Date.now()
        });
        
        console.log(`直播间 ${socket.roomId} 停止直播`);
      } catch (error) {
        console.error('停止直播失败:', error);
        socket.emit('error', { message: '停止直播失败' });
      }
    }
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
    
    if (socket.roomId) {
      // 通知其他用户
      socket.to(socket.roomId).emit('user_left', {
        userId: socket.userId,
        timestamp: Date.now()
      });
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`直播服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;