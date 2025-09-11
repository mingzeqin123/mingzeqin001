// 发票详情页面
Page({
  data: {
    invoiceId: '',
    invoiceDetail: null,
    loading: true,
    
    // 状态映射
    statusMap: {
      'pending': { text: '待处理', color: '#ffc107' },
      'processing': { text: '开票中', color: '#17a2b8' },
      'completed': { text: '已完成', color: '#28a745' },
      'failed': { text: '开票失败', color: '#dc3545' }
    }
  },

  onLoad: function(options) {
    const invoiceId = options.id;
    if (invoiceId) {
      this.setData({ invoiceId });
      this.loadInvoiceDetail(invoiceId);
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow: function() {
    // 页面显示时刷新数据
    if (this.data.invoiceId) {
      this.loadInvoiceDetail(this.data.invoiceId);
    }
  },

  onPullDownRefresh: function() {
    this.loadInvoiceDetail(this.data.invoiceId, () => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载发票详情
  loadInvoiceDetail: function(invoiceId, callback) {
    this.setData({ loading: true });
    
    const invoiceService = require('../../services/invoiceService.js');
    
    invoiceService.getInvoiceDetail(invoiceId)
      .then(detail => {
        this.setData({ 
          invoiceDetail: detail,
          loading: false 
        });
        
        // 更新页面标题
        wx.setNavigationBarTitle({
          title: `发票详情 - ${detail.invoiceNumber || '处理中'}`
        });
      })
      .catch(error => {
        console.error('加载发票详情失败:', error);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        if (callback) callback();
      });
  },

  // 下载发票PDF
  onDownloadPDF: function() {
    const detail = this.data.invoiceDetail;
    
    if (!detail || !detail.pdfUrl) {
      wx.showToast({
        title: '发票文件不存在',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '下载中...'
    });

    // 下载PDF文件
    wx.downloadFile({
      url: detail.pdfUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册或打开文件
          wx.openDocument({
            filePath: res.tempFilePath,
            fileType: 'pdf',
            success: () => {
              wx.hideLoading();
            },
            fail: (err) => {
              console.error('打开文件失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '打开失败',
                icon: 'none'
              });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('下载失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 预览发票图片
  onPreviewImage: function() {
    const detail = this.data.invoiceDetail;
    
    if (!detail || !detail.imageUrl) {
      wx.showToast({
        title: '发票图片不存在',
        icon: 'none'
      });
      return;
    }

    wx.previewImage({
      urls: [detail.imageUrl],
      current: detail.imageUrl
    });
  },

  // 复制发票信息
  onCopyInfo: function(e) {
    const field = e.currentTarget.dataset.field;
    const detail = this.data.invoiceDetail;
    
    let copyText = '';
    switch (field) {
      case 'number':
        copyText = detail.invoiceNumber;
        break;
      case 'code':
        copyText = detail.invoiceCode;
        break;
      case 'checkCode':
        copyText = detail.checkCode;
        break;
      case 'all':
        copyText = `发票号码：${detail.invoiceNumber}\n发票代码：${detail.invoiceCode}\n校验码：${detail.checkCode}`;
        break;
      default:
        return;
    }

    if (copyText) {
      wx.setClipboardData({
        data: copyText,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    }
  },

  // 重新开票
  onReissueInvoice: function() {
    const detail = this.data.invoiceDetail;
    
    wx.showModal({
      title: '确认重新开票',
      content: '将基于此发票信息重新开票，是否继续？',
      success: (res) => {
        if (res.confirm) {
          // 跳转到开票页面并传递数据
          const invoiceData = encodeURIComponent(JSON.stringify({
            type: detail.type,
            title: detail.title,
            taxNumber: detail.taxNumber,
            amount: detail.amount,
            content: detail.content,
            remark: detail.remark,
            address: detail.address,
            phone: detail.phone,
            bankName: detail.bankName,
            bankAccount: detail.bankAccount
          }));
          
          wx.redirectTo({
            url: `/pages/invoice/invoice?data=${invoiceData}`
          });
        }
      }
    });
  },

  // 分享发票
  onShareAppMessage: function() {
    const detail = this.data.invoiceDetail;
    return {
      title: `发票详情 - ${detail?.title || '电子发票'}`,
      path: `/pages/invoice/detail?id=${this.data.invoiceId}`,
      imageUrl: detail?.imageUrl || '/images/invoice-share.png'
    };
  },

  // 联系客服
  onContactService: function() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  // 查看开票进度
  onViewProgress: function() {
    wx.navigateTo({
      url: `/pages/invoice/progress?id=${this.data.invoiceId}`
    });
  }
});