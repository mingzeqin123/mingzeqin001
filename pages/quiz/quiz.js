// pages/quiz/quiz.js
const QuizDataManager = require('../../utils/quizData.js')
const QuizGrading = require('../../utils/quizGrading.js')

Page({
  data: {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    quizState: 'ready', // ready, taking, completed
    timeLeft: 0,
    timeLeftFormatted: '00:00',
    progress: 0,
    timer: null,
    showAnswer: false,
    currentAnswer: null
  },

  onLoad() {
    this.quizDataManager = new QuizDataManager()
    this.quizGrading = new QuizGrading()
    this.loadQuestions()
  },

  onUnload() {
    // 清理定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  // 加载题目
  loadQuestions() {
    const questions = this.quizDataManager.getQuestions()
    this.setData({
      questions,
      currentQuestionIndex: 0,
      userAnswers: {},
      quizState: 'ready'
    })
  },

  // 开始测验
  startQuiz() {
    this.setData({
      quizState: 'taking',
      currentQuestionIndex: 0,
      userAnswers: {},
      timeLeft: this.data.questions.length * 60 // 每题1分钟
    })
    this.startTimer()
  },

  // 开始计时器
  startTimer() {
    const timer = setInterval(() => {
      const timeLeft = this.data.timeLeft - 1
      const timeLeftFormatted = this.formatTime(timeLeft)
      const progress = this.getProgress()
      
      this.setData({ 
        timeLeft,
        timeLeftFormatted,
        progress
      })
      
      if (timeLeft <= 0) {
        this.submitQuiz()
      }
    }, 1000)
    
    this.setData({ timer })
  },

  // 停止计时器
  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  // 选择答案（单选题）
  selectSingleAnswer(e) {
    const answer = parseInt(e.currentTarget.dataset.answer)
    const questionId = this.getCurrentQuestion().id
    
    this.setData({
      [`userAnswers.${questionId}`]: answer
    })
  },

  // 选择答案（多选题）
  selectMultipleAnswer(e) {
    const answer = parseInt(e.currentTarget.dataset.answer)
    const questionId = this.getCurrentQuestion().id
    const currentAnswers = this.data.userAnswers[questionId] || []
    
    let newAnswers
    if (currentAnswers.includes(answer)) {
      // 取消选择
      newAnswers = currentAnswers.filter(a => a !== answer)
    } else {
      // 添加选择
      newAnswers = [...currentAnswers, answer]
    }
    
    this.setData({
      [`userAnswers.${questionId}`]: newAnswers
    })
  },

  // 选择答案（判断题）
  selectTrueFalse(e) {
    const answer = e.currentTarget.dataset.answer === 'true'
    const questionId = this.getCurrentQuestion().id
    
    this.setData({
      [`userAnswers.${questionId}`]: answer
    })
  },

  // 获取当前题目
  getCurrentQuestion() {
    return this.data.questions[this.data.currentQuestionIndex]
  },

  // 下一题
  nextQuestion() {
    const nextIndex = this.data.currentQuestionIndex + 1
    if (nextIndex < this.data.questions.length) {
      const progress = this.getProgress()
      this.setData({
        currentQuestionIndex: nextIndex,
        showAnswer: false,
        progress
      })
    } else {
      this.submitQuiz()
    }
  },

  // 上一题
  prevQuestion() {
    const prevIndex = this.data.currentQuestionIndex - 1
    if (prevIndex >= 0) {
      const progress = this.getProgress()
      this.setData({
        currentQuestionIndex: prevIndex,
        showAnswer: false,
        progress
      })
    }
  },

  // 显示答案
  showAnswer() {
    const currentQuestion = this.getCurrentQuestion()
    const userAnswer = this.data.userAnswers[currentQuestion.id]
    
    this.setData({
      showAnswer: true,
      currentAnswer: userAnswer
    })
  },

  // 提交测验
  submitQuiz() {
    this.stopTimer()
    
    const gradeResult = this.quizGrading.gradeQuiz(this.data.questions, this.data.userAnswers)
    
    // 保存结果
    this.quizDataManager.saveResult(gradeResult)
    
    this.setData({
      quizState: 'completed',
      gradeResult
    })
  },

  // 重新开始
  restartQuiz() {
    this.loadQuestions()
  },

  // 查看结果详情
  viewResults() {
    wx.navigateTo({
      url: '/pages/quiz/result/result'
    })
  },

  // 格式化时间显示
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  // 获取进度百分比
  getProgress() {
    return Math.round(((this.data.currentQuestionIndex + 1) / this.data.questions.length) * 100)
  },

  // 格式化时间显示
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
})