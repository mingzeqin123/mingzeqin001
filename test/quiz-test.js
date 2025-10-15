/**
 * 题库系统测试脚本
 * 测试单选题、多选题、判断题的存储与自动评分功能
 */

// 模拟微信小程序环境
const mockWx = {
  storage: {},
  setStorageSync(key, data) {
    this.storage[key] = JSON.stringify(data)
    console.log(`✓ 存储数据到 ${key}`)
  },
  getStorageSync(key) {
    const data = this.storage[key]
    return data ? JSON.parse(data) : null
  },
  removeStorageSync(key) {
    delete this.storage[key]
    console.log(`✓ 删除存储 ${key}`)
  }
}

// 设置全局 wx 对象
global.wx = mockWx

// 导入测试模块
const { QuizManager, quizManager } = require('../utils/quiz-manager.js')
const { initSampleQuestions, getQuestionStatsByType, getQuestionStatsByDifficulty } = require('../utils/quiz-data.js')

/**
 * 测试题目创建和验证
 */
function testQuestionCreation() {
  console.log('\n=== 测试题目创建和验证 ===')
  
  try {
    // 测试单选题创建
    const singleQuestion = quizManager.createQuestion({
      id: 'test_single_1',
      type: 'single',
      question: '测试单选题：1+1等于几？',
      options: ['1', '2', '3', '4'],
      correctAnswer: 1,
      explanation: '1+1=2，这是基础数学知识。'
    })
    console.log('✓ 单选题创建成功:', singleQuestion.question)
    
    // 测试多选题创建
    const multipleQuestion = quizManager.createQuestion({
      id: 'test_multiple_1',
      type: 'multiple',
      question: '测试多选题：以下哪些是偶数？',
      options: ['1', '2', '3', '4', '5'],
      correctAnswer: [1, 3],
      explanation: '2和4是偶数。'
    })
    console.log('✓ 多选题创建成功:', multipleQuestion.question)
    
    // 测试判断题创建
    const booleanQuestion = quizManager.createQuestion({
      id: 'test_boolean_1',
      type: 'boolean',
      question: '测试判断题：地球是圆的。',
      options: ['正确', '错误'],
      correctAnswer: 0,
      explanation: '地球是一个近似球体。'
    })
    console.log('✓ 判断题创建成功:', booleanQuestion.question)
    
    // 测试错误数据处理
    try {
      quizManager.createQuestion({
        id: 'invalid',
        type: 'invalid_type',
        question: '无效题目',
        options: ['A'],
        correctAnswer: 0
      })
      console.log('✗ 应该抛出错误但没有')
    } catch (error) {
      console.log('✓ 正确处理无效题目类型:', error.message)
    }
    
  } catch (error) {
    console.error('✗ 题目创建测试失败:', error)
  }
}

/**
 * 测试答案检查功能
 */
function testAnswerChecking() {
  console.log('\n=== 测试答案检查功能 ===')
  
  // 单选题测试
  const singleQuestion = {
    id: 1,
    type: 'single',
    question: '中国的首都是？',
    options: ['北京', '上海', '广州', '深圳'],
    correctAnswer: 0
  }
  
  console.log('单选题测试:')
  console.log('✓ 正确答案 (0):', quizManager.checkAnswer(singleQuestion, 0))
  console.log('✓ 错误答案 (1):', quizManager.checkAnswer(singleQuestion, 1))
  
  // 多选题测试
  const multipleQuestion = {
    id: 2,
    type: 'multiple',
    question: '以下哪些是前端框架？',
    options: ['React', 'Vue', 'Angular', 'Django'],
    correctAnswer: [0, 1, 2]
  }
  
  console.log('多选题测试:')
  console.log('✓ 正确答案 ([0,1,2]):', quizManager.checkAnswer(multipleQuestion, [0, 1, 2]))
  console.log('✓ 正确答案乱序 ([2,0,1]):', quizManager.checkAnswer(multipleQuestion, [2, 0, 1]))
  console.log('✓ 部分正确 ([0,1]):', quizManager.checkAnswer(multipleQuestion, [0, 1]))
  console.log('✓ 完全错误 ([3]):', quizManager.checkAnswer(multipleQuestion, [3]))
  
  // 判断题测试
  const booleanQuestion = {
    id: 3,
    type: 'boolean',
    question: 'JavaScript是编译型语言。',
    options: ['正确', '错误'],
    correctAnswer: 1
  }
  
  console.log('判断题测试:')
  console.log('✓ 正确答案 (1):', quizManager.checkAnswer(booleanQuestion, 1))
  console.log('✓ 错误答案 (0):', quizManager.checkAnswer(booleanQuestion, 0))
}

/**
 * 测试自动评分功能
 */
