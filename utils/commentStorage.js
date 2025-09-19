// utils/commentStorage.js - 评论存储和管理工具类

class CommentStorage {
  constructor() {
    this.storageKeys = {
      comments: 'app_comments',
      userProfiles: 'user_profiles',
      reports: 'comment_reports',
      blockedComments: 'blocked_comments'
    };
  }
  
  /**
   * 获取所有评论
   * @param {Object} options 查询选项
   * @returns {Array} 评论列表
   */
  getComments(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortType = 'time', // 'time' 或 'hot'
        includeBlocked = false
      } = options;
      
      let comments = wx.getStorageSync(this.storageKeys.comments) || [];
      
      // 过滤被屏蔽的评论
      if (!includeBlocked) {
        const blockedIds = new Set(wx.getStorageSync(this.storageKeys.blockedComments) || []);
        comments = comments.filter(comment => !blockedIds.has(comment.id));
      }
      
      // 排序
      if (sortType === 'hot') {
        comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      } else {
        comments.sort((a, b) => b.timestamp - a.timestamp);
      }
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedComments = comments.slice(startIndex, endIndex);
      
      // 格式化时间显示
      const formattedComments = paginatedComments.map(comment => ({
        ...comment,
        timeDisplay: this.formatTime(comment.timestamp)
      }));
      
