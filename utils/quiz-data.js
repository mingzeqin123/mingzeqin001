/**
 * 题库示例数据
 * 包含单选题、多选题、判断题的示例
 */

const { quizManager } = require('./quiz-manager.js')

/**
 * 初始化示例题目数据
 */
function initSampleQuestions() {
  const sampleQuestions = [
    // 单选题示例
    {
      id: 1,
      type: 'single',
      question: '中国的首都是哪里？',
      options: ['北京', '上海', '广州', '深圳'],
      correctAnswer: 0,
      explanation: '中华人民共和国的首都是北京，是全国的政治、文化中心。',
      difficulty: 'easy',
      category: '地理',
      tags: ['中国', '首都', '地理知识']
    },
    {
      id: 2,
      type: 'single',
      question: '以下哪个是JavaScript的数据类型？',
      options: ['String', 'Integer', 'Float', 'Character'],
      correctAnswer: 0,
      explanation: 'JavaScript中有String、Number、Boolean、Object、Undefined、Null等基本数据类型，但没有Integer、Float、Character这些具体类型。',
      difficulty: 'medium',
      category: '编程',
      tags: ['JavaScript', '数据类型', '前端']
    },
    {
      id: 3,
      type: 'single',
      question: '世界上最高的山峰是？',
      options: ['珠穆朗玛峰', '乞力马扎罗山', '富士山', '泰山'],
      correctAnswer: 0,
      explanation: '珠穆朗玛峰海拔8848.86米，是世界第一高峰，位于中国和尼泊尔边境。',
      difficulty: 'easy',
      category: '地理',
      tags: ['山峰', '地理', '世界纪录']
    },
    {
      id: 4,
      type: 'single',
      question: 'HTTP状态码200表示什么？',
      options: ['请求成功', '重定向', '客户端错误', '服务器错误'],
      correctAnswer: 0,
      explanation: 'HTTP状态码200表示请求成功，服务器已成功处理了请求。',
      difficulty: 'medium',
      category: '编程',
      tags: ['HTTP', '状态码', '网络']
    },

    // 多选题示例
    {
      id: 5,
      type: 'multiple',
      question: '以下哪些是前端开发框架？（多选）',
      options: ['React', 'Vue', 'Angular', 'Django', 'Express'],
      correctAnswer: [0, 1, 2],
      explanation: 'React、Vue、Angular都是前端开发框架，Django是Python的后端框架，Express是Node.js的后端框架。',
      difficulty: 'medium',
      category: '编程',
      tags: ['前端', '框架', 'JavaScript']
    },
    {
      id: 6,
      type: 'multiple',
      question: '以下哪些是编程语言？（多选）',
      options: ['Python', 'HTML', 'JavaScript', 'CSS', 'Java'],
      correctAnswer: [0, 2, 4],
      explanation: 'Python、JavaScript、Java都是编程语言，HTML是标记语言，CSS是样式表语言。',
      difficulty: 'easy',
      category: '编程',
      tags: ['编程语言', '计算机']
    },
    {
      id: 7,
      type: 'multiple',
      question: '以下哪些是中国的直辖市？（多选）',
      options: ['北京', '上海', '广州', '天津', '重庆', '深圳'],
      correctAnswer: [0, 1, 3, 4],
      explanation: '中国目前有四个直辖市：北京、上海、天津、重庆。广州和深圳是副省级城市，但不是直辖市。',
      difficulty: 'medium',
      category: '地理',
      tags: ['中国', '直辖市', '行政区划']
    },
    {
      id: 8,
      type: 'multiple',
      question: '以下哪些是数据库管理系统？（多选）',
      options: ['MySQL', 'Redis', 'MongoDB', 'Photoshop', 'PostgreSQL'],
      correctAnswer: [0, 1, 2, 4],
      explanation: 'MySQL、Redis、MongoDB、PostgreSQL都是数据库管理系统，Photoshop是图像处理软件。',
      difficulty: 'hard',
      category: '编程',
      tags: ['数据库', '软件', '技术']
    },

    // 判断题示例
    {
      id: 9,
      type: 'boolean',
      question: 'JavaScript是一种编译型语言。',
      options: ['正确', '错误'],
      correctAnswer: 1,
      explanation: 'JavaScript是一种解释型语言，代码在运行时由JavaScript引擎逐行解释执行，而不是预先编译成机器码。',
      difficulty: 'medium',
      category: '编程',
      tags: ['JavaScript', '编程语言', '编译']
    },
    {
      id: 10,
      type: 'boolean',
      question: 'HTML5支持本地存储功能。',
      options: ['正确', '错误'],
      correctAnswer: 0,
      explanation: 'HTML5提供了localStorage和sessionStorage等本地存储API，允许网页在用户浏览器中存储数据。',
      difficulty: 'easy',
      category: '编程',
      tags: ['HTML5', '本地存储', '前端']
    },
    {
      id: 11,
      type: 'boolean',
      question: '中国是世界上人口最多的国家。',
      options: ['正确', '错误'],
      correctAnswer: 0,
      explanation: '中国是世界上人口最多的国家，人口超过14亿。不过印度人口也在快速增长，预计将在不久的将来超过中国。',
      difficulty: 'easy',
      category: '地理',
      tags: ['中国', '人口', '世界纪录']
    },
    {
      id: 12,
      type: 'boolean',
      question: 'CSS可以用来处理网页的交互逻辑。',
      options: ['正确', '错误'],
      correctAnswer: 1,
      explanation: 'CSS主要用于控制网页的样式和布局，虽然CSS3增加了一些动画和过渡效果，但复杂的交互逻辑仍需要JavaScript来处理。',
      difficulty: 'medium',
      category: '编程',
      tags: ['CSS', '前端', '交互']
    },

    // 更多难题示例
    {
      id: 13,
      type: 'single',
      question: '在JavaScript中，以下哪种方法可以创建一个新的数组？',
      options: ['new Array()', '[]', 'Array.from()', '以上都可以'],
      correctAnswer: 3,
      explanation: '在JavaScript中，可以使用new Array()构造函数、数组字面量[]、Array.from()等多种方法创建数组。',
      difficulty: 'hard',
      category: '编程',
      tags: ['JavaScript', '数组', '语法']
    },
    {
      id: 14,
      type: 'multiple',
      question: '以下哪些是HTTP请求方法？（多选）',
      options: ['GET', 'POST', 'DELETE', 'CONNECT', 'PUT', 'PATCH'],
      correctAnswer: [0, 1, 2, 3, 4, 5],
      explanation: 'GET、POST、DELETE、CONNECT、PUT、PATCH都是标准的HTTP请求方法，用于不同的操作场景。',
      difficulty: 'hard',
      category: '编程',
      tags: ['HTTP', '请求方法', '网络协议']
    },
    {
      id: 15,
      type: 'boolean',
      question: '微信小程序可以直接访问用户的文件系统。',
      options: ['正确', '错误'],
      correctAnswer: 1,
      explanation: '出于安全考虑，微信小程序运行在沙盒环境中，不能直接访问用户的文件系统，只能通过特定的API访问有限的资源。',
      difficulty: 'hard',
      category: '编程',
      tags: ['微信小程序', '安全', '文件系统']
    }
  ]

  try {
    // 保存示例题目到本地存储
    quizManager.saveQuestions(sampleQuestions)
    console.log('示例题目初始化成功，共', sampleQuestions.length, '题')
    return true
  } catch (error) {
    console.error('初始化示例题目失败:', error)
    return false
  }
}

/**
 * 获取按难度分类的题目统计
 */
function getQuestionStatsByDifficulty() {
  const questions = quizManager.getQuestions()
  const stats = {
    easy: 0,
    medium: 0,
    hard: 0,
    total: questions.length
  }

  questions.forEach(question => {
    if (stats.hasOwnProperty(question.difficulty)) {
      stats[question.difficulty]++
    }
  })

  return stats
}

/**
 * 获取按类型分类的题目统计
 */
function getQuestionStatsByType() {
  const questions = quizManager.getQuestions()
  const stats = {
    single: 0,
    multiple: 0,
    boolean: 0,
    total: questions.length
  }

  questions.forEach(question => {
    if (stats.hasOwnProperty(question.type)) {
      stats[question.type]++
    }
  })

  return stats
}

/**
 * 创建自定义题目
 */
function createCustomQuestion(questionData) {
  try {
    const question = quizManager.createQuestion(questionData)
    quizManager.saveQuestions([question])
    return question
  } catch (error) {
    console.error('创建自定义题目失败:', error)
    throw error
  }
}

module.exports = {
  initSampleQuestions,
  getQuestionStatsByDifficulty,
  getQuestionStatsByType,
  createCustomQuestion
}