// index.js
const app = getApp()

Page({
  data: {
    roomId: '',
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName')
  },

  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  // 输入房间ID
  onRoomIdInput(e) {
    this.setData({
      roomId: e.detail.value
    })
  },

  // 加入聊天室
  joinChatRoom() {
    const roomId = this.data.roomId.trim()
    
    if (!roomId) {
      wx.showToast({
        title: '请输入房间ID',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/chat/chat?roomId=${encodeURIComponent(roomId)}`
    })
  },

  // 快速加入默认房间
  joinDefaultRoom() {
    wx.navigateTo({
      url: '/pages/chat/chat?roomId=default'
    })
  },

  // 随机房间
  joinRandomRoom() {
    const randomId = 'room_' + Math.random().toString(36).substr(2, 6)
    wx.navigateTo({
      url: `/pages/chat/chat?roomId=${randomId}`
    })
  }
})