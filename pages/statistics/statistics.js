// pages/statistics/statistics.js
const StatisticsUtil = require('../../utils/statistics.js');

Page({
  data: {
    loading: true,
    stats: {
      pv: { total: 0, pages: {}, daily: {} },
      uv: { total: 0, pages: {}, daily: {} },
      summary: { totalPV: 0, totalUV: 0, activeUsers: 0, avgPVPerUV: 0 }
    },
    todayStats: { date: '', pv: 0, uv: 0 },
    recentStats: [],
    selectedTab: 'overview', // overview, pages, trends, details
    chartData: {
      categories: [],
      pvData: [],
      uvData: []
    },
    showExportModal: false
  },

  onLoad: function (options) {
    console.log('统计页面加载');
    this.loadStatistics();
  },

  onShow: function () {
    // 记录当前页面访问
    StatisticsUtil.recordPageView('/pages/statistics/statistics');
    // 刷新数据
    this.loadStatistics();
  },

  onPullDownRefresh: function () {
    this.loadStatistics();
    wx.stopPullDownRefresh();
  },

  // 加载统计数据
  loadStatistics: function() {
    this.setData({ loading: true });

    try {
      // 获取综合统计
      const stats = StatisticsUtil.getStats();
      
      // 获取今日统计
      const todayStats = StatisticsUtil.getTodayStats();
      
      // 获取最近7天统计
      const recentStats = StatisticsUtil.getRecentStats(7);
      
      // 准备图表数据
      const chartData = {
        categories: recentStats.map(item => item.date.substring(5)), // MM-DD格式
        pvData: recentStats.map(item => item.pv),
        uvData: recentStats.map(item => item.uv)
      };

      this.setData({
        stats,
        todayStats,
        recentStats,
        chartData,
        loading: false
      });

      console.log('统计数据加载完成:', stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载数据失败',
        icon: 'error'
      });
    }
  },

  // 切换标签页
  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ selectedTab: tab });
  },

  // 格式化数字
  formatNumber: function(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  },

  // 格式化页面路径
  formatPagePath: function(path) {
    const pathMap = {
      '/pages/game/game': '游戏页面',
      '/pages/watermark/watermark': '水印页面',
      '/pages/statistics/statistics': '统计页面'
    };
    return pathMap[path] || path;
  },

  // 获取页面统计排行
  getPageRanking: function() {
    const { stats } = this.data;
    const pages = [];
    
    Object.keys(stats.pv.pages).forEach(path => {
      pages.push({
        path,
        name: this.formatPagePath(path),
        pv: stats.pv.pages[path] || 0,
        uv: stats.uv.pages[path] || 0
      });
    });

    return pages.sort((a, b) => b.pv - a.pv);
  },

  // 显示页面详情
  showPageDetail: function(e) {
    const path = e.currentTarget.dataset.path;
    const name = this.formatPagePath(path);
    const pv = this.data.stats.pv.pages[path] || 0;
    const uv = this.data.stats.uv.pages[path] || 0;

    wx.showModal({
      title: '页面统计详情',
      content: `页面: ${name}\nPV: ${pv}\nUV: ${uv}\n平均访问: ${uv > 0 ? (pv / uv).toFixed(2) : 0}`,
      showCancel: false
    });
  },

  // 显示趋势详情
  showTrendDetail: function(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.recentStats[index];
    
    if (item) {
      wx.showModal({
        title: '日期详情',
        content: `日期: ${item.date}\nPV: ${item.pv}\nUV: ${item.uv}`,
        showCancel: false
      });
    }
  },

  // 清空统计数据
  clearStatistics: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有统计数据吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          StatisticsUtil.clearStats();
          this.loadStatistics();
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 导出统计数据
  exportStatistics: function() {
    try {
      const data = StatisticsUtil.exportStats();
      if (data) {
        // 显示导出选项
        this.setData({ showExportModal: true });
      } else {
        wx.showToast({
          title: '导出失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      wx.showToast({
        title: '导出失败',
        icon: 'error'
      });
    }
  },

  // 关闭导出弹窗
  closeExportModal: function() {
    this.setData({ showExportModal: false });
  },

  // 复制数据到剪贴板
  copyToClipboard: function() {
    const data = StatisticsUtil.exportStats();
    if (data) {
      wx.setClipboardData({
        data: data,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
          this.closeExportModal();
        }
      });
    }
  },

  // 分享统计数据
  shareStatistics: function() {
    const { stats, todayStats } = this.data;
    const content = `小程序统计数据\n总PV: ${stats.summary.totalPV}\n总UV: ${stats.summary.totalUV}\n今日PV: ${todayStats.pv}\n今日UV: ${todayStats.uv}`;
    
    // 这里可以实现分享功能
    wx.showModal({
      title: '分享统计',
      content: content,
      showCancel: false
    });
    
    this.closeExportModal();
  },

  // 获取统计卡片样式类
  getCardClass: function(type) {
    const classes = {
      pv: 'stats-card pv-card',
      uv: 'stats-card uv-card',
      active: 'stats-card active-card',
      avg: 'stats-card avg-card'
    };
    return classes[type] || 'stats-card';
  },

  // 获取趋势图标
  getTrendIcon: function(current, previous) {
    if (current > previous) return '↗️';
    if (current < previous) return '↘️';
    return '➡️';
  },

  // 计算增长率
  getGrowthRate: function(current, previous) {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const rate = ((current - previous) / previous * 100).toFixed(1);
    return rate > 0 ? `+${rate}%` : `${rate}%`;
  },

  // 分享页面
  onShareAppMessage: function() {
    const { stats } = this.data;
    return {
      title: `小程序统计 - 总PV:${stats.summary.totalPV} 总UV:${stats.summary.totalUV}`,
      path: '/pages/statistics/statistics',
      imageUrl: '/images/statistics-share.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    const { stats } = this.data;
    return {
      title: `小程序数据统计 - PV:${stats.summary.totalPV} UV:${stats.summary.totalUV}`,
      query: 'from=timeline'
    };
  }
});