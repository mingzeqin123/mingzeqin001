// 首页导航
Page({
  data: {
    features: [
      {
        id: 'game',
        title: '跳一跳游戏',
        description: '经典3D跳跃小游戏',
        icon: '/images/game-icon.png',
        path: '/pages/game/game',
        color: '#667eea'
      },
      {
        id: 'invoice',
        title: '电子开票',
        description: '快速便捷的电子发票开具',
        icon: '/images/invoice-icon.png',
        path: '/pages/invoice/invoice',
        color: '#f093fb'
      },
      {
        id: 'watermark',
        title: '水印工具',
        description: '图片水印添加工具',
        icon: '/images/watermark-icon.png',
        path: '/pages/watermark/watermark',
        color: '#4facfe'
      }
    ]
  },

  onLoad: function(options) {
    console.log('首页加载');
    this.checkInvoiceSystemStatus();
  },

  // 检查开票系统状态
  checkInvoiceSystemStatus: function() {
    const app = getApp();
    const status = app.getInvoiceSystemStatus();
    
    if (!status.apiAvailable) {
      // 如果开票系统不可用，可以禁用相关功能或显示提示
      console.warn('开票系统暂时不可用');
    }
  },

  // 导航到功能页面
  navigateToFeature: function(e) {
    const feature = e.currentTarget.dataset.feature;
    
    if (feature.id === 'invoice') {
      // 检查开票系统状态
      const app = getApp();
      const status = app.getInvoiceSystemStatus();
      
      if (!status.apiAvailable) {
        wx.showToast({
          title: '开票系统暂时不可用',
          icon: 'none'
        });
        return;
      }
    }
    
    wx.navigateTo({
      url: feature.path,
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '多功能小程序 - 游戏、开票、水印',
      path: '/pages/index/index',
      imageUrl: '/images/share-banner.png'
    };
  }
});