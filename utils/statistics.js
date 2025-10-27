/**
 * 页面统计工具类
 * 提供PV（页面浏览量）和UV（独立访客）统计功能
 */

class Statistics {
  constructor() {
    this.storageKeys = {
      pv: 'page_views', // PV统计数据
      uv: 'unique_visitors', // UV统计数据
      userInfo: 'user_statistics_info', // 用户信息
      dailyStats: 'daily_statistics', // 每日统计
      pageStats: 'page_statistics' // 页面统计
    };
  }

  /**
   * 获取用户唯一标识
   * 优先使用openId，其次使用设备唯一标识，最后生成随机ID
   */
  async getUserId() {
    try {
      let userInfo = wx.getStorageSync(this.storageKeys.userInfo);
      
      if (userInfo && userInfo.userId) {
        return userInfo.userId;
      }

      // 尝试获取openId
      const loginResult = await this.wxLogin();
      if (loginResult && loginResult.code) {
        // 这里应该调用后端接口获取openId，暂时使用code作为标识
        const userId = 'user_' + loginResult.code;
        userInfo = {
          userId: userId,
          createTime: Date.now(),
          source: 'wechat'
        };
      } else {
        // 生成随机用户ID
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userInfo = {
          userId: userId,
          createTime: Date.now(),
          source: 'random'
        };
      }

      // 保存用户信息
      wx.setStorageSync(this.storageKeys.userInfo, userInfo);
      return userInfo.userId;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      // 生成临时用户ID
      return 'temp_' + Date.now();
    }
  }

  /**
   * 微信登录
   */
  wxLogin() {
    return new Promise((resolve) => {
      wx.login({
        success: resolve,
        fail: () => resolve(null)
      });
    });
  }

  /**
   * 记录页面访问（PV统计）
   * @param {string} pagePath 页面路径
   * @param {object} options 页面参数
   */
  async recordPageView(pagePath, options = {}) {
    try {
      const userId = await this.getUserId();
      const timestamp = Date.now();
      const date = this.getDateString(timestamp);
      
      // 获取当前PV数据
      let pvData = wx.getStorageSync(this.storageKeys.pv) || {
        total: 0,
        pages: {},
        daily: {},
        records: []
      };

      // 更新总PV
      pvData.total += 1;

      // 更新页面PV
      if (!pvData.pages[pagePath]) {
        pvData.pages[pagePath] = 0;
      }
      pvData.pages[pagePath] += 1;

      // 更新每日PV
      if (!pvData.daily[date]) {
        pvData.daily[date] = 0;
      }
      pvData.daily[date] += 1;

      // 记录访问详情（保留最近1000条）
      pvData.records.unshift({
        userId,
        pagePath,
        timestamp,
        date,
        options: JSON.stringify(options)
      });
      
      if (pvData.records.length > 1000) {
        pvData.records = pvData.records.slice(0, 1000);
      }

      // 保存PV数据
      wx.setStorageSync(this.storageKeys.pv, pvData);

      // 记录UV
      await this.recordUniqueVisitor(userId, pagePath, timestamp);

      console.log(`PV统计: ${pagePath}, 总PV: ${pvData.total}`);
    } catch (error) {
      console.error('记录PV失败:', error);
    }
  }

  /**
   * 记录独立访客（UV统计）
   * @param {string} userId 用户ID
   * @param {string} pagePath 页面路径
   * @param {number} timestamp 时间戳
   */
  async recordUniqueVisitor(userId, pagePath, timestamp) {
    try {
      const date = this.getDateString(timestamp);
      
      // 获取当前UV数据
      let uvData = wx.getStorageSync(this.storageKeys.uv) || {
        total: new Set(),
        pages: {},
        daily: {},
        users: {}
      };

      // 转换Set（因为本地存储不支持Set）
      if (Array.isArray(uvData.total)) {
        uvData.total = new Set(uvData.total);
      } else if (uvData.total && typeof uvData.total === 'object') {
        uvData.total = new Set(Object.keys(uvData.total));
      } else {
        uvData.total = new Set();
      }

      // 转换页面UV数据
      Object.keys(uvData.pages || {}).forEach(page => {
        if (Array.isArray(uvData.pages[page])) {
          uvData.pages[page] = new Set(uvData.pages[page]);
        } else if (uvData.pages[page] && typeof uvData.pages[page] === 'object') {
          uvData.pages[page] = new Set(Object.keys(uvData.pages[page]));
        } else {
          uvData.pages[page] = new Set();
        }
      });

      // 转换每日UV数据
      Object.keys(uvData.daily || {}).forEach(d => {
        if (Array.isArray(uvData.daily[d])) {
          uvData.daily[d] = new Set(uvData.daily[d]);
        } else if (uvData.daily[d] && typeof uvData.daily[d] === 'object') {
          uvData.daily[d] = new Set(Object.keys(uvData.daily[d]));
        } else {
          uvData.daily[d] = new Set();
        }
      });

      // 更新总UV
      const isNewUser = !uvData.total.has(userId);
      uvData.total.add(userId);

      // 更新页面UV
      if (!uvData.pages[pagePath]) {
        uvData.pages[pagePath] = new Set();
      }
      uvData.pages[pagePath].add(userId);

      // 更新每日UV
      if (!uvData.daily[date]) {
        uvData.daily[date] = new Set();
      }
      uvData.daily[date].add(userId);

      // 更新用户访问记录
      if (!uvData.users[userId]) {
        uvData.users[userId] = {
          firstVisit: timestamp,
          lastVisit: timestamp,
          visitCount: 0,
          pages: new Set()
        };
      }
      
      uvData.users[userId].lastVisit = timestamp;
      uvData.users[userId].visitCount += 1;
      
      if (Array.isArray(uvData.users[userId].pages)) {
        uvData.users[userId].pages = new Set(uvData.users[userId].pages);
      } else if (!uvData.users[userId].pages) {
        uvData.users[userId].pages = new Set();
      }
      uvData.users[userId].pages.add(pagePath);

      // 转换Set为Array以便存储
      const uvDataToStore = {
        total: Array.from(uvData.total),
        pages: {},
        daily: {},
        users: {}
      };

      Object.keys(uvData.pages).forEach(page => {
        uvDataToStore.pages[page] = Array.from(uvData.pages[page]);
      });

      Object.keys(uvData.daily).forEach(d => {
        uvDataToStore.daily[d] = Array.from(uvData.daily[d]);
      });

      Object.keys(uvData.users).forEach(uid => {
        uvDataToStore.users[uid] = {
          ...uvData.users[uid],
          pages: Array.from(uvData.users[uid].pages)
        };
      });

      // 保存UV数据
      wx.setStorageSync(this.storageKeys.uv, uvDataToStore);

      if (isNewUser) {
        console.log(`新用户访问: ${userId}, 总UV: ${uvData.total.size}`);
      }
    } catch (error) {
      console.error('记录UV失败:', error);
    }
  }

