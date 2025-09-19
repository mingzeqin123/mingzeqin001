// utils/antiSpam.js - 防恶意评论工具类

class AntiSpam {
  constructor() {
    // 敏感词库
    this.sensitiveWords = [
      // 政治敏感词
      '政治敏感词1', '政治敏感词2',
      // 色情词汇
      '色情词汇1', '色情词汇2',
      // 暴力词汇
      '暴力词汇1', '暴力词汇2',
      // 广告词汇
      '加微信', '联系QQ', '免费领取', '点击链接', '扫码关注',
      // 赌博相关
      '赌博', '彩票', '博彩', '下注',
      // 其他违规内容
      '刷单', '代刷', '外挂', '破解'
    ];
    
    // 垃圾评论模式
    this.spamPatterns = [
      /(.)\1{4,}/g, // 重复字符 (如: aaaaaaa)
      /[!！]{3,}/g, // 多个感叹号
      /[?？]{3,}/g, // 多个问号
      /[\u4e00-\u9fa5]{1}[\s]*[\u4e00-\u9fa5]{1}[\s]*[\u4e00-\u9fa5]{1}/g, // 字符间插入空格
      /^.{1,3}$/, // 过短内容
      /^(.)\1*$/, // 全是同一字符
    ];
    
    // 用户行为限制
    this.userLimits = {
      maxCommentsPerMinute: 3,
      maxCommentsPerHour: 20,
      maxCommentsPerDay: 100,
      minCommentInterval: 10000, // 10秒
      maxCommentLength: 500,
      minCommentLength: 2
    };
    
    // 黑名单用户
    this.blacklist = new Set();
    
    // 用户评论记录
    this.userActivity = new Map();
  }
  
  /**
   * 检查评论内容是否违规
   * @param {string} content 评论内容
   * @param {string} userId 用户ID
   * @returns {Object} 检查结果
   */
  checkComment(content, userId) {
    const result = {
      isValid: true,
      riskLevel: 0, // 0: 正常, 1: 低风险, 2: 中风险, 3: 高风险
      reasons: [],
      needCaptcha: false,
      needManualReview: false
    };
    
    // 1. 检查用户是否在黑名单
    if (this.blacklist.has(userId)) {
      result.isValid = false;
      result.riskLevel = 3;
      result.reasons.push('用户已被拉黑');
      return result;
    }
    
    // 2. 检查评论长度
    if (content.length < this.userLimits.minCommentLength) {
      result.isValid = false;
      result.reasons.push('评论内容过短');
      return result;
    }
    
    if (content.length > this.userLimits.maxCommentLength) {
      result.isValid = false;
      result.reasons.push('评论内容过长');
      return result;
    }
    
    // 3. 检查发言频率
    const frequencyCheck = this.checkUserFrequency(userId);
    if (!frequencyCheck.allowed) {
      result.isValid = false;
      result.riskLevel = 2;
      result.reasons.push(frequencyCheck.reason);
      return result;
    }
    
    // 4. 敏感词检查
    const sensitiveCheck = this.checkSensitiveWords(content);
    if (sensitiveCheck.found) {
      result.isValid = false;
      result.riskLevel = 3;
      result.reasons.push('包含敏感词汇');
      result.needManualReview = true;
      return result;
    }
    
    // 5. 垃圾内容检查
    const spamCheck = this.checkSpamPatterns(content);
    if (spamCheck.isSpam) {
      result.riskLevel = Math.max(result.riskLevel, 2);
      result.reasons.push(...spamCheck.reasons);
      
      if (spamCheck.severity >= 2) {
        result.isValid = false;
        return result;
      }
    }
    
    // 6. 用户信誉检查
    const userRisk = this.checkUserRisk(userId);
    if (userRisk.level > 0) {
      result.riskLevel = Math.max(result.riskLevel, userRisk.level);
      result.needCaptcha = userRisk.level >= 2;
      result.needManualReview = userRisk.level >= 3;
    }
    
    // 7. 内容相似度检查
    const similarityCheck = this.checkContentSimilarity(content, userId);
    if (similarityCheck.isSimilar) {
      result.riskLevel = Math.max(result.riskLevel, 1);
      result.reasons.push('内容重复度较高');
    }
    
    // 记录用户活动
    this.recordUserActivity(userId, content);
    
    return result;
  }
  
