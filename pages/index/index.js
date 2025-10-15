// pages/index/index.js
Page({
  data: {
    features: [
      {
        id: 'game',
        title: '跳一跳',
        desc: '经典小游戏，挑战你的反应能力',
        icon: '🎮',
        color: '#4CAF50',
        path: '/pages/game/game'
      },
      {
        id: 'quiz',
        title: '知识测验',
        desc: '单选、多选、判断题自动评分',
        icon: '📝',
        color: '#667eea',
        path: '/pages/quiz/quiz'
      },
      {
        id: 'watermark',
        title: '水印工具',
        desc: '为图片添加水印保护',
        icon: '🖼️',
        color: '#FF9800',
        path: '/pages/watermark/watermark'
      },
      {
        id: 'manage',
        title: '题目管理',
        desc: '添加、编辑、删除测验题目',
        icon: '⚙️',
        color: '#9C27B0',
        path: '/pages/quiz/manage/manage'
      }
    ]
  },

  onLoad() {
    // 页面加载
  },

  // 跳转到功能页面
  navigateToFeature(e) {
    const path = e.currentTarget.dataset.path
    wx.navigateTo({
      url: path
    })
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '多功能小程序集合',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    }
  }
})