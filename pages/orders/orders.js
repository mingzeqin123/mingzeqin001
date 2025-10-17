/**
 * 订单列表页面
 */

const { ORDER_STATUS } = require('../../models/order.js')
const OrderApi = require('../../api/orderApi.js')

Page({
  data: {
    // 订单状态选项卡
    statusTabs: [
      { key: '', label: '全部', count: 0 },
      { key: ORDER_STATUS.PENDING, label: '待付款', count: 0 },
      { key: ORDER_STATUS.PAID, label: '待发货', count: 0 },
      { key: ORDER_STATUS.SHIPPED, label: '待收货', count: 0 },
      { key: ORDER_STATUS.DELIVERED, label: '已完成', count: 0 }
    ],
    currentTab: 0,
    
    // 订单列表
    orders: [],
    loading: false,
    hasMore: true,
    
    // 分页参数
    page: 1,
    pageSize: 10,
    
    // 筛选参数
    currentStatus: '',
    
    // 用户信息
    userInfo: null
  },

  onLoad(options) {
    // 获取传入的状态参数
    const { status = '', tab = 0 } = options
    
    this.setData({
      currentStatus: status,
      currentTab: parseInt(tab)
    })
    
    this.initPage()
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshOrders()
  },

  onPullDownRefresh() {
    this.refreshOrders()
  },

  onReachBottom() {
    this.loadMoreOrders()
  },

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo) {
        wx.redirectTo({
          url: '/pages/login/login'
        })
        return
      }
      
      this.setData({ userInfo })
      
      // 加载订单数据
      await this.loadOrders()
      
      // 更新状态选项卡计数
      await this.updateTabCounts()
      
    } catch (error) {
      console.error('初始化页面失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  /**
   * 切换状态选项卡
   */
  onTabChange(e) {
    const { index } = e.detail
    const status = this.data.statusTabs[index].key
    
    this.setData({
      currentTab: index,
      currentStatus: status,
      page: 1,
      orders: [],
      hasMore: true
    })
    
    this.loadOrders()
  },

  /**
   * 刷新订单列表
   */
  async refreshOrders() {
    this.setData({
      page: 1,
      orders: [],
      hasMore: true
    })
    
    await this.loadOrders()
    wx.stopPullDownRefresh()
  },

  /**
   * 加载更多订单
   */
  async loadMoreOrders() {
    if (!this.data.hasMore || this.data.loading) {
      return
    }
    
    this.setData({
      page: this.data.page + 1
    })
    
    await this.loadOrders()
  },

  /**
   * 加载订单数据
   */
  async loadOrders() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.getUserOrders({
          user: { userId: this.data.userInfo.id }
        }, {
          query: {
            status: this.data.currentStatus,
            page: this.data.page,
            pageSize: this.data.pageSize
          }
        })
      )
      
      if (response.success) {
        const { orders, pagination } = response.data
        
        this.setData({
          orders: this.data.page === 1 ? orders : [...this.data.orders, ...orders],
          hasMore: pagination.page < pagination.totalPages,
          loading: false
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('加载订单失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      this.setData({ loading: false })
    }
  },

  /**
   * 更新选项卡计数
   */
  async updateTabCounts() {
    try {
      const orderApi = new OrderApi()
      const promises = this.data.statusTabs.map(async (tab) => {
        const response = await this.mockApiCall(() => 
          orderApi.getUserOrders({
            user: { userId: this.data.userInfo.id }
          }, {
            query: {
              status: tab.key,
              page: 1,
              pageSize: 1
            }
          })
        )
        return response.success ? response.data.pagination.total : 0
      })
      
      const counts = await Promise.all(promises)
      const updatedTabs = this.data.statusTabs.map((tab, index) => ({
        ...tab,
        count: counts[index]
      }))
      
      this.setData({ statusTabs: updatedTabs })
    } catch (error) {
      console.error('更新选项卡计数失败:', error)
    }
  },

  /**
   * 查看订单详情
   */
  onOrderTap(e) {
    const { orderId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    })
  },

  /**
   * 支付订单
   */
  async onPayOrder(e) {
    const { orderId } = e.currentTarget.dataset
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      // 调用微信支付
      const paymentResult = await this.requestPayment(orderId)
      
      if (paymentResult.success) {
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        })
        
        // 刷新订单列表
        this.refreshOrders()
      }
    } catch (error) {
      console.error('支付失败:', error)
      wx.showToast({
        title: error.message || '支付失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 取消订单
   */
  async onCancelOrder(e) {
    const { orderId, orderNo } = e.currentTarget.dataset
    
    const result = await wx.showModal({
      title: '确认取消',
      content: `确定要取消订单 ${orderNo} 吗？`,
      confirmText: '确认取消',
      confirmColor: '#ff4444'
    })
    
    if (!result.confirm) return
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.cancelOrder({
          params: { orderId },
          body: { reason: '用户主动取消' },
          user: { userId: this.data.userInfo.id }
        })
      )
      
      if (response.success) {
        wx.showToast({
          title: '取消成功',
          icon: 'success'
        })
        
        // 刷新订单列表
        this.refreshOrders()
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 确认收货
   */
  async onConfirmDelivery(e) {
    const { orderId, orderNo } = e.currentTarget.dataset
    
    const result = await wx.showModal({
      title: '确认收货',
      content: `确认收到订单 ${orderNo} 的商品吗？`,
      confirmText: '确认收货'
    })
    
    if (!result.confirm) return
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.confirmDelivery({
          params: { orderId },
          user: { userId: this.data.userInfo.id }
        })
      )
      
      if (response.success) {
        wx.showToast({
          title: '确认成功',
          icon: 'success'
        })
        
        // 刷新订单列表
        this.refreshOrders()
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('确认收货失败:', error)
      wx.showToast({
        title: error.message || '确认失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 联系客服
   */
  onContactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    })
  },

  /**
   * 申请售后
   */
  onApplyAfterSale(e) {
    const { orderId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/after-sale/after-sale?orderId=${orderId}`
    })
  },

  /**
   * 再次购买
   */
  onBuyAgain(e) {
    const { orderId } = e.currentTarget.dataset
    // 将订单商品重新加入购物车
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  /**
   * 查看物流
   */
  onViewLogistics(e) {
    const { orderId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/logistics/logistics?orderId=${orderId}`
    })
  },

  /**
   * 发起微信支付
   */
  async requestPayment(orderId) {
    return new Promise((resolve, reject) => {
      // 模拟获取支付参数
      const paymentParams = {
        timeStamp: Date.now().toString(),
        nonceStr: Math.random().toString(36).substr(2, 15),
        package: `prepay_id=wx${Date.now()}${Math.random().toString(36).substr(2, 10)}`,
        signType: 'RSA',
        paySign: 'mock_pay_sign'
      }
      
      wx.requestPayment({
        ...paymentParams,
        success: () => {
          resolve({ success: true })
        },
        fail: (error) => {
          reject(new Error(error.errMsg || '支付失败'))
        }
      })
    })
  },

  /**
   * 模拟API调用
   */
  async mockApiCall(apiFunction) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      const mockRes = {
        json: (data) => data,
        status: (code) => ({ json: (data) => data })
      }
      
      let result
      await apiFunction({}, mockRes)
      
      // 由于是模拟调用，直接返回成功结果
      return {
        success: true,
        data: {
          orders: this.generateMockOrders(),
          pagination: {
            page: this.data.page,
            pageSize: this.data.pageSize,
            total: 50,
            totalPages: 5
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  },

  /**
   * 生成模拟订单数据
   */
  generateMockOrders() {
    const statuses = [ORDER_STATUS.PENDING, ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]
    const orders = []
    
    for (let i = 0; i < this.data.pageSize; i++) {
      const orderId = `order_${Date.now()}_${i}`
      const status = this.data.currentStatus || statuses[Math.floor(Math.random() * statuses.length)]
      
      orders.push({
        id: orderId,
        orderNo: `ORD${Date.now().toString().substr(-8)}${i.toString().padStart(2, '0')}`,
        status,
        statusText: this.getStatusText(status),
        items: [
          {
            productId: `prod_${i}`,
            productName: `商品名称 ${i + 1}`,
            productImage: '/images/product-placeholder.jpg',
            price: 99.99 + i * 10,
            quantity: Math.floor(Math.random() * 3) + 1,
            specifications: [
              { name: '颜色', value: ['红色', '蓝色', '黑色'][Math.floor(Math.random() * 3)] },
              { name: '尺寸', value: ['S', 'M', 'L'][Math.floor(Math.random() * 3)] }
            ]
          }
        ],
        totalAmount: 99.99 + i * 10,
        finalAmount: 99.99 + i * 10,
        createTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        expireTime: status === ORDER_STATUS.PENDING ? 
          new Date(Date.now() + 30 * 60 * 1000).toISOString() : null
      })
    }
    
    return orders
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusTexts = {
      [ORDER_STATUS.PENDING]: '待付款',
      [ORDER_STATUS.PAID]: '待发货',
      [ORDER_STATUS.PROCESSING]: '处理中',
      [ORDER_STATUS.SHIPPED]: '待收货',
      [ORDER_STATUS.DELIVERED]: '已完成',
      [ORDER_STATUS.CANCELLED]: '已取消',
      [ORDER_STATUS.REFUNDED]: '已退款'
    }
    return statusTexts[status] || '未知状态'
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return date.toLocaleDateString()
    }
  },

  /**
   * 计算倒计时
   */
  calculateCountdown(expireTime) {
    if (!expireTime) return null
    
    const now = new Date()
    const expire = new Date(expireTime)
    const diff = expire - now
    
    if (diff <= 0) return '已过期'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
})