  /**
   * 获取PV统计数据
   */
  getPVStats() {
    try {
      const pvData = wx.getStorageSync(this.storageKeys.pv) || {
        total: 0,
        pages: {},
        daily: {},
        records: []
      };

      return {
        total: pvData.total,
        pages: pvData.pages,
        daily: pvData.daily,
        recentRecords: pvData.records.slice(0, 10) // 最近10条记录
      };
    } catch (error) {
      console.error('获取PV统计失败:', error);
      return { total: 0, pages: {}, daily: {}, recentRecords: [] };
    }
  }

  /**
   * 获取UV统计数据
   */
  getUVStats() {
    try {
      const uvData = wx.getStorageSync(this.storageKeys.uv) || {
        total: [],
        pages: {},
        daily: {},
        users: {}
      };

      // 转换数据格式
      const stats = {
        total: Array.isArray(uvData.total) ? uvData.total.length : 0,
        pages: {},
        daily: {},
        activeUsers: 0
      };

      // 统计页面UV
      Object.keys(uvData.pages || {}).forEach(page => {
        stats.pages[page] = Array.isArray(uvData.pages[page]) ? uvData.pages[page].length : 0;
      });

      // 统计每日UV
      Object.keys(uvData.daily || {}).forEach(date => {
        stats.daily[date] = Array.isArray(uvData.daily[date]) ? uvData.daily[date].length : 0;
      });

      // 统计活跃用户（最近7天有访问）
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      Object.keys(uvData.users || {}).forEach(userId => {
        const user = uvData.users[userId];
        if (user && user.lastVisit > sevenDaysAgo) {
          stats.activeUsers += 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('获取UV统计失败:', error);
      return { total: 0, pages: {}, daily: {}, activeUsers: 0 };
    }
  }

  /**
   * 获取综合统计数据
   */
  getStats() {
    const pvStats = this.getPVStats();
    const uvStats = this.getUVStats();

    return {
      pv: pvStats,
      uv: uvStats,
      summary: {
        totalPV: pvStats.total,
        totalUV: uvStats.total,
        activeUsers: uvStats.activeUsers,
        avgPVPerUV: uvStats.total > 0 ? (pvStats.total / uvStats.total).toFixed(2) : 0
      }
    };
  }

  /**
   * 获取今日统计
   */
  getTodayStats() {
    const today = this.getDateString();
    const pvStats = this.getPVStats();
    const uvStats = this.getUVStats();

    return {
      date: today,
      pv: pvStats.daily[today] || 0,
      uv: uvStats.daily[today] || 0
    };
  }

  /**
   * 获取最近7天统计
   */
  getRecentStats(days = 7) {
    const stats = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = this.getDateString(date.getTime());
      
      const pvStats = this.getPVStats();
      const uvStats = this.getUVStats();

      stats.push({
        date: dateString,
        pv: pvStats.daily[dateString] || 0,
        uv: uvStats.daily[dateString] || 0
      });
    }

    return stats;
  }

  /**
   * 清空统计数据
   */
  clearStats() {
    try {
      wx.removeStorageSync(this.storageKeys.pv);
      wx.removeStorageSync(this.storageKeys.uv);
      wx.removeStorageSync(this.storageKeys.userInfo);
      console.log('统计数据已清空');
    } catch (error) {
      console.error('清空统计数据失败:', error);
    }
  }

  /**
   * 导出统计数据
   */
  exportStats() {
    try {
      const stats = this.getStats();
      const data = JSON.stringify(stats, null, 2);
      
      // 可以通过分享或其他方式导出数据
      return data;
    } catch (error) {
      console.error('导出统计数据失败:', error);
      return null;
    }
  }

  /**
   * 获取日期字符串
   */
  getDateString(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// 创建全局统计实例
const statistics = new Statistics();

// 导出统计方法
module.exports = {
  // 记录页面访问
  recordPageView: (pagePath, options) => statistics.recordPageView(pagePath, options),
  
  // 获取统计数据
  getStats: () => statistics.getStats(),
  getPVStats: () => statistics.getPVStats(),
  getUVStats: () => statistics.getUVStats(),
  getTodayStats: () => statistics.getTodayStats(),
  getRecentStats: (days) => statistics.getRecentStats(days),
  
  // 数据管理
  clearStats: () => statistics.clearStats(),
  exportStats: () => statistics.exportStats(),
  
  // 工具方法
  getUserId: () => statistics.getUserId()
};