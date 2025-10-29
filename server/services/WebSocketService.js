/**
 * WebSocket服务
 * 处理实时通信相关功能
 */
class WebSocketService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // 存储房间信息
    this.users = new Map(); // 存储用户信息
  }

  /**
   * 用户加入房间
   * @param {string} socketId Socket ID
   * @param {string} roomId 房间ID
   * @param {object} userInfo 用户信息
   */
  joinRoom(socketId, roomId, userInfo) {
    // 存储用户信息
    this.users.set(socketId, {
      ...userInfo,
      socketId,
      roomId,
      joinTime: Date.now()
    });

    // 加入房间
    this.io.sockets.sockets.get(socketId)?.join(roomId);

    // 更新房间信息
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Set(),
        createdAt: Date.now()
      });
    }

    this.rooms.get(roomId).users.add(socketId);

    // 通知房间内其他用户
    this.io.to(roomId).emit('user_joined', {
      user: userInfo,
      timestamp: Date.now()
    });

    // 发送房间信息给新用户
    this.sendRoomInfo(socketId, roomId);
  }

  /**
   * 用户离开房间
   * @param {string} socketId Socket ID
   */
  leaveRoom(socketId) {
    const user = this.users.get(socketId);
    if (!user) return;

    const { roomId } = user;

    // 从房间中移除用户
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).users.delete(socketId);
      
      // 如果房间为空，删除房间
      if (this.rooms.get(roomId).users.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    // 通知房间内其他用户
    this.io.to(roomId).emit('user_left', {
      user: user,
      timestamp: Date.now()
    });

    // 移除用户信息
    this.users.delete(socketId);
  }

  /**
   * 发送房间信息
   * @param {string} socketId Socket ID
   * @param {string} roomId 房间ID
   */
  async sendRoomInfo(socketId, roomId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const userList = Array.from(room.users).map(socketId => {
        const user = this.users.get(socketId);
        return user ? {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level
        } : null;
      }).filter(Boolean);

      this.io.to(socketId).emit('room_info', {
        roomId,
        userCount: userList.length,
        users: userList,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('发送房间信息失败:', error);
    }
  }

  /**
   * 广播消息到房间
   * @param {string} roomId 房间ID
   * @param {string} event 事件名
   * @param {object} data 数据
   */
  broadcastToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * 发送消息给特定用户
   * @param {string} socketId Socket ID
   * @param {string} event 事件名
   * @param {object} data 数据
   */
  sendToUser(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * 发送弹幕
   * @param {string} roomId 房间ID
   * @param {object} danmaku 弹幕数据
   */
  sendDanmaku(roomId, danmaku) {
    this.broadcastToRoom(roomId, 'danmaku', danmaku);
  }

  /**
   * 发送礼物
   * @param {string} roomId 房间ID
   * @param {object} gift 礼物数据
   */
  sendGift(roomId, gift) {
    this.broadcastToRoom(roomId, 'gift', gift);
  }

  /**
   * 更新观看人数
   * @param {string} roomId 房间ID
   * @param {number} count 观看人数
   */
  updateViewerCount(roomId, count) {
    this.broadcastToRoom(roomId, 'viewer_count', { count });
  }

  /**
   * 直播开始通知
   * @param {string} roomId 房间ID
   * @param {object} liveInfo 直播信息
   */
  notifyLiveStart(roomId, liveInfo) {
    this.broadcastToRoom(roomId, 'live_start', liveInfo);
  }

  /**
   * 直播结束通知
   * @param {string} roomId 房间ID
   */
  notifyLiveEnd(roomId) {
    this.broadcastToRoom(roomId, 'live_end', {
      roomId,
      timestamp: Date.now()
    });
  }

  /**
   * 发送系统消息
   * @param {string} roomId 房间ID
   * @param {string} message 消息内容
   * @param {string} type 消息类型
   */
  sendSystemMessage(roomId, message, type = 'info') {
    this.broadcastToRoom(roomId, 'system_message', {
      message,
      type,
      timestamp: Date.now()
    });
  }

  /**
   * 发送警告消息
   * @param {string} socketId Socket ID
   * @param {string} message 警告内容
   */
  sendWarning(socketId, message) {
    this.sendToUser(socketId, 'warning', {
      message,
      timestamp: Date.now()
    });
  }

  /**
   * 踢出用户
   * @param {string} socketId Socket ID
   * @param {string} reason 踢出原因
   */
  kickUser(socketId, reason = '违反直播规范') {
    this.sendToUser(socketId, 'kicked', {
      reason,
      timestamp: Date.now()
    });
    
    // 断开连接
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect();
    }
  }

  /**
   * 禁言用户
   * @param {string} socketId Socket ID
   * @param {number} duration 禁言时长（秒）
   * @param {string} reason 禁言原因
   */
  muteUser(socketId, duration = 300, reason = '违反直播规范') {
    const user = this.users.get(socketId);
    if (!user) return;

    user.muted = true;
    user.muteExpire = Date.now() + duration * 1000;
    user.muteReason = reason;

    this.sendToUser(socketId, 'muted', {
      duration,
      reason,
      timestamp: Date.now()
    });
  }

  /**
   * 解除禁言
   * @param {string} socketId Socket ID
   */
  unmuteUser(socketId) {
    const user = this.users.get(socketId);
    if (!user) return;

    user.muted = false;
    user.muteExpire = null;
    user.muteReason = null;

    this.sendToUser(socketId, 'unmuted', {
      timestamp: Date.now()
    });
  }

  /**
   * 检查用户是否被禁言
   * @param {string} socketId Socket ID
   * @returns {boolean} 是否被禁言
   */
  isUserMuted(socketId) {
    const user = this.users.get(socketId);
    if (!user) return false;

    if (user.muted && user.muteExpire && Date.now() < user.muteExpire) {
      return true;
    }

    // 如果禁言时间已过，自动解除禁言
    if (user.muted && user.muteExpire && Date.now() >= user.muteExpire) {
      this.unmuteUser(socketId);
    }

    return false;
  }

  /**
   * 获取房间用户列表
   * @param {string} roomId 房间ID
   * @returns {Array} 用户列表
   */
  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.users).map(socketId => {
      const user = this.users.get(socketId);
      return user ? {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        level: user.level,
        joinTime: user.joinTime,
        muted: user.muted || false
      } : null;
    }).filter(Boolean);
  }

  /**
   * 获取房间数量
   * @returns {number} 房间数量
   */
  getRoomCount() {
    return this.rooms.size;
  }

  /**
   * 获取在线用户数量
   * @returns {number} 在线用户数量
   */
  getUserCount() {
    return this.users.size;
  }

  /**
   * 获取房间统计信息
   * @param {string} roomId 房间ID
   * @returns {object} 统计信息
   */
  getRoomStats(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const users = this.getRoomUsers(roomId);
    const mutedUsers = users.filter(user => user.muted).length;

    return {
      roomId,
      userCount: users.length,
      mutedCount: mutedUsers,
      createdAt: room.createdAt,
      duration: Date.now() - room.createdAt
    };
  }

  /**
   * 清理过期数据
   */
  cleanup() {
    const now = Date.now();
    const expireTime = 24 * 60 * 60 * 1000; // 24小时

    // 清理过期的房间
    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.createdAt > expireTime) {
        this.rooms.delete(roomId);
      }
    }

    // 清理过期的用户
    for (const [socketId, user] of this.users.entries()) {
      if (now - user.joinTime > expireTime) {
        this.users.delete(socketId);
      }
    }
  }

  /**
   * 定期清理过期数据
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // 每小时清理一次
  }
}

module.exports = WebSocketService;