  /**
   * 检查用户发言频率
   * @param {string} userId 用户ID
   * @returns {Object} 频率检查结果
   */
  checkUserFrequency(userId) {
    const now = Date.now();
    const activity = this.userActivity.get(userId) || {
      comments: [],
      lastCommentTime: 0
    };
    
    // 检查最小间隔
    if (now - activity.lastCommentTime < this.userLimits.minCommentInterval) {
      return {
        allowed: false,
        reason: '评论间隔过短，请稍后再试'
      };
    }
    
    // 清理过期记录
    const oneHourAgo = now - 3600000; // 1小时
    const oneDayAgo = now - 86400000; // 24小时
    const oneMinuteAgo = now - 60000; // 1分钟
    
    activity.comments = activity.comments.filter(time => time > oneDayAgo);
    
    // 检查各时间段限制
    const commentsInLastMinute = activity.comments.filter(time => time > oneMinuteAgo).length;
    const commentsInLastHour = activity.comments.filter(time => time > oneHourAgo).length;
    const commentsInLastDay = activity.comments.length;
    
    if (commentsInLastMinute >= this.userLimits.maxCommentsPerMinute) {
      return {
        allowed: false,
        reason: '评论过于频繁，请稍后再试'
      };
    }
    
    if (commentsInLastHour >= this.userLimits.maxCommentsPerHour) {
      return {
        allowed: false,
        reason: '每小时评论数量已达上限'
      };
    }
    
    if (commentsInLastDay >= this.userLimits.maxCommentsPerDay) {
      return {
        allowed: false,
        reason: '今日评论数量已达上限'
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 检查敏感词
   * @param {string} content 评论内容
   * @returns {Object} 敏感词检查结果
   */
  checkSensitiveWords(content) {
    const lowerContent = content.toLowerCase();
    const foundWords = [];
    
    for (const word of this.sensitiveWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }
    
    return {
      found: foundWords.length > 0,
      words: foundWords
    };
  }
  
  /**
   * 检查垃圾内容模式
   * @param {string} content 评论内容
   * @returns {Object} 垃圾内容检查结果
   */
  checkSpamPatterns(content) {
    const reasons = [];
    let severity = 0;
    
    for (const pattern of this.spamPatterns) {
      if (pattern.test(content)) {
        reasons.push('疑似垃圾内容');
        severity++;
      }
    }
    
    // 检查特殊字符比例
    const specialCharRatio = (content.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length / content.length;
    if (specialCharRatio > 0.3) {
      reasons.push('特殊字符过多');
      severity++;
    }
    
    // 检查数字比例
    const numberRatio = (content.match(/\d/g) || []).length / content.length;
    if (numberRatio > 0.5) {
      reasons.push('数字内容过多');
      severity++;
    }
    
    return {
      isSpam: reasons.length > 0,
      reasons: reasons,
      severity: severity
    };
  }
  
  /**
   * 检查用户风险等级
   * @param {string} userId 用户ID
   * @returns {Object} 用户风险检查结果
   */
  checkUserRisk(userId) {
    const activity = this.userActivity.get(userId);
    if (!activity) {
      return { level: 1 }; // 新用户中等风险
    }
    
    const now = Date.now();
    const accountAge = now - (activity.firstCommentTime || now);
    const totalComments = activity.totalComments || 0;
    const reportCount = activity.reportCount || 0;
    
    let riskLevel = 0;
    
    // 新账户风险
    if (accountAge < 86400000) { // 24小时内的新账户
      riskLevel = Math.max(riskLevel, 1);
    }
    
    // 被举报次数
    if (reportCount > 0) {
      riskLevel = Math.max(riskLevel, reportCount > 5 ? 3 : 2);
    }
    
    // 评论频率异常
    if (totalComments > 50 && accountAge < 86400000 * 7) { // 一周内发布超过50条评论
      riskLevel = Math.max(riskLevel, 2);
    }
    
    return { level: riskLevel };
  }
  
  /**
   * 检查内容相似度
   * @param {string} content 评论内容
   * @param {string} userId 用户ID
   * @returns {Object} 相似度检查结果
   */
  checkContentSimilarity(content, userId) {
    const activity = this.userActivity.get(userId);
    if (!activity || !activity.recentComments) {
      return { isSimilar: false };
    }
    
    // 检查与最近评论的相似度
    for (const recentContent of activity.recentComments) {
      const similarity = this.calculateSimilarity(content, recentContent);
      if (similarity > 0.8) {
        return { isSimilar: true, similarity };
      }
    }
    
    return { isSimilar: false };
  }
  
  /**
   * 计算字符串相似度
   * @param {string} str1 字符串1
   * @param {string} str2 字符串2
   * @returns {number} 相似度 (0-1)
   */
  calculateSimilarity(str1, str2) {
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
   * 记录用户活动
   * @param {string} userId 用户ID
   * @param {string} content 评论内容
   */
  recordUserActivity(userId, content) {
    const now = Date.now();
    let activity = this.userActivity.get(userId) || {
      comments: [],
      recentComments: [],
      totalComments: 0,
      firstCommentTime: now,
      lastCommentTime: 0,
      reportCount: 0
    };
    
    activity.comments.push(now);
    activity.lastCommentTime = now;
    activity.totalComments++;
    
    // 保持最近10条评论用于相似度检查
    activity.recentComments = activity.recentComments || [];
    activity.recentComments.push(content);
    if (activity.recentComments.length > 10) {
      activity.recentComments.shift();
    }
    
    this.userActivity.set(userId, activity);
  }
  
  /**
   * 将用户加入黑名单
   * @param {string} userId 用户ID
   * @param {string} reason 拉黑原因
   */
  addToBlacklist(userId, reason) {
    this.blacklist.add(userId);
    
    // 记录拉黑信息到本地存储
    try {
      const blacklistData = wx.getStorageSync('user_blacklist') || {};
      blacklistData[userId] = {
        reason: reason,
        timestamp: Date.now()
      };
      wx.setStorageSync('user_blacklist', blacklistData);
    } catch (e) {
      console.error('保存黑名单失败:', e);
    }
  }
  
  /**
   * 从黑名单移除用户
   * @param {string} userId 用户ID
   */
  removeFromBlacklist(userId) {
    this.blacklist.delete(userId);
    
    try {
      const blacklistData = wx.getStorageSync('user_blacklist') || {};
      delete blacklistData[userId];
      wx.setStorageSync('user_blacklist', blacklistData);
    } catch (e) {
      console.error('更新黑名单失败:', e);
    }
  }
  
  /**
   * 增加用户举报次数
   * @param {string} userId 用户ID
   */
  increaseReportCount(userId) {
    const activity = this.userActivity.get(userId) || {};
    activity.reportCount = (activity.reportCount || 0) + 1;
    this.userActivity.set(userId, activity);
    
    // 如果举报次数过多，自动加入黑名单
    if (activity.reportCount >= 10) {
      this.addToBlacklist(userId, '多次被举报');
    }
  }
  
  /**
   * 生成验证码
   * @returns {string} 验证码
   */
  generateCaptcha() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let captcha = '';
    for (let i = 0; i < 4; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
  }
  
  /**
   * 初始化黑名单（从本地存储加载）
   */
  initBlacklist() {
    try {
      const blacklistData = wx.getStorageSync('user_blacklist') || {};
      for (const userId in blacklistData) {
        this.blacklist.add(userId);
      }
    } catch (e) {
      console.error('加载黑名单失败:', e);
    }
  }
}

// 导出单例
const antiSpam = new AntiSpam();
antiSpam.initBlacklist();

module.exports = antiSpam;