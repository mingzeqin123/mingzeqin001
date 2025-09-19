// utils/riskAssessment.js - 用户风险评估系统

class RiskAssessment {
  constructor() {
    // 风险评估权重配置
    this.weights = {
      accountAge: 0.2,        // 账户年龄权重
      commentFrequency: 0.25, // 评论频率权重
      reportCount: 0.3,       // 被举报次数权重
      contentQuality: 0.15,   // 内容质量权重
      timePattern: 0.1        // 时间模式权重
    };
    
    // 风险阈值
    this.thresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8
    };
    
    // 行为模式检测
    this.suspiciousPatterns = {
      rapidCommenting: 5,     // 快速评论次数阈值
      nightActivity: 0.7,     // 夜间活动比例阈值
      repeatContent: 0.8,     // 重复内容相似度阈值
      shortComments: 0.6      // 短评论比例阈值
    };
  }

  /**
   * 评估用户风险等级
   * @param {string} userId 用户ID
   * @param {Object} userProfile 用户资料
   * @param {Array} userComments 用户评论历史
   * @returns {Object} 风险评估结果
   */
  assessUserRisk(userId, userProfile, userComments) {
    const factors = {
      accountAge: this.assessAccountAge(userProfile),
      commentFrequency: this.assessCommentFrequency(userComments),
      reportCount: this.assessReportCount(userProfile),
      contentQuality: this.assessContentQuality(userComments),
      timePattern: this.assessTimePattern(userComments)
    };
    
    // 计算综合风险分数
    let riskScore = 0;
    for (const [factor, score] of Object.entries(factors)) {
      riskScore += score * this.weights[factor];
    }
    
    // 确定风险等级
    let riskLevel = 0;
    if (riskScore >= this.thresholds.high) {
      riskLevel = 3;
    } else if (riskScore >= this.thresholds.medium) {
      riskLevel = 2;
    } else if (riskScore >= this.thresholds.low) {
      riskLevel = 1;
    }
    
    return {
      userId,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      riskText: this.getRiskLevelText(riskLevel),
      factors,
      recommendations: this.getRecommendations(riskLevel, factors),
      timestamp: Date.now()
    };
  }

  /**
   * 评估账户年龄风险
   * @param {Object} userProfile 用户资料
   * @returns {number} 风险分数 (0-1)
   */
  assessAccountAge(userProfile) {
    const accountAge = Date.now() - (userProfile.joinTime || Date.now());
    const ageInDays = accountAge / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 1) return 0.9;      // 新注册用户高风险
    if (ageInDays < 7) return 0.7;      // 一周内中高风险
    if (ageInDays < 30) return 0.4;     // 一月内中等风险
    if (ageInDays < 90) return 0.2;     // 三月内低风险
    return 0.1;                         // 老用户低风险
  }

  /**
   * 评估评论频率风险
   * @param {Array} userComments 用户评论历史
   * @returns {number} 风险分数 (0-1)
   */
  assessCommentFrequency(userComments) {
    if (!userComments || userComments.length === 0) return 0.3;
    
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;
    
    // 统计不同时间段的评论数
    const commentsInHour = userComments.filter(c => now - c.timestamp < oneHour).length;
    const commentsInDay = userComments.filter(c => now - c.timestamp < oneDay).length;
    const commentsInWeek = userComments.filter(c => now - c.timestamp < oneWeek).length;
    
    let riskScore = 0;
    
    // 每小时评论数风险
    if (commentsInHour > 20) riskScore += 0.4;
    else if (commentsInHour > 10) riskScore += 0.3;
    else if (commentsInHour > 5) riskScore += 0.2;
    
    // 每日评论数风险
    if (commentsInDay > 100) riskScore += 0.3;
    else if (commentsInDay > 50) riskScore += 0.2;
    else if (commentsInDay > 20) riskScore += 0.1;
    
    // 每周评论数风险
    if (commentsInWeek > 500) riskScore += 0.3;
    else if (commentsInWeek > 200) riskScore += 0.2;
    
    return Math.min(riskScore, 1);
  }

  /**
   * 评估被举报次数风险
   * @param {Object} userProfile 用户资料
   * @returns {number} 风险分数 (0-1)
   */
  assessReportCount(userProfile) {
    const reportCount = userProfile.reportCount || 0;
    
    if (reportCount >= 10) return 1.0;   // 被举报10次以上极高风险
    if (reportCount >= 5) return 0.8;    // 被举报5次以上高风险
    if (reportCount >= 3) return 0.6;    // 被举报3次以上中高风险
    if (reportCount >= 1) return 0.3;    // 被举报1次以上中等风险
    return 0.0;                          // 未被举报低风险
  }

  /**
   * 评估内容质量风险
   * @param {Array} userComments 用户评论历史
   * @returns {number} 风险分数 (0-1)
   */
  assessContentQuality(userComments) {
    if (!userComments || userComments.length === 0) return 0.3;
    
    let qualityIssues = 0;
    let totalComments = userComments.length;
    
    // 分析最近的评论
    const recentComments = userComments.slice(-20);
    
    for (const comment of recentComments) {
      const content = comment.content || '';
      
      // 检查短评论
      if (content.length < 5) qualityIssues++;
      
      // 检查重复字符
      if (/(.)\1{3,}/.test(content)) qualityIssues++;
      
      // 检查特殊字符比例
      const specialCharRatio = (content.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length / content.length;
      if (specialCharRatio > 0.3) qualityIssues++;
      
      // 检查数字比例
      const numberRatio = (content.match(/\d/g) || []).length / content.length;
      if (numberRatio > 0.5) qualityIssues++;
    }
    
    const qualityRatio = qualityIssues / Math.min(recentComments.length, 20);
    return Math.min(qualityRatio * 2, 1); // 放大风险系数
  }

  /**
   * 评估时间模式风险
   * @param {Array} userComments 用户评论历史
   * @returns {number} 风险分数 (0-1)
   */
  assessTimePattern(userComments) {
    if (!userComments || userComments.length < 10) return 0.2;
    
    const hours = userComments.map(comment => {
      const date = new Date(comment.timestamp);
      return date.getHours();
    });
    
    // 统计夜间活动（22:00-06:00）
    const nightHours = hours.filter(hour => hour >= 22 || hour <= 6).length;
    const nightActivityRatio = nightHours / hours.length;
    
    // 检查活动时间分布的均匀性
    const hourCounts = new Array(24).fill(0);
    hours.forEach(hour => hourCounts[hour]++);
    
    // 计算活动时间的标准差
    const mean = hours.length / 24;
    const variance = hourCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / 24;
    const standardDeviation = Math.sqrt(variance);
    
    let riskScore = 0;
    
    // 夜间活动过多
    if (nightActivityRatio > this.suspiciousPatterns.nightActivity) {
      riskScore += 0.4;
    }
    
    // 活动时间过于集中（可能是机器人）
    if (standardDeviation > mean * 2) {
      riskScore += 0.3;
    }
    
    // 检查快速连续评论
    const timestamps = userComments.map(c => c.timestamp).sort();
    let rapidComments = 0;
    
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i-1] < 5000) { // 5秒内
        rapidComments++;
      }
    }
    
    if (rapidComments > this.suspiciousPatterns.rapidCommenting) {
      riskScore += 0.3;
    }
    
    return Math.min(riskScore, 1);
  }

  /**
   * 检测内容相似度
   * @param {Array} userComments 用户评论历史
   * @returns {number} 相似度分数 (0-1)
   */
  detectContentSimilarity(userComments) {
    if (!userComments || userComments.length < 2) return 0;
    
    const contents = userComments.map(c => c.content || '').slice(-10); // 最近10条
    let similaritySum = 0;
    let comparisons = 0;
    
    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const similarity = this.calculateStringSimilarity(contents[i], contents[j]);
        similaritySum += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? similaritySum / comparisons : 0;
  }

  /**
   * 计算字符串相似度
   * @param {string} str1 字符串1
   * @param {string} str2 字符串2
   * @returns {number} 相似度 (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return maxLen > 0 ? 1 - matrix[len1][len2] / maxLen : 1;
  }

  /**
   * 获取风险等级文本
   * @param {number} riskLevel 风险等级
   * @returns {string} 风险等级文本
   */
  getRiskLevelText(riskLevel) {
    const levelTexts = {
      0: '正常用户',
      1: '低风险用户',
      2: '中风险用户',
      3: '高风险用户'
    };
    return levelTexts[riskLevel] || '未知';
  }

  /**
   * 获取风险处理建议
   * @param {number} riskLevel 风险等级
   * @param {Object} factors 风险因子
   * @returns {Array} 建议列表
   */
  getRecommendations(riskLevel, factors) {
    const recommendations = [];
    
    if (riskLevel === 0) {
      recommendations.push('用户行为正常，无需特殊处理');
    } else if (riskLevel === 1) {
      recommendations.push('建议增加内容审核');
      if (factors.accountAge > 0.5) {
        recommendations.push('新用户，建议限制评论频率');
      }
    } else if (riskLevel === 2) {
      recommendations.push('需要验证码验证');
      recommendations.push('评论进入人工审核队列');
      if (factors.reportCount > 0.5) {
        recommendations.push('考虑临时限制评论权限');
      }
    } else if (riskLevel === 3) {
      recommendations.push('建议立即人工审核');
      recommendations.push('所有评论需要预审核');
      recommendations.push('考虑加入黑名单');
      if (factors.reportCount > 0.8) {
        recommendations.push('建议永久封禁');
      }
    }
    
    return recommendations;
  }

  /**
   * 更新用户风险档案
   * @param {string} userId 用户ID
   * @param {Object} riskAssessment 风险评估结果
   */
  updateUserRiskProfile(userId, riskAssessment) {
    try {
      const riskProfiles = wx.getStorageSync('user_risk_profiles') || {};
      
      riskProfiles[userId] = {
        ...riskAssessment,
        updateTime: Date.now(),
        history: (riskProfiles[userId]?.history || []).concat([{
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
          timestamp: Date.now()
        }]).slice(-10) // 保留最近10次记录
      };
      
      wx.setStorageSync('user_risk_profiles', riskProfiles);
    } catch (error) {
      console.error('更新用户风险档案失败:', error);
    }
  }

  /**
   * 获取用户风险档案
   * @param {string} userId 用户ID
   * @returns {Object} 用户风险档案
   */
  getUserRiskProfile(userId) {
    try {
      const riskProfiles = wx.getStorageSync('user_risk_profiles') || {};
      return riskProfiles[userId] || null;
    } catch (error) {
      console.error('获取用户风险档案失败:', error);
      return null;
    }
  }

  /**
   * 批量评估用户风险
   * @param {Array} users 用户列表
   * @returns {Array} 风险评估结果列表
   */
  batchAssessRisk(users) {
    return users.map(user => {
      return this.assessUserRisk(user.userId, user.profile, user.comments);
    });
  }

  /**
   * 获取风险统计
   * @returns {Object} 风险统计信息
   */
  getRiskStatistics() {
    try {
      const riskProfiles = wx.getStorageSync('user_risk_profiles') || {};
      const profiles = Object.values(riskProfiles);
      
      const stats = {
        total: profiles.length,
        normal: profiles.filter(p => p.riskLevel === 0).length,
        low: profiles.filter(p => p.riskLevel === 1).length,
        medium: profiles.filter(p => p.riskLevel === 2).length,
        high: profiles.filter(p => p.riskLevel === 3).length,
        averageScore: profiles.length > 0 ? 
          profiles.reduce((sum, p) => sum + p.riskScore, 0) / profiles.length : 0
      };
      
      return stats;
    } catch (error) {
      console.error('获取风险统计失败:', error);
      return { total: 0, normal: 0, low: 0, medium: 0, high: 0, averageScore: 0 };
    }
  }
}

// 导出单例
const riskAssessment = new RiskAssessment();

module.exports = riskAssessment;