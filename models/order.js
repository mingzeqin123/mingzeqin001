/**
 * 订单数据模型
 * 订单系统核心数据结构定义
 */

// 订单状态枚举
const ORDER_STATUS = {
  PENDING: 'pending',           // 待付款
  PAID: 'paid',                // 已付款
  PROCESSING: 'processing',     // 处理中
  SHIPPED: 'shipped',          // 已发货
  DELIVERED: 'delivered',      // 已送达
  CANCELLED: 'cancelled',      // 已取消
  REFUNDED: 'refunded'         // 已退款
}

// 支付方式枚举
const PAYMENT_METHOD = {
  WECHAT_PAY: 'wechat_pay',    // 微信支付
  ALIPAY: 'alipay',            // 支付宝
  BALANCE: 'balance',          // 余额支付
  POINTS: 'points'             // 积分支付
}

// 订单类型枚举
const ORDER_TYPE = {
  NORMAL: 'normal',            // 普通订单
  GROUP_BUY: 'group_buy',      // 团购订单
  SECKILL: 'seckill',          // 秒杀订单
  PRESALE: 'presale'           // 预售订单
}

/**
 * 订单模型类
 */
class Order {
  constructor(data = {}) {
    this.id = data.id || this.generateOrderId()
    this.orderNo = data.orderNo || this.generateOrderNo()
    this.userId = data.userId || ''
    this.userInfo = data.userInfo || {}
    this.type = data.type || ORDER_TYPE.NORMAL
    this.status = data.status || ORDER_STATUS.PENDING
    this.items = data.items || []
    this.totalAmount = data.totalAmount || 0
    this.discountAmount = data.discountAmount || 0
    this.shippingFee = data.shippingFee || 0
    this.finalAmount = data.finalAmount || 0
    this.paymentMethod = data.paymentMethod || ''
    this.paymentTime = data.paymentTime || null
    this.shippingAddress = data.shippingAddress || {}
    this.remark = data.remark || ''
    this.couponId = data.couponId || ''
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
    this.expireTime = data.expireTime || this.calculateExpireTime()
  }

  /**
   * 生成订单ID
   */
  generateOrderId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 生成订单号
   */
  generateOrderNo() {
    const date = new Date()
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0')
    const timeStr = date.getHours().toString().padStart(2, '0') + 
                   date.getMinutes().toString().padStart(2, '0') + 
                   date.getSeconds().toString().padStart(2, '0')
    const randomStr = Math.random().toString().substr(2, 4)
    return `ORD${dateStr}${timeStr}${randomStr}`
  }

  /**
   * 计算订单过期时间（30分钟后）
   */
  calculateExpireTime() {
    const expireTime = new Date()
    expireTime.setMinutes(expireTime.getMinutes() + 30)
    return expireTime.toISOString()
  }

  /**
   * 计算订单总金额
   */
  calculateTotalAmount() {
    this.totalAmount = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    this.finalAmount = this.totalAmount - this.discountAmount + this.shippingFee
    return this.finalAmount
  }

  /**
   * 添加订单商品
   */
  addItem(item) {
    const existingItem = this.items.find(i => i.productId === item.productId && i.skuId === item.skuId)
    if (existingItem) {
      existingItem.quantity += item.quantity
    } else {
      this.items.push({
        productId: item.productId,
        skuId: item.skuId || '',
        productName: item.productName,
        productImage: item.productImage,
        specifications: item.specifications || [],
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })
    }
    this.calculateTotalAmount()
    this.updateTime = new Date().toISOString()
  }

  /**
   * 移除订单商品
   */
  removeItem(productId, skuId = '') {
    this.items = this.items.filter(item => 
      !(item.productId === productId && item.skuId === skuId)
    )
    this.calculateTotalAmount()
    this.updateTime = new Date().toISOString()
  }

