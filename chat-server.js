const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// 创建HTTP服务器
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 存储连接的客户端和房间信息
const clients = new Map();
const rooms = new Map();

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 广播消息到房间内所有用户
function broadcastToRoom(roomId, message, excludeClient = null) {
  if (rooms.has(roomId)) {
    const roomClients = rooms.get(roomId);
    roomClients.forEach(clientId => {
      if (clientId !== excludeClient && clients.has(clientId)) {
        const client = clients.get(clientId);
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      }
    });
  }
}

// 获取房间用户列表
function getRoomUsers(roomId) {
  if (!rooms.has(roomId)) return [];
  
  const roomClients = rooms.get(roomId);
  return Array.from(roomClients)
    .map(clientId => clients.get(clientId))
    .filter(client => client)
    .map(client => ({
      id: client.id,
      nickname: client.nickname,
      avatar: client.avatar
    }));
}

wss.on('connection', (ws, req) => {
  const clientId = generateId();
  console.log(`新客户端连接: ${clientId}`);
  
  // 初始化客户端信息
  const clientInfo = {
    id: clientId,
    ws: ws,
    nickname: '',
    avatar: '',
    roomId: null,
    lastSeen: Date.now()
  };
  
  clients.set(clientId, clientInfo);
  
  // 发送连接成功消息
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId,
    timestamp: Date.now()
  }));
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      const client = clients.get(clientId);
      
      if (!client) return;
      
      client.lastSeen = Date.now();
      
      switch (message.type) {
        case 'join':
          // 用户加入房间
          const { roomId, nickname, avatar } = message;
          
          // 如果已经在其他房间，先离开
          if (client.roomId && client.roomId !== roomId) {
            leaveRoom(clientId, client.roomId);
          }
          
          // 更新客户端信息
          client.nickname = nickname || `用户${clientId.substr(-4)}`;
          client.avatar = avatar || '';
          client.roomId = roomId;
          
          // 加入房间
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId).add(clientId);
          
          // 通知房间内其他用户
          broadcastToRoom(roomId, {
            type: 'user_joined',
            user: {
              id: client.id,
              nickname: client.nickname,
              avatar: client.avatar
            },
            users: getRoomUsers(roomId),
            timestamp: Date.now()
          }, clientId);
          
          // 向当前用户发送房间信息
          ws.send(JSON.stringify({
            type: 'joined',
            roomId: roomId,
            users: getRoomUsers(roomId),
            timestamp: Date.now()
          }));
          
          console.log(`用户 ${client.nickname} 加入房间 ${roomId}`);
          break;
          
        case 'message':
          // 发送聊天消息
          if (client.roomId) {
            const chatMessage = {
              type: 'message',
              id: generateId(),
              content: message.content,
              user: {
                id: client.id,
                nickname: client.nickname,
                avatar: client.avatar
              },
              timestamp: Date.now()
            };
            
            // 广播消息到房间内所有用户（包括发送者）
            broadcastToRoom(client.roomId, chatMessage);
            console.log(`房间 ${client.roomId} 收到消息: ${message.content}`);
          }
          break;
          
        case 'typing':
          // 输入状态提示
          if (client.roomId) {
            broadcastToRoom(client.roomId, {
              type: 'typing',
              user: {
                id: client.id,
                nickname: client.nickname
              },
              isTyping: message.isTyping,
              timestamp: Date.now()
            }, clientId);
          }
          break;
          
        case 'ping':
          // 心跳检测
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;
          
        default:
          console.log('未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`客户端断开连接: ${clientId}`);
    const client = clients.get(clientId);
    
    if (client && client.roomId) {
      leaveRoom(clientId, client.roomId);
    }
    
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket错误 ${clientId}:`, error);
  });
});

// 离开房间
function leaveRoom(clientId, roomId) {
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(clientId);
    
    // 如果房间为空，删除房间
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
    } else {
      // 通知房间内其他用户
      const client = clients.get(clientId);
      if (client) {
        broadcastToRoom(roomId, {
          type: 'user_left',
          user: {
            id: client.id,
            nickname: client.nickname,
            avatar: client.avatar
          },
          users: getRoomUsers(roomId),
          timestamp: Date.now()
        }, clientId);
      }
    }
  }
}

// 定期清理断开的连接
setInterval(() => {
  const now = Date.now();
  const timeout = 30000; // 30秒超时
  
  clients.forEach((client, clientId) => {
    if (now - client.lastSeen > timeout || client.ws.readyState !== WebSocket.OPEN) {
      console.log(`清理超时连接: ${clientId}`);
      if (client.roomId) {
        leaveRoom(clientId, client.roomId);
      }
      clients.delete(clientId);
    }
  });
}, 10000); // 每10秒检查一次

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket聊天服务器启动在端口 ${PORT}`);
  console.log(`当前房间数: ${rooms.size}, 在线用户数: ${clients.size}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('服务器正在关闭...');
  wss.close(() => {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
});

module.exports = { server, wss };