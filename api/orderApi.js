/**
 * 订单API接口
 * 提供订单管理的HTTP接口
 */

const OrderService = require('../services/orderService.js')

/**
 * 订单API类
 */
class OrderApi {
  constructor() {
    this.orderService = new OrderService()
  }

  /**
   * 创建订单
   * POST /api/orders
   */
  async createOrder(req, res) {
    try {
      const { userId } = req.user || {}
      const orderData = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const order = await this.orderService.createOrder(userId, orderData)

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: order.toJSON()
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 获取订单详情
   * GET /api/orders/:orderId
   */
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params
      const { userId } = req.user || {}

      const order = await this.orderService.getOrderById(orderId, userId)

      res.json({
        success: true,
        data: order.toJSON()
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 获取用户订单列表
   * GET /api/orders
   */
  async getUserOrders(req, res) {
    try {
      const { userId } = req.user || {}
      const {
        status,
        page = 1,
        pageSize = 10,
        sortBy = 'createTime',
        sortOrder = 'desc'
      } = req.query

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const result = await this.orderService.getUserOrders(userId, {
        status,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sortBy,
        sortOrder
      })

      res.json({
        success: true,
        data: {
          orders: result.orders.map(order => order.toJSON()),
          pagination: result.pagination
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 支付订单
   * POST /api/orders/:orderId/pay
   */
  async payOrder(req, res) {
    try {
      const { orderId } = req.params
      const { paymentMethod, paymentData } = req.body

      const result = await this.orderService.payOrder(orderId, paymentMethod, paymentData)

      res.json({
        success: true,
        message: '支付成功',
        data: {
          order: result.order.toJSON(),
          paymentId: result.paymentId
        }
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 取消订单
   * POST /api/orders/:orderId/cancel
   */
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params
      const { reason } = req.body
      const { userId } = req.user || {}

      const order = await this.orderService.cancelOrder(orderId, reason, userId)

      res.json({
        success: true,
        message: '订单取消成功',
        data: order.toJSON()
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 确认收货
   * POST /api/orders/:orderId/confirm
   */
  async confirmDelivery(req, res) {
    try {
      const { orderId } = req.params
      const { userId } = req.user || {}

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const order = await this.orderService.confirmDelivery(orderId, userId)

      res.json({
        success: true,
        message: '确认收货成功',
        data: order.toJSON()
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 添加商品到购物车
   * POST /api/cart/add
   */
  async addToCart(req, res) {
    try {
      const { userId } = req.user || {}
      const { productId, skuId, quantity = 1 } = req.body

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const cartItem = await this.orderService.addToCart(userId, productId, skuId, quantity)

      res.json({
        success: true,
        message: '添加到购物车成功',
        data: cartItem
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 获取购物车列表
   * GET /api/cart
   */
  async getCartItems(req, res) {
    try {
      const { userId } = req.user || {}

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const cartItems = await this.orderService.getCartItems(userId)
      const summary = await this.orderService.getCartSummary(userId)

      res.json({
        success: true,
        data: {
          items: cartItems,
          summary
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 更新购物车商品数量
   * PUT /api/cart/:productId
   */
  async updateCartItemQuantity(req, res) {
    try {
      const { productId } = req.params
      const { skuId, quantity } = req.body
      const { userId } = req.user || {}

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const cartItem = await this.orderService.updateCartItemQuantity(userId, productId, skuId, quantity)

      res.json({
        success: true,
        message: '更新成功',
        data: cartItem
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 删除购物车商品
   * DELETE /api/cart/:productId
   */
  async removeCartItem(req, res) {
    try {
      const { productId } = req.params
      const { skuId } = req.query
      const { userId } = req.user || {}

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      await this.orderService.removeCartItem(userId, productId, skuId)

      res.json({
        success: true,
        message: '删除成功'
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 切换购物车商品选中状态
   * POST /api/cart/:productId/toggle
   */
  async toggleCartItemSelected(req, res) {
    try {
      const { productId } = req.params
      const { skuId } = req.body
      const { userId } = req.user || {}

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未登录'
        })
      }

      const cartItem = await this.orderService.toggleCartItemSelected(userId, productId, skuId)

      res.json({
        success: true,
        message: '更新成功',
        data: cartItem
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 获取订单统计数据
   * GET /api/orders/statistics
   */
  async getOrderStatistics(req, res) {
    try {
      const { userId } = req.user || {}
      const { startDate, endDate } = req.query

      const dateRange = startDate && endDate ? { startDate, endDate } : null
      const statistics = await this.orderService.getOrderStatistics(userId, dateRange)

      res.json({
        success: true,
        data: statistics
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 管理员更新订单状态
   * PUT /api/admin/orders/:orderId/status
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params
      const { status, remark } = req.body
      const { userId: operatorId } = req.user || {}

      // 这里应该检查管理员权限
      // if (!isAdmin(operatorId)) {
      //   return res.status(403).json({ success: false, message: '无权限操作' })
      // }

      const order = await this.orderService.updateOrderStatus(orderId, status, remark, operatorId)

      res.json({
        success: true,
        message: '订单状态更新成功',
        data: order.toJSON()
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 获取所有订单（管理员）
   * GET /api/admin/orders
   */
  async getAllOrders(req, res) {
    try {
      const {
        status,
        userId,
        startDate,
        endDate,
        page = 1,
        pageSize = 20,
        sortBy = 'createTime',
        sortOrder = 'desc'
      } = req.query

      // 这里应该检查管理员权限
      // const { userId: operatorId } = req.user || {}
      // if (!isAdmin(operatorId)) {
      //   return res.status(403).json({ success: false, message: '无权限操作' })
      // }

      // 获取所有订单并进行筛选
      let orders = Array.from(this.orderService.orders.values())

      // 状态筛选
      if (status) {
        orders = orders.filter(order => order.status === status)
      }

      // 用户筛选
      if (userId) {
        orders = orders.filter(order => order.userId === userId)
      }

      // 日期筛选
      if (startDate && endDate) {
        orders = orders.filter(order => {
          const orderDate = new Date(order.createTime)
          return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
        })
      }

      // 排序
      orders.sort((a, b) => {
        const aValue = a[sortBy]
        const bValue = b[sortBy]
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : 1
        } else {
          return aValue < bValue ? -1 : 1
        }
      })

      // 分页
      const total = orders.length
      const startIndex = (parseInt(page) - 1) * parseInt(pageSize)
      const endIndex = startIndex + parseInt(pageSize)
      const paginatedOrders = orders.slice(startIndex, endIndex)

      res.json({
        success: true,
        data: {
          orders: paginatedOrders.map(order => order.toJSON()),
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            total,
            totalPages: Math.ceil(total / parseInt(pageSize))
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }

  /**
   * 微信小程序支付回调
   * POST /api/orders/wechat-pay-callback
   */
  async wechatPayCallback(req, res) {
    try {
      // 处理微信支付回调
      const { out_trade_no, transaction_id, result_code } = req.body

      if (result_code === 'SUCCESS') {
        // 支付成功，更新订单状态
        const order = Array.from(this.orderService.orders.values())
          .find(o => o.orderNo === out_trade_no)

        if (order) {
          await this.orderService.updateOrderStatus(order.id, 'paid', '微信支付成功')
        }
      }

      // 返回成功响应给微信
      res.json({
        return_code: 'SUCCESS',
        return_msg: 'OK'
      })
    } catch (error) {
      console.error('微信支付回调处理失败:', error)
      res.json({
        return_code: 'FAIL',
        return_msg: error.message
      })
    }
  }
}

module.exports = OrderApi