// 发票详情页面
Page({
  data: {
    invoiceId: '',
    invoiceData: null,
    loading: true,
    actions: []
  },

  onLoad(options) {
    this.setData({ invoiceId: options.id });
    this.loadInvoiceDetail();
  },

  // 加载发票详情
  async loadInvoiceDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await this.requestInvoiceDetail(this.data.invoiceId);
      
      this.setData({
        invoiceData: result.data,
        loading: false
      });
      
      this.generateActions();
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

  // 生成操作按钮
  generateActions() {
    const { invoiceData } = this.data;
    const actions = [];
    
    if (!invoiceData) return;
    
    // 根据发票状态生成不同的操作按钮
    switch (invoiceData.status) {
      case 'draft':
        actions.push(
          { text: '编辑', type: 'edit', color: '#007aff' },
          { text: '提交', type: 'submit', color: '#28a745' },
          { text: '删除', type: 'delete', color: '#dc3545' }
        );
        break;
      case 'pending':
        actions.push(
          { text: '查看', type: 'view', color: '#007aff' },
          { text: '打印', type: 'print', color: '#6c757d' },
          { text: '作废', type: 'cancel', color: '#dc3545' }
        );
        break;
      case 'completed':
        actions.push(
          { text: '查看', type: 'view', color: '#007aff' },
          { text: '打印', type: 'print', color: '#6c757d' },
          { text: '下载', type: 'download', color: '#28a745' },
          { text: '作废', type: 'cancel', color: '#dc3545' }
        );
        break;
      case 'cancelled':
        actions.push(
          { text: '查看', type: 'view', color: '#007aff' }
        );
        break;
    }
    
    this.setData({ actions });
  },

  // 执行操作
  onActionTap(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'edit':
        this.editInvoice();
        break;
      case 'submit':
        this.submitInvoice();
        break;
      case 'delete':
        this.deleteInvoice();
        break;
      case 'view':
        this.viewInvoice();
        break;
      case 'print':
        this.printInvoice();
        break;
      case 'download':
        this.downloadInvoice();
        break;
      case 'cancel':
        this.cancelInvoice();
        break;
    }
  },

  // 编辑发票
  editInvoice() {
    wx.navigateTo({
      url: `/pages/invoice/edit/edit?id=${this.data.invoiceId}`
    });
  },

  // 提交发票
  async submitInvoice() {
    wx.showModal({
      title: '确认提交',
      content: '确定要提交这张发票吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '提交中...' });
            
            await this.requestUpdateInvoiceStatus('pending');
            
            wx.hideLoading();
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            
            this.loadInvoiceDetail();
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '提交失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 删除发票
  deleteInvoice() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张发票吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            
            await this.requestDeleteInvoice();
            
            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 查看发票
  viewInvoice() {
    wx.navigateTo({
      url: `/pages/invoice/preview/preview?id=${this.data.invoiceId}`
    });
  },

  // 打印发票
  printInvoice() {
    wx.showToast({
      title: '打印功能开发中',
      icon: 'none'
    });
  },

  // 下载发票
  downloadInvoice() {
    wx.showToast({
      title: '下载功能开发中',
      icon: 'none'
    });
  },

  // 作废发票
  async cancelInvoice() {
    wx.showModal({
      title: '确认作废',
      content: '确定要作废这张发票吗？作废后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '作废中...' });
            
            await this.requestUpdateInvoiceStatus('cancelled');
            
            wx.hideLoading();
            wx.showToast({
              title: '作废成功',
              icon: 'success'
            });
            
            this.loadInvoiceDetail();
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '作废失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 请求更新发票状态API
  async requestUpdateInvoiceStatus(status) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.example.com/invoices/${this.data.invoiceId}/status`,
        method: 'PUT',
        data: { status },
        header: {
          'Authorization': wx.getStorageSync('token') || '',
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '更新失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 请求删除发票API
  async requestDeleteInvoice() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.example.com/invoices/${this.data.invoiceId}`,
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

  // 复制发票号
  copyInvoiceNumber() {
    const { invoiceData } = this.data;
    if (invoiceData && invoiceData.invoiceNumber) {
      wx.setClipboardData({
        data: invoiceData.invoiceNumber,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    }
  },

  // 分享
  onShareAppMessage() {
    const { invoiceData } = this.data;
    return {
      title: `发票详情 - ${invoiceData?.invoiceNumber || ''}`,
      path: `/pages/invoice/detail/detail?id=${this.data.invoiceId}`
    };
  }
});