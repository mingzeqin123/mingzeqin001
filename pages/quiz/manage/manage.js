// pages/quiz/manage/manage.js
const QuizDataManager = require('../../../utils/quizData.js')

Page({
  data: {
    questions: [],
    showAddForm: false,
    newQuestion: {
      type: 'single',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    },
    editingIndex: -1
  },

  onLoad() {
    this.quizDataManager = new QuizDataManager()
    this.loadQuestions()
  },

  // 加载题目
  loadQuestions() {
    const questions = this.quizDataManager.getQuestions()
    this.setData({ questions })
  },

  // 显示添加表单
  showAddQuestion() {
    this.setData({
      showAddForm: true,
      editingIndex: -1,
      newQuestion: {
        type: 'single',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    })
  },

  // 编辑题目
  editQuestion(e) {
    const index = e.currentTarget.dataset.index
    const question = this.data.questions[index]
    
    this.setData({
      showAddForm: true,
      editingIndex: index,
      newQuestion: {
        ...question,
        options: [...question.options]
      }
    })
  },

  // 删除题目
  deleteQuestion(e) {
    const index = e.currentTarget.dataset.index
    const question = this.data.questions[index]
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除题目"${question.question}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.quizDataManager.deleteQuestion(question.id)
          this.loadQuestions()
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 输入题目内容
  onQuestionInput(e) {
    this.setData({
      'newQuestion.question': e.detail.value
    })
  },

  // 选择题目类型
  onTypeChange(e) {
    const type = e.detail.value
    let options = ['', '', '', '']
    
    if (type === 'multiple') {
      options = ['', '', '', '', '', '']
    }
    
    this.setData({
      'newQuestion.type': type,
      'newQuestion.options': options,
      'newQuestion.correctAnswer': type === 'truefalse' ? true : 0
    })
  },

  // 输入选项内容
  onOptionInput(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    
    this.setData({
      [`newQuestion.options[${index}]`]: value
    })
  },

  // 选择正确答案
  onCorrectAnswerChange(e) {
    const type = this.data.newQuestion.type
    let correctAnswer = e.detail.value
    
    if (type === 'single' || type === 'multiple') {
      correctAnswer = parseInt(correctAnswer)
    } else if (type === 'truefalse') {
      correctAnswer = correctAnswer === 'true'
    }
    
    this.setData({
      'newQuestion.correctAnswer': correctAnswer
    })
  },

  // 输入解析
  onExplanationInput(e) {
    this.setData({
      'newQuestion.explanation': e.detail.value
    })
  },

  // 保存题目
  saveQuestion() {
    const { newQuestion, editingIndex } = this.data
    
    // 验证必填字段
    if (!newQuestion.question.trim()) {
      wx.showToast({
        title: '请输入题目内容',
        icon: 'none'
      })
      return
    }
    
    if (newQuestion.type !== 'truefalse') {
      const hasValidOption = newQuestion.options.some(option => option.trim())
      if (!hasValidOption) {
        wx.showToast({
          title: '请至少输入一个选项',
          icon: 'none'
        })
        return
      }
    }
    
    if (!newQuestion.explanation.trim()) {
      wx.showToast({
        title: '请输入题目解析',
        icon: 'none'
      })
      return
    }
    
    // 生成题目ID
    if (editingIndex === -1) {
      newQuestion.id = 'q' + Date.now()
    }
    
    // 保存题目
    if (editingIndex === -1) {
      this.quizDataManager.addQuestion(newQuestion)
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
    } else {
      const questions = [...this.data.questions]
      questions[editingIndex] = newQuestion
      this.quizDataManager.saveQuestions(questions)
      wx.showToast({
        title: '修改成功',
        icon: 'success'
      })
    }
    
    this.loadQuestions()
    this.cancelAdd()
  },

  // 取消添加
  cancelAdd() {
    this.setData({
      showAddForm: false,
      editingIndex: -1
    })
  },

  // 获取题目类型名称
  getTypeName(type) {
    const typeNames = {
      single: '单选题',
      multiple: '多选题',
      truefalse: '判断题'
    }
    return typeNames[type] || '未知类型'
  },

  // 格式化正确答案显示
  formatCorrectAnswer(question) {
    if (question.type === 'single') {
      return question.options[question.correctAnswer]
    } else if (question.type === 'multiple') {
      return question.correctAnswer.map(i => question.options[i]).join(', ')
    } else {
      return question.correctAnswer ? '正确' : '错误'
    }
  }
})