/**
 * 评论服务后端实现
 * 包含完整的防恶意评论机制
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');

class CommentService {
  constructor() {
    this.app = express();
    this.comments = new Map(); // 存储评论数据
    this.userBehavior = new Map(); // 存储用户行为数据
    this.blacklist = new Set(); // 黑名单
    this.whitelist = new Set(); // 白名单
    this.rateLimitStore = new Map(); // 频率限制存储
    
    this.setupMiddleware();
    this.setupRoutes();
    this.loadInitialData();
  }

  // 设置中间件
  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 全局频率限制
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 限制每个IP 15分钟内最多100个请求
      message: {
        error: '请求过于频繁，请稍后再试',
        retryAfter: 15 * 60
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', globalLimiter);

    // 评论专用频率限制
    const commentLimiter = rateLimit({
      windowMs: 60 * 1000, // 1分钟
      max: 3, // 每分钟最多3条评论
      message: {
        error: '评论过于频繁，请稍后再试',
        retryAfter: 60
      },
      keyGenerator: (req) => {
        // 基于用户ID和IP的组合进行限制
        return `${req.user?.id || 'anonymous'}_${req.ip}`;
      }
    });
    this.app.use('/api/comments', commentLimiter);

    // 请求日志中间件
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });
  }

  // 设置路由
  setupRoutes() {
    // 获取评论列表
    this.app.get('/api/comments', this.getComments.bind(this));
    
    // 提交评论
    this.app.post('/api/comments', this.validateUser.bind(this), this.submitComment.bind(this));
    
    // 删除评论（管理员）
    this.app.delete('/api/comments/:id', this.requireAdmin.bind(this), this.deleteComment.bind(this));
    
    // 用户行为分析
    this.app.get('/api/analytics/user/:userId', this.getUserAnalytics.bind(this));
    
    // 系统统计
    this.app.get('/api/analytics/stats', this.getSystemStats.bind(this));
    
    // 黑名单管理
    this.app.post('/api/admin/blacklist', this.requireAdmin.bind(this), this.addToBlacklist.bind(this));
    this.app.delete('/api/admin/blacklist/:userId', this.requireAdmin.bind(this), this.removeFromBlacklist.bind(this));
    
    // 健康检查
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  // 加载初始数据
  loadInitialData() {
    // 加载示例评论
    this.loadSampleComments();
    
    // 加载黑名单
    this.loadBlacklist();
    
    // 加载敏感词库
    this.loadSensitiveWords();
  }

  // 加载示例评论
  loadSampleComments() {
    const sampleComments = [
      {
        id: 1,
        content: '这个游戏很有趣，画面也很精美！',
        userId: 'user_001',
        username: '玩家A',
        avatar: '/images/avatar1.png',
        timestamp: Date.now() - 3600000,
        likes: 15,
        tags: ['游戏', '画面'],
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
        quality: 0.85
      },
      {
        id: 2,
        content: '操作简单，适合休闲娱乐。',
        userId: 'user_002',
        username: '玩家B',
        avatar: '/images/avatar2.png',
        timestamp: Date.now() - 7200000,
        likes: 8,
        tags: ['操作', '休闲'],
        ip: '192.168.1.102',
        userAgent: 'Mozilla/5.0...',
        quality: 0.75
      }
    ];

    sampleComments.forEach(comment => {
      this.comments.set(comment.id, comment);
    });
  }

  // 加载黑名单
  loadBlacklist() {
    const blacklistedUsers = ['user_spam_001', 'user_troll_002'];
    blacklistedUsers.forEach(userId => {
      this.blacklist.add(userId);
    });
  }

  // 加载敏感词库
  loadSensitiveWords() {
    // 这里可以从数据库或文件加载敏感词
    this.sensitiveWords = [
      '垃圾', '骗子', '傻逼', '白痴', '智障', '脑残',
      '去死', '该死', '操你', 'fuck', 'shit', 'damn',
      '广告', '推广', '微信', '加群', 'qq群', '联系我',
      '色情', '赌博', '违法', '政治', '反动'
    ];
  }

  // 用户验证中间件
  validateUser(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // 匿名用户
      req.user = { id: 'anonymous', role: 'user' };
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
      } catch (error) {
        return res.status(401).json({ error: '无效的访问令牌' });
      }
    }
    
    // 检查用户是否在黑名单中
    if (this.blacklist.has(req.user.id)) {
      return res.status(403).json({ 
        error: '您的账户已被限制，无法发表评论',
        code: 'USER_BLOCKED'
      });
    }
    
    next();
  }

  // 管理员权限验证
  requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  }

  // 获取评论列表
  async getComments(req, res) {
    try {
      const { page = 1, limit = 10, sort = 'newest' } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      let comments = Array.from(this.comments.values());
      
      // 排序
      switch (sort) {
        case 'newest':
          comments.sort((a, b) => b.timestamp - a.timestamp);
          break;
        case 'oldest':
          comments.sort((a, b) => a.timestamp - b.timestamp);
          break;
        case 'popular':
          comments.sort((a, b) => b.likes - a.likes);
          break;
      }

      // 分页
      const paginatedComments = comments.slice(offset, offset + limitNum);
      
      // 格式化评论数据
      const formattedComments = paginatedComments.map(comment => ({
        id: comment.id,
        content: comment.content,
        username: comment.username,
        avatar: comment.avatar,
        timeAgo: this.getTimeAgo(comment.timestamp),
        likes: comment.likes,
        tags: comment.tags
      }));

      res.json({
        success: true,
        data: {
          comments: formattedComments,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: comments.length,
            hasMore: offset + limitNum < comments.length
          }
        }
      });
    } catch (error) {
      console.error('获取评论失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 提交评论
  async submitComment(req, res) {
    try {
      const { content, captcha } = req.body;
      const userId = req.user.id;
      const userIp = req.ip;
      const userAgent = req.get('User-Agent');

      // 基础验证
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: '评论内容不能为空' });
      }

      if (content.length > 500) {
        return res.status(400).json({ error: '评论内容过长' });
      }

      // 防刷检查
      const antiSpamResult = await this.performAntiSpamCheck(content, userId, userIp, userAgent);
      
      if (!antiSpamResult.allowed) {
        return res.status(429).json({
          error: antiSpamResult.reason,
          code: antiSpamResult.code,
          retryAfter: antiSpamResult.retryAfter
        });
      }

      // 创建评论
      const comment = {
        id: Date.now(),
        content: content.trim(),
        userId,
        username: req.user.username || '匿名用户',
        avatar: req.user.avatar || '/images/default-avatar.png',
        timestamp: Date.now(),
        likes: 0,
        tags: this.extractTags(content),
        ip: userIp,
        userAgent,
        quality: this.calculateContentQuality(content)
      };

      // 保存评论
      this.comments.set(comment.id, comment);
      
      // 更新用户行为数据
      this.updateUserBehavior(userId, userIp, 'comment');

      // 记录操作日志
      this.logUserAction(userId, 'submit_comment', { commentId: comment.id });

      res.json({
        success: true,
        data: {
          comment: {
            id: comment.id,
            content: comment.content,
            username: comment.username,
            avatar: comment.avatar,
            timeAgo: '刚刚',
            likes: 0,
            tags: comment.tags
          }
        }
      });

    } catch (error) {
      console.error('提交评论失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 防刷检查
  async performAntiSpamCheck(content, userId, userIp, userAgent) {
    // 1. 频率限制检查
    const rateLimitResult = this.checkRateLimit(userId, userIp);
    if (!rateLimitResult.allowed) {
      return {
        allowed: false,
        reason: '评论过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter
      };
    }

    // 2. 内容质量检查
    const qualityScore = this.calculateContentQuality(content);
    if (qualityScore < 0.3) {
      return {
        allowed: false,
        reason: '评论内容质量过低',
        code: 'LOW_QUALITY_CONTENT'
      };
    }

    // 3. 敏感词检查
    if (this.containsSensitiveWords(content)) {
      this.recordSuspiciousActivity(userId, 'sensitive_content', { content });
      return {
        allowed: false,
        reason: '评论包含不当内容',
        code: 'SENSITIVE_CONTENT'
      };
    }

    // 4. 重复内容检查
    if (this.isDuplicateContent(content)) {
      this.recordSuspiciousActivity(userId, 'duplicate_content', { content });
      return {
        allowed: false,
        reason: '评论内容重复',
        code: 'DUPLICATE_CONTENT'
      };
    }

    // 5. 用户行为检查
    const behaviorCheck = this.checkUserBehavior(userId);
    if (behaviorCheck.isSuspicious) {
      return {
        allowed: false,
        reason: '用户行为异常',
        code: 'SUSPICIOUS_BEHAVIOR',
        retryAfter: behaviorCheck.cooldownPeriod
      };
    }

    // 6. 垃圾内容检测
    const isSpam = this.detectSpamContent(content);
    if (isSpam) {
      this.recordSuspiciousActivity(userId, 'spam_content', { content });
      return {
        allowed: false,
        reason: '检测到垃圾内容',
        code: 'SPAM_CONTENT'
      };
    }

    return { allowed: true };
  }

  // 频率限制检查
  checkRateLimit(userId, userIp) {
    const key = `${userId}_${userIp}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分钟窗口
    const maxRequests = 3; // 每分钟最多3条评论

    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, []);
    }

    const requests = this.rateLimitStore.get(key);
    
    // 清理过期请求
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.rateLimitStore.set(key, validRequests);

    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      
      return {
        allowed: false,
        retryAfter
      };
    }

    // 记录当前请求
    validRequests.push(now);
    this.rateLimitStore.set(key, validRequests);

    return { allowed: true };
  }

  // 计算内容质量
  calculateContentQuality(content) {
    if (!content) return 0;
    
    let score = 1.0;
    const length = content.length;
    
    // 长度检查
    if (length < 3) score -= 0.5;
    if (length > 500) score -= 0.2;
    
    // 重复字符检查
    const repeatedChars = this.countRepeatedChars(content);
    if (repeatedChars > 5) score -= 0.3;
    
    // 特殊字符检查
    const specialChars = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
    if (specialChars > 10) score -= 0.2;
    
    // 唯一词汇检查
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words).size;
    if (uniqueWords < 2) score -= 0.3;
    
    // 中文内容加分
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseChars > 0) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  // 统计重复字符
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

  // 检查敏感词
  containsSensitiveWords(content) {
    const lowerContent = content.toLowerCase();
    return this.sensitiveWords.some(word => 
      lowerContent.includes(word.toLowerCase())
    );
  }

  // 检查重复内容
  isDuplicateContent(content) {
    const normalizedContent = this.normalizeText(content);
    
    for (const comment of this.comments.values()) {
      const normalizedComment = this.normalizeText(comment.content);
      const similarity = this.calculateSimilarity(normalizedContent, normalizedComment);
      
      if (similarity > 0.8) {
        return true;
      }
    }
    
    return false;
  }

  // 标准化文本
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
      .trim();
  }

  // 计算文本相似度
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const set1 = new Set(text1.split(''));
    const set2 = new Set(text2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // 检查用户行为
  checkUserBehavior(userId) {
    const behavior = this.userBehavior.get(userId) || {
      commentCount: 0,
      lastCommentTime: 0,
      suspiciousActions: 0,
      cooldownUntil: 0
    };
    
    const now = Date.now();
    
    // 检查是否在冷却期
    if (now < behavior.cooldownUntil) {
      return {
        isSuspicious: true,
        cooldownPeriod: Math.ceil((behavior.cooldownUntil - now) / 1000)
      };
    }
    
    // 检查可疑行为
    if (behavior.suspiciousActions > 3) {
      return {
        isSuspicious: true,
        cooldownPeriod: 300 // 5分钟冷却
      };
    }
    
    return { isSuspicious: false };
  }

  // 检测垃圾内容
  detectSpamContent(content) {
    const spamPatterns = [
      /(.)\1{10,}/, // 重复字符
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}/, // 过多特殊字符
      /\d{6,}/, // 长数字串
      /(https?:\/\/)?[^\s]+\.[^\s]{2,}/, // URL
      /微信|wechat|qq|QQ|群|加我|联系|电话|手机/g, // 联系方式
      /代练|刷分|外挂|辅助|破解|免费/g // 游戏相关垃圾信息
    ];
    
    return spamPatterns.some(pattern => pattern.test(content));
  }

  // 记录可疑活动
  recordSuspiciousActivity(userId, type, data) {
    const behavior = this.userBehavior.get(userId) || {
      commentCount: 0,
      lastCommentTime: 0,
      suspiciousActions: 0,
      cooldownUntil: 0
    };
    
    behavior.suspiciousActions++;
    behavior.cooldownUntil = Date.now() + (behavior.suspiciousActions * 60000); // 递增冷却时间
    
    this.userBehavior.set(userId, behavior);
    
    console.log(`可疑活动记录: 用户${userId}, 类型${type}, 数据:`, data);
  }

  // 更新用户行为
  updateUserBehavior(userId, userIp, action) {
    const behavior = this.userBehavior.get(userId) || {
      commentCount: 0,
      lastCommentTime: 0,
      suspiciousActions: 0,
      cooldownUntil: 0
    };
    
    if (action === 'comment') {
      behavior.commentCount++;
      behavior.lastCommentTime = Date.now();
    }
    
    this.userBehavior.set(userId, behavior);
  }

  // 记录用户操作日志
  logUserAction(userId, action, data) {
    const log = {
      userId,
      action,
      data,
      timestamp: Date.now(),
      ip: data.ip || 'unknown'
    };
    
    console.log('用户操作日志:', log);
  }

  // 提取标签
  extractTags(content) {
    const tags = [];
    
    const gameKeywords = ['游戏', '好玩', '有趣', '关卡', '难度', '操作', '画面', '音乐'];
    gameKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        tags.push('游戏');
      }
    });
    
    const suggestionKeywords = ['建议', '希望', '改进', '优化', '增加', '减少'];
    suggestionKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        tags.push('建议');
      }
    });
    
    return [...new Set(tags)];
  }

  // 获取时间差描述
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  }

  // 删除评论
  async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const commentId = parseInt(id);
      
      if (!this.comments.has(commentId)) {
        return res.status(404).json({ error: '评论不存在' });
      }
      
      const comment = this.comments.get(commentId);
      this.comments.delete(commentId);
      
      // 记录删除操作
      this.logUserAction(req.user.id, 'delete_comment', { 
        commentId, 
        deletedComment: comment.content 
      });
      
      res.json({ success: true, message: '评论已删除' });
    } catch (error) {
      console.error('删除评论失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 获取用户分析数据
  async getUserAnalytics(req, res) {
    try {
      const { userId } = req.params;
      const behavior = this.userBehavior.get(userId);
      
      if (!behavior) {
        return res.status(404).json({ error: '用户数据不存在' });
      }
      
      // 获取用户的评论
      const userComments = Array.from(this.comments.values())
        .filter(comment => comment.userId === userId);
      
      const analytics = {
        userId,
        commentCount: behavior.commentCount,
        suspiciousActions: behavior.suspiciousActions,
        lastCommentTime: behavior.lastCommentTime,
        averageQuality: userComments.length > 0 ? 
          userComments.reduce((sum, c) => sum + c.quality, 0) / userComments.length : 0,
        isBlocked: this.blacklist.has(userId),
        cooldownUntil: behavior.cooldownUntil
      };
      
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('获取用户分析失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 获取系统统计
  async getSystemStats(req, res) {
    try {
      const comments = Array.from(this.comments.values());
      const users = Array.from(this.userBehavior.keys());
      
      const stats = {
        totalComments: comments.length,
        totalUsers: users.length,
        blacklistedUsers: this.blacklist.size,
        averageQuality: comments.length > 0 ? 
          comments.reduce((sum, c) => sum + c.quality, 0) / comments.length : 0,
        spamRate: comments.filter(c => c.quality < 0.3).length / comments.length,
        activeUsersToday: users.filter(userId => {
          const behavior = this.userBehavior.get(userId);
          return behavior && (Date.now() - behavior.lastCommentTime) < 86400000;
        }).length
      };
      
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('获取系统统计失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 添加到黑名单
  async addToBlacklist(req, res) {
    try {
      const { userId, reason } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: '用户ID不能为空' });
      }
      
      this.blacklist.add(userId);
      
      // 记录操作日志
      this.logUserAction(req.user.id, 'add_to_blacklist', { userId, reason });
      
      res.json({ success: true, message: '用户已添加到黑名单' });
    } catch (error) {
      console.error('添加到黑名单失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 从黑名单移除
  async removeFromBlacklist(req, res) {
    try {
      const { userId } = req.params;
      
      if (!this.blacklist.has(userId)) {
        return res.status(404).json({ error: '用户不在黑名单中' });
      }
      
      this.blacklist.delete(userId);
      
      // 记录操作日志
      this.logUserAction(req.user.id, 'remove_from_blacklist', { userId });
      
      res.json({ success: true, message: '用户已从黑名单移除' });
    } catch (error) {
      console.error('从黑名单移除失败:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  // 启动服务
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`评论服务已启动，端口: ${port}`);
      console.log(`健康检查: http://localhost:${port}/api/health`);
    });
  }
}

module.exports = CommentService;