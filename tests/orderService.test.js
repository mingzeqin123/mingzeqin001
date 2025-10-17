/**
 * 订单服务测试用例
 */

const OrderService = require('../services/orderService.js')
const { Order, ORDER_STATUS, PAYMENT_METHOD } = require('../models/order.js')

describe('OrderService', () => {
  let orderService
  let testUserId = 'test_user_001'
  
  beforeEach(() => {
    orderService = new OrderService()
  })

  describe('购物车管理', () => {
    test('应该能够添加商品到购物车', async () => {
      const productId = 'prod_001'
      const quantity = 2
      
      const cartItem = await orderService.addToCart(testUserId, productId, '', quantity)
      
      expect(cartItem).toBeDefined()
      expect(cartItem.userId).toBe(testUserId)
      expect(cartItem.productId).toBe(productId)
      expect(cartItem.quantity).toBe(quantity)
      expect(cartItem.selected).toBe(true)
    })

    test('应该能够获取购物车商品列表', async () => {
      // 先添加一些商品到购物车
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      await orderService.addToCart(testUserId, 'prod_002', '', 2)
      
      const cartItems = await orderService.getCartItems(testUserId)
      
      expect(cartItems).toHaveLength(2)
      expect(cartItems[0].userId).toBe(testUserId)
    })

    test('应该能够更新购物车商品数量', async () => {
      const productId = 'prod_001'
      await orderService.addToCart(testUserId, productId, '', 1)
      
      const updatedItem = await orderService.updateCartItemQuantity(testUserId, productId, '', 3)
      
      expect(updatedItem.quantity).toBe(3)
    })

    test('应该能够删除购物车商品', async () => {
      const productId = 'prod_001'
      await orderService.addToCart(testUserId, productId, '', 1)
      
      const result = await orderService.removeCartItem(testUserId, productId, '')
      
      expect(result).toBe(true)
      
      const cartItems = await orderService.getCartItems(testUserId)
      expect(cartItems).toHaveLength(0)
    })

    test('应该能够切换商品选中状态', async () => {
      const productId = 'prod_001'
      await orderService.addToCart(testUserId, productId, '', 1)
      
      const cartItem = await orderService.toggleCartItemSelected(testUserId, productId, '')
      
      expect(cartItem.selected).toBe(false)
    })

    test('应该能够获取购物车统计信息', async () => {
      await orderService.addToCart(testUserId, 'prod_001', '', 2)
      await orderService.addToCart(testUserId, 'prod_002', '', 1)
      
      const summary = await orderService.getCartSummary(testUserId)
      
      expect(summary.totalItems).toBe(2)
      expect(summary.selectedItems).toBe(2)
      expect(summary.totalQuantity).toBe(3)
      expect(summary.totalAmount).toBeGreaterThan(0)
    })
  })

  describe('订单管理', () => {
    test('应该能够创建订单', async () => {
      // 先添加商品到购物车
      await orderService.addToCart(testUserId, 'prod_001', '', 2)
      
      const orderData = {
        userInfo: {
          id: testUserId,
          name: '测试用户',
          phone: '13800138000'
        },
        shippingAddress: {
          receiverName: '张三',
          receiverPhone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detailAddress: '科技园南区'
        },
        remark: '测试订单',
        shippingFee: 10,
        discountAmount: 0
      }
      
      const order = await orderService.createOrder(testUserId, orderData)
      
      expect(order).toBeDefined()
      expect(order.userId).toBe(testUserId)
      expect(order.status).toBe(ORDER_STATUS.PENDING)
      expect(order.items).toHaveLength(1)
      expect(order.finalAmount).toBeGreaterThan(0)
    })

    test('应该能够获取订单详情', async () => {
      // 先创建一个订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      const retrievedOrder = await orderService.getOrderById(order.id, testUserId)
      
      expect(retrievedOrder).toBeDefined()
      expect(retrievedOrder.id).toBe(order.id)
      expect(retrievedOrder.userId).toBe(testUserId)
    })

    test('应该能够获取用户订单列表', async () => {
      // 先创建几个订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      await orderService.createOrder(testUserId, {})
      
      await orderService.addToCart(testUserId, 'prod_002', '', 1)
      await orderService.createOrder(testUserId, {})
      
      const result = await orderService.getUserOrders(testUserId, {
        page: 1,
        pageSize: 10
      })
      
      expect(result.orders).toHaveLength(2)
      expect(result.pagination.total).toBe(2)
    })

    test('应该能够支付订单', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      const paymentResult = await orderService.payOrder(order.id, PAYMENT_METHOD.WECHAT_PAY, {})
      
      expect(paymentResult.success).toBe(true)
      expect(paymentResult.order.status).toBe(ORDER_STATUS.PAID)
      expect(paymentResult.paymentId).toBeDefined()
    })

    test('应该能够取消订单', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      const cancelledOrder = await orderService.cancelOrder(order.id, '用户主动取消', testUserId)
      
      expect(cancelledOrder.status).toBe(ORDER_STATUS.CANCELLED)
    })

    test('应该能够确认收货', async () => {
      // 创建并支付订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      await orderService.payOrder(order.id, PAYMENT_METHOD.WECHAT_PAY, {})
      
      // 更新为已发货状态
      await orderService.updateOrderStatus(order.id, ORDER_STATUS.SHIPPED, '商品已发货')
      
      const deliveredOrder = await orderService.confirmDelivery(order.id, testUserId)
      
      expect(deliveredOrder.status).toBe(ORDER_STATUS.DELIVERED)
    })

    test('应该能够更新订单状态', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      const updatedOrder = await orderService.updateOrderStatus(
        order.id, 
        ORDER_STATUS.PROCESSING, 
        '订单处理中',
        'admin_001'
      )
      
      expect(updatedOrder.status).toBe(ORDER_STATUS.PROCESSING)
    })
  })

  describe('库存管理', () => {
    test('创建订单时应该扣减库存', async () => {
      const productId = 'prod_001'
      const product = orderService.products.get(productId)
      const originalStock = product.stock
      
      await orderService.addToCart(testUserId, productId, '', 2)
      await orderService.createOrder(testUserId, {})
      
      const updatedProduct = orderService.products.get(productId)
      expect(updatedProduct.stock).toBe(originalStock - 2)
    })

    test('取消订单时应该恢复库存', async () => {
      const productId = 'prod_001'
      const product = orderService.products.get(productId)
      const originalStock = product.stock
      
      await orderService.addToCart(testUserId, productId, '', 2)
      const order = await orderService.createOrder(testUserId, {})
      
      // 取消订单
      await orderService.cancelOrder(order.id, '测试取消', testUserId)
      
      const updatedProduct = orderService.products.get(productId)
      expect(updatedProduct.stock).toBe(originalStock)
    })

    test('库存不足时应该无法创建订单', async () => {
      const productId = 'prod_001'
      const product = orderService.products.get(productId)
      
      // 尝试添加超过库存的数量
      await expect(
        orderService.addToCart(testUserId, productId, '', product.stock + 1)
      ).rejects.toThrow('商品库存不足')
    })
  })

  describe('订单状态流转', () => {
    test('订单状态应该按正确流程流转', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      expect(order.status).toBe(ORDER_STATUS.PENDING)
      
      // 支付订单
      await orderService.payOrder(order.id, PAYMENT_METHOD.WECHAT_PAY, {})
      const paidOrder = await orderService.getOrderById(order.id)
      expect(paidOrder.status).toBe(ORDER_STATUS.PAID)
      
      // 发货
      await orderService.updateOrderStatus(order.id, ORDER_STATUS.SHIPPED, '已发货')
      const shippedOrder = await orderService.getOrderById(order.id)
      expect(shippedOrder.status).toBe(ORDER_STATUS.SHIPPED)
      
      // 确认收货
      await orderService.confirmDelivery(order.id, testUserId)
      const deliveredOrder = await orderService.getOrderById(order.id)
      expect(deliveredOrder.status).toBe(ORDER_STATUS.DELIVERED)
    })

    test('不应该允许无效的状态转换', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      // 尝试直接从待付款跳转到已发货（无效转换）
      await expect(
        orderService.updateOrderStatus(order.id, ORDER_STATUS.SHIPPED, '无效转换')
      ).rejects.toThrow('无法从 pending 状态变更为 shipped')
    })
  })

  describe('订单过期处理', () => {
    test('应该能够检测订单是否过期', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      // 模拟订单过期
      order.expireTime = new Date(Date.now() - 1000).toISOString()
      
      expect(order.isExpired()).toBe(true)
    })

    test('已支付的订单不应该过期', async () => {
      // 创建并支付订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      await orderService.payOrder(order.id, PAYMENT_METHOD.WECHAT_PAY, {})
      
      // 模拟时间过期
      order.expireTime = new Date(Date.now() - 1000).toISOString()
      
      expect(order.isExpired()).toBe(false)
    })
  })

  describe('订单统计', () => {
    test('应该能够获取订单统计数据', async () => {
      // 创建几个不同状态的订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order1 = await orderService.createOrder(testUserId, {})
      
      await orderService.addToCart(testUserId, 'prod_002', '', 1)
      const order2 = await orderService.createOrder(testUserId, {})
      await orderService.payOrder(order2.id, PAYMENT_METHOD.WECHAT_PAY, {})
      
      const statistics = await orderService.getOrderStatistics(testUserId)
      
      expect(statistics.totalOrders).toBe(2)
      expect(statistics.statusCounts[ORDER_STATUS.PENDING]).toBe(1)
      expect(statistics.statusCounts[ORDER_STATUS.PAID]).toBe(1)
      expect(statistics.totalAmount).toBeGreaterThan(0)
      expect(statistics.averageOrderValue).toBeGreaterThan(0)
    })
  })

  describe('错误处理', () => {
    test('获取不存在的订单应该抛出错误', async () => {
      await expect(
        orderService.getOrderById('non_existent_order')
      ).rejects.toThrow('订单不存在')
    })

    test('无权限访问他人订单应该抛出错误', async () => {
      // 创建订单
      await orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderService.createOrder(testUserId, {})
      
      // 尝试用其他用户ID访问
      await expect(
        orderService.getOrderById(order.id, 'other_user')
      ).rejects.toThrow('无权限访问此订单')
    })

    test('添加不存在的商品到购物车应该抛出错误', async () => {
      await expect(
        orderService.addToCart(testUserId, 'non_existent_product', '', 1)
      ).rejects.toThrow('商品不存在')
    })

    test('支付不存在的订单应该抛出错误', async () => {
      await expect(
        orderService.payOrder('non_existent_order', PAYMENT_METHOD.WECHAT_PAY, {})
      ).rejects.toThrow('订单不存在')
    })
  })
})

// 测试工具函数
function createMockOrder(userId = 'test_user', status = ORDER_STATUS.PENDING) {
  return new Order({
    userId,
    status,
    items: [
      {
        productId: 'prod_001',
        productName: '测试商品',
        price: 99.99,
        quantity: 1
      }
    ]
  })
}

module.exports = {
  createMockOrder
}