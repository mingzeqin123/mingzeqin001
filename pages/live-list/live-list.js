// 直播列表页面
const app = getApp()

Page({
  data: {
    // 直播列表
    liveList: [],
    
    // 分页信息
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true
    },
    
    // 加载状态
    loading: false,
    refreshing: false,
    
    // 搜索关键词
    searchKeyword: '',
    
    // 分类筛选
    category: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: 'game', name: '游戏' },
      { id: 'music', name: '音乐' },
      { id: 'dance', name: '舞蹈' },
      { id: 'talk', name: '聊天' },
      { id: 'education', name: '教育' }
    ],
    
    // 排序方式
    sortBy: 'viewer',
    sortOptions: [
      { id: 'viewer', name: '观看人数' },
      { id: 'time', name: '最新开播' },
      { id: 'duration', name: '直播时长' }
    ]
  },

  onLoad() {
    this.loadLiveList()
  },

  onShow() {
    // 刷新列表
    this.refreshList()
  },

  onPullDownRefresh() {
    this.refreshList()
  },

  onReachBottom() {
    this.loadMore()
  },

  // 加载直播列表
  async loadLiveList(refresh = false) {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const { page, limit, searchKeyword, category, sortBy } = this.data
      const params = {
        page: refresh ? 1 : page,
        limit,
        keyword: searchKeyword,
        category: category !== 'all' ? category : undefined,
        sortBy
      }
      
      const response = await this.request('/api/live/rooms', params)
      
      if (response.code === 0) {
        const { rooms, total, page: currentPage, totalPages } = response.data
        
        this.setData({
          liveList: refresh ? rooms : [...this.data.liveList, ...rooms],
          pagination: {
            page: currentPage,
            limit,
            total,
            hasMore: currentPage < totalPages
          }
        })
      } else {
        wx.showToast({
          title: response.message || '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('加载直播列表失败:', error)
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      })
    } finally {
      this.setData({ 
        loading: false,
        refreshing: false
      })
      wx.stopPullDownRefresh()
    }
  },

  // 刷新列表
  refreshList() {
    this.setData({ 
      refreshing: true,
      'pagination.page': 1,
      'pagination.hasMore': true
    })
    this.loadLiveList(true)
  },

  // 加载更多
  loadMore() {
    if (!this.data.pagination.hasMore || this.data.loading) return
    
    this.setData({
      'pagination.page': this.data.pagination.page + 1
    })
    this.loadLiveList()
  },

  // 搜索直播
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 执行搜索
  onSearch() {
    this.refreshList()
  },

  // 清空搜索
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    })
    this.refreshList()
  },

  // 选择分类
  onCategoryChange(e) {
    const category = this.data.categories[e.detail.value].id
    this.setData({ category })
    this.refreshList()
  },

  // 选择排序
  onSortChange(e) {
    const sortBy = this.data.sortOptions[e.detail.value].id
    this.setData({ sortBy })
    this.refreshList()
  },

  // 进入直播间
  enterLiveRoom(e) {
    const { roomId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/live/live?roomId=${roomId}&mode=watch`
    })
  },

  // 开始直播
  startLive() {
    wx.navigateTo({
      url: '/pages/live/live?mode=push'
    })
  },

  // 请求封装
  request(url, data = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://your-api.com${url}`,
        method: data.method || 'GET',
        data: data.method === 'GET' ? data : data.data || data,
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

  // 格式化观看人数
  formatViewerCount(count) {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`
    }
    return count.toString()
  },

  // 格式化直播时长
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  },

  // 获取直播状态文本
  getLiveStatusText(status) {
    const statusMap = {
      'live': '直播中',
      'idle': '未开播',
      'ended': '已结束'
    }
    return statusMap[status] || '未知'
  },

  // 获取直播状态颜色
  getLiveStatusColor(status) {
    const colorMap = {
      'live': '#ff4757',
      'idle': '#747d8c',
      'ended': '#2ed573'
    }
    return colorMap[status] || '#747d8c'
  }
})