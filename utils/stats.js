// utils/stats.js - 页面PV/UV统计工具类

class StatsManager {
  constructor() {
    this.storageKey = 'pageStats'
    this.sessionKey = 'sessionId'
    this.sessionTimeout = 30 * 60 * 1000 // 30分钟会话超时
    this.init()
  }

  // 初始化统计管理器
  init() {
    this.sessionId = this.getOrCreateSession()
    this.stats = this.loadStats()
  }

  // 获取或创建会话ID
  getOrCreateSession() {
    try {
      const sessionData = wx.getStorageSync(this.sessionKey)
      const now = Date.now()
      
      if (sessionData && (now - sessionData.timestamp) < this.sessionTimeout) {
        return sessionData.sessionId
      }
    } catch (e) {
      console.error('获取会话ID失败:', e)
    }
    
    // 创建新会话
    const newSessionId = this.generateSessionId()
    try {
      wx.setStorageSync(this.sessionKey, {
        sessionId: newSessionId,
        timestamp: Date.now()
      })
    } catch (e) {
      console.error('保存会话ID失败:', e)
    }
    
    return newSessionId
  }

  // 生成会话ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 加载统计数据
  loadStats() {
    try {
      const stats = wx.getStorageSync(this.storageKey)
      return stats || {
        pages: {},
        dailyStats: {},
        totalPV: 0,
        totalUV: 0,
        uniqueVisitors: new Set()
      }
    } catch (e) {
      console.error('加载统计数据失败:', e)
      return {
        pages: {},
        dailyStats: {},
        totalPV: 0,
        totalUV: 0,
        uniqueVisitors: new Set()
      }
    }
  }

  // 保存统计数据
  saveStats() {
    try {
      // 将Set转换为Array以便存储
      const statsToSave = {
        ...this.stats,
        uniqueVisitors: Array.from(this.stats.uniqueVisitors)
      }
      wx.setStorageSync(this.storageKey, statsToSave)
    } catch (e) {
      console.error('保存统计数据失败:', e)
    }
  }

  // 记录页面访问
  recordPageView(pageName, pageTitle = '') {
    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD格式
    const timestamp = now.getTime()

    // 初始化页面统计
    if (!this.stats.pages[pageName]) {
      this.stats.pages[pageName] = {
        name: pageName,
        title: pageTitle,
        pv: 0,
        uv: 0,
        uniqueVisitors: new Set(),
        dailyStats: {},
        lastVisit: null
      }
    }

    // 增加PV
    this.stats.pages[pageName].pv++
    this.stats.totalPV++

    // 检查是否为新访客
    const isNewVisitor = !this.stats.pages[pageName].uniqueVisitors.has(this.sessionId)
    if (isNewVisitor) {
      this.stats.pages[pageName].uniqueVisitors.add(this.sessionId)
      this.stats.pages[pageName].uv++
      this.stats.totalUV++
      
      // 全局唯一访客统计
      if (!this.stats.uniqueVisitors.has(this.sessionId)) {
        this.stats.uniqueVisitors.add(this.sessionId)
      }
    }

    // 更新最后访问时间
    this.stats.pages[pageName].lastVisit = timestamp

    // 更新日统计
    if (!this.stats.pages[pageName].dailyStats[today]) {
      this.stats.pages[pageName].dailyStats[today] = {
        pv: 0,
        uv: 0,
        uniqueVisitors: new Set()
      }
    }

    this.stats.pages[pageName].dailyStats[today].pv++
    
    if (isNewVisitor) {
      this.stats.pages[pageName].dailyStats[today].uniqueVisitors.add(this.sessionId)
      this.stats.pages[pageName].dailyStats[today].uv++
    }

    // 更新全局日统计
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        pv: 0,
        uv: 0,
        uniqueVisitors: new Set()
      }
    }

    this.stats.dailyStats[today].pv++
    if (isNewVisitor) {
      this.stats.dailyStats[today].uniqueVisitors.add(this.sessionId)
      this.stats.dailyStats[today].uv++
    }

    // 保存统计数据
    this.saveStats()

    console.log(`页面访问记录: ${pageName} - PV: ${this.stats.pages[pageName].pv}, UV: ${this.stats.pages[pageName].uv}`)
  }

  // 获取页面统计
  getPageStats(pageName) {
    return this.stats.pages[pageName] || null
  }

  // 获取所有页面统计
  getAllPageStats() {
    return this.stats.pages
  }

  // 获取总体统计
  getOverallStats() {
    return {
      totalPV: this.stats.totalPV,
      totalUV: this.stats.uniqueVisitors.size,
      pageCount: Object.keys(this.stats.pages).length
    }
  }

  // 获取日统计
  getDailyStats(date) {
    return this.stats.dailyStats[date] || null
  }

  // 获取最近N天的统计
  getRecentDaysStats(days = 7) {
    const result = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayStats = this.stats.dailyStats[dateStr]
      result.push({
        date: dateStr,
        pv: dayStats ? dayStats.pv : 0,
        uv: dayStats ? dayStats.uv : 0
      })
    }
    
    return result
  }

  // 获取页面排行榜
  getPageRanking(limit = 10) {
    const pages = Object.values(this.stats.pages)
    return pages
      .sort((a, b) => b.pv - a.pv)
      .slice(0, limit)
      .map(page => ({
        name: page.name,
        title: page.title,
        pv: page.pv,
        uv: page.uv
      }))
  }

  // 清除统计数据
  clearStats() {
    this.stats = {
      pages: {},
      dailyStats: {},
      totalPV: 0,
      totalUV: 0,
      uniqueVisitors: new Set()
    }
    this.saveStats()
  }

  // 导出统计数据
  exportStats() {
    const exportData = {
      ...this.stats,
      uniqueVisitors: Array.from(this.stats.uniqueVisitors),
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }
    
    // 将Set转换为Array
    Object.keys(exportData.pages).forEach(pageName => {
      exportData.pages[pageName].uniqueVisitors = Array.from(exportData.pages[pageName].uniqueVisitors)
      Object.keys(exportData.pages[pageName].dailyStats).forEach(date => {
        exportData.pages[pageName].dailyStats[date].uniqueVisitors = Array.from(exportData.pages[pageName].dailyStats[date].uniqueVisitors)
      })
    })
    
    Object.keys(exportData.dailyStats).forEach(date => {
      exportData.dailyStats[date].uniqueVisitors = Array.from(exportData.dailyStats[date].uniqueVisitors)
    })
    
    return exportData
  }

  // 导入统计数据
  importStats(data) {
    try {
      // 将Array转换回Set
      data.uniqueVisitors = new Set(data.uniqueVisitors || [])
      
      Object.keys(data.pages).forEach(pageName => {
        data.pages[pageName].uniqueVisitors = new Set(data.pages[pageName].uniqueVisitors || [])
        Object.keys(data.pages[pageName].dailyStats).forEach(date => {
          data.pages[pageName].dailyStats[date].uniqueVisitors = new Set(data.pages[pageName].dailyStats[date].uniqueVisitors || [])
        })
      })
      
      Object.keys(data.dailyStats).forEach(date => {
        data.dailyStats[date].uniqueVisitors = new Set(data.dailyStats[date].uniqueVisitors || [])
      })
      
      this.stats = data
      this.saveStats()
      return true
    } catch (e) {
      console.error('导入统计数据失败:', e)
      return false
    }
  }
}

// 创建全局实例
const statsManager = new StatsManager()

module.exports = statsManager