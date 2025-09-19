// pages/comments/comments.js
const AntiSpam = require('../../utils/antiSpam.js');
const CommentStorage = require('../../utils/commentStorage.js');
const CaptchaGenerator = require('../../utils/captcha.js');
const RiskAssessment = require('../../utils/riskAssessment.js');

Page({
  data: {
    // 评论数据
    comments: [],
    totalComments: 0,
    hasMore: true,
    loading: false,
    currentPage: 1,
    sortType: 'time', // 'time' 或 'hot'
    
    // 输入相关
    inputContent: '',
    maxInputLength: 500,
    canSend: false,
    submitting: false,
    replyingTo: null,
    
    // 安全相关
    showSecurityTip: false,
    showCaptcha: false,
    captchaText: '',
    captchaInput: '',
    userRiskLevel: 0,
    
    // 举报相关
    showReportModal: false,
    reportingCommentId: '',
    reportReason: '',
    reportReasons: [
      { value: 'spam', label: '垃圾信息' },
      { value: 'abuse', label: '辱骂攻击' },
      { value: 'porn', label: '色情内容' },
      { value: 'ad', label: '广告推广' },
      { value: 'politics', label: '政治敏感' },
      { value: 'other', label: '其他' }
    ],
    reportDetail: ''
  },

  onLoad(options) {
    this.loadComments();
    this.checkUserRisk();
    
    // 显示安全提示
    setTimeout(() => {
      this.setData({ showSecurityTip: true });
    }, 2000);
  },

  onShow() {
    // 刷新评论列表
    this.loadComments();
  },

  onPullDownRefresh() {
    this.setData({
      currentPage: 1,
      comments: [],
      hasMore: true
    });
    this.loadComments(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreComments();
    }
  },

  /**
   * 加载评论列表
   */
  loadComments(callback) {
    this.setData({ loading: true });
    
    try {
      const result = CommentStorage.getComments({
        page: this.data.currentPage,
        pageSize: 20,
        sortType: this.data.sortType
      });
      
      const newComments = this.data.currentPage === 1 ? 
        result.comments : 
        [...this.data.comments, ...result.comments];
      
      this.setData({
        comments: newComments,
        totalComments: result.total,
        hasMore: result.hasMore,
        loading: false
      });
      
      if (callback) callback();
      
    } catch (error) {
      console.error('加载评论失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  /**
   * 加载更多评论
   */
  loadMoreComments() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.setData({
      currentPage: this.data.currentPage + 1
    });
    
    this.loadComments();
  },

  /**
   * 切换排序方式
   */
  changeSortType(e) {
    const sortType = e.currentTarget.dataset.type;
    if (sortType === this.data.sortType) return;
    
    this.setData({
      sortType: sortType,
      currentPage: 1,
      comments: [],
      hasMore: true
    });
    
    this.loadComments();
  },

  /**
   * 输入内容变化
   */
  onInputChange(e) {
    const content = e.detail.value.trim();
    this.setData({
      inputContent: content,
      canSend: content.length > 0 && content.length <= this.data.maxInputLength
    });
  },

  /**
   * 提交评论
   */
  async submitComment() {
    if (!this.data.canSend || this.data.submitting) return;
    
    const content = this.data.inputContent.trim();
    if (!content) return;
    
    // 获取用户信息
    const userInfo = this.getUserInfo();
    
    // 反垃圾检查
    const spamCheck = AntiSpam.checkComment(content, userInfo.userId);
    
    if (!spamCheck.isValid) {
      wx.showModal({
        title: '评论被拒绝',
        content: spamCheck.reasons.join(', '),
        showCancel: false
      });
      return;
    }
    
    // 需要验证码
    if (spamCheck.needCaptcha && !this.verifyCaptcha()) {
      this.showCaptcha();
      return;
    }
    
    this.setData({ submitting: true });
    
    try {
      const commentData = {
        content: content,
        userId: userInfo.userId,
        username: userInfo.username,
        userAvatar: userInfo.userAvatar,
        isVerified: userInfo.isVerified,
        riskLevel: spamCheck.riskLevel,
        parentId: this.data.replyingTo ? this.data.replyingTo.id : null
      };
      
      const result = CommentStorage.addComment(commentData);
      
      if (result.success) {
        // 成功提示
        wx.showToast({
          title: spamCheck.needManualReview ? '评论已提交审核' : '评论成功',
          icon: 'success'
        });
        
        // 清空输入
        this.setData({
          inputContent: '',
          canSend: false,
          replyingTo: null,
          showCaptcha: false,
          captchaInput: ''
        });
        
        // 如果不需要审核，立即刷新列表
        if (!spamCheck.needManualReview) {
          this.setData({
            currentPage: 1,
            comments: [],
            hasMore: true
          });
          this.loadComments();
        }
        
      } else {
        throw new Error(result.error || '评论失败');
      }
      
    } catch (error) {
      console.error('提交评论失败:', error);
      wx.showToast({
        title: '评论失败',
        icon: 'error'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 显示回复输入框
   */
  showReplyInput(e) {
    const commentId = e.currentTarget.dataset.id;
    const comment = this.data.comments.find(c => c.id === commentId);
    
    if (comment) {
      this.setData({
        replyingTo: {
          id: commentId,
          username: comment.username,
          preview: comment.content.substring(0, 20) + '...'
        }
      });
    }
  },

  /**
   * 取消回复
   */
  cancelReply() {
    this.setData({ replyingTo: null });
  },

  /**
   * 点赞评论
   */
  likeComment(e) {
    const commentId = e.currentTarget.dataset.id;
    const userInfo = this.getUserInfo();
    
    const result = CommentStorage.likeComment(commentId, userInfo.userId);
    
    if (result.success) {
      // 更新评论列表中的点赞数
      const comments = this.data.comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: result.likes
          };
        }
        return comment;
      });
      
      this.setData({ comments });
      
    } else {
      wx.showToast({
        title: result.error || '操作失败',
        icon: 'error'
      });
    }
  },

  /**
   * 举报评论
   */
  reportComment(e) {
    const commentId = e.currentTarget.dataset.id;
    this.setData({
      showReportModal: true,
      reportingCommentId: commentId,
      reportReason: '',
      reportDetail: ''
    });
  },

  /**
   * 举报原因变化
   */
  onReportReasonChange(e) {
    this.setData({ reportReason: e.detail.value });
  },

  /**
   * 举报详情输入
   */
  onReportDetailInput(e) {
    this.setData({ reportDetail: e.detail.value });
  },

  /**
   * 提交举报
   */
  submitReport() {
    if (!this.data.reportReason) {
      wx.showToast({
        title: '请选择举报原因',
        icon: 'error'
      });
      return;
    }
    
    const userInfo = this.getUserInfo();
    const result = CommentStorage.reportComment(
      this.data.reportingCommentId,
      userInfo.userId,
      this.data.reportReason,
      this.data.reportDetail
    );
    
    if (result.success) {
      wx.showToast({
        title: '举报已提交',
        icon: 'success'
      });
      
      // 增加被举报用户的举报次数
      const comment = this.data.comments.find(c => c.id === this.data.reportingCommentId);
      if (comment) {
        AntiSpam.increaseReportCount(comment.userId);
      }
      
    } else {
      wx.showToast({
        title: result.error || '举报失败',
        icon: 'error'
      });
    }
    
    this.closeReportModal();
  },

  /**
   * 关闭举报弹窗
   */
  closeReportModal() {
    this.setData({
      showReportModal: false,
      reportingCommentId: '',
      reportReason: '',
      reportDetail: ''
    });
  },

  /**
   * 检查用户风险等级
   */
  checkUserRisk() {
    const userInfo = this.getUserInfo();
    
    // 获取用户资料和评论历史
    const userProfile = CommentStorage.getUserProfile(userInfo.userId);
    const userComments = this.getUserComments(userInfo.userId);
    
    // 进行风险评估
    const riskAssessment = RiskAssessment.assessUserRisk(
      userInfo.userId, 
      userProfile, 
      userComments
    );
    
    // 更新风险档案
    RiskAssessment.updateUserRiskProfile(userInfo.userId, riskAssessment);
    
    this.setData({
      userRiskLevel: riskAssessment.riskLevel,
      showCaptcha: riskAssessment.riskLevel >= 2
    });
    
    if (riskAssessment.riskLevel >= 2) {
      this.generateCaptcha();
    }
  },

  /**
   * 获取用户评论历史
   */
  getUserComments(userId) {
    try {
      const allComments = wx.getStorageSync('app_comments') || [];
      return allComments.filter(comment => comment.userId === userId);
    } catch (error) {
      console.error('获取用户评论历史失败:', error);
      return [];
    }
  },

  /**
   * 显示验证码
   */
  showCaptcha() {
    this.setData({ showCaptcha: true });
    this.generateCaptcha();
  },

  /**
   * 生成验证码
   */
  generateCaptcha() {
    const captchaText = CaptchaGenerator.generateTextCaptcha();
    this.setData({ captchaText });
    
    // 在canvas上绘制验证码
    this.drawCaptcha(captchaText);
  },

  /**
   * 绘制验证码
   */
  drawCaptcha(text) {
    const ctx = wx.createCanvasContext('captcha-canvas', this);
    CaptchaGenerator.drawTextCaptcha(ctx, text, 80, 32);
    ctx.draw();
  },

  /**
   * 刷新验证码
   */
  refreshCaptcha() {
    this.generateCaptcha();
    this.setData({ captchaInput: '' });
  },

  /**
   * 验证码输入
   */
  onCaptchaInput(e) {
    this.setData({ captchaInput: e.detail.value });
  },

  /**
   * 验证验证码
   */
  verifyCaptcha() {
    if (!this.data.showCaptcha) return true;
    
    const input = this.data.captchaInput.toLowerCase();
    const correct = this.data.captchaText.toLowerCase();
    
    return input === correct;
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    // 这里应该从全局状态或登录接口获取用户信息
    // 现在使用模拟数据
    try {
      let userInfo = wx.getStorageSync('current_user');
      
      if (!userInfo) {
        // 创建匿名用户
        userInfo = {
          userId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          username: '游客' + Math.floor(Math.random() * 10000),
          userAvatar: '/images/default-avatar.png',
          isVerified: false
        };
        wx.setStorageSync('current_user', userInfo);
      }
      
      return userInfo;
      
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        userId: 'anonymous',
        username: '匿名用户',
        userAvatar: '/images/default-avatar.png',
        isVerified: false
      };
    }
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '参与讨论，发表你的看法',
      path: '/pages/comments/comments',
      imageUrl: '/images/share-comments.png'
    };
  }
});