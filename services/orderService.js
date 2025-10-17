/**
 * 订单服务层
 * 处理订单相关的业务逻辑
 */

const { Order, CartItem, ShippingAddress, ORDER_STATUS, PAYMENT_METHOD } = require('../models/order.js')
const { Product } = require('../models/product.js')

/**
 * 订单服务类
 */
class OrderService {
  constructor() {
    // 模拟数据存储（实际项目中应使用数据库）
    this.orders = new Map()
    this.cartItems = new Map()
    this.addresses = new Map()
    this.products = new Map()
    
    // 初始化一些测试数据
    this.initTestData()
  }

  /**
   * 初始化测试数据
   */
  initTestData() {
    // 创建测试商品
    const testProducts = [
      {
        id: 'prod_001',
        name: 'iPhone 15 Pro',
        price: 7999,
        originalPrice: 8999,
        stock: 100,
        mainImage: '/images/iphone15pro.jpg',
        categoryId: 'cat_001',
        categoryName: '手机数码'
      },
      {
        id: 'prod_002',
        name: 'MacBook Pro 16寸',
        price: 18999,
        originalPrice: 19999,
        stock: 50,
        mainImage: '/images/macbookpro.jpg',
        categoryId: 'cat_002',
        categoryName: '电脑办公'
      }
    ]

    testProducts.forEach(productData => {
      const product = new Product(productData)
      this.products.set(product.id, product)
    })
  }

