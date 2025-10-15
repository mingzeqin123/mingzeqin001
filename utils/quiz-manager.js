/**
 * 题库管理和自动评分工具类
 * 支持单选题、多选题、判断题的存储与自动评分
 */

class QuizManager {
  constructor() {
    this.storageKeys = {
      questions: 'quiz_questions',
      results: 'quiz_results',
      history: 'quiz_history',
      currentResult: 'latest_quiz_result'
    }
  }

  /**
   * 题目类型枚举
   */
  static get QUESTION_TYPES() {
    return {
      SINGLE: 'single',      // 单选题
      MULTIPLE: 'multiple',  // 多选题
      BOOLEAN: 'boolean'     // 判断题
    }
  }

  /**
   * 创建题目对象
   * @param {Object} questionData 题目数据
   * @returns {Object} 标准化的题目对象
   */
  createQuestion(questionData) {
    const {
      id,
      type,
      question,
      options,
      correctAnswer,
      explanation,
      difficulty = 'medium',
      category = 'general',
      tags = []
    } = questionData

    // 验证必需字段
    if (!id || !type || !question || !options || correctAnswer === undefined) {
      throw new Error('题目数据不完整')
    }

    // 验证题目类型
    if (!Object.values(QuizManager.QUESTION_TYPES).includes(type)) {
      throw new Error('不支持的题目类型')
    }

    // 验证选项数量
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error('选项数量不能少于2个')
    }

