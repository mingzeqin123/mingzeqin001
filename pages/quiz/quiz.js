// 题库管理和自动评分系统
const app = getApp()
const { quizManager } = require('../../utils/quiz-manager.js')
const { initSampleQuestions } = require('../../utils/quiz-data.js')

Page({
  data: {
    // 当前题目索引
    currentQuestionIndex: 0,
    // 题目列表
    questions: [],
    // 用户答案
    userAnswers: [],
    // 当前题目
    currentQuestion: null,
    // 是否显示结果
    showResult: false,
    // 考试结果
    result: {
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      accuracy: 0
    },
    // 考试是否开始
    quizStarted: false,
    // 考试是否结束
    quizFinished: false,
    // 选中的答案（用于多选题）
    selectedAnswers: [],
    // 题目类型映射
    questionTypeMap: {
      'single': '单选题',
      'multiple': '多选题',
      'boolean': '判断题'
    }
  },

  onLoad() {
    this.initQuestions()
  },

  // 初始化题目数据
  initQuestions() {
    // 初始化示例数据（如果本地没有数据的话）
    const existingQuestions = quizManager.getQuestions()
    if (existingQuestions.length === 0) {
      initSampleQuestions()
    }
    
    // 获取题目数据
    const questions = quizManager.getQuestions()
    this.setData({
      questions: questions,
      totalQuestions: questions.length
    })
  },

  // 获取示例题目数据
  getSampleQuestions() {
    return [
      // 单选题
      {
        id: 1,
        type: 'single',
        question: '中国的首都是哪里？',
        options: ['北京', '上海', '广州', '深圳'],
        correctAnswer: 0, // 正确答案索引
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
      
      // 多选题
      {
        id: 3,
        type: 'multiple',
        question: '以下哪些是前端开发框架？（多选）',
        options: ['React', 'Vue', 'Angular', 'Django'],
        correctAnswer: [0, 1, 2], // 正确答案索引数组
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
      
      // 判断题
      {
        id: 5,
        type: 'boolean',
        question: 'JavaScript是一种编译型语言。',
        options: ['正确', '错误'],
        correctAnswer: 1, // 1表示错误
        explanation: 'JavaScript是一种解释型语言，不是编译型语言。'
      },
      {
        id: 6,
        type: 'boolean',
        question: 'HTML5支持本地存储功能。',
        options: ['正确', '错误'],
        correctAnswer: 0, // 0表示正确
        explanation: 'HTML5提供了localStorage和sessionStorage等本地存储API。'
      }
    ]
  },

  // 开始考试
  startQuiz() {
    this.setData({
      quizStarted: true,
      currentQuestionIndex: 0,
      userAnswers: [],
      selectedAnswers: [],
      showResult: false,
      quizFinished: false
    })
    this.loadCurrentQuestion()
  },

  // 加载当前题目
  loadCurrentQuestion() {
    const { questions, currentQuestionIndex } = this.data
    if (currentQuestionIndex < questions.length) {
      this.setData({
        currentQuestion: questions[currentQuestionIndex],
        selectedAnswers: [] // 重置选中答案
      })
    }
  },

  // 选择答案（单选题和判断题）
  selectSingleAnswer(e) {
    const answerIndex = e.currentTarget.dataset.index
    this.setData({
      selectedAnswers: [answerIndex]
    })
  },

  // 选择答案（多选题）
  selectMultipleAnswer(e) {
    const answerIndex = e.currentTarget.dataset.index
    let { selectedAnswers } = this.data
    
    const existingIndex = selectedAnswers.indexOf(answerIndex)
    if (existingIndex > -1) {
      // 如果已选中，则取消选择
      selectedAnswers.splice(existingIndex, 1)
    } else {
      // 如果未选中，则添加选择
      selectedAnswers.push(answerIndex)
    }
    
    this.setData({
      selectedAnswers: selectedAnswers
    })
  },

  // 提交当前题目答案
  submitAnswer() {
    const { selectedAnswers, currentQuestion, userAnswers, currentQuestionIndex } = this.data
    
    if (selectedAnswers.length === 0) {
      wx.showToast({
        title: '请选择答案',
        icon: 'none'
      })
      return
    }

    // 保存用户答案
    const answer = {
      questionId: currentQuestion.id,
      questionType: currentQuestion.type,
      userAnswer: currentQuestion.type === 'multiple' ? selectedAnswers : selectedAnswers[0],
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: this.checkAnswer(selectedAnswers, currentQuestion)
    }

    userAnswers.push(answer)
    
    this.setData({
      userAnswers: userAnswers
    })

    // 保存到本地存储
    this.saveAnswerToStorage(answer)

    // 下一题或结束考试
    this.nextQuestion()
  },

  // 检查答案是否正确
  checkAnswer(userAnswer, question) {
    return quizManager.checkAnswer(question, question.type === 'multiple' ? userAnswer : userAnswer[0])
  },

  // 下一题
  nextQuestion() {
    const { currentQuestionIndex, questions } = this.data
    
    if (currentQuestionIndex + 1 < questions.length) {
      this.setData({
        currentQuestionIndex: currentQuestionIndex + 1
      })
      this.loadCurrentQuestion()
    } else {
      // 考试结束
      this.finishQuiz()
    }
  },

  // 结束考试
  finishQuiz() {
    const result = this.calculateResult()
    this.setData({
      quizFinished: true,
      showResult: true,
      result: result
    })
    
    // 保存考试结果
    this.saveResultToStorage(result)
  },

  // 计算考试结果
  calculateResult() {
    const { questions, userAnswers } = this.data
    const userAnswerList = userAnswers.map(answer => 
      answer.questionType === 'multiple' ? answer.userAnswer : answer.userAnswer
    )
    
    return quizManager.autoGrade(questions, userAnswerList)
  },

  // 保存答案到本地存储
  saveAnswerToStorage(answer) {
    try {
      const key = `quiz_answer_${answer.questionId}`
      wx.setStorageSync(key, {
        ...answer,
        timestamp: Date.now()
      })
    } catch (e) {
      console.error('保存答案失败:', e)
    }
  },

  // 保存考试结果到本地存储
  saveResultToStorage(result) {
    try {
      const success = quizManager.saveResult({
        ...result,
        answers: this.data.userAnswers
      })
      
      if (success) {
        wx.showToast({
          title: '结果已保存',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    } catch (e) {
      console.error('保存结果失败:', e)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 重新开始考试
  restartQuiz() {
    this.setData({
      currentQuestionIndex: 0,
      userAnswers: [],
      selectedAnswers: [],
      showResult: false,
      quizFinished: false,
      quizStarted: false
    })
  },

  // 查看答案解析
  showAnswerDetail() {
    wx.navigateTo({
      url: '/pages/quiz-result/quiz-result'
    })
  },

  // 查看历史记录
  showHistory() {
    wx.navigateTo({
      url: '/pages/quiz-history/quiz-history'
    })
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/game/game'
    })
  }
})