  /**
   * 创建订单
   */
  async createOrder(userId, orderData) {
    try {
      // 验证用户购物车
      const cartItems = await this.getCartItems(userId)
      const selectedItems = cartItems.filter(item => item.selected)
      
      if (selectedItems.length === 0) {
        throw new Error('购物车中没有选中的商品')
      }

      // 验证商品库存和价格
      for (const cartItem of selectedItems) {
        const product = this.products.get(cartItem.productId)
        if (!product) {
          throw new Error(`商品 ${cartItem.productName} 不存在`)
        }
        
        if (!product.checkStock(cartItem.quantity, cartItem.skuId)) {
          throw new Error(`商品 ${cartItem.productName} 库存不足`)
        }
        
        // 验证价格是否有变化
        const currentPrice = product.getPrice(cartItem.skuId)
        if (Math.abs(currentPrice - cartItem.price) > 0.01) {
          throw new Error(`商品 ${cartItem.productName} 价格已变更，请重新加载`)
        }
      }

      // 创建订单
      const order = new Order({
        userId,
        userInfo: orderData.userInfo || {},
        items: selectedItems.map(item => ({
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          productImage: item.productImage,
          specifications: item.specifications,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.getSubtotal()
        })),
        shippingAddress: orderData.shippingAddress || {},
        remark: orderData.remark || '',
        couponId: orderData.couponId || '',
        shippingFee: orderData.shippingFee || 0,
        discountAmount: orderData.discountAmount || 0
      })

      // 计算订单金额
      order.calculateTotalAmount()

      // 保存订单
      this.orders.set(order.id, order)

      // 扣减库存
      for (const item of order.items) {
        const product = this.products.get(item.productId)
        if (product) {
          product.updateStock(-item.quantity, item.skuId)
        }
      }

      // 清空购物车中的已选商品
      await this.clearSelectedCartItems(userId)

      return order
    } catch (error) {
      throw new Error(`创建订单失败: ${error.message}`)
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(orderId, userId = null) {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }
    
    if (userId && order.userId !== userId) {
      throw new Error('无权限访问此订单')
    }
    
    return order
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId, options = {}) {
    const {
      status = null,
      page = 1,
      pageSize = 10,
      sortBy = 'createTime',
      sortOrder = 'desc'
    } = options

    let userOrders = Array.from(this.orders.values())
      .filter(order => order.userId === userId)

    // 状态筛选
    if (status) {
      userOrders = userOrders.filter(order => order.status === status)
    }

    // 排序
    userOrders.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : 1
      } else {
        return aValue < bValue ? -1 : 1
      }
    })

    // 分页
    const total = userOrders.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const orders = userOrders.slice(startIndex, endIndex)

    return {
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId, newStatus, remark = '', operatorId = null) {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    try {
      order.updateStatus(newStatus, remark)
      
      // 记录状态变更日志
      console.log(`订单 ${orderId} 状态从 ${order.status} 变更为 ${newStatus}`, {
        operatorId,
        remark,
        timestamp: new Date().toISOString()
      })
      
      return order
    } catch (error) {
      throw new Error(`更新订单状态失败: ${error.message}`)
    }
  }

  /**
   * 支付订单
   */
  async payOrder(orderId, paymentMethod, paymentData = {}) {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw new Error('订单状态不正确，无法支付')
    }

    if (order.isExpired()) {
      throw new Error('订单已过期，无法支付')
    }

    try {
      // 模拟支付处理
      const paymentResult = await this.processPayment(order, paymentMethod, paymentData)
      
      if (paymentResult.success) {
        order.paymentMethod = paymentMethod
        order.updateStatus(ORDER_STATUS.PAID, '支付成功')
        
        // 增加商品销量
        for (const item of order.items) {
          const product = this.products.get(item.productId)
          if (product) {
            product.increaseSales(item.quantity)
          }
        }
        
        return {
          success: true,
          order,
          paymentId: paymentResult.paymentId
        }
      } else {
        throw new Error(paymentResult.message || '支付失败')
      }
    } catch (error) {
      throw new Error(`支付订单失败: ${error.message}`)
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId, reason = '', userId = null) {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    if (userId && order.userId !== userId) {
      throw new Error('无权限取消此订单')
    }

    if (![ORDER_STATUS.PENDING, ORDER_STATUS.PAID].includes(order.status)) {
      throw new Error('当前订单状态不允许取消')
    }

    try {
      // 恢复库存
      for (const item of order.items) {
        const product = this.products.get(item.productId)
        if (product) {
          product.updateStock(item.quantity, item.skuId)
        }
      }

      // 如果已支付，需要退款
      if (order.status === ORDER_STATUS.PAID) {
        await this.processRefund(order, reason)
        order.updateStatus(ORDER_STATUS.REFUNDED, `取消订单退款: ${reason}`)
      } else {
        order.updateStatus(ORDER_STATUS.CANCELLED, `取消订单: ${reason}`)
      }

      return order
    } catch (error) {
      throw new Error(`取消订单失败: ${error.message}`)
    }
  }

  /**
   * 确认收货
   */
  async confirmDelivery(orderId, userId) {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    if (order.userId !== userId) {
      throw new Error('无权限操作此订单')
    }

    if (order.status !== ORDER_STATUS.SHIPPED) {
      throw new Error('订单状态不正确，无法确认收货')
    }

    try {
      order.updateStatus(ORDER_STATUS.DELIVERED, '用户确认收货')
      return order
    } catch (error) {
      throw new Error(`确认收货失败: ${error.message}`)
    }
  }

  /**
   * 添加商品到购物车
   */
  async addToCart(userId, productId, skuId = '', quantity = 1) {
    const product = this.products.get(productId)
    if (!product) {
      throw new Error('商品不存在')
    }

    if (!product.checkStock(quantity, skuId)) {
      throw new Error('商品库存不足')
    }

    const cartKey = `${userId}_${productId}_${skuId}`
    let cartItem = this.cartItems.get(cartKey)

    if (cartItem) {
      // 更新数量
      const newQuantity = cartItem.quantity + quantity
      if (!product.checkStock(newQuantity, skuId)) {
        throw new Error('商品库存不足')
      }
      cartItem.updateQuantity(newQuantity)
    } else {
      // 创建新的购物车项
      cartItem = new CartItem({
        userId,
        productId,
        skuId,
        productName: product.name,
        productImage: product.mainImage,
        specifications: skuId ? this.getSkuSpecifications(product, skuId) : [],
        price: product.getPrice(skuId),
        quantity
      })
      this.cartItems.set(cartKey, cartItem)
    }

    return cartItem
  }

  /**
   * 获取购物车商品列表
   */
  async getCartItems(userId) {
    const userCartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))

    return userCartItems
  }

  /**
   * 更新购物车商品数量
   */
  async updateCartItemQuantity(userId, productId, skuId = '', quantity) {
    const cartKey = `${userId}_${productId}_${skuId}`
    const cartItem = this.cartItems.get(cartKey)
    
    if (!cartItem) {
      throw new Error('购物车商品不存在')
    }

    const product = this.products.get(productId)
    if (!product) {
      throw new Error('商品不存在')
    }

    if (!product.checkStock(quantity, skuId)) {
      throw new Error('商品库存不足')
    }

    cartItem.updateQuantity(quantity)
    return cartItem
  }

  /**
   * 删除购物车商品
   */
  async removeCartItem(userId, productId, skuId = '') {
    const cartKey = `${userId}_${productId}_${skuId}`
    const deleted = this.cartItems.delete(cartKey)
    
    if (!deleted) {
      throw new Error('购物车商品不存在')
    }
    
    return true
  }

  /**
   * 清空购物车中的已选商品
   */
  async clearSelectedCartItems(userId) {
    const userCartItems = Array.from(this.cartItems.entries())
      .filter(([key, item]) => item.userId === userId && item.selected)

    for (const [key, item] of userCartItems) {
      this.cartItems.delete(key)
    }

    return true
  }

  /**
   * 切换购物车商品选中状态
   */
  async toggleCartItemSelected(userId, productId, skuId = '') {
    const cartKey = `${userId}_${productId}_${skuId}`
    const cartItem = this.cartItems.get(cartKey)
    
    if (!cartItem) {
      throw new Error('购物车商品不存在')
    }

    cartItem.toggleSelected()
    return cartItem
  }

  /**
   * 获取购物车统计信息
   */
  async getCartSummary(userId) {
    const cartItems = await this.getCartItems(userId)
    const selectedItems = cartItems.filter(item => item.selected)
    
    const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.getSubtotal(), 0)
    
    return {
      totalItems: cartItems.length,
      selectedItems: selectedItems.length,
      totalQuantity,
      totalAmount
    }
  }

  /**
   * 模拟支付处理
   */
  async processPayment(order, paymentMethod, paymentData) {
    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模拟支付成功率（95%）
    const success = Math.random() > 0.05
    
    if (success) {
      return {
        success: true,
        paymentId: 'PAY' + Date.now() + Math.random().toString(36).substr(2, 6),
        message: '支付成功'
      }
    } else {
      return {
        success: false,
        message: '支付失败，请重试'
      }
    }
  }

  /**
   * 模拟退款处理
   */
  async processRefund(order, reason) {
    // 模拟退款处理
    console.log(`处理订单 ${order.orderNo} 退款，金额: ${order.finalAmount}，原因: ${reason}`)
    
    // 实际项目中这里应该调用支付平台的退款接口
    return {
      success: true,
      refundId: 'REF' + Date.now() + Math.random().toString(36).substr(2, 6),
      amount: order.finalAmount
    }
  }

  /**
   * 获取SKU规格信息
   */
  getSkuSpecifications(product, skuId) {
    const sku = product.skus.find(s => s.id === skuId)
    return sku ? sku.specifications : []
  }

  /**
   * 获取订单统计数据
   */
  async getOrderStatistics(userId = null, dateRange = null) {
    let orders = Array.from(this.orders.values())
    
    if (userId) {
      orders = orders.filter(order => order.userId === userId)
    }
    
    if (dateRange) {
      const { startDate, endDate } = dateRange
      orders = orders.filter(order => {
        const orderDate = new Date(order.createTime)
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
      })
    }
    
    const statistics = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, order) => sum + order.finalAmount, 0),
      statusCounts: {},
      averageOrderValue: 0
    }
    
    // 统计各状态订单数量
    Object.values(ORDER_STATUS).forEach(status => {
      statistics.statusCounts[status] = orders.filter(order => order.status === status).length
    })
    
    // 计算平均订单价值
    if (statistics.totalOrders > 0) {
      statistics.averageOrderValue = statistics.totalAmount / statistics.totalOrders
    }
    
    return statistics
  }
}

module.exports = OrderService