    // 验证正确答案格式
    if (type === QuizManager.QUESTION_TYPES.MULTIPLE) {
      if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) {
        throw new Error('多选题必须提供正确答案数组')
      }
    } else {
      if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
        throw new Error('单选题/判断题的正确答案索引无效')
      }
    }

    return {
      id,
      type,
      question,
      options,
      correctAnswer,
      explanation: explanation || '',
      difficulty,
      category,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * 保存题目到本地存储
   * @param {Object|Array} questions 单个题目或题目数组
   */
  saveQuestions(questions) {
    try {
      const questionArray = Array.isArray(questions) ? questions : [questions]
      const validQuestions = questionArray.map(q => this.createQuestion(q))
      
      // 获取现有题目
      const existingQuestions = this.getQuestions()
      
      // 合并题目（去重）
      const questionMap = new Map()
      
      // 添加现有题目
      existingQuestions.forEach(q => questionMap.set(q.id, q))
      
      // 添加新题目（覆盖同ID的题目）
      validQuestions.forEach(q => questionMap.set(q.id, q))
      
      // 保存到本地存储
      const allQuestions = Array.from(questionMap.values())
      wx.setStorageSync(this.storageKeys.questions, allQuestions)
      
      return allQuestions
    } catch (error) {
      console.error('保存题目失败:', error)
      throw error
    }
  }

  /**
   * 获取所有题目
   * @param {Object} filters 过滤条件
   * @returns {Array} 题目列表
   */
  getQuestions(filters = {}) {
    try {
      const questions = wx.getStorageSync(this.storageKeys.questions) || []
      
      if (Object.keys(filters).length === 0) {
        return questions
      }

      return questions.filter(question => {
        // 按类型过滤
        if (filters.type && question.type !== filters.type) {
          return false
        }
        
        // 按难度过滤
        if (filters.difficulty && question.difficulty !== filters.difficulty) {
          return false
        }
        
        // 按分类过滤
        if (filters.category && question.category !== filters.category) {
          return false
        }
        
        // 按标签过滤
        if (filters.tags && filters.tags.length > 0) {
          const hasTag = filters.tags.some(tag => question.tags.includes(tag))
          if (!hasTag) return false
        }
        
        return true
      })
    } catch (error) {
      console.error('获取题目失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取题目
   * @param {number|string} questionId 题目ID
   * @returns {Object|null} 题目对象
   */
  getQuestionById(questionId) {
    const questions = this.getQuestions()
    return questions.find(q => q.id == questionId) || null
  }

  /**
   * 删除题目
   * @param {number|string} questionId 题目ID
   */
  deleteQuestion(questionId) {
    try {
      const questions = this.getQuestions()
      const filteredQuestions = questions.filter(q => q.id != questionId)
      wx.setStorageSync(this.storageKeys.questions, filteredQuestions)
      return true
    } catch (error) {
      console.error('删除题目失败:', error)
      return false
    }
  }

  /**
   * 检查答案是否正确
   * @param {Object} question 题目对象
   * @param {number|Array} userAnswer 用户答案
   * @returns {boolean} 是否正确
   */
  checkAnswer(question, userAnswer) {
    if (!question || userAnswer === undefined || userAnswer === null) {
      return false
    }

    switch (question.type) {
      case QuizManager.QUESTION_TYPES.SINGLE:
      case QuizManager.QUESTION_TYPES.BOOLEAN:
        return userAnswer === question.correctAnswer

      case QuizManager.QUESTION_TYPES.MULTIPLE:
        if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
          return false
        }
        
        // 长度必须相同
        if (userAnswer.length !== question.correctAnswer.length) {
          return false
        }
        
        // 排序后比较
        const sortedUserAnswer = [...userAnswer].sort((a, b) => a - b)
        const sortedCorrectAnswer = [...question.correctAnswer].sort((a, b) => a - b)
        
        return sortedUserAnswer.every((answer, index) => answer === sortedCorrectAnswer[index])

      default:
        return false
    }
  }

  /**
   * 自动评分
   * @param {Array} questions 题目列表
   * @param {Array} userAnswers 用户答案列表
   * @returns {Object} 评分结果
   */
  autoGrade(questions, userAnswers) {
    if (!Array.isArray(questions) || !Array.isArray(userAnswers)) {
      throw new Error('参数必须是数组')
    }

    const results = []
    let correctCount = 0
    let totalScore = 0

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index]
      const isCorrect = this.checkAnswer(question, userAnswer)
      
      if (isCorrect) {
        correctCount++
      }

      const result = {
        questionId: question.id,
        questionType: question.type,
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation,
        score: isCorrect ? 1 : 0 // 每题1分
      }

      results.push(result)
      totalScore += result.score
    })

    const totalQuestions = questions.length
    const wrongCount = totalQuestions - correctCount
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const finalScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0

    return {
      totalQuestions,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      accuracy,
      score: finalScore,
      totalScore,
      results,
      timestamp: Date.now()
    }
  }

  /**
   * 保存考试结果
   * @param {Object} result 考试结果
   */
  saveResult(result) {
    try {
      // 保存最新结果
      wx.setStorageSync(this.storageKeys.currentResult, result)
      
      // 保存到历史记录
      const history = wx.getStorageSync(this.storageKeys.history) || []
      history.unshift(result)
      
      // 只保留最近20次记录
      if (history.length > 20) {
        history.splice(20)
      }
      
      wx.setStorageSync(this.storageKeys.history, history)
      
      return true
    } catch (error) {
      console.error('保存结果失败:', error)
      return false
    }
  }

  /**
   * 获取最新考试结果
   * @returns {Object|null} 考试结果
   */
  getLatestResult() {
    try {
      return wx.getStorageSync(this.storageKeys.currentResult) || null
    } catch (error) {
      console.error('获取最新结果失败:', error)
      return null
    }
  }

  /**
   * 获取历史考试记录
   * @param {number} limit 限制数量
   * @returns {Array} 历史记录列表
   */
  getHistory(limit = 10) {
    try {
      const history = wx.getStorageSync(this.storageKeys.history) || []
      return limit > 0 ? history.slice(0, limit) : history
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return []
    }
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    try {
      wx.removeStorageSync(this.storageKeys.history)
      wx.removeStorageSync(this.storageKeys.currentResult)
      return true
    } catch (error) {
      console.error('清空历史记录失败:', error)
      return false
    }
  }

  /**
   * 随机获取题目
   * @param {number} count 题目数量
   * @param {Object} filters 过滤条件
   * @returns {Array} 随机题目列表
   */
  getRandomQuestions(count = 10, filters = {}) {
    const allQuestions = this.getQuestions(filters)
    
    if (allQuestions.length <= count) {
      return allQuestions
    }

    // Fisher-Yates 洗牌算法
    const shuffled = [...allQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled.slice(0, count)
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStatistics() {
    try {
      const questions = this.getQuestions()
      const history = this.getHistory(0) // 获取所有历史记录

      // 题目统计
      const questionStats = {
        total: questions.length,
        byType: {},
        byDifficulty: {},
        byCategory: {}
      }

      // 按类型统计
      Object.values(QuizManager.QUESTION_TYPES).forEach(type => {
        questionStats.byType[type] = questions.filter(q => q.type === type).length
      })

      // 按难度统计
      questions.forEach(q => {
        questionStats.byDifficulty[q.difficulty] = (questionStats.byDifficulty[q.difficulty] || 0) + 1
      })

      // 按分类统计
      questions.forEach(q => {
        questionStats.byCategory[q.category] = (questionStats.byCategory[q.category] || 0) + 1
      })

      // 答题统计
      const answerStats = {
        totalAttempts: history.length,
        averageScore: 0,
        bestScore: 0,
        totalQuestions: 0,
        totalCorrect: 0
      }

      if (history.length > 0) {
        const totalScore = history.reduce((sum, result) => sum + result.score, 0)
        answerStats.averageScore = Math.round(totalScore / history.length)
        answerStats.bestScore = Math.max(...history.map(result => result.score))
        answerStats.totalQuestions = history.reduce((sum, result) => sum + result.totalQuestions, 0)
        answerStats.totalCorrect = history.reduce((sum, result) => sum + result.correctAnswers, 0)
      }

      return {
        questions: questionStats,
        answers: answerStats,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return null
    }
  }
}

// 创建单例实例
const quizManager = new QuizManager()

module.exports = {
  QuizManager,
  quizManager
}