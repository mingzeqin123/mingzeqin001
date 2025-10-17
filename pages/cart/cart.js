/**
 * 购物车页面
 */

const OrderApi = require('../../api/orderApi.js')

Page({
  data: {
    // 购物车商品列表
    cartItems: [],
    
    // 全选状态
    selectAll: false,
    
    // 统计信息
    summary: {
      totalItems: 0,
      selectedItems: 0,
      totalQuantity: 0,
      totalAmount: 0
    },
    
    // 页面状态
    loading: false,
    editing: false,
    
    // 用户信息
    userInfo: null
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    this.loadCartData()
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
      
      // 加载购物车数据
      await this.loadCartData()
      
    } catch (error) {
      console.error('初始化页面失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  /**
   * 加载购物车数据
   */
  async loadCartData() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.getCartItems({
          user: { userId: this.data.userInfo.id }
        })
      )
      
      if (response.success) {
        const { items, summary } = response.data
        
        // 检查全选状态
        const selectAll = items.length > 0 && items.every(item => item.selected)
        
        this.setData({
          cartItems: items,
          summary,
          selectAll,
          loading: false
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('加载购物车失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      this.setData({ loading: false })
    }
  },

  /**
   * 切换商品选中状态
   */
  async onToggleSelect(e) {
    const { productId, skuId } = e.currentTarget.dataset
    
    try {
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.toggleCartItemSelected({
          params: { productId },
          body: { skuId },
          user: { userId: this.data.userInfo.id }
        })
      )
      
      if (response.success) {
        // 更新本地数据
        const cartItems = this.data.cartItems.map(item => {
          if (item.productId === productId && item.skuId === skuId) {
            return { ...item, selected: !item.selected }
          }
          return item
        })
        
        // 重新计算统计信息
        const summary = this.calculateSummary(cartItems)
        const selectAll = cartItems.length > 0 && cartItems.every(item => item.selected)
        
        this.setData({
          cartItems,
          summary,
          selectAll
        })
      }
    } catch (error) {
      console.error('切换选中状态失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  /**
   * 全选/取消全选
   */
  async onToggleSelectAll() {
    const newSelectAll = !this.data.selectAll
    
    try {
      // 批量更新选中状态
      const promises = this.data.cartItems.map(item => {
        if (item.selected !== newSelectAll) {
          const orderApi = new OrderApi()
          return this.mockApiCall(() => 
            orderApi.toggleCartItemSelected({
              params: { productId: item.productId },
              body: { skuId: item.skuId },
              user: { userId: this.data.userInfo.id }
            })
          )
        }
        return Promise.resolve({ success: true })
      })
      
      await Promise.all(promises)
      
      // 更新本地数据
      const cartItems = this.data.cartItems.map(item => ({
        ...item,
        selected: newSelectAll
      }))
      
      const summary = this.calculateSummary(cartItems)
      
      this.setData({
        cartItems,
        summary,
        selectAll: newSelectAll
      })
      
    } catch (error) {
      console.error('全选操作失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  /**
   * 更新商品数量
   */
  async onUpdateQuantity(e) {
    const { productId, skuId, action } = e.currentTarget.dataset
    const item = this.data.cartItems.find(item => 
      item.productId === productId && item.skuId === skuId
    )
    
    if (!item) return
    
    let newQuantity = item.quantity
    if (action === 'increase') {
      newQuantity += 1
    } else if (action === 'decrease') {
      newQuantity = Math.max(1, newQuantity - 1)
    }
    
    if (newQuantity === item.quantity) return
    
    try {
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.updateCartItemQuantity({
          params: { productId },
          body: { skuId, quantity: newQuantity },
          user: { userId: this.data.userInfo.id }
        })
      )
      
      if (response.success) {
        // 更新本地数据
        const cartItems = this.data.cartItems.map(cartItem => {
          if (cartItem.productId === productId && cartItem.skuId === skuId) {
            return { ...cartItem, quantity: newQuantity }
          }
          return cartItem
        })
        
        const summary = this.calculateSummary(cartItems)
        
        this.setData({
          cartItems,
          summary
        })
      }
    } catch (error) {
      console.error('更新数量失败:', error)
      wx.showToast({
        title: error.message || '更新失败',
        icon: 'error'
      })
    }
  },

  /**
   * 删除商品
   */
  async onRemoveItem(e) {
    const { productId, skuId, productName } = e.currentTarget.dataset
    
    const result = await wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${productName} 吗？`,
      confirmText: '删除',
      confirmColor: '#ff4444'
    })
    
    if (!result.confirm) return
    
    try {
      const orderApi = new OrderApi()
      const response = await this.mockApiCall(() => 
        orderApi.removeCartItem({
          params: { productId },
          query: { skuId },
          user: { userId: this.data.userInfo.id }
        })
      )
      
      if (response.success) {
        // 更新本地数据
        const cartItems = this.data.cartItems.filter(item => 
          !(item.productId === productId && item.skuId === skuId)
        )
        
        const summary = this.calculateSummary(cartItems)
        const selectAll = cartItems.length > 0 && cartItems.every(item => item.selected)
        
        this.setData({
          cartItems,
          summary,
          selectAll
        })
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('删除商品失败:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
  },

  /**
   * 切换编辑模式
   */
  onToggleEdit() {
    this.setData({
      editing: !this.data.editing
    })
  },

  /**
   * 去结算
   */
  onCheckout() {
    const selectedItems = this.data.cartItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }
    
    // 跳转到结算页面
    wx.navigateTo({
      url: '/pages/checkout/checkout'
    })
  },

  /**
   * 删除选中商品
   */
  async onDeleteSelected() {
    const selectedItems = this.data.cartItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }
    
    const result = await wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedItems.length} 件商品吗？`,
      confirmText: '删除',
      confirmColor: '#ff4444'
    })
    
    if (!result.confirm) return
    
    try {
      wx.showLoading({ title: '删除中...' })
      
      // 批量删除
      const promises = selectedItems.map(item => {
        const orderApi = new OrderApi()
        return this.mockApiCall(() => 
          orderApi.removeCartItem({
            params: { productId: item.productId },
            query: { skuId: item.skuId },
            user: { userId: this.data.userInfo.id }
          })
        )
      })
      
      await Promise.all(promises)
      
      // 更新本地数据
      const cartItems = this.data.cartItems.filter(item => !item.selected)
      const summary = this.calculateSummary(cartItems)
      
      this.setData({
        cartItems,
        summary,
        selectAll: false,
        editing: false
      })
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('批量删除失败:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 收藏选中商品
   */
  onFavoriteSelected() {
    const selectedItems = this.data.cartItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      })
      return
    }
    
    // 这里实现收藏逻辑
    wx.showToast({
      title: '收藏成功',
      icon: 'success'
    })
  },

  /**
   * 去逛逛
   */
  onGoShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  /**
   * 计算购物车统计信息
   */
  calculateSummary(cartItems) {
    const selectedItems = cartItems.filter(item => item.selected)
    
    return {
      totalItems: cartItems.length,
      selectedItems: selectedItems.length,
      totalQuantity: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }
  },

  /**
   * 模拟API调用
   */
  async mockApiCall(apiFunction) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const mockRes = {
        json: (data) => data,
        status: (code) => ({ json: (data) => data })
      }
      
      await apiFunction({}, mockRes)
      
      // 返回成功结果
      return {
        success: true,
        data: {
          items: this.generateMockCartItems(),
          summary: this.data.summary
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
   * 生成模拟购物车数据
   */
  generateMockCartItems() {
    if (!this.mockCartItems) {
      this.mockCartItems = [
        {
          id: 'cart_001',
          userId: 'user_001',
          productId: 'prod_001',
          skuId: 'sku_001',
          productName: 'iPhone 15 Pro 深空黑色 256GB',
          productImage: '/images/iphone15pro.jpg',
          specifications: [
            { name: '颜色', value: '深空黑色' },
            { name: '容量', value: '256GB' }
          ],
          price: 7999,
          quantity: 1,
          selected: true
        },
        {
          id: 'cart_002',
          userId: 'user_001',
          productId: 'prod_002',
          skuId: '',
          productName: 'MacBook Pro 16寸 M3 Pro芯片',
          productImage: '/images/macbookpro.jpg',
          specifications: [],
          price: 18999,
          quantity: 1,
          selected: false
        }
      ]
    }
    
    return this.mockCartItems
  },

  /**
   * 格式化价格
   */
  formatPrice(price) {
    return price.toFixed(2)
  }
})