  /**
   * 更新订单状态
   */
  updateStatus(newStatus, remark = '') {
    const validTransitions = this.getValidStatusTransitions()
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`无法从 ${this.status} 状态变更为 ${newStatus}`)
    }
    
    this.status = newStatus
    this.updateTime = new Date().toISOString()
    
    if (newStatus === ORDER_STATUS.PAID) {
      this.paymentTime = new Date().toISOString()
    }
    
    if (remark) {
      this.remark = remark
    }
  }

  /**
   * 获取有效的状态转换
   */
  getValidStatusTransitions() {
    const transitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PAID]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.REFUNDED],
      [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REFUNDED],
      [ORDER_STATUS.CANCELLED]: [],
      [ORDER_STATUS.REFUNDED]: []
    }
    return transitions[this.status] || []
  }

  /**
   * 检查订单是否已过期
   */
  isExpired() {
    if (this.status !== ORDER_STATUS.PENDING) {
      return false
    }
    return new Date() > new Date(this.expireTime)
  }

  /**
   * 获取订单状态文本
   */
  getStatusText() {
    const statusTexts = {
      [ORDER_STATUS.PENDING]: '待付款',
      [ORDER_STATUS.PAID]: '已付款',
      [ORDER_STATUS.PROCESSING]: '处理中',
      [ORDER_STATUS.SHIPPED]: '已发货',
      [ORDER_STATUS.DELIVERED]: '已送达',
      [ORDER_STATUS.CANCELLED]: '已取消',
      [ORDER_STATUS.REFUNDED]: '已退款'
    }
    return statusTexts[this.status] || '未知状态'
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      orderNo: this.orderNo,
      userId: this.userId,
      userInfo: this.userInfo,
      type: this.type,
      status: this.status,
      items: this.items,
      totalAmount: this.totalAmount,
      discountAmount: this.discountAmount,
      shippingFee: this.shippingFee,
      finalAmount: this.finalAmount,
      paymentMethod: this.paymentMethod,
      paymentTime: this.paymentTime,
      shippingAddress: this.shippingAddress,
      remark: this.remark,
      couponId: this.couponId,
      createTime: this.createTime,
      updateTime: this.updateTime,
      expireTime: this.expireTime
    }
  }
}

/**
 * 购物车商品模型
 */
class CartItem {
  constructor(data = {}) {
    this.id = data.id || Date.now().toString()
    this.userId = data.userId || ''
    this.productId = data.productId || ''
    this.skuId = data.skuId || ''
    this.productName = data.productName || ''
    this.productImage = data.productImage || ''
    this.specifications = data.specifications || []
    this.price = data.price || 0
    this.quantity = data.quantity || 1
    this.selected = data.selected !== undefined ? data.selected : true
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
  }

  /**
   * 计算小计
   */
  getSubtotal() {
    return this.price * this.quantity
  }

  /**
   * 更新数量
   */
  updateQuantity(quantity) {
    if (quantity <= 0) {
      throw new Error('商品数量必须大于0')
    }
    this.quantity = quantity
    this.updateTime = new Date().toISOString()
  }

  /**
   * 切换选中状态
   */
  toggleSelected() {
    this.selected = !this.selected
    this.updateTime = new Date().toISOString()
  }
}

/**
 * 收货地址模型
 */
class ShippingAddress {
  constructor(data = {}) {
    this.id = data.id || Date.now().toString()
    this.userId = data.userId || ''
    this.receiverName = data.receiverName || ''
    this.receiverPhone = data.receiverPhone || ''
    this.province = data.province || ''
    this.city = data.city || ''
    this.district = data.district || ''
    this.detailAddress = data.detailAddress || ''
    this.postalCode = data.postalCode || ''
    this.isDefault = data.isDefault || false
    this.createTime = data.createTime || new Date().toISOString()
    this.updateTime = data.updateTime || new Date().toISOString()
  }

  /**
   * 获取完整地址
   */
  getFullAddress() {
    return `${this.province}${this.city}${this.district}${this.detailAddress}`
  }

  /**
   * 设置为默认地址
   */
  setAsDefault() {
    this.isDefault = true
    this.updateTime = new Date().toISOString()
  }

  /**
   * 验证地址信息
   */
  validate() {
    const errors = []
    
    if (!this.receiverName.trim()) {
      errors.push('收货人姓名不能为空')
    }
    
    if (!this.receiverPhone.trim()) {
      errors.push('收货人电话不能为空')
    } else if (!/^1[3-9]\d{9}$/.test(this.receiverPhone)) {
      errors.push('收货人电话格式不正确')
    }
    
    if (!this.province.trim()) {
      errors.push('省份不能为空')
    }
    
    if (!this.city.trim()) {
      errors.push('城市不能为空')
    }
    
    if (!this.district.trim()) {
      errors.push('区县不能为空')
    }
    
    if (!this.detailAddress.trim()) {
      errors.push('详细地址不能为空')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

module.exports = {
  Order,
  CartItem,
  ShippingAddress,
  ORDER_STATUS,
  PAYMENT_METHOD,
  ORDER_TYPE
}