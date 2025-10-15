# 题库系统使用指南

## 概述

本项目实现了一个完整的题库管理和自动评分系统，支持单选题、多选题、判断题的存储与自动评分功能。系统采用微信小程序技术栈开发，具有完整的用户界面和数据管理功能。

## 功能特性

### 📝 题目类型支持
- **单选题 (Single Choice)**: 从多个选项中选择一个正确答案
- **多选题 (Multiple Choice)**: 从多个选项中选择多个正确答案
- **判断题 (True/False)**: 判断陈述的正确性

### 🎯 自动评分系统
- 实时答案验证
- 自动计算得分和正确率
- 详细的答题结果分析
- 答案解析和说明

### 💾 数据存储管理
- 本地存储题目数据
- 答题历史记录保存
- 统计信息管理
- 数据导入导出支持

### 🎨 用户界面
- 现代化的UI设计
- 响应式布局
- 直观的答题流程
- 详细的结果展示

## 项目结构

```
├── pages/
│   ├── quiz/                 # 答题页面
│   │   ├── quiz.js          # 答题逻辑
│   │   ├── quiz.wxml        # 答题界面
│   │   ├── quiz.wxss        # 答题样式
│   │   └── quiz.json        # 页面配置
│   ├── quiz-result/         # 结果详情页面
│   │   ├── quiz-result.js   # 结果展示逻辑
│   │   ├── quiz-result.wxml # 结果界面
│   │   ├── quiz-result.wxss # 结果样式
│   │   └── quiz-result.json # 页面配置
│   └── quiz-history/        # 历史记录页面
│       ├── quiz-history.js  # 历史记录逻辑
│       ├── quiz-history.wxml# 历史记录界面
│       ├── quiz-history.wxss# 历史记录样式
│       └── quiz-history.json# 页面配置
├── utils/
│   ├── quiz-manager.js      # 题库管理核心类
│   └── quiz-data.js         # 示例数据和工具函数
└── test/
    └── quiz-test.js         # 测试脚本
```

## 核心类和方法

### QuizManager 类

题库管理的核心类，提供完整的题目管理和评分功能。

#### 主要方法

```javascript
// 创建题目
createQuestion(questionData)

// 保存题目到本地存储
saveQuestions(questions)

// 获取题目列表（支持过滤）
getQuestions(filters)

// 检查答案是否正确
checkAnswer(question, userAnswer)

// 自动评分
autoGrade(questions, userAnswers)

// 保存考试结果
saveResult(result)

// 获取历史记录
getHistory(limit)

// 获取统计信息
getStatistics()
```

### 题目数据结构

```javascript
{
  id: 1,                           // 题目ID
  type: 'single',                  // 题目类型: single/multiple/boolean
  question: '题目内容',             // 题目文本
  options: ['选项A', '选项B'],      // 选项列表
  correctAnswer: 0,                // 正确答案（单选/判断）或 [0,1] （多选）
  explanation: '答案解析',          // 答案解析
  difficulty: 'medium',            // 难度: easy/medium/hard
  category: '分类',                // 题目分类
  tags: ['标签1', '标签2'],        // 题目标签
  createdAt: 1640995200000,       // 创建时间
  updatedAt: 1640995200000        // 更新时间
}
```

## 使用方法

### 1. 初始化题库

```javascript
const { quizManager } = require('../../utils/quiz-manager.js')
const { initSampleQuestions } = require('../../utils/quiz-data.js')

// 初始化示例数据
initSampleQuestions()

// 获取所有题目
const questions = quizManager.getQuestions()
```

### 2. 创建自定义题目

```javascript
// 单选题
const singleQuestion = {
  id: 'custom_1',
  type: 'single',
  question: '中国的首都是哪里？',
  options: ['北京', '上海', '广州', '深圳'],
  correctAnswer: 0,
  explanation: '中华人民共和国的首都是北京。'
}

// 多选题
const multipleQuestion = {
  id: 'custom_2',
  type: 'multiple',
  question: '以下哪些是编程语言？',
  options: ['Python', 'HTML', 'JavaScript', 'CSS'],
  correctAnswer: [0, 2],
  explanation: 'Python和JavaScript是编程语言。'
}

// 判断题
const booleanQuestion = {
  id: 'custom_3',
  type: 'boolean',
  question: 'JavaScript是编译型语言。',
  options: ['正确', '错误'],
  correctAnswer: 1,
  explanation: 'JavaScript是解释型语言。'
}

// 保存题目
quizManager.saveQuestions([singleQuestion, multipleQuestion, booleanQuestion])
```

### 3. 答题和评分

