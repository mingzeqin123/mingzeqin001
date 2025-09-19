/**
 * 防恶意评论工具类
 * 提供多种防刷机制：内容检测、频率限制、行为分析等
 */

class AntiSpamUtil {
  constructor() {
    // 敏感词库
    this.sensitiveWords = [
      '垃圾', '骗子', '傻逼', '白痴', '智障', '脑残',
      '去死', '该死', '操你', 'fuck', 'shit', 'damn',
      '广告', '推广', '微信', '加群', 'qq群', '联系我',
      '色情', '赌博', '违法', '政治', '反动'
    ];
    
    // 垃圾内容模式
    this.spamPatterns = [
      /(.)\1{10,}/, // 重复字符
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}/, // 过多特殊字符
      /(.)\1{5,}/g, // 重复模式
      /^.{1,2}$/, // 过短内容
      /\d{6,}/, // 长数字串（可能是手机号或QQ号）
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 邮箱
      /(https?:\/\/)?[^\s]+\.[^\s]{2,}/, // URL
      /微信|wechat|qq|QQ|群|加我|联系|电话|手机/g, // 联系方式
      /代练|刷分|外挂|辅助|破解|免费/g // 游戏相关垃圾信息
    ];
    
    // 用户行为阈值
    this.thresholds = {
      maxCommentsPerMinute: 3,
      maxCommentsPerHour: 10,
      maxCommentsPerDay: 50,
      maxSimilarityRatio: 0.8,
      maxSuspiciousActions: 5
    };
    
