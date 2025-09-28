// pages/login/login.js
Page({
  data: {
    username: '',
    room: 'general',
    roomList: ['general', '技术讨论', '闲聊', '游戏', '学习'],
    customRoom: '',
    showCustomRoom: false
  },

  onLoad() {
    // 生成随机用户名
    const randomUsername = '用户' + Math.floor(Math.random() * 10000);
    this.setData({
      username: randomUsername
    });
  },

  // 用户名输入
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 房间选择
  onRoomChange(e) {
    const index = e.detail.value;
    if (index < this.data.roomList.length) {
      this.setData({
        room: this.data.roomList[index],
        showCustomRoom: false
      });
    } else {
      // 自定义房间
      this.setData({
        showCustomRoom: true,
        room: this.data.customRoom
      });
    }
  },

  // 自定义房间输入
  onCustomRoomInput(e) {
    this.setData({
      customRoom: e.detail.value,
      room: e.detail.value
    });
  },

  // 进入聊天室
  enterChat() {
    const { username, room } = this.data;
    
    if (!username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!room.trim()) {
      wx.showToast({
        title: '请选择房间',
        icon: 'none'
      });
      return;
    }

    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/chat/chat?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room)}`
    });
  },

  // 快速进入
  quickEnter() {
    const randomRoom = this.data.roomList[Math.floor(Math.random() * this.data.roomList.length)];
    this.setData({
      room: randomRoom
    });
    this.enterChat();
  }
});