```javascript
// 获取题目
const questions = quizManager.getRandomQuestions(5)

// 用户答案（示例）
const userAnswers = [
  0,        // 单选题答案
  [0, 2],   // 多选题答案
  1         // 判断题答案
]

// 自动评分
const result = quizManager.autoGrade(questions, userAnswers)

console.log('评分结果:', {
  score: result.score,           // 总分
  accuracy: result.accuracy,     // 正确率
  correctAnswers: result.correctAnswers,  // 正确题数
  wrongAnswers: result.wrongAnswers       // 错误题数
})

// 保存结果
quizManager.saveResult(result)
```

### 4. 查看历史记录

```javascript
// 获取最新结果
const latestResult = quizManager.getLatestResult()

// 获取历史记录
const history = quizManager.getHistory(10) // 最近10次

// 获取统计信息
const stats = quizManager.getStatistics()
```

## 页面功能说明

### 答题页面 (pages/quiz/)

- **开始界面**: 显示题目信息，开始答题按钮
- **答题界面**: 
  - 进度条显示当前进度
  - 题目类型标识
  - 选项列表（支持单选/多选）
  - 提交按钮
- **结果界面**: 显示得分、正确率等统计信息

### 结果详情页面 (pages/quiz-result/)

- **结果概览**: 总分、正确率、题目统计
- **答题详情**: 
  - 每道题的答题情况
  - 用户答案vs正确答案对比
  - 答案解析
- **操作按钮**: 重新答题、返回首页

### 历史记录页面 (pages/quiz-history/)

- **历史列表**: 按时间倒序显示答题记录
- **成绩等级**: 根据分数显示等级标识
- **详情查看**: 点击记录查看详细结果
- **记录管理**: 删除单条记录、清空所有记录

## 数据存储

系统使用微信小程序的本地存储API进行数据管理：

- `quiz_questions`: 题目数据
- `latest_quiz_result`: 最新答题结果
- `quiz_history`: 历史答题记录

## 自动评分算法

### 单选题/判断题评分
```javascript
// 直接比较用户答案与正确答案
isCorrect = (userAnswer === correctAnswer)
```

### 多选题评分
```javascript
// 必须完全匹配所有正确选项
isCorrect = (
  userAnswer.length === correctAnswer.length &&
  sortedUserAnswer.every((answer, index) => answer === sortedCorrectAnswer[index])
)
```

### 总分计算
```javascript
// 每题1分，总分按百分制计算
finalScore = Math.round((correctCount / totalQuestions) * 100)
```

## 扩展功能

### 题目过滤和搜索
```javascript
// 按类型过滤
const singleQuestions = quizManager.getQuestions({ type: 'single' })

// 按难度过滤
const easyQuestions = quizManager.getQuestions({ difficulty: 'easy' })

// 按分类过滤
const mathQuestions = quizManager.getQuestions({ category: '数学' })

// 按标签过滤
const jsQuestions = quizManager.getQuestions({ tags: ['JavaScript'] })
```

### 随机题目生成
```javascript
// 随机获取10道题目
const randomQuestions = quizManager.getRandomQuestions(10)

// 随机获取指定类型的题目
const randomSingleQuestions = quizManager.getRandomQuestions(5, { type: 'single' })
```

## 测试

运行测试脚本验证系统功能：

```bash
node test/quiz-test.js
```

测试覆盖：
- 题目创建和验证
- 答案检查功能
- 自动评分功能
- 数据存储功能
- 完整答题流程

## 性能优化

1. **数据缓存**: 题目数据本地缓存，减少重复加载
2. **懒加载**: 按需加载题目内容
3. **批量操作**: 支持批量保存和删除题目
4. **内存管理**: 及时清理不需要的数据

## 安全考虑

1. **数据验证**: 严格验证题目数据格式
2. **错误处理**: 完善的异常处理机制
3. **存储限制**: 控制历史记录数量，避免存储溢出

## 未来扩展

1. **云端同步**: 支持题目数据云端同步
2. **题目导入**: 支持Excel/JSON格式题目导入
3. **统计分析**: 更详细的答题数据分析
4. **社交功能**: 答题排行榜、分享功能
5. **AI推荐**: 基于答题历史推荐相关题目

## 常见问题

### Q: 如何添加新的题目类型？
A: 在QuizManager类中扩展QUESTION_TYPES枚举，并在checkAnswer方法中添加对应的评分逻辑。

### Q: 如何自定义评分规则？
A: 修改autoGrade方法中的评分逻辑，可以为不同题目类型设置不同的分值。

### Q: 如何备份和恢复题目数据？
A: 使用getQuestions()获取所有题目数据进行备份，使用saveQuestions()恢复数据。

### Q: 如何清理存储空间？
A: 调用clearHistory()清空历史记录，或手动删除不需要的题目。

---

更多技术细节和使用示例，请参考源代码注释和测试文件。