// pages/chat/chat.js
Page({
  data: {
    // WebSocket相关
    socketOpen: false,
    socketTask: null,
    serverUrl: 'ws://localhost:8080', // 请根据实际服务器地址修改
    
    // 用户信息
    userInfo: {
      id: '',
      nickname: '',
      avatar: ''
    },
    
    // 聊天相关
    roomId: '',
    messages: [],
    inputValue: '',
    isTyping: false,
    typingUsers: new Set(),
    onlineUsers: [],
    
    // UI状态
    loading: false,
    scrollToView: '',
    showEmojiPanel: false,
    keyboardHeight: 0
  },

  onLoad(options) {
    // 获取房间ID
    this.setData({
      roomId: options.roomId || 'default'
    });
    
    // 获取用户信息
    this.getUserInfo();
  },

  onShow() {
    // 连接WebSocket
    this.connectWebSocket();
  },

  onHide() {
    // 发送停止输入状态
    this.sendTypingStatus(false);
  },

  onUnload() {
    // 关闭WebSocket连接
    this.closeWebSocket();
  },

  // 获取用户信息
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于聊天显示头像和昵称',
      success: (res) => {
        this.setData({
          'userInfo.nickname': res.userInfo.nickName,
          'userInfo.avatar': res.userInfo.avatarUrl
        });
      },
      fail: () => {
        // 使用默认信息
        this.setData({
          'userInfo.nickname': `用户${Date.now().toString().substr(-4)}`,
          'userInfo.avatar': '/images/default-avatar.png'
        });
      }
    });
  },

  // 连接WebSocket
  connectWebSocket() {
    if (this.data.socketOpen) {
      return;
    }

    this.setData({ loading: true });

    const socketTask = wx.connectSocket({
      url: this.data.serverUrl,
      success: () => {
        console.log('WebSocket连接成功');
      },
      fail: (err) => {
        console.error('WebSocket连接失败:', err);
        wx.showToast({
          title: '连接失败',
          icon: 'error'
        });
        this.setData({ loading: false });
      }
    });

    socketTask.onOpen(() => {
      console.log('WebSocket连接已打开');
      this.setData({
        socketTask: socketTask,
        socketOpen: true,
        loading: false
      });
      
      // 加入房间
      this.joinRoom();
    });

    socketTask.onMessage((res) => {
      try {
        const message = JSON.parse(res.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    });

    socketTask.onClose(() => {
      console.log('WebSocket连接已关闭');
      this.setData({
        socketOpen: false,
        socketTask: null
      });
      
      // 3秒后尝试重连
      setTimeout(() => {
        if (!this.data.socketOpen) {
          this.connectWebSocket();
        }
      }, 3000);
    });

    socketTask.onError((err) => {
      console.error('WebSocket错误:', err);
      wx.showToast({
        title: '连接异常',
        icon: 'error'
      });
    });
  },

  // 关闭WebSocket连接
  closeWebSocket() {
    if (this.data.socketTask) {
      this.data.socketTask.close();
      this.setData({
        socketOpen: false,
        socketTask: null
      });
    }
  },

  // 加入房间
  joinRoom() {
    if (!this.data.socketOpen) return;

    const message = {
      type: 'join',
      roomId: this.data.roomId,
      nickname: this.data.userInfo.nickname,
      avatar: this.data.userInfo.avatar
    };

    this.sendMessage(message);
  },

  // 发送消息到服务器
  sendMessage(message) {
    if (this.data.socketTask && this.data.socketOpen) {
      this.data.socketTask.send({
        data: JSON.stringify(message),
        fail: (err) => {
          console.error('发送消息失败:', err);
          wx.showToast({
            title: '发送失败',
            icon: 'error'
          });
        }
      });
    }
  },

  // 处理收到的消息
  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        this.setData({
          'userInfo.id': message.clientId
        });
        break;

      case 'joined':
        this.setData({
          onlineUsers: message.users
        });
        this.addSystemMessage(`已加入房间: ${this.data.roomId}`);
        break;

      case 'message':
        this.addChatMessage(message);
        break;

      case 'user_joined':
        this.setData({
          onlineUsers: message.users
        });
        this.addSystemMessage(`${message.user.nickname} 加入了聊天`);
        break;

      case 'user_left':
        this.setData({
          onlineUsers: message.users
        });
        this.addSystemMessage(`${message.user.nickname} 离开了聊天`);
        break;

      case 'typing':
        this.handleTypingStatus(message);
        break;

      case 'pong':
        // 心跳响应
        break;

      default:
        console.log('未知消息类型:', message.type);
    }
  },

  // 添加聊天消息
  addChatMessage(message) {
    const messages = this.data.messages;
    const messageId = `msg-${message.id}`;
    
    messages.push({
      id: message.id,
      content: message.content,
      user: message.user,
      timestamp: message.timestamp,
      isSelf: message.user.id === this.data.userInfo.id,
      type: 'chat'
    });

    this.setData({
      messages: messages,
      scrollToView: messageId
    });

    // 播放消息提示音
    if (!message.user.id === this.data.userInfo.id) {
      wx.vibrateShort();
    }
  },

  // 添加系统消息
  addSystemMessage(content) {
    const messages = this.data.messages;
    const messageId = `sys-${Date.now()}`;
    
    messages.push({
      id: messageId,
      content: content,
      timestamp: Date.now(),
      type: 'system'
    });

    this.setData({
      messages: messages,
      scrollToView: messageId
    });
  },

  // 处理输入状态
  handleTypingStatus(message) {
    const typingUsers = this.data.typingUsers;
    
    if (message.isTyping) {
      typingUsers.add(message.user.nickname);
    } else {
      typingUsers.delete(message.user.nickname);
    }
    
    this.setData({
      typingUsers: typingUsers
    });
  },

  // 发送输入状态
  sendTypingStatus(isTyping) {
    if (!this.data.socketOpen) return;

    const message = {
      type: 'typing',
      isTyping: isTyping
    };

    this.sendMessage(message);
  },

  // 输入框内容变化
  onInputChange(e) {
    const value = e.detail.value;
    this.setData({
      inputValue: value
    });

    // 发送正在输入状态
    if (value.length > 0 && !this.data.isTyping) {
      this.setData({ isTyping: true });
      this.sendTypingStatus(true);
    } else if (value.length === 0 && this.data.isTyping) {
      this.setData({ isTyping: false });
      this.sendTypingStatus(false);
    }
  },

  // 发送聊天消息
  sendChatMessage() {
    const content = this.data.inputValue.trim();
    
    if (!content) {
      wx.showToast({
        title: '请输入消息内容',
        icon: 'none'
      });
      return;
    }

    if (!this.data.socketOpen) {
      wx.showToast({
        title: '连接已断开',
        icon: 'error'
      });
      return;
    }

    const message = {
      type: 'message',
      content: content
    };

    this.sendMessage(message);

    // 清空输入框和输入状态
    this.setData({
      inputValue: '',
      isTyping: false
    });
    this.sendTypingStatus(false);
  },

  // 键盘高度变化
  onKeyboardHeightChange(e) {
    this.setData({
      keyboardHeight: e.detail.height
    });
  },

  // 长按消息
  onMessageLongPress(e) {
    const messageId = e.currentTarget.dataset.id;
    const message = this.data.messages.find(msg => msg.id === messageId);
    
    if (!message || message.type !== 'chat') return;

    wx.showActionSheet({
      itemList: ['复制', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制消息
          wx.setClipboardData({
            data: message.content,
            success: () => {
              wx.showToast({
                title: '已复制',
                icon: 'success'
              });
            }
          });
        } else if (res.tapIndex === 1) {
          // 删除消息（仅本地删除）
          const messages = this.data.messages.filter(msg => msg.id !== messageId);
          this.setData({ messages });
        }
      }
    });
  },

  // 刷新聊天
  onRefresh() {
    this.setData({
      messages: []
    });
    
    if (this.data.socketOpen) {
      this.addSystemMessage('聊天记录已清空');
    } else {
      this.connectWebSocket();
    }
  },

  // 显示在线用户
  showOnlineUsers() {
    const users = this.data.onlineUsers.map(user => user.nickname).join('、');
    wx.showModal({
      title: `在线用户 (${this.data.onlineUsers.length}人)`,
      content: users || '暂无在线用户',
      showCancel: false
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (date.toDateString() === now.toDateString()) { // 今天
      return date.toLocaleTimeString('zh-CN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
});