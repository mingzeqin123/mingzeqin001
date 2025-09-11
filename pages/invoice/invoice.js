// 开票页面逻辑
Page({
  data: {
    // 表单数据
    invoiceForm: {
      type: 1, // 1: 增值税普通发票, 2: 增值税专用发票
      title: '', // 发票抬头
      taxNumber: '', // 纳税人识别号
      amount: '', // 开票金额
      content: '', // 开票内容
      remark: '', // 备注
      // 专票额外信息
      address: '', // 地址
      phone: '', // 电话
      bankName: '', // 开户行
      bankAccount: '' // 银行账号
    },
    
    // 页面状态
    loading: false,
    submitLoading: false,
    
    // 发票类型选项
    invoiceTypes: [
      { value: 1, text: '增值税普通发票' },
      { value: 2, text: '增值税专用发票' }
    ],
    
    // 开票内容选项
    contentOptions: [
      '技术服务费',
      '咨询服务费',
      '软件开发费',
      '信息技术服务',
      '其他'
    ],
    
    // 历史发票记录
    invoiceHistory: []
  },

  onLoad: function (options) {
    console.log('开票页面加载');
    this.loadInvoiceHistory();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.loadInvoiceHistory();
  },

  // 发票类型选择
  onInvoiceTypeChange: function(e) {
    const type = parseInt(e.detail.value);
    this.setData({
      'invoiceForm.type': type
    });
  },

  // 表单输入处理
  onInputChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`invoiceForm.${field}`]: value
    });
  },

  // 开票内容选择
  onContentSelect: function(e) {
    const index = e.detail.value;
    const content = this.data.contentOptions[index];
    this.setData({
      'invoiceForm.content': content
    });
  },

  // 表单验证
  validateForm: function() {
    const form = this.data.invoiceForm;
    
    if (!form.title.trim()) {
      wx.showToast({
        title: '请输入发票抬头',
        icon: 'none'
      });
      return false;
    }

    if (!form.taxNumber.trim()) {
      wx.showToast({
        title: '请输入纳税人识别号',
        icon: 'none'
      });
      return false;
    }

    // 纳税人识别号格式验证（18位或20位）
    const taxNumberRegex = /^[A-Z0-9]{15}[A-Z0-9]{3}$|^[A-Z0-9]{18}[A-Z0-9]{2}$/;
    if (!taxNumberRegex.test(form.taxNumber)) {
      wx.showToast({
        title: '纳税人识别号格式不正确',
        icon: 'none'
      });
      return false;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      wx.showToast({
        title: '请输入正确的开票金额',
        icon: 'none'
      });
      return false;
    }

    if (!form.content.trim()) {
      wx.showToast({
        title: '请选择或输入开票内容',
        icon: 'none'
      });
      return false;
    }

    // 专票额外验证
    if (form.type === 2) {
      if (!form.address.trim() || !form.phone.trim() || 
          !form.bankName.trim() || !form.bankAccount.trim()) {
        wx.showToast({
          title: '专用发票需要完整的企业信息',
          icon: 'none'
        });
        return false;
      }
    }

    return true;
  },

  // 提交开票申请
  onSubmitInvoice: function() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitLoading: true });

    // 调用开票服务
    const invoiceService = require('../../services/invoiceService.js');
    
    invoiceService.createInvoice(this.data.invoiceForm)
      .then(result => {
        wx.showToast({
          title: '开票申请已提交',
          icon: 'success'
        });
        
        // 清空表单
        this.resetForm();
        
        // 刷新历史记录
        this.loadInvoiceHistory();
        
        // 跳转到详情页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/invoice/detail?id=${result.invoiceId}`
          });
        }, 1500);
      })
      .catch(error => {
        console.error('开票失败:', error);
        wx.showToast({
          title: error.message || '开票失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ submitLoading: false });
      });
  },

  // 重置表单
  resetForm: function() {
    this.setData({
      invoiceForm: {
        type: 1,
        title: '',
        taxNumber: '',
        amount: '',
        content: '',
        remark: '',
        address: '',
        phone: '',
        bankName: '',
        bankAccount: ''
      }
    });
  },

  // 加载发票历史记录
  loadInvoiceHistory: function() {
    this.setData({ loading: true });
    
    const invoiceService = require('../../services/invoiceService.js');
    
    invoiceService.getInvoiceHistory()
      .then(history => {
        this.setData({ 
          invoiceHistory: history,
          loading: false 
        });
      })
      .catch(error => {
        console.error('加载历史记录失败:', error);
        this.setData({ loading: false });
      });
  },

  // 查看发票详情
  onViewInvoice: function(e) {
    const invoiceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/invoice/detail?id=${invoiceId}`
    });
  },

  // 重新开票（基于历史记录）
  onReissueInvoice: function(e) {
    const invoice = e.currentTarget.dataset.invoice;
    
    wx.showModal({
      title: '确认重新开票',
      content: '将基于此记录重新开票，是否继续？',
      success: (res) => {
        if (res.confirm) {
          // 填充表单数据
          this.setData({
            invoiceForm: {
              type: invoice.type,
              title: invoice.title,
              taxNumber: invoice.taxNumber,
              amount: invoice.amount,
              content: invoice.content,
              remark: invoice.remark,
              address: invoice.address || '',
              phone: invoice.phone || '',
              bankName: invoice.bankName || '',
              bankAccount: invoice.bankAccount || ''
            }
          });
          
          // 滚动到表单顶部
          wx.pageScrollTo({
            scrollTop: 0,
            duration: 300
          });
        }
      }
    });
  },

  // 分享发票
  onShareAppMessage: function() {
    return {
      title: '快速开票系统',
      path: '/pages/invoice/invoice',
      imageUrl: '/images/invoice-share.png'
    };
  }
});