// 答题历史记录页面
Page({
  data: {
    historyList: [],
    isEmpty: false
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    // 每次显示页面时重新加载历史记录
    this.loadHistory()
  },

  // 加载历史记录
  loadHistory() {
    try {
      const history = wx.getStorageSync('quiz_history') || []
      this.setData({
        historyList: history,
        isEmpty: history.length === 0
      })
    } catch (e) {
      console.error('加载历史记录失败:', e)
      this.setData({
        historyList: [],
        isEmpty: true
      })
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  },

  // 查看历史记录详情
  viewHistoryDetail(e) {
    const index = e.currentTarget.dataset.index
    const historyItem = this.data.historyList[index]
    
    if (historyItem) {
      // 将选中的历史记录设置为当前结果
      try {
        wx.setStorageSync('latest_quiz_result', historyItem)
        wx.navigateTo({
          url: '/pages/quiz-result/quiz-result'
        })
      } catch (e) {
        console.error('设置历史记录失败:', e)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    }
  },

  // 删除历史记录
  deleteHistory(e) {
    const index = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条答题记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(index)
        }
      }
    })
  },

  // 执行删除操作
  performDelete(index) {
    try {
      let historyList = [...this.data.historyList]
      historyList.splice(index, 1)
      
      // 更新本地存储
      wx.setStorageSync('quiz_history', historyList)
      
      // 更新页面数据
      this.setData({
        historyList: historyList,
        isEmpty: historyList.length === 0
      })
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } catch (e) {
      console.error('删除历史记录失败:', e)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  },

  // 清空所有历史记录
  clearAllHistory() {
    if (this.data.historyList.length === 0) {
      wx.showToast({
        title: '暂无记录',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有答题记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          this.performClearAll()
        }
      }
    })
  },

  // 执行清空操作
  performClearAll() {
    try {
      wx.removeStorageSync('quiz_history')
      wx.removeStorageSync('latest_quiz_result')
      
      this.setData({
        historyList: [],
        isEmpty: true
      })
      
      wx.showToast({
        title: '清空成功',
        icon: 'success'
      })
    } catch (e) {
      console.error('清空历史记录失败:', e)
      wx.showToast({
        title: '清空失败',
        icon: 'none'
      })
    }
  },

  // 开始新的答题
  startNewQuiz() {
    wx.navigateTo({
      url: '/pages/quiz/quiz'
    })
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/game/game'
    })
  }
})