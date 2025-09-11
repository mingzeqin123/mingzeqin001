// 发票预览页面
Page({
  data: {
    invoiceData: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      // 通过ID加载发票数据
      this.loadInvoiceData(options.id);
    } else if (options.data) {
      // 通过传递的数据显示预览
      try {
        const data = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          invoiceData: data,
          loading: false
        });
      } catch (error) {
        console.error('解析发票数据失败:', error);
        wx.showToast({
          title: '数据格式错误',
          icon: 'error'
        });
        this.setData({ loading: false });
      }
    }
  },

  // 加载发票数据
  async loadInvoiceData(invoiceId) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await this.requestInvoiceDetail(invoiceId);
      
      this.setData({
        invoiceData: result.data,
        loading: false
      });
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
      this.setData({ loading: false });
    }
  },

  // 请求发票详情API
  async requestInvoiceDetail(invoiceId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.example.com/invoices/${invoiceId}`,
        method: 'GET',
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

  // 打印发票
  printInvoice() {
    wx.showToast({
      title: '打印功能开发中',
      icon: 'none'
    });
  },

  // 保存为图片
  saveAsImage() {
    wx.showToast({
      title: '保存功能开发中',
      icon: 'none'
    });
  },

  // 分享
  onShareAppMessage() {
    const { invoiceData } = this.data;
    return {
      title: `发票预览 - ${invoiceData?.invoiceNumber || ''}`,
      path: `/pages/invoice/preview/preview?id=${invoiceData?.id || ''}`
    };
  }
});