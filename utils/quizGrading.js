// 自动评分系统
class QuizGrading {
  constructor() {
    this.questionTypes = {
      SINGLE: 'single',
      MULTIPLE: 'multiple',
      TRUEFALSE: 'truefalse'
    }
  }

  // 评分单个题目
  gradeQuestion(question, userAnswer) {
    const { type, correctAnswer } = question
    
    switch (type) {
      case this.questionTypes.SINGLE:
        return this.gradeSingleChoice(correctAnswer, userAnswer)
      
      case this.questionTypes.MULTIPLE:
        return this.gradeMultipleChoice(correctAnswer, userAnswer)
      
      case this.questionTypes.TRUEFALSE:
        return this.gradeTrueFalse(correctAnswer, userAnswer)
      
      default:
        return { isCorrect: false, score: 0, feedback: '未知题目类型' }
    }
  }

  // 评分单选题
  gradeSingleChoice(correctAnswer, userAnswer) {
    const isCorrect = correctAnswer === userAnswer
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? '回答正确！' : '回答错误，请查看解析。'
    }
  }

  // 评分多选题
  gradeMultipleChoice(correctAnswer, userAnswer) {
    if (!Array.isArray(userAnswer)) {
      return {
        isCorrect: false,
        score: 0,
        feedback: '多选题答案格式错误'
      }
    }

    // 检查答案是否完全正确
    const correctSet = new Set(correctAnswer)
    const userSet = new Set(userAnswer)
    
    const isCorrect = correctSet.size === userSet.size && 
                     [...correctSet].every(answer => userSet.has(answer))
    
    if (isCorrect) {
      return {
        isCorrect: true,
        score: 1,
        feedback: '回答正确！'
      }
    } else {
      // 部分正确的情况
      const correctCount = [...correctSet].filter(answer => userSet.has(answer)).length
      const wrongCount = [...userSet].filter(answer => !correctSet.has(answer)).length
      
      let feedback = ''
      if (correctCount > 0) {
        feedback += `选对了 ${correctCount} 个选项。`
      }
      if (wrongCount > 0) {
        feedback += `选错了 ${wrongCount} 个选项。`
      }
      feedback += '请查看解析。'
      
      return {
        isCorrect: false,
        score: 0,
        feedback
      }
    }
  }

  // 评分判断题
  gradeTrueFalse(correctAnswer, userAnswer) {
    const isCorrect = correctAnswer === userAnswer
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: isCorrect ? '回答正确！' : '回答错误，请查看解析。'
    }
  }

  // 评分整个测验
  gradeQuiz(questions, userAnswers) {
    const results = []
    let totalScore = 0
    let correctCount = 0

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[question.id]
      const gradeResult = this.gradeQuestion(question, userAnswer)
      
      results.push({
        questionId: question.id,
        question: question.question,
        type: question.type,
        userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        ...gradeResult
      })

      totalScore += gradeResult.score
      if (gradeResult.isCorrect) {
        correctCount++
      }
    })

    const totalQuestions = questions.length
    const percentage = Math.round((totalScore / totalQuestions) * 100)
    
    // 根据分数给出评价
    let evaluation = ''
    if (percentage >= 90) {
      evaluation = '优秀！'
    } else if (percentage >= 80) {
      evaluation = '良好！'
    } else if (percentage >= 70) {
      evaluation = '及格。'
    } else if (percentage >= 60) {
      evaluation = '需要加强。'
    } else {
      evaluation = '需要重新学习。'
    }

    return {
      results,
      totalScore,
      totalQuestions,
      correctCount,
      percentage,
      evaluation,
      timestamp: Date.now()
    }
  }

  // 获取统计信息
  getStatistics(results) {
    if (!results || results.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        recentScores: []
      }
    }

    const scores = results.map(r => r.percentage)
    const totalQuizzes = results.length
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalQuizzes)
    const bestScore = Math.max(...scores)
    const recentScores = results.slice(-5).map(r => r.percentage) // 最近5次成绩

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      recentScores
    }
  }
}

module.exports = QuizGrading