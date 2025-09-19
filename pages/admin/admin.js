// pages/admin/admin.js
const AntiSpam = require('../../utils/antiSpam.js');
const CommentStorage = require('../../utils/commentStorage.js');

Page({
  data: {
    // 认证相关
    isAdmin: false,
    adminPassword: '',
    
    // 界面状态
    activeTab: 'reports',
    
    // 统计数据
    stats: {},
    
    // 举报管理
    reports: [],
    reportFilter: 'pending',
    
    // 评论管理
    adminComments: [],
    commentFilter: 'all',
    
    // 黑名单管理
    blacklistUsers: [],
    blacklistSearch: '',
    showAddBlacklistModal: false,
    newBlacklistUserId: '',
    newBlacklistReason: '',
    
    // 系统设置
    settings: {
      maxCommentsPerMinute: 3,
      maxCommentsPerHour: 20,
      minCommentInterval: 10000,
      autoBlockThreshold: 3
    }
  },

  onLoad(options) {
    // 检查是否已经是管理员
    this.checkAdminStatus();
  },

  onShow() {
    if (this.data.isAdmin) {
      this.loadStats();
      this.loadData();
    }
  },

  onPullDownRefresh() {
    if (this.data.isAdmin) {
      this.loadStats();
      this.loadData();
    }
    wx.stopPullDownRefresh();
  },

  /**
   * 检查管理员状态
   */
  checkAdminStatus() {
    try {
      const adminStatus = wx.getStorageSync('admin_logged_in');
      if (adminStatus) {
        this.setData({ isAdmin: true });
        this.loadStats();
        this.loadData();
      }
    } catch (error) {
      console.error('检查管理员状态失败:', error);
    }
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },

  /**
   * 验证管理员
   */
  verifyAdmin() {
    const password = this.data.adminPassword;
    
    // 这里应该是真实的密码验证逻辑
    // 为了演示，使用简单的密码
    if (password === 'admin123') {
      this.setData({ isAdmin: true });
      
      // 保存登录状态
      wx.setStorageSync('admin_logged_in', true);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      this.loadStats();
      this.loadData();
      
    } else {
      wx.showToast({
        title: '密码错误',
        icon: 'error'
      });
    }
  },

  /**
   * 加载统计数据
   */
  loadStats() {
    try {
      const stats = CommentStorage.getStatistics();
      this.setData({ stats });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  /**
   * 加载数据
   */
  loadData() {
    this.loadReports();
    this.loadComments();
    this.loadBlacklist();
    this.loadSettings();
  },

  /**
   * 切换标签页
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  /**
   * 加载举报列表
   */
  loadReports() {
    try {
      const result = CommentStorage.getReports({
        status: this.data.reportFilter === 'all' ? 'all' : 'pending',
        page: 1,
        pageSize: 50
      });
      
      this.setData({ reports: result.reports });
    } catch (error) {
      console.error('加载举报列表失败:', error);
    }
  },

  /**
   * 切换举报过滤器
   */
  changeReportFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ reportFilter: filter });
    this.loadReports();
  },

  /**
   * 处理举报
   */
  processReport(e) {
    const reportId = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;
    
    wx.showModal({
      title: '确认操作',
      content: action === 'approve' ? '确认该评论违规并屏蔽？' : '确认驳回此举报？',
      success: (res) => {
        if (res.confirm) {
          this.handleReportAction(reportId, action);
        }
      }
    });
  },

  /**
   * 执行举报处理
   */
  handleReportAction(reportId, action) {
    try {
      const reports = wx.getStorageSync('comment_reports') || [];
      const reportIndex = reports.findIndex(r => r.id === reportId);
      
      if (reportIndex !== -1) {
        const report = reports[reportIndex];
        
        if (action === 'approve') {
          // 屏蔽评论
          CommentStorage.blockComment(report.commentId, '举报确认违规');
          reports[reportIndex].status = 'processed';
          
          wx.showToast({
            title: '已屏蔽违规评论',
            icon: 'success'
          });
          
        } else {
          // 驳回举报
          reports[reportIndex].status = 'rejected';
          
          wx.showToast({
            title: '举报已驳回',
            icon: 'success'
          });
        }
        
        wx.setStorageSync('comment_reports', reports);
        this.loadReports();
        this.loadStats();
      }
      
    } catch (error) {
      console.error('处理举报失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  /**
   * 加载评论列表
   */
  loadComments() {
    try {
      const result = CommentStorage.getComments({
        page: 1,
        pageSize: 50,
        includeBlocked: true
      });
      
      let comments = result.comments;
      
      // 根据过滤器过滤评论
      if (this.data.commentFilter === 'blocked') {
        comments = comments.filter(c => c.isBlocked);
      } else if (this.data.commentFilter === 'high-risk') {
        comments = comments.filter(c => c.riskLevel >= 2);
      }
      
      this.setData({ adminComments: comments });
      
    } catch (error) {
      console.error('加载评论列表失败:', error);
    }
  },

  /**
   * 切换评论过滤器
   */
  changeCommentFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ commentFilter: filter });
    this.loadComments();
  },

  /**
   * 屏蔽评论
   */
  blockComment(e) {
    const commentId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认屏蔽',
      content: '确认屏蔽此评论？',
      success: (res) => {
        if (res.confirm) {
          const result = CommentStorage.blockComment(commentId, '管理员手动屏蔽');
          
          if (result.success) {
            wx.showToast({
              title: '屏蔽成功',
              icon: 'success'
            });
            this.loadComments();
            this.loadStats();
          } else {
            wx.showToast({
              title: '屏蔽失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  /**
   * 取消屏蔽评论
   */
  unblockComment(e) {
    const commentId = e.currentTarget.dataset.id;
    
    const result = CommentStorage.unblockComment(commentId);
    
    if (result.success) {
      wx.showToast({
        title: '已取消屏蔽',
        icon: 'success'
      });
      this.loadComments();
      this.loadStats();
    } else {
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  /**
   * 删除评论
   */
  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确认删除此评论？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          const userInfo = this.getCurrentUser();
          const result = CommentStorage.deleteComment(commentId, userInfo.userId);
          
          if (result.success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadComments();
            this.loadStats();
          } else {
            wx.showToast({
              title: result.error || '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  /**
   * 将用户加入黑名单
   */
  addUserToBlacklist(e) {
    const userId = e.currentTarget.dataset.userId;
    
    wx.showModal({
      title: '确认拉黑',
      content: '确认将此用户加入黑名单？',
      success: (res) => {
        if (res.confirm) {
          AntiSpam.addToBlacklist(userId, '管理员手动拉黑');
          
          wx.showToast({
            title: '已加入黑名单',
            icon: 'success'
          });
          
          this.loadBlacklist();
        }
      }
    });
  },

  /**
   * 加载黑名单
   */
  loadBlacklist() {
    try {
      const blacklistData = wx.getStorageSync('user_blacklist') || {};
      let blacklistUsers = Object.keys(blacklistData).map(userId => ({
        userId: userId,
        ...blacklistData[userId]
      }));
      
      // 搜索过滤
      if (this.data.blacklistSearch) {
        const search = this.data.blacklistSearch.toLowerCase();
        blacklistUsers = blacklistUsers.filter(user => 
          user.userId.toLowerCase().includes(search)
        );
      }
      
      this.setData({ blacklistUsers });
      
    } catch (error) {
      console.error('加载黑名单失败:', error);
    }
  },

  /**
   * 黑名单搜索输入
   */
  onBlacklistSearchInput(e) {
    this.setData({ blacklistSearch: e.detail.value });
    this.loadBlacklist();
  },

  /**
   * 显示添加黑名单弹窗
   */
  showAddBlacklistModal() {
    this.setData({ 
      showAddBlacklistModal: true,
      newBlacklistUserId: '',
      newBlacklistReason: ''
    });
  },

  /**
   * 关闭添加黑名单弹窗
   */
  closeAddBlacklistModal() {
    this.setData({ showAddBlacklistModal: false });
  },

  /**
   * 新黑名单用户ID输入
   */
  onNewBlacklistUserIdInput(e) {
    this.setData({ newBlacklistUserId: e.detail.value });
  },

  /**
   * 新黑名单原因输入
   */
  onNewBlacklistReasonInput(e) {
    this.setData({ newBlacklistReason: e.detail.value });
  },

  /**
   * 确认添加黑名单
   */
  addToBlacklistConfirm() {
    const userId = this.data.newBlacklistUserId.trim();
    const reason = this.data.newBlacklistReason.trim();
    
    if (!userId) {
      wx.showToast({
        title: '请输入用户ID',
        icon: 'error'
      });
      return;
    }
    
    if (!reason) {
      wx.showToast({
        title: '请输入拉黑原因',
        icon: 'error'
      });
      return;
    }
    
    AntiSpam.addToBlacklist(userId, reason);
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
    
    this.closeAddBlacklistModal();
    this.loadBlacklist();
  },

  /**
   * 从黑名单移除
   */
  removeFromBlacklist(e) {
    const userId = e.currentTarget.dataset.userId;
    
    wx.showModal({
      title: '确认移除',
      content: '确认将此用户从黑名单移除？',
      success: (res) => {
        if (res.confirm) {
          AntiSpam.removeFromBlacklist(userId);
          
          wx.showToast({
            title: '移除成功',
            icon: 'success'
          });
          
          this.loadBlacklist();
        }
      }
    });
  },

  /**
   * 加载设置
   */
  loadSettings() {
    try {
      const savedSettings = wx.getStorageSync('admin_settings');
      if (savedSettings) {
        this.setData({ settings: { ...this.data.settings, ...savedSettings } });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  /**
   * 设置项变更
   */
  onSettingChange(e) {
    const key = e.currentTarget.dataset.key;
    let value = e.detail.value;
    
    // 转换数据类型
    if (key === 'minCommentInterval') {
      value = parseInt(value) * 1000; // 转换为毫秒
    } else {
      value = parseInt(value);
    }
    
    this.setData({
      [`settings.${key}`]: value
    });
  },

  /**
   * 保存设置
   */
  saveSettings() {
    try {
      wx.setStorageSync('admin_settings', this.data.settings);
      
      // 更新反垃圾系统的配置
      AntiSpam.userLimits = {
        ...AntiSpam.userLimits,
        ...this.data.settings
      };
      
      wx.showToast({
        title: '设置已保存',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('保存设置失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  /**
   * 清理旧数据
   */
  cleanupOldData() {
    wx.showModal({
      title: '确认清理',
      content: '确认清理30天前的数据？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          CommentStorage.cleanupOldData(30);
          
          wx.showToast({
            title: '清理完成',
            icon: 'success'
          });
          
          this.loadStats();
          this.loadData();
        }
      }
    });
  },

  /**
   * 导出数据
   */
  exportData() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 重置所有数据
   */
  resetAllData() {
    wx.showModal({
      title: '危险操作',
      content: '确认重置所有数据？此操作将清空所有评论、举报、黑名单等数据，且不可撤销！',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清空所有相关存储
            wx.removeStorageSync('app_comments');
            wx.removeStorageSync('comment_reports');
            wx.removeStorageSync('blocked_comments');
            wx.removeStorageSync('user_blacklist');
            wx.removeStorageSync('user_profiles');
            
            wx.showToast({
              title: '重置完成',
              icon: 'success'
            });
            
            this.loadStats();
            this.loadData();
            
          } catch (error) {
            console.error('重置数据失败:', error);
            wx.showToast({
              title: '重置失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  /**
   * 获取举报原因文本
   */
  getReportReasonText(reason) {
    const reasonMap = {
      'spam': '垃圾信息',
      'abuse': '辱骂攻击',
      'porn': '色情内容',
      'ad': '广告推广',
      'politics': '政治敏感',
      'other': '其他'
    };
    return reasonMap[reason] || reason;
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'processed': '已处理',
      'rejected': '已驳回'
    };
    return statusMap[status] || status;
  },

  /**
   * 获取风险等级文本
   */
  getRiskLevelText(level) {
    const levelMap = {
      0: '正常',
      1: '低风险',
      2: '中风险',
      3: '高风险'
    };
    return levelMap[level] || '未知';
  },

  /**
   * 获取评论内容
   */
  getCommentContent(commentId) {
    try {
      const comments = wx.getStorageSync('app_comments') || [];
      const comment = comments.find(c => c.id === commentId);
      return comment ? comment.content : '评论已删除';
    } catch (error) {
      return '获取失败';
    }
  },

  /**
   * 格式化时间
   */
  formatTime(timestamp) {
    return CommentStorage.formatTime(timestamp);
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return {
      userId: 'admin',
      username: '管理员',
      isAdmin: true
    };
  }
});