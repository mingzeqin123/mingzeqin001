/**
 * 订单API测试用例
 */

const OrderApi = require('../api/orderApi.js')
const { ORDER_STATUS, PAYMENT_METHOD } = require('../models/order.js')

describe('OrderApi', () => {
  let orderApi
  let mockReq
  let mockRes
  let testUserId = 'test_user_001'
  
  beforeEach(() => {
    orderApi = new OrderApi()
    
    // 模拟请求对象
    mockReq = {
      user: { userId: testUserId },
      body: {},
      params: {},
      query: {}
    }
    
    // 模拟响应对象
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    }
  })

  describe('订单管理接口', () => {
    test('POST /api/orders - 创建订单', async () => {
      mockReq.body = {
        userInfo: {
          id: testUserId,
          name: '测试用户'
        },
        shippingAddress: {
          receiverName: '张三',
          receiverPhone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detailAddress: '科技园南区'
        }
      }
      
      // 先添加商品到购物车
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      
      await orderApi.createOrder(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '订单创建成功',
          data: expect.objectContaining({
            userId: testUserId,
            status: ORDER_STATUS.PENDING
          })
        })
      )
    })

    test('GET /api/orders/:orderId - 获取订单详情', async () => {
      // 先创建一个订单
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderApi.orderService.createOrder(testUserId, {})
      
      mockReq.params.orderId = order.id
      
      await orderApi.getOrderById(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: order.id,
            userId: testUserId
          })
        })
      )
    })

    test('GET /api/orders - 获取用户订单列表', async () => {
      mockReq.query = {
        page: '1',
        pageSize: '10',
        status: ORDER_STATUS.PENDING
      }
      
      await orderApi.getUserOrders(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              pageSize: 10
            })
          })
        })
      )
    })

    test('POST /api/orders/:orderId/pay - 支付订单', async () => {
      // 先创建一个订单
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderApi.orderService.createOrder(testUserId, {})
      
      mockReq.params.orderId = order.id
      mockReq.body = {
        paymentMethod: PAYMENT_METHOD.WECHAT_PAY,
        paymentData: {}
      }
      
      await orderApi.payOrder(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '支付成功',
          data: expect.objectContaining({
            order: expect.objectContaining({
              status: ORDER_STATUS.PAID
            }),
            paymentId: expect.any(String)
          })
        })
      )
    })

    test('POST /api/orders/:orderId/cancel - 取消订单', async () => {
      // 先创建一个订单
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderApi.orderService.createOrder(testUserId, {})
      
      mockReq.params.orderId = order.id
      mockReq.body = {
        reason: '用户主动取消'
      }
      
      await orderApi.cancelOrder(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '订单取消成功',
          data: expect.objectContaining({
            status: ORDER_STATUS.CANCELLED
          })
        })
      )
    })

    test('POST /api/orders/:orderId/confirm - 确认收货', async () => {
      // 先创建并发货订单
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderApi.orderService.createOrder(testUserId, {})
      await orderApi.orderService.payOrder(order.id, PAYMENT_METHOD.WECHAT_PAY, {})
      await orderApi.orderService.updateOrderStatus(order.id, ORDER_STATUS.SHIPPED, '已发货')
      
      mockReq.params.orderId = order.id
      
      await orderApi.confirmDelivery(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '确认收货成功',
          data: expect.objectContaining({
            status: ORDER_STATUS.DELIVERED
          })
        })
      )
    })
  })

  describe('购物车管理接口', () => {
    test('POST /api/cart/add - 添加商品到购物车', async () => {
      mockReq.body = {
        productId: 'prod_001',
        skuId: '',
        quantity: 2
      }
      
      await orderApi.addToCart(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '添加到购物车成功',
          data: expect.objectContaining({
            productId: 'prod_001',
            quantity: 2
          })
        })
      )
    })

    test('GET /api/cart - 获取购物车列表', async () => {
      // 先添加商品到购物车
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      
      await orderApi.getCartItems(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            items: expect.any(Array),
            summary: expect.objectContaining({
              totalItems: expect.any(Number),
              totalAmount: expect.any(Number)
            })
          })
        })
      )
    })

    test('PUT /api/cart/:productId - 更新购物车商品数量', async () => {
      // 先添加商品到购物车
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      
      mockReq.params.productId = 'prod_001'
      mockReq.body = {
        skuId: '',
        quantity: 3
      }
      
      await orderApi.updateCartItemQuantity(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '更新成功',
          data: expect.objectContaining({
            quantity: 3
          })
        })
      )
    })

    test('DELETE /api/cart/:productId - 删除购物车商品', async () => {
      // 先添加商品到购物车
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      
      mockReq.params.productId = 'prod_001'
      mockReq.query.skuId = ''
      
      await orderApi.removeCartItem(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '删除成功'
        })
      )
    })

    test('POST /api/cart/:productId/toggle - 切换商品选中状态', async () => {
      // 先添加商品到购物车
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      
      mockReq.params.productId = 'prod_001'
      mockReq.body = { skuId: '' }
      
      await orderApi.toggleCartItemSelected(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '更新成功',
          data: expect.objectContaining({
            selected: false // 默认是true，切换后应该是false
          })
        })
      )
    })
  })

  describe('管理员接口', () => {
    test('PUT /api/admin/orders/:orderId/status - 更新订单状态', async () => {
      // 先创建一个订单
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderApi.orderService.createOrder(testUserId, {})
      
      mockReq.params.orderId = order.id
      mockReq.body = {
        status: ORDER_STATUS.PROCESSING,
        remark: '订单处理中'
      }
      
      await orderApi.updateOrderStatus(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: '订单状态更新成功',
          data: expect.objectContaining({
            status: ORDER_STATUS.PROCESSING
          })
        })
      )
    })

    test('GET /api/admin/orders - 获取所有订单', async () => {
      mockReq.query = {
        page: '1',
        pageSize: '20'
      }
      
      await orderApi.getAllOrders(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders: expect.any(Array),
            pagination: expect.any(Object)
          })
        })
      )
    })
  })

  describe('统计接口', () => {
    test('GET /api/orders/statistics - 获取订单统计', async () => {
      await orderApi.getOrderStatistics(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalOrders: expect.any(Number),
            totalAmount: expect.any(Number),
            statusCounts: expect.any(Object),
            averageOrderValue: expect.any(Number)
          })
        })
      )
    })
  })

  describe('错误处理', () => {
    test('未登录用户应该返回401错误', async () => {
      mockReq.user = null
      
      await orderApi.createOrder(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '用户未登录'
        })
      )
    })

    test('获取不存在的订单应该返回404错误', async () => {
      mockReq.params.orderId = 'non_existent_order'
      
      await orderApi.getOrderById(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      )
    })

    test('创建订单时购物车为空应该返回400错误', async () => {
      // 不添加任何商品到购物车直接创建订单
      await orderApi.createOrder(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('购物车')
        })
      )
    })

    test('支付不存在的订单应该返回400错误', async () => {
      mockReq.params.orderId = 'non_existent_order'
      mockReq.body = {
        paymentMethod: PAYMENT_METHOD.WECHAT_PAY
      }
      
      await orderApi.payOrder(mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      )
    })
  })

  describe('支付回调', () => {
    test('POST /api/orders/wechat-pay-callback - 微信支付回调', async () => {
      // 先创建一个订单
      await orderApi.orderService.addToCart(testUserId, 'prod_001', '', 1)
      const order = await orderApi.orderService.createOrder(testUserId, {})
      
      mockReq.body = {
        out_trade_no: order.orderNo,
        transaction_id: 'wx_transaction_123',
        result_code: 'SUCCESS'
      }
      
      await orderApi.wechatPayCallback(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          return_code: 'SUCCESS',
          return_msg: 'OK'
        })
      )
      
      // 验证订单状态是否已更新
      const updatedOrder = await orderApi.orderService.getOrderById(order.id)
      expect(updatedOrder.status).toBe(ORDER_STATUS.PAID)
    })

    test('支付失败的回调应该正确处理', async () => {
      mockReq.body = {
        out_trade_no: 'test_order_no',
        result_code: 'FAIL'
      }
      
      await orderApi.wechatPayCallback(mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          return_code: 'SUCCESS',
          return_msg: 'OK'
        })
      )
    })
  })
})

// Jest模拟函数设置
beforeAll(() => {
  // 模拟console.log和console.error以避免测试输出干扰
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  // 恢复console函数
  console.log.mockRestore()
  console.error.mockRestore()
})