    // 内容质量权重
    this.qualityWeights = {
      minLength: 3,
      maxLength: 500,
      minUniqueWords: 2,
      maxRepeatedChars: 5,
      maxSpecialChars: 10
    };
  }

  /**
   * 检查是否包含敏感词
   * @param {string} text - 待检测文本
   * @returns {boolean} - 是否包含敏感词
   */
  containsSensitiveWords(text) {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    return this.sensitiveWords.some(word => 
      lowerText.includes(word.toLowerCase())
    );
  }

  /**
   * 检测是否为重复内容
   * @param {string} text - 新评论内容
   * @param {Array} existingComments - 已有评论列表
   * @returns {boolean} - 是否为重复内容
   */
  isDuplicateContent(text, existingComments) {
    if (!text || !existingComments || existingComments.length === 0) {
      return false;
    }
    
    const normalizedText = this.normalizeText(text);
    
    return existingComments.some(comment => {
      const normalizedComment = this.normalizeText(comment.content);
      const similarity = this.calculateTextSimilarity(normalizedText, normalizedComment);
      return similarity > this.thresholds.maxSimilarityRatio;
    });
  }

  /**
   * 计算文本相似度
   * @param {string} text1 - 文本1
   * @param {string} text2 - 文本2
   * @returns {number} - 相似度 (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // 使用Jaccard相似度
    const set1 = new Set(text1.split(''));
    const set2 = new Set(text2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * 计算与现有评论的相似度
   * @param {string} text - 新评论
   * @param {Array} comments - 现有评论列表
   * @returns {number} - 最高相似度
   */
  calculateSimilarity(text, comments) {
    if (!comments || comments.length === 0) return 0;
    
    let maxSimilarity = 0;
    const normalizedText = this.normalizeText(text);
    
    comments.forEach(comment => {
      const similarity = this.calculateTextSimilarity(
        normalizedText, 
        this.normalizeText(comment.content)
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });
    
    return maxSimilarity;
  }

  /**
   * 标准化文本（去除标点、空格，转为小写）
   * @param {string} text - 原始文本
   * @returns {string} - 标准化后的文本
   */
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') // 只保留中文、英文、数字
      .trim();
  }

  /**
   * 检测垃圾内容
   * @param {string} text - 待检测文本
   * @returns {Promise<boolean>} - 是否为垃圾内容
   */
  async detectSpam(text) {
    if (!text) return false;
    
    // 基础模式检测
    const hasSpamPattern = this.spamPatterns.some(pattern => pattern.test(text));
    if (hasSpamPattern) return true;
    
    // 敏感词检测
    if (this.containsSensitiveWords(text)) return true;
    
    // 内容质量检测
    const qualityScore = this.calculateContentQuality(text);
    if (qualityScore < 0.3) return true;
    
    // 语义分析（模拟）
    const semanticScore = await this.analyzeSemantic(text);
    if (semanticScore < 0.2) return true;
    
    return false;
  }

  /**
   * 计算内容质量分数
   * @param {string} text - 文本内容
   * @returns {number} - 质量分数 (0-1)
   */
  calculateContentQuality(text) {
    if (!text) return 0;
    
    let score = 1.0;
    const length = text.length;
    
    // 长度检查
    if (length < this.qualityWeights.minLength) score -= 0.5;
    if (length > this.qualityWeights.maxLength) score -= 0.2;
    
    // 重复字符检查
    const repeatedChars = this.countRepeatedChars(text);
    if (repeatedChars > this.qualityWeights.maxRepeatedChars) {
      score -= 0.3;
    }
    
    // 特殊字符检查
    const specialChars = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialChars > this.qualityWeights.maxSpecialChars) {
      score -= 0.2;
    }
    
    // 唯一词汇检查
    const uniqueWords = new Set(text.split(/\s+/)).size;
    if (uniqueWords < this.qualityWeights.minUniqueWords) {
      score -= 0.3;
    }
    
    // 中文内容加分
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseChars > 0) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 统计重复字符数量
   * @param {string} text - 文本
   * @returns {number} - 重复字符数量
   */
  countRepeatedChars(text) {
    let maxRepeated = 0;
    let currentRepeated = 1;
    
    for (let i = 1; i < text.length; i++) {
      if (text[i] === text[i - 1]) {
        currentRepeated++;
      } else {
        maxRepeated = Math.max(maxRepeated, currentRepeated);
        currentRepeated = 1;
      }
    }
    
    return Math.max(maxRepeated, currentRepeated);
  }

  /**
   * 语义分析（模拟）
   * @param {string} text - 文本内容
   * @returns {Promise<number>} - 语义分数 (0-1)
   */
  async analyzeSemantic(text) {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 简单的语义分析逻辑
    const positiveWords = ['好', '棒', '赞', '喜欢', '不错', '推荐', '优秀'];
    const negativeWords = ['差', '烂', '垃圾', '讨厌', '不推荐', '失望'];
    const neutralWords = ['一般', '还行', '普通', '可以', '还好'];
    
    const lowerText = text.toLowerCase();
    let score = 0.5; // 基础分数
    
    // 正面词汇加分
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    score += positiveCount * 0.1;
    
    // 负面词汇减分
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    score -= negativeCount * 0.05;
    
    // 中性词汇微调
    const neutralCount = neutralWords.filter(word => lowerText.includes(word)).length;
    score += neutralCount * 0.02;
    
    // 内容长度合理性
    if (text.length > 10 && text.length < 200) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 提取内容标签
   * @param {string} text - 文本内容
   * @returns {Array<string>} - 标签数组
   */
  extractTags(text) {
    if (!text) return [];
    
    const tags = [];
    
    // 游戏相关标签
    const gameKeywords = ['游戏', '好玩', '有趣', '关卡', '难度', '操作', '画面', '音乐'];
    gameKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push('游戏');
      }
    });
    
    // 建议相关标签
    const suggestionKeywords = ['建议', '希望', '改进', '优化', '增加', '减少'];
    suggestionKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push('建议');
      }
    });
    
    // 体验相关标签
    const experienceKeywords = ['体验', '感觉', '流畅', '卡顿', 'bug', '问题'];
    experienceKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push('体验');
      }
    });
    
    return [...new Set(tags)]; // 去重
  }

  /**
   * 检查用户行为是否异常
   * @param {Object} userBehavior - 用户行为数据
   * @returns {Object} - 检查结果
   */
  checkUserBehavior(userBehavior) {
    const now = Date.now();
    const result = {
      isAbnormal: false,
      reasons: [],
      riskLevel: 'low' // low, medium, high
    };
    
    // 检查评论频率
    const timeSinceLastComment = now - userBehavior.lastCommentTime;
    const commentsPerMinute = userBehavior.commentCount / (timeSinceLastComment / 60000);
    
    if (commentsPerMinute > this.thresholds.maxCommentsPerMinute) {
      result.isAbnormal = true;
      result.reasons.push('评论频率过高');
      result.riskLevel = 'high';
    }
    
    // 检查可疑行为
    if (userBehavior.suspiciousActions > this.thresholds.maxSuspiciousActions) {
      result.isAbnormal = true;
      result.reasons.push('可疑行为过多');
      result.riskLevel = 'high';
    }
    
    // 检查评论数量
    if (userBehavior.commentCount > this.thresholds.maxCommentsPerDay) {
      result.isAbnormal = true;
      result.reasons.push('日评论数超限');
      result.riskLevel = 'medium';
    }
    
    return result;
  }

  /**
   * 生成风险评估报告
   * @param {string} text - 评论内容
   * @param {Object} userBehavior - 用户行为
   * @returns {Object} - 风险评估报告
   */
  generateRiskAssessment(text, userBehavior) {
    const report = {
      overallRisk: 'low',
      contentRisk: 'low',
      behaviorRisk: 'low',
      recommendations: [],
      score: 0
    };
    
    let riskScore = 0;
    
    // 内容风险评估
    if (this.containsSensitiveWords(text)) {
      report.contentRisk = 'high';
      riskScore += 50;
      report.recommendations.push('内容包含敏感词');
    }
    
    if (this.calculateContentQuality(text) < 0.3) {
      report.contentRisk = 'medium';
      riskScore += 30;
      report.recommendations.push('内容质量较低');
    }
    
    // 行为风险评估
    const behaviorCheck = this.checkUserBehavior(userBehavior);
    if (behaviorCheck.isAbnormal) {
      report.behaviorRisk = behaviorCheck.riskLevel;
      riskScore += behaviorCheck.riskLevel === 'high' ? 40 : 20;
      report.recommendations.push(...behaviorCheck.reasons);
    }
    
    // 计算总体风险
    if (riskScore >= 70) {
      report.overallRisk = 'high';
    } else if (riskScore >= 40) {
      report.overallRisk = 'medium';
    }
    
    report.score = riskScore;
    
    return report;
  }

  /**
   * 获取防刷建议
   * @param {Object} riskAssessment - 风险评估结果
   * @returns {Array<string>} - 建议列表
   */
  getAntiSpamRecommendations(riskAssessment) {
    const recommendations = [];
    
    switch (riskAssessment.overallRisk) {
      case 'high':
        recommendations.push('建议暂时限制用户评论');
        recommendations.push('要求用户进行人机验证');
        recommendations.push('增加冷却时间');
        break;
        
      case 'medium':
        recommendations.push('建议增加验证码验证');
        recommendations.push('延长评论间隔时间');
        recommendations.push('监控用户后续行为');
        break;
        
      case 'low':
        recommendations.push('正常处理评论');
        recommendations.push('继续监控用户行为');
        break;
    }
    
    return recommendations;
  }

  /**
   * 批量检测评论
   * @param {Array<string>} comments - 评论列表
   * @returns {Promise<Array>} - 检测结果
   */
  async batchDetectSpam(comments) {
    const results = [];
    
    for (const comment of comments) {
      const isSpam = await this.detectSpam(comment);
      const qualityScore = this.calculateContentQuality(comment);
      const tags = this.extractTags(comment);
      
      results.push({
        comment,
        isSpam,
        qualityScore,
        tags,
        timestamp: Date.now()
      });
    }
    
    return results;
  }

  /**
   * 更新敏感词库
   * @param {Array<string>} newWords - 新的敏感词
   */
  updateSensitiveWords(newWords) {
    this.sensitiveWords = [...new Set([...this.sensitiveWords, ...newWords])];
  }

  /**
   * 更新垃圾内容模式
   * @param {Array<RegExp>} newPatterns - 新的检测模式
   */
  updateSpamPatterns(newPatterns) {
    this.spamPatterns = [...new Set([...this.spamPatterns, ...newPatterns])];
  }

  /**
   * 获取统计信息
   * @param {Array} comments - 评论列表
   * @returns {Object} - 统计信息
   */
  getStatistics(comments) {
    const stats = {
      totalComments: comments.length,
      spamCount: 0,
      averageQuality: 0,
      tagDistribution: {},
      timeDistribution: {},
      qualityDistribution: {
        high: 0,    // > 0.7
        medium: 0,  // 0.3 - 0.7
        low: 0      // < 0.3
      }
    };
    
    let totalQuality = 0;
    
    comments.forEach(comment => {
      const quality = this.calculateContentQuality(comment.content);
      totalQuality += quality;
      
      // 质量分布统计
      if (quality > 0.7) {
        stats.qualityDistribution.high++;
      } else if (quality >= 0.3) {
        stats.qualityDistribution.medium++;
      } else {
        stats.qualityDistribution.low++;
        stats.spamCount++;
      }
      
      // 标签分布统计
      const tags = this.extractTags(comment.content);
      tags.forEach(tag => {
        stats.tagDistribution[tag] = (stats.tagDistribution[tag] || 0) + 1;
      });
      
      // 时间分布统计（按小时）
      const hour = new Date(comment.timestamp).getHours();
      stats.timeDistribution[hour] = (stats.timeDistribution[hour] || 0) + 1;
    });
    
    stats.averageQuality = comments.length > 0 ? totalQuality / comments.length : 0;
    
    return stats;
  }
}

// 导出单例实例
module.exports = new AntiSpamUtil();