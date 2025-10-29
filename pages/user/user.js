// 用户中心页面
const app = getApp()

Page({
  data: {
    // 用户信息
    userInfo: {
      id: '',
      nickname: '',
      avatar: '',
      level: 1,
      experience: 0,
      coins: 0,
      earnings: 0,
      liveCount: 0,
      totalLiveTime: 0,
      fansCount: 0,
      followCount: 0
    },
    
    // 是否已登录
    isLoggedIn: false,
    
    // 菜单列表
    menuList: [
      {
        id: 'live_history',
        title: '我的直播',
        icon: '📹',
        color: '#ff4757'
      },
      {
        id: 'earnings',
        title: '我的收益',
        icon: '💰',
        color: '#2ed573'
      },
      {
        id: 'gifts',
        title: '礼物记录',
        icon: '🎁',
        color: '#ffa502'
      },
      {
        id: 'followers',
        title: '我的粉丝',
        icon: '👥',
        color: '#3742fa'
      },
      {
        id: 'following',
        title: '我的关注',
        icon: '❤️',
        color: '#ff6b6b'
      },
      {
        id: 'settings',
        title: '设置',
        icon: '⚙️',
        color: '#747d8c'
      }
    ],
    
    // 统计信息
    stats: {
      todayViewers: 0,
      todayEarnings: 0,
      totalViewers: 0,
      totalEarnings: 0
    }
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    if (this.data.isLoggedIn) {
      this.loadUserInfo()
      this.loadStats()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) return
      
      const response = await this.request('/api/user/info/' + this.data.userInfo.id)
      
      if (response.code === 0) {
        this.setData({
          userInfo: response.data
        })
        wx.setStorageSync('userInfo', response.data)
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  // 加载统计信息
  async loadStats() {
    try {
      const response = await this.request('/api/user/stats/' + this.data.userInfo.id)
      
      if (response.code === 0) {
        this.setData({
          stats: response.data
        })
      }
    } catch (error) {
      console.error('加载统计信息失败:', error)
    }
  },

  // 微信登录
  async wxLogin() {
    try {
      // 获取用户信息
      const userProfile = await this.getUserProfile()
      
      // 获取登录凭证
      const loginRes = await this.wxLoginPromise()
      
      // 发送到服务器
      const response = await this.request('/api/auth/wechat-login', {
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: userProfile.userInfo
        }
      })
      
      if (response.code === 0) {
        const { user, token } = response.data
        
        // 保存登录信息
        wx.setStorageSync('token', token)
        wx.setStorageSync('userInfo', user)
        
        this.setData({
          isLoggedIn: true,
          userInfo: user
        })
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: response.message || '登录失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      })
    })
  },

  // 微信登录
  wxLoginPromise() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          
          this.setData({
            isLoggedIn: false,
            userInfo: {
              id: '',
              nickname: '',
              avatar: '',
              level: 1,
              experience: 0,
              coins: 0,
              earnings: 0,
              liveCount: 0,
              totalLiveTime: 0,
              fansCount: 0,
              followCount: 0
            }
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 菜单点击
  onMenuTap(e) {
    const { id } = e.currentTarget.dataset
    
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '登录后即可使用完整功能',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.wxLogin()
          }
        }
      })
      return
    }
    
    switch (id) {
      case 'live_history':
        this.navigateToLiveHistory()
        break
      case 'earnings':
        this.navigateToEarnings()
        break
      case 'gifts':
        this.navigateToGifts()
        break
      case 'followers':
        this.navigateToFollowers()
        break
      case 'following':
        this.navigateToFollowing()
        break
      case 'settings':
        this.navigateToSettings()
        break
    }
  },

  // 跳转到直播记录
  navigateToLiveHistory() {
    wx.navigateTo({
      url: '/pages/live-history/live-history'
    })
  },

  // 跳转到收益页面
  navigateToEarnings() {
    wx.navigateTo({
      url: '/pages/earnings/earnings'
    })
  },

  // 跳转到礼物记录
  navigateToGifts() {
    wx.navigateTo({
      url: '/pages/gifts/gifts'
    })
  },

  // 跳转到粉丝列表
  navigateToFollowers() {
    wx.navigateTo({
      url: '/pages/followers/followers'
    })
  },

  // 跳转到关注列表
  navigateToFollowing() {
    wx.navigateTo({
      url: '/pages/following/following'
    })
  },

  // 跳转到设置页面
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  // 开始直播
  startLive() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '登录后即可开始直播',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.wxLogin()
          }
        }
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/live/live?mode=push'
    })
  },

  // 编辑资料
  editProfile() {
    if (!this.data.isLoggedIn) {
      this.wxLogin()
      return
    }
    
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    })
  },

  // 请求封装
  request(url, options = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://your-api.com${url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': wx.getStorageSync('token') ? `Bearer ${wx.getStorageSync('token')}` : ''
        },
        success: (res) => {
          resolve(res.data)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 格式化数字
  formatNumber(num) {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`
    }
    return num.toString()
  },

  // 格式化时长
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  },

  // 获取等级信息
  getLevelInfo(level) {
    const levelNames = ['新手', '初级', '中级', '高级', '专家', '大师', '传奇']
    const levelIndex = Math.min(Math.floor(level / 10), levelNames.length - 1)
    return {
      name: levelNames[levelIndex],
      progress: (level % 10) * 10
    }
  }
})