// pages/comments/comments.js
const AntiSpamUtil = require('../../utils/antiSpam.js');

Page({
  data: {
    // 评论输入相关
    commentText: '',
    isSubmitting: false,
    canSubmit: false,
    
    // 验证码相关
    showCaptcha: false,
    captchaImage: '',
    captchaCode: '',
    
    // 用户状态
    isUserBlocked: false,
    cooldownTime: 0,
    cooldownTimer: null,
    
    // 评论列表
    comments: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    totalComments: 0,
    
    // 排序
    sortIndex: 0,
    sortOptions: ['最新', '最热', '最早'],
    
    // 统计
    showStatsModal: false,
    stats: {
      todayComments: 0,
      totalComments: 0,
      activeUsers: 0
    },
    
    // 管理员
    isAdmin: false,
    
    // 用户行为追踪
    userBehavior: {
      commentCount: 0,
      lastCommentTime: 0,
      suspiciousActions: 0,
      ipAddress: '',
      deviceFingerprint: ''
    }
  },

  onLoad(options) {
    console.log('评论页面加载');
    this.initUserBehavior();
    this.loadComments();
    this.checkUserStatus();
    this.loadStats();
  },

  onShow() {
    // 页面显示时检查用户状态
    this.checkUserStatus();
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.setData({ page: 1, comments: [], hasMore: true });
    this.loadComments().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 初始化用户行为追踪
  initUserBehavior() {
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    // 获取用户基本信息
    this.setData({
      'userBehavior.commentCount': wx.getStorageSync('userCommentCount') || 0,
      'userBehavior.lastCommentTime': wx.getStorageSync('lastCommentTime') || 0,
      'userBehavior.ipAddress': this.getClientIP(),
      'userBehavior.deviceFingerprint': this.generateDeviceFingerprint()
    });
    
    // 检查是否为管理员
    this.setData({
      isAdmin: userInfo && userInfo.role === 'admin'
    });
  },

  // 检查用户状态（是否被限制）
  checkUserStatus() {
    const now = Date.now();
    const lastCommentTime = this.data.userBehavior.lastCommentTime;
    const cooldownPeriod = this.getCooldownPeriod();
    
    if (now - lastCommentTime < cooldownPeriod) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - lastCommentTime)) / 1000);
      this.setData({
        cooldownTime: remainingTime,
        isUserBlocked: true
      });
      
      // 启动倒计时
      this.startCooldownTimer();
    } else {
      this.setData({
        cooldownTime: 0,
        isUserBlocked: false
      });
    }
  },

  // 获取冷却时间（根据用户行为动态调整）
  getCooldownPeriod() {
    const behavior = this.data.userBehavior;
    let baseCooldown = 60000; // 1分钟基础冷却
    
    // 根据可疑行为增加冷却时间
    if (behavior.suspiciousActions > 3) {
      baseCooldown = 300000; // 5分钟
    } else if (behavior.suspiciousActions > 1) {
      baseCooldown = 180000; // 3分钟
    }
    
    // 根据评论频率调整
    const recentComments = behavior.commentCount;
    if (recentComments > 20) {
      baseCooldown *= 2;
    } else if (recentComments > 10) {
      baseCooldown *= 1.5;
    }
    
    return baseCooldown;
  },

  // 启动冷却倒计时
  startCooldownTimer() {
    if (this.data.cooldownTimer) {
      clearInterval(this.data.cooldownTimer);
    }
    
    const timer = setInterval(() => {
      const cooldownTime = this.data.cooldownTime - 1;
      if (cooldownTime <= 0) {
        clearInterval(timer);
        this.setData({
          cooldownTime: 0,
          isUserBlocked: false,
          cooldownTimer: null
        });
      } else {
        this.setData({ cooldownTime });
      }
    }, 1000);
    
    this.setData({ cooldownTimer: timer });
  },

  // 评论输入处理
  onCommentInput(e) {
    const value = e.detail.value;
    this.setData({
      commentText: value,
      canSubmit: this.validateComment(value)
    });
    
    // 实时内容检测
    this.detectSuspiciousContent(value);
  },

  // 验证评论内容
  validateComment(text) {
    if (!text || text.trim().length === 0) return false;
    if (text.length < 3) return false;
    if (text.length > 500) return false;
    
    // 检查是否包含敏感词
    if (AntiSpamUtil.containsSensitiveWords(text)) {
      return false;
    }
    
    // 检查是否为重复内容
    if (AntiSpamUtil.isDuplicateContent(text, this.data.comments)) {
      return false;
    }
    
    return true;
  },

  // 检测可疑内容
  detectSuspiciousContent(text) {
    const suspiciousPatterns = [
      /(.)\1{10,}/, // 重复字符超过10个
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}/, // 过多特殊字符
      /(.)\1{5,}/g, // 重复模式
      /^.{1,2}$/ // 过短内容
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(text));
    
    if (isSuspicious) {
      this.incrementSuspiciousActions();
    }
  },

  // 增加可疑行为计数
  incrementSuspiciousActions() {
    const count = this.data.userBehavior.suspiciousActions + 1;
    this.setData({
      'userBehavior.suspiciousActions': count
    });
    
    // 保存到本地存储
    wx.setStorageSync('suspiciousActions', count);
    
    // 如果可疑行为过多，显示验证码
    if (count > 2 && !this.data.showCaptcha) {
      this.showCaptchaVerification();
    }
  },

  // 显示验证码验证
  showCaptchaVerification() {
    this.setData({ showCaptcha: true });
    this.refreshCaptcha();
  },

  // 刷新验证码
  refreshCaptcha() {
    // 生成验证码图片（这里使用简单的数字验证码）
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const canvas = wx.createCanvasContext('captchaCanvas');
    
    // 绘制验证码背景
    canvas.setFillStyle('#f0f0f0');
    canvas.fillRect(0, 0, 120, 40);
    
    // 绘制干扰线
    for (let i = 0; i < 5; i++) {
      canvas.setStrokeStyle(`hsl(${Math.random() * 360}, 50%, 70%)`);
      canvas.beginPath();
      canvas.moveTo(Math.random() * 120, Math.random() * 40);
      canvas.lineTo(Math.random() * 120, Math.random() * 40);
      canvas.stroke();
    }
    
    // 绘制验证码文字
    canvas.setFillStyle('#333');
    canvas.setFontSize(20);
    canvas.setTextAlign('center');
    canvas.fillText(code, 60, 25);
    
    canvas.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'captchaCanvas',
        success: (res) => {
          this.setData({
            captchaImage: res.tempFilePath,
            correctCaptcha: code
          });
        }
      });
    });
  },

  // 验证码输入处理
  onCaptchaInput(e) {
    this.setData({ captchaCode: e.detail.value.toUpperCase() });
  },

  // 提交评论
  async submitComment() {
    if (!this.data.canSubmit || this.data.isSubmitting || this.data.isUserBlocked) {
      return;
    }
    
    // 验证码验证
    if (this.data.showCaptcha) {
      if (this.data.captchaCode !== this.data.correctCaptcha) {
        wx.showToast({
          title: '验证码错误',
          icon: 'error'
        });
        this.refreshCaptcha();
        return;
      }
    }
    
    this.setData({ isSubmitting: true });
    
    try {
      // 最终内容验证
      const validationResult = await this.validateCommentContent(this.data.commentText);
      
      if (!validationResult.valid) {
        wx.showModal({
          title: '评论内容不符合规范',
          content: validationResult.reason,
          showCancel: false
        });
        return;
      }
      
      // 提交评论到服务器
      const commentData = {
        content: this.data.commentText,
        userId: getApp().globalData.userInfo?.id || 'anonymous',
        username: getApp().globalData.userInfo?.nickName || '匿名用户',
        avatar: getApp().globalData.userInfo?.avatarUrl || '',
        timestamp: Date.now(),
        ip: this.data.userBehavior.ipAddress,
        deviceFingerprint: this.data.userBehavior.deviceFingerprint
      };
      
      const result = await this.submitCommentToServer(commentData);
      
      if (result.success) {
        wx.showToast({
          title: '评论发表成功',
          icon: 'success'
        });
        
        // 更新用户行为数据
        this.updateUserBehavior();
        
        // 清空输入
        this.setData({
          commentText: '',
          canSubmit: false,
          showCaptcha: false,
          captchaCode: ''
        });
        
        // 刷新评论列表
        this.setData({ page: 1, comments: [], hasMore: true });
        this.loadComments();
        
      } else {
        throw new Error(result.message || '提交失败');
      }
      
    } catch (error) {
      console.error('提交评论失败:', error);
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'error'
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 验证评论内容（包含更多检查）
  async validateCommentContent(text) {
    // 基础验证
    if (!this.validateComment(text)) {
      return { valid: false, reason: '评论内容不符合基本要求' };
    }
    
    // 检查内容相似度
    const similarity = AntiSpamUtil.calculateSimilarity(text, this.data.comments);
    if (similarity > 0.8) {
      return { valid: false, reason: '评论内容与已有评论过于相似' };
    }
    
    // 检查是否为垃圾内容
    const isSpam = await AntiSpamUtil.detectSpam(text);
    if (isSpam) {
      this.incrementSuspiciousActions();
      return { valid: false, reason: '检测到垃圾内容' };
    }
    
    // 检查用户行为异常
    if (this.data.userBehavior.suspiciousActions > 5) {
      return { valid: false, reason: '您的行为异常，暂时无法发表评论' };
    }
    
    return { valid: true };
  },

  // 提交评论到服务器
  async submitCommentToServer(commentData) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟服务器验证
        const success = Math.random() > 0.1; // 90%成功率
        
        if (success) {
          resolve({
            success: true,
            comment: {
              ...commentData,
              id: Date.now(),
              likes: 0,
              tags: AntiSpamUtil.extractTags(commentData.content)
            }
          });
        } else {
          resolve({
            success: false,
            message: '服务器繁忙，请稍后重试'
          });
        }
      }, 1000);
    });
  },

  // 更新用户行为数据
  updateUserBehavior() {
    const now = Date.now();
    const newCount = this.data.userBehavior.commentCount + 1;
    
    this.setData({
      'userBehavior.commentCount': newCount,
      'userBehavior.lastCommentTime': now
    });
    
    // 保存到本地存储
    wx.setStorageSync('userCommentCount', newCount);
    wx.setStorageSync('lastCommentTime', now);
    
    // 重置冷却时间
    this.setData({
      cooldownTime: 0,
      isUserBlocked: false
    });
  },

  // 加载评论列表
  async loadComments() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      // 模拟API调用
      const result = await this.fetchCommentsFromServer();
      
      if (result.success) {
        const newComments = this.data.page === 1 ? 
          result.comments : 
          [...this.data.comments, ...result.comments];
          
        this.setData({
          comments: newComments,
          totalComments: result.total,
          hasMore: result.hasMore,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 从服务器获取评论
  async fetchCommentsFromServer() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟评论数据
        const mockComments = this.generateMockComments();
        
        resolve({
          success: true,
          comments: mockComments,
          total: 156,
          hasMore: this.data.page < 16
        });
      }, 500);
    });
  },

  // 生成模拟评论数据
  generateMockComments() {
    const comments = [];
    const usernames = ['用户A', '用户B', '用户C', '用户D', '用户E'];
    const contents = [
      '这个游戏很有趣，画面也很精美！',
      '操作简单，适合休闲娱乐。',
      '希望能增加更多关卡。',
      '音乐很好听，玩起来很放松。',
      '难度适中，不会太简单也不会太难。'
    ];
    
    for (let i = 0; i < this.data.pageSize; i++) {
      const index = (this.data.page - 1) * this.data.pageSize + i;
      if (index >= 156) break;
      
      comments.push({
        id: Date.now() + i,
        username: usernames[i % usernames.length],
        content: contents[i % contents.length],
        timeAgo: this.getTimeAgo(Date.now() - Math.random() * 86400000),
        likes: Math.floor(Math.random() * 20),
        tags: ['游戏', '休闲'],
        userId: `user_${i}`
      });
    }
    
    return comments;
  },

  // 获取时间差描述
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  },

  // 加载更多评论
  loadMoreComments() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({ page: this.data.page + 1 });
    this.loadComments();
  },

  // 排序改变
  onSortChange(e) {
    this.setData({
      sortIndex: e.detail.value,
      page: 1,
      comments: [],
      hasMore: true
    });
    this.loadComments();
  },

  // 点赞/取消点赞
  toggleLike(e) {
    const commentId = e.currentTarget.dataset.id;
    // 实现点赞逻辑
    console.log('点赞评论:', commentId);
  },

  // 删除评论（管理员）
  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          // 实现删除逻辑
          console.log('删除评论:', commentId);
        }
      }
    });
  },

  // 拉黑用户（管理员）
  blockUser(e) {
    const userId = e.currentTarget.dataset.userid;
    wx.showModal({
      title: '确认拉黑',
      content: '确定要拉黑这个用户吗？',
      success: (res) => {
        if (res.confirm) {
          // 实现拉黑逻辑
          console.log('拉黑用户:', userId);
        }
      }
    });
  },

  // 加载统计数据
  loadStats() {
    // 模拟统计数据
    this.setData({
      stats: {
        todayComments: 23,
        totalComments: 156,
        activeUsers: 45
      }
    });
  },

  // 显示统计弹窗
  showStatsModal() {
    this.setData({ showStatsModal: true });
  },

  // 隐藏统计弹窗
  hideStatsModal() {
    this.setData({ showStatsModal: false });
  },

  // 获取客户端IP（模拟）
  getClientIP() {
    return '192.168.1.100';
  },

  // 生成设备指纹（模拟）
  generateDeviceFingerprint() {
    const info = wx.getSystemInfoSync();
    return `${info.brand}_${info.model}_${info.system}`.replace(/\s/g, '_');
  },

  onUnload() {
    // 清理定时器
    if (this.data.cooldownTimer) {
      clearInterval(this.data.cooldownTimer);
    }
  }
});