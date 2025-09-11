// 客户管理页面
Page({
  data: {
    customerList: [],
    searchKeyword: '',
    loading: false,
    selectedCustomer: null
  },

  onLoad() {
    this.loadCustomerList();
  },

  // 加载客户列表
  async loadCustomerList() {
    this.setData({ loading: true });
    
    try {
      const result = await this.requestCustomerList({
        keyword: this.data.searchKeyword
      });
      
      this.setData({
        customerList: result.data || [],
        loading: false
      });
    } catch (error) {
      console.error('加载客户列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      this.setData({ loading: false });
    }
  },

  // 请求客户列表API
  async requestCustomerList(params) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.example.com/customers',
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

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  onSearch() {
    this.loadCustomerList();
  },

  // 选择客户
  selectCustomer(e) {
    const customer = e.currentTarget.dataset.customer;
    
    // 将选中的客户信息传递给上一页
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    if (prevPage && prevPage.onCustomerSelected) {
      prevPage.onCustomerSelected(customer);
    }
    
    wx.navigateBack();
  },

  // 创建新客户
  createCustomer() {
    wx.navigateTo({
      url: '/pages/invoice/customer/create/create'
    });
  }
});