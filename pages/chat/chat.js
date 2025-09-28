// pages/chat/chat.js
const io = require('../../utils/socket.io.min.js');

Page({
  data: {
    messages: [],
    inputValue: '',
    username: '',
    room: 'general',
    isConnected: false,
    isTyping: false,
    typingUsers: [],
    userList: [],
    showUserList: false
  },

  onLoad(options) {
    // 获取传入的用户名和房间
    const username = options.username || '用户' + Math.floor(Math.random() * 1000);
    const room = options.room || 'general';
    
    this.setData({
      username: username,
      room: room
    });

    this.initSocket();
  },

  onUnload() {
    // 页面卸载时断开连接
    if (this.socket) {
      this.socket.disconnect();
    }
  },

  initSocket() {
    // 初始化Socket.io连接
    this.socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    // 连接成功
    this.socket.on('connect', () => {
      console.log('WebSocket连接成功');
      this.setData({ isConnected: true });
      
      // 加入房间
      this.socket.emit('join', {
        username: this.data.username,
        room: this.data.room
      });
    });

    // 连接断开
    this.socket.on('disconnect', () => {
      console.log('WebSocket连接断开');
      this.setData({ isConnected: false });
    });

    // 接收房间历史消息
    this.socket.on('roomHistory', (messages) => {
      this.setData({
        messages: messages
      });
      this.scrollToBottom();
    });

    // 接收新消息
    this.socket.on('newMessage', (message) => {
      const messages = this.data.messages;
      messages.push(message);
      this.setData({
        messages: messages
      });
      this.scrollToBottom();
    });

    // 用户加入
    this.socket.on('userJoined', (data) => {
      this.showSystemMessage(data.message);
    });

    // 用户离开
    this.socket.on('userLeft', (data) => {
      this.showSystemMessage(data.message);
    });

    // 用户列表更新
    this.socket.on('userList', (users) => {
      this.setData({
        userList: users
      });
    });

    // 用户正在输入
    this.socket.on('userTyping', (data) => {
      let typingUsers = this.data.typingUsers;
      
      if (data.isTyping) {
        if (!typingUsers.includes(data.username)) {
          typingUsers.push(data.username);
        }
      } else {
        typingUsers = typingUsers.filter(user => user !== data.username);
      }
      
      this.setData({
        typingUsers: typingUsers
      });
    });
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });

    // 发送正在输入状态
    if (e.detail.value.length > 0 && !this.data.isTyping) {
      this.setData({ isTyping: true });
      this.socket.emit('typing', { isTyping: true });
    } else if (e.detail.value.length === 0 && this.data.isTyping) {
      this.setData({ isTyping: false });
      this.socket.emit('typing', { isTyping: false });
    }
  },

  // 发送消息
  sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || !this.data.isConnected) return;

    // 发送消息
    this.socket.emit('sendMessage', {
      content: content,
      type: 'text'
    });

    // 清空输入框
    this.setData({
      inputValue: '',
      isTyping: false
    });

    // 停止正在输入状态
    this.socket.emit('typing', { isTyping: false });
  },

  // 键盘发送
  onInputConfirm() {
    this.sendMessage();
  },

  // 显示系统消息
  showSystemMessage(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({
      scrollTop: 99999
    });
  },

  // 切换用户列表显示
  toggleUserList() {
    this.setData({
      showUserList: !this.data.showUserList
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 长按消息
  onLongPressMessage(e) {
    const messageId = e.currentTarget.dataset.id;
    const message = this.data.messages.find(msg => msg.id === messageId);
    
    if (message && message.username === this.data.username) {
      wx.showActionSheet({
        itemList: ['删除消息'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.deleteMessage(messageId);
          }
        }
      });
    }
  },

  // 删除消息
  deleteMessage(messageId) {
    // 这里可以实现删除消息的逻辑
    console.log('删除消息:', messageId);
  }
});