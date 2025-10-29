// 直播列表页面
const { LiveAPI } = require('../../utils/live-api.js');

Page({
  data: {
    liveRooms: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    searchKeyword: '',
    categories: [
      { id: 'all', name: '全部', active: true },
      { id: 'game', name: '游戏', active: false },
      { id: 'entertainment', name: '娱乐', active: false },
      { id: 'education', name: '教育', active: false },
      { id: 'life', name: '生活', active: false }
    ]
  },

  onLoad: function (options) {
    this.liveAPI = new LiveAPI();
    this.loadLiveRooms();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.refreshLiveRooms();
  },

  onPullDownRefresh: function () {
    this.refreshLiveRooms();
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreRooms();
    }
  },

  /**
   * 加载直播间列表
   */
  async loadLiveRooms() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const activeCategory = this.data.categories.find(cat => cat.active);
      const params = {
        page: 1,
        pageSize: this.data.pageSize,
        category: activeCategory.id === 'all' ? '' : activeCategory.id,
        keyword: this.data.searchKeyword
      };

      const result = await this.liveAPI.getRoomList(params);
      
      if (result.success) {
        this.setData({
          liveRooms: result.data.rooms || [],
          hasMore: result.data.hasMore || false,
          page: 1
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('Load live rooms error:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 刷新直播间列表
   */
  async refreshLiveRooms() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    });
    await this.loadLiveRooms();
    this.setData({ refreshing: false });
  },

  /**
   * 加载更多直播间
   */
  async loadMoreRooms() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const activeCategory = this.data.categories.find(cat => cat.active);
      const params = {
        page: this.data.page + 1,
        pageSize: this.data.pageSize,
        category: activeCategory.id === 'all' ? '' : activeCategory.id,
        keyword: this.data.searchKeyword
      };

      const result = await this.liveAPI.getRoomList(params);
      
      if (result.success) {
        this.setData({
          liveRooms: [...this.data.liveRooms, ...(result.data.rooms || [])],
          hasMore: result.data.hasMore || false,
          page: this.data.page + 1
        });
      }
    } catch (error) {
      console.error('Load more rooms error:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 搜索直播间
   */
  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm: function () {
    this.refreshLiveRooms();
  },

  /**
   * 切换分类
   */
  onCategoryTap: function (e) {
    const categoryId = e.currentTarget.dataset.id;
    const categories = this.data.categories.map(cat => ({
      ...cat,
      active: cat.id === categoryId
    }));
    
    this.setData({ categories });
    this.refreshLiveRooms();
  },

  /**
   * 进入直播间
   */
  onRoomTap: function (e) {
    const room = e.currentTarget.dataset.room;
    wx.navigateTo({
      url: `/pages/live/live-watch?roomId=${room.id}&roomName=${room.name}`
    });
  },

  /**
   * 开始直播
   */
  onStartLive: function () {
    wx.navigateTo({
      url: '/pages/live/live-push'
    });
  },

  /**
   * 创建直播间
   */
  onCreateRoom: function () {
    wx.navigateTo({
      url: '/pages/live/live-room'
    });
  },

  /**
   * 分享直播间
   */
  onShareRoom: function (e) {
    const room = e.currentTarget.dataset.room;
    return {
      title: `正在观看 ${room.name} 的直播`,
      path: `/pages/live/live-watch?roomId=${room.id}`,
      imageUrl: room.cover || '/images/live-default-cover.jpg'
    };
  },

  /**
   * 格式化观看人数
   */
  formatViewerCount: function (count) {
    if (count < 1000) {
      return count.toString();
    } else if (count < 10000) {
      return (count / 1000).toFixed(1) + 'k';
    } else {
      return (count / 10000).toFixed(1) + 'w';
    }
  }
});