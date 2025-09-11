// 开票系统主页面
Page({
  data: {
    invoiceList: [],
    currentTab: 'all', // all, pending, completed, cancelled
    searchKeyword: '',
    showFilter: false,
    filterStatus: 'all',
    filterDateRange: '',
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    },
    loading: false,
    refreshing: false
  },

  onLoad() {
    this.loadInvoiceList();
  },

  onShow() {
    this.refreshInvoiceList();
  },

  // 加载发票列表
  async loadInvoiceList() {
    this.setData({ loading: true });
    
    try {
      const params = {
        page: this.data.pagination.current,
        pageSize: this.data.pagination.pageSize,
        status: this.data.filterStatus,
        keyword: this.data.searchKeyword,
        dateRange: this.data.filterDateRange
      };
      
      const result = await this.requestInvoiceList(params);
      
      this.setData({
        invoiceList: result.data || [],
        'pagination.total': result.total || 0,
        loading: false,
        refreshing: false
      });
    } catch (error) {
      console.error('加载发票列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      this.setData({ loading: false, refreshing: false });
    }
  },

  // 刷新发票列表
  refreshInvoiceList() {
    this.setData({
      pagination: { ...this.data.pagination, current: 1 },
      refreshing: true
    });
    this.loadInvoiceList();
  },

  // 请求发票列表API
  async requestInvoiceList(params) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.example.com/invoices',
        method: 'GET',
        data: params,
        header: {
          'Authorization': wx.getStorageSync('token') || '',
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab,
      filterStatus: tab === 'all' ? 'all' : tab
    });
    this.refreshInvoiceList();
  },

  // 搜索发票
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  onSearch() {
    this.refreshInvoiceList();
  },

  // 显示筛选器
  showFilterModal() {
    this.setData({ showFilter: true });
  },

  // 隐藏筛选器
  hideFilterModal() {
    this.setData({ showFilter: false });
  },

  // 筛选状态改变
  onFilterStatusChange(e) {
    this.setData({
      filterStatus: e.detail.value
    });
  },

  // 筛选日期范围改变
  onFilterDateChange(e) {
    this.setData({
      filterDateRange: e.detail.value
    });
  },

  // 应用筛选
  applyFilter() {
    this.hideFilterModal();
    this.refreshInvoiceList();
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      filterStatus: 'all',
      filterDateRange: '',
      searchKeyword: ''
    });
    this.refreshInvoiceList();
  },

  // 创建新发票
  createInvoice() {
    wx.navigateTo({
      url: '/pages/invoice/create/create'
    });
  },

  // 查看发票详情
  viewInvoiceDetail(e) {
    const invoiceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/invoice/detail/detail?id=${invoiceId}`
    });
  },

  // 编辑发票
  editInvoice(e) {
    const invoiceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/invoice/edit/edit?id=${invoiceId}`
    });
  },

  // 删除发票
  deleteInvoice(e) {
    const invoiceId = e.currentTarget.dataset.id;
    const invoice = this.data.invoiceList.find(item => item.id === invoiceId);
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除发票 ${invoice?.invoiceNumber || invoiceId} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performDeleteInvoice(invoiceId);
        }
      }
    });
  },

  // 执行删除发票
  async performDeleteInvoice(invoiceId) {
    try {
      wx.showLoading({ title: '删除中...' });
      
      await this.requestDeleteInvoice(invoiceId);
      
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      
      this.refreshInvoiceList();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  },

  // 请求删除发票API
  async requestDeleteInvoice(invoiceId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.example.com/invoices/${invoiceId}`,
        method: 'DELETE',
        header: {
          'Authorization': wx.getStorageSync('token') || '',
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '删除失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshInvoiceList();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.invoiceList.length < this.data.pagination.total) {
      this.setData({
        'pagination.current': this.data.pagination.current + 1
      });
      this.loadInvoiceList();
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '发票管理系统',
      path: '/pages/invoice/invoice'
    };
  }
});