function testAutoGrading() {
  console.log('\n=== 测试自动评分功能 ===')
  
  const testQuestions = [
    {
      id: 1,
      type: 'single',
      question: '1+1=?',
      options: ['1', '2', '3'],
      correctAnswer: 1
    },
    {
      id: 2,
      type: 'multiple',
      question: '偶数有哪些？',
      options: ['1', '2', '3', '4'],
      correctAnswer: [1, 3]
    },
    {
      id: 3,
      type: 'boolean',
      question: '地球是圆的。',
      options: ['正确', '错误'],
      correctAnswer: 0
    }
  ]
  
  // 测试全对的情况
  const perfectAnswers = [1, [1, 3], 0]
  const perfectResult = quizManager.autoGrade(testQuestions, perfectAnswers)
  console.log('全对测试结果:', {
    score: perfectResult.score,
    accuracy: perfectResult.accuracy,
    correct: perfectResult.correctAnswers,
    wrong: perfectResult.wrongAnswers
  })
  
  // 测试部分正确的情况
  const partialAnswers = [1, [1], 1] // 单选对，多选部分对，判断错
  const partialResult = quizManager.autoGrade(testQuestions, partialAnswers)
  console.log('部分正确测试结果:', {
    score: partialResult.score,
    accuracy: partialResult.accuracy,
    correct: partialResult.correctAnswers,
    wrong: partialResult.wrongAnswers
  })
  
  // 测试全错的情况
  const wrongAnswers = [0, [0, 2], 1]
  const wrongResult = quizManager.autoGrade(testQuestions, wrongAnswers)
  console.log('全错测试结果:', {
    score: wrongResult.score,
    accuracy: wrongResult.accuracy,
    correct: wrongResult.correctAnswers,
    wrong: wrongResult.wrongAnswers
  })
}

/**
 * 测试存储功能
 */
function testStorage() {
  console.log('\n=== 测试存储功能 ===')
  
  try {
    // 清空存储
    quizManager.clearHistory()
    
    // 初始化示例数据
    console.log('初始化示例数据...')
    initSampleQuestions()
    
    // 获取题目统计
    const questions = quizManager.getQuestions()
    console.log(`✓ 成功加载 ${questions.length} 道题目`)
    
    const typeStats = getQuestionStatsByType()
    console.log('✓ 题目类型统计:', typeStats)
    
    const difficultyStats = getQuestionStatsByDifficulty()
    console.log('✓ 难度统计:', difficultyStats)
    
    // 测试过滤功能
    const singleQuestions = quizManager.getQuestions({ type: 'single' })
    console.log(`✓ 单选题数量: ${singleQuestions.length}`)
    
    const easyQuestions = quizManager.getQuestions({ difficulty: 'easy' })
    console.log(`✓ 简单题数量: ${easyQuestions.length}`)
    
    // 测试随机获取题目
    const randomQuestions = quizManager.getRandomQuestions(5)
    console.log(`✓ 随机获取 ${randomQuestions.length} 道题目`)
    
    // 测试结果保存
    const testResult = {
      score: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      wrongAnswers: 2,
      accuracy: 80,
      timestamp: Date.now()
    }
    
    const saveSuccess = quizManager.saveResult(testResult)
    console.log('✓ 结果保存:', saveSuccess ? '成功' : '失败')
    
    // 测试历史记录
    const history = quizManager.getHistory()
    console.log(`✓ 历史记录数量: ${history.length}`)
    
    // 测试统计信息
    const stats = quizManager.getStatistics()
    console.log('✓ 统计信息:', {
      题目总数: stats.questions.total,
      答题次数: stats.answers.totalAttempts,
      平均分: stats.answers.averageScore,
      最高分: stats.answers.bestScore
    })
    
  } catch (error) {
    console.error('✗ 存储功能测试失败:', error)
  }
}

/**
 * 测试完整的答题流程
 */
function testCompleteQuizFlow() {
  console.log('\n=== 测试完整答题流程 ===')
  
  try {
    // 获取测试题目
    const questions = quizManager.getRandomQuestions(3)
    console.log(`开始答题，共 ${questions.length} 道题目`)
    
    // 模拟用户答题
    const userAnswers = []
    questions.forEach((question, index) => {
      let userAnswer
      
      switch (question.type) {
        case 'single':
        case 'boolean':
          // 随机选择一个答案
          userAnswer = Math.floor(Math.random() * question.options.length)
          break
        case 'multiple':
          // 随机选择1-3个答案
          const numSelections = Math.floor(Math.random() * 3) + 1
          userAnswer = []
          for (let i = 0; i < numSelections; i++) {
            const option = Math.floor(Math.random() * question.options.length)
            if (!userAnswer.includes(option)) {
              userAnswer.push(option)
            }
          }
          break
      }
      
      userAnswers.push(userAnswer)
      
      const isCorrect = quizManager.checkAnswer(question, userAnswer)
      console.log(`第${index + 1}题 (${question.type}): ${isCorrect ? '✓正确' : '✗错误'}`)
    })
    
    // 自动评分
    const result = quizManager.autoGrade(questions, userAnswers)
    console.log('\n答题结果:')
    console.log(`总分: ${result.score}分`)
    console.log(`正确率: ${result.accuracy}%`)
    console.log(`正确题数: ${result.correctAnswers}/${result.totalQuestions}`)
    
    // 保存结果
    const saveSuccess = quizManager.saveResult(result)
    console.log(`结果保存: ${saveSuccess ? '成功' : '失败'}`)
    
    console.log('\n✓ 完整答题流程测试完成')
    
  } catch (error) {
    console.error('✗ 完整答题流程测试失败:', error)
  }
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('开始运行题库系统测试...\n')
  
  testQuestionCreation()
  testAnswerChecking()
  testAutoGrading()
  testStorage()
  testCompleteQuizFlow()
  
  console.log('\n=== 测试完成 ===')
  console.log('所有功能测试已完成，请检查上述输出结果。')
}

// 运行测试
runAllTests()

module.exports = {
  testQuestionCreation,
  testAnswerChecking,
  testAutoGrading,
  testStorage,
  testCompleteQuizFlow,
  runAllTests
}