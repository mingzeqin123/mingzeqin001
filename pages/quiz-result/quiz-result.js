// 答题结果详情页面
Page({
  data: {
    result: null,
    questions: [],
    userAnswers: [],
    questionTypeMap: {
      'single': '单选题',
      'multiple': '多选题',
      'boolean': '判断题'
    }
  },

  onLoad() {
    this.loadResultData()
  },

  // 加载结果数据
  loadResultData() {
    try {
      const result = wx.getStorageSync('latest_quiz_result')
      if (result) {
        this.setData({
          result: result,
          userAnswers: result.answers || []
        })
        this.loadQuestions()
      } else {
        wx.showToast({
          title: '没有找到答题记录',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (e) {
      console.error('加载结果数据失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载题目数据
  loadQuestions() {
    // 这里应该从服务器或本地存储加载题目数据
    // 为了演示，我们使用示例数据
    const questions = this.getSampleQuestions()
    this.setData({
      questions: questions
    })
  },

  // 获取示例题目数据（与quiz.js中的数据保持一致）
  getSampleQuestions() {
    return [
      {
        id: 1,
        type: 'single',
        question: '中国的首都是哪里？',
        options: ['北京', '上海', '广州', '深圳'],
        correctAnswer: 0,
        explanation: '中华人民共和国的首都是北京。'
      },
      {
        id: 2,
        type: 'single',
        question: '以下哪个是JavaScript的数据类型？',
        options: ['String', 'Integer', 'Float', 'Character'],
        correctAnswer: 0,
        explanation: 'JavaScript中有String、Number、Boolean等基本数据类型，但没有Integer、Float、Character这些具体类型。'
      },
      {
        id: 3,
        type: 'multiple',
        question: '以下哪些是前端开发框架？（多选）',
        options: ['React', 'Vue', 'Angular', 'Django'],
        correctAnswer: [0, 1, 2],
        explanation: 'React、Vue、Angular都是前端开发框架，Django是Python的后端框架。'
      },
      {
        id: 4,
        type: 'multiple',
        question: '以下哪些是编程语言？（多选）',
        options: ['Python', 'HTML', 'JavaScript', 'CSS'],
        correctAnswer: [0, 2],
        explanation: 'Python和JavaScript是编程语言，HTML是标记语言，CSS是样式表语言。'
      },
      {
        id: 5,
        type: 'boolean',
        question: 'JavaScript是一种编译型语言。',
        options: ['正确', '错误'],
        correctAnswer: 1,
        explanation: 'JavaScript是一种解释型语言，不是编译型语言。'
      },
      {
        id: 6,
        type: 'boolean',
        question: 'HTML5支持本地存储功能。',
        options: ['正确', '错误'],
        correctAnswer: 0,
        explanation: 'HTML5提供了localStorage和sessionStorage等本地存储API。'
      }
    ]
  },

  // 获取题目详情
  getQuestionById(questionId) {
    return this.data.questions.find(q => q.id === questionId)
  },

  // 获取用户答案文本
  getUserAnswerText(userAnswer, question) {
    if (question.type === 'multiple') {
      if (Array.isArray(userAnswer)) {
        return userAnswer.map(index => question.options[index]).join('、')
      }
      return '未作答'
    } else {
      return question.options[userAnswer] || '未作答'
    }
  },

  // 获取正确答案文本
  getCorrectAnswerText(question) {
    if (question.type === 'multiple') {
      return question.correctAnswer.map(index => question.options[index]).join('、')
    } else {
      return question.options[question.correctAnswer]
    }
  },

  // 重新答题
  retakeQuiz() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/game/game'
    })
  }
})