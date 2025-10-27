// pages/stats/stats.js
const statsManager = require('../../utils/stats.js')

Page({
  data: {
    overallStats: {},
    pageStats: [],
    recentDaysStats: [],
    pageRanking: [],
    loading: true,
    currentTab: 'overview', // overview, pages, daily
    selectedDate: '',
    dateRange: []
  },

  onLoad() {
    // 记录页面访问
    const appStatsManager = getApp().globalData.statsManager
    if (appStatsManager) {
      appStatsManager.recordPageView('stats', '数据统计')
    }
    
    this.loadStats()
    this.initDateRange()
  },

  onShow() {
    this.loadStats()
  },

  // 加载统计数据
  loadStats() {
    this.setData({ loading: true })
    
    try {
      const overallStats = statsManager.getOverallStats()
      const pageStats = Object.values(statsManager.getAllPageStats())
      const recentDaysStats = statsManager.getRecentDaysStats(7)
      const pageRanking = statsManager.getPageRanking(10)
      
      this.setData({
        overallStats,
        pageStats,
        recentDaysStats,
        pageRanking,
        loading: false
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      wx.showToast({
        title: '加载数据失败',
        icon: 'error'
      })
      this.setData({ loading: false })
    }
  },

  // 初始化日期范围
  initDateRange() {
    const dates = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    this.setData({
      dateRange: dates,
      selectedDate: dates[dates.length - 1] // 默认选择今天
    })
  },

  // 切换标签页
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value })
  },

  // 获取指定日期的统计
  getDailyStats() {
    const { selectedDate } = this.data
    const dailyStats = statsManager.getDailyStats(selectedDate)
    
    if (dailyStats) {
      wx.showModal({
        title: `${selectedDate} 统计`,
        content: `PV: ${dailyStats.pv}\nUV: ${dailyStats.uv}`,
        showCancel: false
      })
    } else {
      wx.showToast({
        title: '该日期无数据',
        icon: 'none'
      })
    }
  },

  // 刷新数据
  refreshData() {
    this.loadStats()
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  },

  // 导出数据
  exportData() {
    try {
      const data = statsManager.exportStats()
      const dataStr = JSON.stringify(data, null, 2)
      
      // 将数据复制到剪贴板
      wx.setClipboardData({
        data: dataStr,
        success: () => {
          wx.showModal({
            title: '导出成功',
            content: '统计数据已复制到剪贴板，您可以粘贴到其他应用中保存',
            showCancel: false
          })
        }
      })
    } catch (error) {
      console.error('导出数据失败:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      })
    }
  },

  // 清除数据
  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有统计数据吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          statsManager.clearStats()
          this.loadStats()
          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 查看页面详情
  viewPageDetail(e) {
    const pageName = e.currentTarget.dataset.page
    const pageStats = statsManager.getPageStats(pageName)
    
    if (pageStats) {
      const content = `页面: ${pageStats.title}\nPV: ${pageStats.pv}\nUV: ${pageStats.uv}\n最后访问: ${pageStats.lastVisit ? new Date(pageStats.lastVisit).toLocaleString() : '无'}`
      
      wx.showModal({
        title: '页面详情',
        content: content,
        showCancel: false
      })
    }
  },

  // 格式化数字
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }
})