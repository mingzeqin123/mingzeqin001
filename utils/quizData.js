// 题库数据管理
class QuizDataManager {
  constructor() {
    this.storageKey = 'quizQuestions'
    this.resultsKey = 'quizResults'
  }

  // 获取默认题库
  getDefaultQuestions() {
    return [
      // 单选题
      {
        id: 'q1',
        type: 'single',
        question: 'JavaScript中，以下哪个方法可以创建新数组？',
        options: ['push()', 'slice()', 'splice()', 'pop()'],
        correctAnswer: 1, // slice() 的索引
        explanation: 'slice() 方法返回一个新数组，不会修改原数组。'
      },
      {
        id: 'q2',
        type: 'single',
        question: 'CSS中，以下哪个属性用于设置元素的外边距？',
        options: ['padding', 'margin', 'border', 'outline'],
        correctAnswer: 1, // margin 的索引
        explanation: 'margin 属性用于设置元素的外边距。'
      },
      {
        id: 'q3',
        type: 'single',
        question: 'HTML中，以下哪个标签用于创建表格行？',
        options: ['<table>', '<tr>', '<td>', '<th>'],
        correctAnswer: 1, // <tr> 的索引
        explanation: '<tr> 标签用于创建表格行。'
      },

      // 多选题
      {
        id: 'q4',
        type: 'multiple',
        question: '以下哪些是JavaScript的数据类型？',
        options: ['String', 'Number', 'Boolean', 'Object', 'Array', 'Function'],
        correctAnswer: [0, 1, 2, 3, 5], // String, Number, Boolean, Object, Function
        explanation: 'Array 不是基本数据类型，它是 Object 的一种特殊形式。'
      },
      {
        id: 'q5',
        type: 'multiple',
        question: '以下哪些CSS属性可以设置文本样式？',
        options: ['color', 'font-size', 'background-color', 'text-align', 'border'],
        correctAnswer: [0, 1, 3], // color, font-size, text-align
        explanation: 'background-color 和 border 不是文本样式属性。'
      },

      // 判断题
      {
        id: 'q6',
        type: 'truefalse',
        question: 'JavaScript中，var 声明的变量存在变量提升。',
        correctAnswer: true,
        explanation: 'var 声明的变量会被提升到函数作用域的顶部。'
      },
      {
        id: 'q7',
        type: 'truefalse',
        question: 'CSS中，margin 可以设置为负值。',
        correctAnswer: true,
        explanation: 'margin 可以设置为负值，常用于布局调整。'
      },
      {
        id: 'q8',
        type: 'truefalse',
        question: 'HTML中，每个页面只能有一个 <title> 标签。',
        correctAnswer: true,
        explanation: 'HTML 标准规定每个页面只能有一个 <title> 标签。'
      }
    ]
  }

  // 保存题目到本地存储
  saveQuestions(questions) {
    try {
      wx.setStorageSync(this.storageKey, questions)
      return true
    } catch (e) {
      console.error('保存题目失败:', e)
      return false
    }
  }

  // 从本地存储获取题目
  getQuestions() {
    try {
      const questions = wx.getStorageSync(this.storageKey)
      if (!questions || questions.length === 0) {
        // 如果没有保存的题目，使用默认题目
        const defaultQuestions = this.getDefaultQuestions()
        this.saveQuestions(defaultQuestions)
        return defaultQuestions
      }
      return questions
    } catch (e) {
      console.error('获取题目失败:', e)
      return this.getDefaultQuestions()
    }
  }

  // 保存答题结果
  saveResult(result) {
    try {
      const results = this.getResults()
      results.push({
        ...result,
        timestamp: Date.now()
      })
      wx.setStorageSync(this.resultsKey, results)
      return true
    } catch (e) {
      console.error('保存结果失败:', e)
      return false
    }
  }

  // 获取答题结果
  getResults() {
    try {
      return wx.getStorageSync(this.resultsKey) || []
    } catch (e) {
      console.error('获取结果失败:', e)
      return []
    }
  }

  // 清空答题结果
  clearResults() {
    try {
      wx.removeStorageSync(this.resultsKey)
      return true
    } catch (e) {
      console.error('清空结果失败:', e)
      return false
    }
  }

  // 添加新题目
  addQuestion(question) {
    try {
      const questions = this.getQuestions()
      questions.push(question)
      return this.saveQuestions(questions)
    } catch (e) {
      console.error('添加题目失败:', e)
      return false
    }
  }

  // 删除题目
  deleteQuestion(questionId) {
    try {
      const questions = this.getQuestions()
      const filteredQuestions = questions.filter(q => q.id !== questionId)
      return this.saveQuestions(filteredQuestions)
    } catch (e) {
      console.error('删除题目失败:', e)
      return false
    }
  }
}

module.exports = QuizDataManager