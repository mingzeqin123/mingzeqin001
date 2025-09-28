const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 配置CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 存储用户和房间信息
const users = new Map();
const rooms = new Map();

// 默认房间
rooms.set('general', {
  name: 'general',
  users: new Set(),
  messages: []
});

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户加入
  socket.on('join', (data) => {
    const { username, room = 'general' } = data;
    
    // 存储用户信息
    users.set(socket.id, {
      id: socket.id,
      username: username,
      room: room,
      joinTime: new Date()
    });

    // 加入房间
    socket.join(room);
    
    // 如果房间不存在，创建房间
    if (!rooms.has(room)) {
      rooms.set(room, {
        name: room,
        users: new Set(),
        messages: []
      });
    }
    
    rooms.get(room).users.add(socket.id);

    // 通知房间内其他用户
    socket.to(room).emit('userJoined', {
      username: username,
      message: `${username} 加入了聊天室`,
      timestamp: new Date()
    });

    // 发送房间历史消息
    socket.emit('roomHistory', rooms.get(room).messages);

    // 发送当前房间用户列表
    const roomUsers = Array.from(rooms.get(room).users).map(id => users.get(id));
    io.to(room).emit('userList', roomUsers);

    console.log(`${username} 加入了房间 ${room}`);
  });

  // 发送消息
  socket.on('sendMessage', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now() + Math.random(),
      username: user.username,
      content: data.content,
      timestamp: new Date(),
      room: user.room,
      type: data.type || 'text'
    };

    // 保存消息到房间历史
    rooms.get(user.room).messages.push(message);
    
    // 限制历史消息数量
    if (rooms.get(user.room).messages.length > 100) {
      rooms.get(user.room).messages.shift();
    }

    // 广播消息到房间
    io.to(user.room).emit('newMessage', message);

    console.log(`${user.username} 在房间 ${user.room} 发送消息: ${data.content}`);
  });

  // 用户正在输入
  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    socket.to(user.room).emit('userTyping', {
      username: user.username,
      isTyping: data.isTyping
    });
  });

  // 用户断开连接
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // 从房间移除用户
      rooms.get(user.room)?.users.delete(socket.id);
      
      // 通知房间内其他用户
      socket.to(user.room).emit('userLeft', {
        username: user.username,
        message: `${user.username} 离开了聊天室`,
        timestamp: new Date()
      });

      // 更新用户列表
      const roomUsers = Array.from(rooms.get(user.room).users).map(id => users.get(id));
      io.to(user.room).emit('userList', roomUsers);

      // 删除用户信息
      users.delete(socket.id);

      console.log(`${user.username} 离开了房间 ${user.room}`);
    }
  });
});

// 获取房间列表
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.keys()).map(roomName => ({
    name: roomName,
    userCount: rooms.get(roomName).users.size
  }));
  res.json(roomList);
});

// 获取房间信息
app.get('/api/rooms/:roomName', (req, res) => {
  const roomName = req.params.roomName;
  const room = rooms.get(roomName);
  
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  const roomUsers = Array.from(room.users).map(id => users.get(id));
  res.json({
    name: room.name,
    users: roomUsers,
    messageCount: room.messages.length
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket聊天服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
});