      return {
        comments: formattedComments,
        total: comments.length,
        hasMore: endIndex < comments.length,
        currentPage: page
      };
      
    } catch (error) {
      console.error('获取评论失败:', error);
      return {
        comments: [],
        total: 0,
        hasMore: false,
        currentPage: 1
      };
    }
  }
  
  /**
   * 添加评论
   * @param {Object} commentData 评论数据
   * @returns {Object} 添加结果
   */
  addComment(commentData) {
    try {
      const comments = wx.getStorageSync(this.storageKeys.comments) || [];
      
      const newComment = {
        id: this.generateId(),
        content: commentData.content,
        userId: commentData.userId,
        username: commentData.username || '匿名用户',
        userAvatar: commentData.userAvatar || '',
        timestamp: Date.now(),
        likes: 0,
        replies: [],
        isVerified: commentData.isVerified || false,
        riskLevel: commentData.riskLevel || 0,
        parentId: commentData.parentId || null, // 回复的父评论ID
        isBlocked: false
      };
      
      comments.unshift(newComment);
      wx.setStorageSync(this.storageKeys.comments, comments);
      
      // 更新用户资料
      this.updateUserProfile(commentData.userId, {
        username: commentData.username,
        userAvatar: commentData.userAvatar,
        lastCommentTime: Date.now()
      });
      
      return {
        success: true,
        comment: {
          ...newComment,
          timeDisplay: this.formatTime(newComment.timestamp)
        }
      };
      
    } catch (error) {
      console.error('添加评论失败:', error);
      return {
        success: false,
        error: '添加评论失败'
      };
    }
  }
  
  /**
   * 删除评论
   * @param {string} commentId 评论ID
   * @param {string} userId 操作用户ID
   * @returns {Object} 删除结果
   */
  deleteComment(commentId, userId) {
    try {
      let comments = wx.getStorageSync(this.storageKeys.comments) || [];
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex === -1) {
        return { success: false, error: '评论不存在' };
      }
      
      const comment = comments[commentIndex];
      
      // 检查权限（只能删除自己的评论，或管理员可以删除任何评论）
      if (comment.userId !== userId && !this.isAdmin(userId)) {
        return { success: false, error: '无权限删除此评论' };
      }
      
      // 删除评论及其回复
      comments = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
      wx.setStorageSync(this.storageKeys.comments, comments);
      
      return { success: true };
      
    } catch (error) {
      console.error('删除评论失败:', error);
      return { success: false, error: '删除评论失败' };
    }
  }
  
  /**
   * 点赞/取消点赞评论
   * @param {string} commentId 评论ID
   * @param {string} userId 用户ID
   * @returns {Object} 操作结果
   */
  likeComment(commentId, userId) {
    try {
      const comments = wx.getStorageSync(this.storageKeys.comments) || [];
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex === -1) {
        return { success: false, error: '评论不存在' };
      }
      
      const comment = comments[commentIndex];
      
      // 获取用户点赞记录
      const userLikes = wx.getStorageSync(`user_likes_${userId}`) || [];
      const hasLiked = userLikes.includes(commentId);
      
      if (hasLiked) {
        // 取消点赞
        comment.likes = Math.max(0, (comment.likes || 0) - 1);
        const likeIndex = userLikes.indexOf(commentId);
        userLikes.splice(likeIndex, 1);
      } else {
        // 点赞
        comment.likes = (comment.likes || 0) + 1;
        userLikes.push(commentId);
      }
      
      comments[commentIndex] = comment;
      wx.setStorageSync(this.storageKeys.comments, comments);
      wx.setStorageSync(`user_likes_${userId}`, userLikes);
      
      return {
        success: true,
        likes: comment.likes,
        hasLiked: !hasLiked
      };
      
    } catch (error) {
      console.error('点赞操作失败:', error);
      return { success: false, error: '操作失败' };
    }
  }
  
  /**
   * 举报评论
   * @param {string} commentId 评论ID
   * @param {string} reporterId 举报者ID
   * @param {string} reason 举报原因
   * @param {string} detail 详细描述
   * @returns {Object} 举报结果
   */
  reportComment(commentId, reporterId, reason, detail = '') {
    try {
      const reports = wx.getStorageSync(this.storageKeys.reports) || [];
      
      // 检查是否已经举报过
      const existingReport = reports.find(r => 
        r.commentId === commentId && r.reporterId === reporterId
      );
      
      if (existingReport) {
        return { success: false, error: '您已经举报过此评论' };
      }
      
      const newReport = {
        id: this.generateId(),
        commentId: commentId,
        reporterId: reporterId,
        reason: reason,
        detail: detail,
        timestamp: Date.now(),
        status: 'pending' // pending, processed, rejected
      };
      
      reports.push(newReport);
      wx.setStorageSync(this.storageKeys.reports, reports);
      
      // 自动处理举报（简单规则）
      this.autoProcessReport(commentId);
      
      return { success: true };
      
    } catch (error) {
      console.error('举报失败:', error);
      return { success: false, error: '举报失败' };
    }
  }
  
  /**
   * 屏蔽评论
   * @param {string} commentId 评论ID
   * @param {string} reason 屏蔽原因
   * @returns {Object} 屏蔽结果
   */
  blockComment(commentId, reason = '违规内容') {
    try {
      const blockedComments = wx.getStorageSync(this.storageKeys.blockedComments) || [];
      
      if (!blockedComments.includes(commentId)) {
        blockedComments.push(commentId);
        wx.setStorageSync(this.storageKeys.blockedComments, blockedComments);
        
        // 更新评论状态
        const comments = wx.getStorageSync(this.storageKeys.comments) || [];
        const commentIndex = comments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          comments[commentIndex].isBlocked = true;
          comments[commentIndex].blockReason = reason;
          wx.setStorageSync(this.storageKeys.comments, comments);
        }
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('屏蔽评论失败:', error);
      return { success: false, error: '屏蔽失败' };
    }
  }
  
  /**
   * 取消屏蔽评论
   * @param {string} commentId 评论ID
   * @returns {Object} 操作结果
   */
  unblockComment(commentId) {
    try {
      let blockedComments = wx.getStorageSync(this.storageKeys.blockedComments) || [];
      blockedComments = blockedComments.filter(id => id !== commentId);
      wx.setStorageSync(this.storageKeys.blockedComments, blockedComments);
      
      // 更新评论状态
      const comments = wx.getStorageSync(this.storageKeys.comments) || [];
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex !== -1) {
        comments[commentIndex].isBlocked = false;
        delete comments[commentIndex].blockReason;
        wx.setStorageSync(this.storageKeys.comments, comments);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('取消屏蔽失败:', error);
      return { success: false, error: '操作失败' };
    }
  }
  
  /**
   * 获取用户资料
   * @param {string} userId 用户ID
   * @returns {Object} 用户资料
   */
  getUserProfile(userId) {
    try {
      const profiles = wx.getStorageSync(this.storageKeys.userProfiles) || {};
      return profiles[userId] || {
        userId: userId,
        username: '匿名用户',
        userAvatar: '',
        joinTime: Date.now(),
        commentCount: 0,
        likedCount: 0,
        reportCount: 0,
        isVerified: false
      };
    } catch (error) {
      console.error('获取用户资料失败:', error);
      return null;
    }
  }
  
  /**
   * 更新用户资料
   * @param {string} userId 用户ID
   * @param {Object} profileData 资料数据
   */
  updateUserProfile(userId, profileData) {
    try {
      const profiles = wx.getStorageSync(this.storageKeys.userProfiles) || {};
      const existingProfile = profiles[userId] || {};
      
      profiles[userId] = {
        ...existingProfile,
        ...profileData,
        userId: userId,
        lastUpdateTime: Date.now()
      };
      
      wx.setStorageSync(this.storageKeys.userProfiles, profiles);
    } catch (error) {
      console.error('更新用户资料失败:', error);
    }
  }
  
  /**
   * 自动处理举报
   * @param {string} commentId 评论ID
   */
  autoProcessReport(commentId) {
    try {
      const reports = wx.getStorageSync(this.storageKeys.reports) || [];
      const commentReports = reports.filter(r => r.commentId === commentId);
      
      // 如果同一评论被举报3次以上，自动屏蔽
      if (commentReports.length >= 3) {
        this.blockComment(commentId, '多次被举报');
        
        // 更新举报状态
        const updatedReports = reports.map(r => {
          if (r.commentId === commentId && r.status === 'pending') {
            return { ...r, status: 'processed' };
          }
          return r;
        });
        wx.setStorageSync(this.storageKeys.reports, updatedReports);
      }
    } catch (error) {
      console.error('自动处理举报失败:', error);
    }
  }
  
  /**
   * 获取举报列表
   * @param {Object} options 查询选项
   * @returns {Array} 举报列表
   */
  getReports(options = {}) {
    try {
      const { status = 'all', page = 1, pageSize = 20 } = options;
      let reports = wx.getStorageSync(this.storageKeys.reports) || [];
      
      // 过滤状态
      if (status !== 'all') {
        reports = reports.filter(r => r.status === status);
      }
      
      // 排序
      reports.sort((a, b) => b.timestamp - a.timestamp);
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        reports: reports.slice(startIndex, endIndex),
        total: reports.length,
        hasMore: endIndex < reports.length
      };
    } catch (error) {
      console.error('获取举报列表失败:', error);
      return { reports: [], total: 0, hasMore: false };
    }
  }
  
  /**
   * 清理过期数据
   * @param {number} daysToKeep 保留天数
   */
  cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      // 清理旧评论
      let comments = wx.getStorageSync(this.storageKeys.comments) || [];
      comments = comments.filter(c => c.timestamp > cutoffTime);
      wx.setStorageSync(this.storageKeys.comments, comments);
      
      // 清理旧举报
      let reports = wx.getStorageSync(this.storageKeys.reports) || [];
      reports = reports.filter(r => r.timestamp > cutoffTime);
      wx.setStorageSync(this.storageKeys.reports, reports);
      
      console.log('数据清理完成');
    } catch (error) {
      console.error('数据清理失败:', error);
    }
  }
  
  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * 格式化时间显示
   * @param {number} timestamp 时间戳
   * @returns {string} 格式化后的时间
   */
  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 2592000000) { // 30天内
      return `${Math.floor(diff / 86400000)}天前`;
    } else {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
  
  /**
   * 检查是否为管理员
   * @param {string} userId 用户ID
   * @returns {boolean} 是否为管理员
   */
  isAdmin(userId) {
    const adminUsers = wx.getStorageSync('admin_users') || [];
    return adminUsers.includes(userId);
  }
  
  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    try {
      const comments = wx.getStorageSync(this.storageKeys.comments) || [];
      const reports = wx.getStorageSync(this.storageKeys.reports) || [];
      const blockedComments = wx.getStorageSync(this.storageKeys.blockedComments) || [];
      
      const now = Date.now();
      const oneDayAgo = now - 86400000;
      const oneWeekAgo = now - 7 * 86400000;
      
      return {
        totalComments: comments.length,
        todayComments: comments.filter(c => c.timestamp > oneDayAgo).length,
        weekComments: comments.filter(c => c.timestamp > oneWeekAgo).length,
        totalReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length,
        blockedComments: blockedComments.length
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {};
    }
  }
}

// 导出单例
const commentStorage = new CommentStorage();

module.exports = commentStorage;