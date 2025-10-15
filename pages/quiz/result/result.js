// pages/quiz/result/result.js
const QuizDataManager = require('../../../utils/quizData.js')
const QuizGrading = require('../../../utils/quizGrading.js')

Page({
  data: {
    results: [],
    statistics: {},
    currentResult: null,
    showDetails: false
  },

  onLoad(options) {
    this.quizDataManager = new QuizDataManager()
    this.quizGrading = new QuizGrading()
    this.loadResults()
  },

  // 加载结果数据
  loadResults() {
    const results = this.quizDataManager.getResults()
    const statistics = this.quizGrading.getStatistics(results)
    
    this.setData({
      results: results.reverse(), // 最新的在前
      statistics
    })
  },

  // 查看详细结果
  viewDetails(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    
    this.setData({
      currentResult: result,
      showDetails: true
    })
  },

  // 关闭详细结果
  closeDetails() {
    this.setData({
      showDetails: false,
      currentResult: null
    })
  },

  // 重新测验
  restartQuiz() {
    wx.navigateBack()
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有测验记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          this.quizDataManager.clearResults()
          this.loadResults()
          wx.showToast({
            title: '已清空记录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 分享结果
  shareResult(e) {
    const index = e.currentTarget.dataset.index
    const result = this.data.results[index]
    
    return {
      title: `我在知识测验中获得了${result.percentage}%的正确率！`,
      path: '/pages/quiz/quiz',
      imageUrl: '/images/quiz-share.png'
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

  // 获取评价颜色
  getEvaluationColor(percentage) {
    if (percentage >= 90) return '#4caf50'
    if (percentage >= 80) return '#8bc34a'
    if (percentage >= 70) return '#ff9800'
    if (percentage >= 60) return '#ff5722'
    return '#f44336'
  },

  // 获取题目类型图标
  getTypeIcon(type) {
    switch (type) {
      case 'single': return '📝'
      case 'multiple': return '☑️'
      case 'truefalse': return '✓'
      default: return '❓'
    }
  }
})