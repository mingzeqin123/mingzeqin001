// 创建发票页面
Page({
  data: {
    formData: {
      customerName: '',
      customerTaxNumber: '',
      customerAddress: '',
      customerPhone: '',
      customerBank: '',
      customerAccount: '',
      invoiceType: 'normal', // normal, special
      invoiceContent: '',
      amount: '',
      taxRate: 0.13,
      taxAmount: 0,
      totalAmount: 0,
      remark: ''
    },
    invoiceTypes: [
      { value: 'normal', label: '普通发票' },
      { value: 'special', label: '专用发票' }
    ],
    taxRates: [
      { value: 0.03, label: '3%' },
      { value: 0.06, label: '6%' },
      { value: 0.09, label: '9%' },
      { value: 0.13, label: '13%' }
    ],
    loading: false,
    submitting: false
  },

  onLoad(options) {
    // 如果有编辑的发票ID，加载发票数据
    if (options.id) {
      this.loadInvoiceData(options.id);
    }
  },

  // 加载发票数据
  async loadInvoiceData(invoiceId) {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const result = await this.requestInvoiceDetail(invoiceId);
      
      this.setData({
        formData: {
          ...this.data.formData,
          ...result.data
        }
      });
      
      this.calculateTax();
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
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

  // 输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    // 如果是金额相关字段，重新计算税额
    if (['amount', 'taxRate'].includes(field)) {
      this.calculateTax();
    }
  },

  // 选择器变化
  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    // 如果是税率变化，重新计算税额
    if (field === 'taxRate') {
      this.calculateTax();
    }
  },

  // 计算税额
  calculateTax() {
    const amount = parseFloat(this.data.formData.amount) || 0;
    const taxRate = parseFloat(this.data.formData.taxRate) || 0;
    const taxAmount = amount * taxRate;
    const totalAmount = amount + taxAmount;
    
    this.setData({
      'formData.taxAmount': taxAmount.toFixed(2),
      'formData.totalAmount': totalAmount.toFixed(2)
    });
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.customerName.trim()) {
      wx.showToast({
        title: '请输入客户名称',
        icon: 'error'
      });
      return false;
    }
    
    if (!formData.invoiceContent.trim()) {
      wx.showToast({
        title: '请输入开票内容',
        icon: 'error'
      });
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'error'
      });
      return false;
    }
    
    if (formData.invoiceType === 'special') {
      if (!formData.customerTaxNumber.trim()) {
        wx.showToast({
          title: '专用发票需要填写税号',
          icon: 'error'
        });
        return false;
      }
    }
    
    return true;
  },

  // 保存草稿
  async saveDraft() {
    if (!this.validateForm()) {
      return;
    }
    
    try {
      this.setData({ submitting: true });
      
      const result = await this.requestSaveInvoice({
        ...this.data.formData,
        status: 'draft'
      });
      
      wx.showToast({
        title: '草稿保存成功',
        icon: 'success'
      });
      
      this.setData({ submitting: false });
    } catch (error) {
      this.setData({ submitting: false });
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  },

  // 提交发票
  async submitInvoice() {
    if (!this.validateForm()) {
      return;
    }
    
    wx.showModal({
      title: '确认提交',
      content: '确定要提交这张发票吗？提交后将无法修改。',
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({ submitting: true });
            
            const result = await this.requestSaveInvoice({
              ...this.data.formData,
              status: 'pending'
            });
            
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            
            // 返回发票列表
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
            
            this.setData({ submitting: false });
          } catch (error) {
            this.setData({ submitting: false });
            wx.showToast({
              title: '提交失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 请求保存发票API
  async requestSaveInvoice(data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.example.com/invoices',
        method: 'POST',
        data: data,
        header: {
          'Authorization': wx.getStorageSync('token') || '',
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '保存失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 预览发票
  previewInvoice() {
    if (!this.validateForm()) {
      return;
    }
    
    wx.navigateTo({
      url: `/pages/invoice/preview/preview?data=${encodeURIComponent(JSON.stringify(this.data.formData))}`
    });
  },

  // 选择客户
  selectCustomer() {
    wx.navigateTo({
      url: '/pages/invoice/customer/customer'
    });
  },

  // 客户选择回调
  onCustomerSelected(customer) {
    this.setData({
      'formData.customerName': customer.name,
      'formData.customerTaxNumber': customer.taxNumber || '',
      'formData.customerAddress': customer.address || '',
      'formData.customerPhone': customer.phone || '',
      'formData.customerBank': customer.bank || '',
      'formData.customerAccount': customer.account || ''
    });
  },

  // 返回
  onBack() {
    wx.navigateBack();
  }
});