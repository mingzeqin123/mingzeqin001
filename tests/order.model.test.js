/**
 * 订单模型测试用例
 */

const { Order, CartItem, ShippingAddress, ORDER_STATUS, PAYMENT_METHOD, ORDER_TYPE } = require('../models/order.js')

describe('Order Model', () => {
  describe('Order类', () => {
    test('应该能够创建订单实例', () => {
      const orderData = {
        userId: 'user_001',
        items: [
          {
            productId: 'prod_001',
            productName: '测试商品',
            price: 99.99,
            quantity: 2
          }
        ]
      }
      
      const order = new Order(orderData)
      
      expect(order.userId).toBe('user_001')
      expect(order.status).toBe(ORDER_STATUS.PENDING)
      expect(order.items).toHaveLength(1)
      expect(order.id).toBeDefined()
      expect(order.orderNo).toBeDefined()
    })

    test('应该能够生成唯一的订单ID和订单号', () => {
      const order1 = new Order()
      const order2 = new Order()
      
      expect(order1.id).not.toBe(order2.id)
      expect(order1.orderNo).not.toBe(order2.orderNo)
      expect(order1.orderNo).toMatch(/^ORD\d{8}\d{6}\d{4}$/)
    })

    test('应该能够计算订单总金额', () => {
      const order = new Order({
        items: [
          { productId: 'prod_001', price: 100, quantity: 2 },
          { productId: 'prod_002', price: 50, quantity: 1 }
        ],
        shippingFee: 10,
        discountAmount: 20
      })
      
      order.calculateTotalAmount()
      
      expect(order.totalAmount).toBe(250) // 100*2 + 50*1
      expect(order.finalAmount).toBe(240) // 250 - 20 + 10
    })

    test('应该能够添加订单商品', () => {
      const order = new Order()
      
      order.addItem({
        productId: 'prod_001',
        productName: '商品1',
        price: 99.99,
        quantity: 2
      })
      
      expect(order.items).toHaveLength(1)
      expect(order.items[0].productId).toBe('prod_001')
      expect(order.items[0].quantity).toBe(2)
      expect(order.totalAmount).toBe(199.98)
    })

    test('添加相同商品应该合并数量', () => {
      const order = new Order()
      
      order.addItem({
        productId: 'prod_001',
        productName: '商品1',
        price: 99.99,
        quantity: 1
      })
      
      order.addItem({
        productId: 'prod_001',
        productName: '商品1',
        price: 99.99,
        quantity: 2
      })
      
      expect(order.items).toHaveLength(1)
      expect(order.items[0].quantity).toBe(3)
    })

    test('应该能够移除订单商品', () => {
      const order = new Order({
        items: [
          { productId: 'prod_001', productName: '商品1', price: 100, quantity: 1 },
          { productId: 'prod_002', productName: '商品2', price: 50, quantity: 1 }
        ]
      })
      
      order.removeItem('prod_001')
      
      expect(order.items).toHaveLength(1)
      expect(order.items[0].productId).toBe('prod_002')
    })

    test('应该能够更新订单状态', () => {
      const order = new Order({ status: ORDER_STATUS.PENDING })
      
      order.updateStatus(ORDER_STATUS.PAID, '支付成功')
      
      expect(order.status).toBe(ORDER_STATUS.PAID)
      expect(order.paymentTime).toBeDefined()
      expect(order.remark).toBe('支付成功')
    })

    test('无效的状态转换应该抛出错误', () => {
      const order = new Order({ status: ORDER_STATUS.PENDING })
      
      expect(() => {
        order.updateStatus(ORDER_STATUS.SHIPPED, '无效转换')
      }).toThrow('无法从 pending 状态变更为 shipped')
    })

    test('应该能够获取有效的状态转换', () => {
      const order = new Order({ status: ORDER_STATUS.PENDING })
      
      const validTransitions = order.getValidStatusTransitions()
      
      expect(validTransitions).toContain(ORDER_STATUS.PAID)
      expect(validTransitions).toContain(ORDER_STATUS.CANCELLED)
      expect(validTransitions).not.toContain(ORDER_STATUS.SHIPPED)
    })

    test('应该能够检查订单是否过期', () => {
      const order = new Order({
        status: ORDER_STATUS.PENDING,
        expireTime: new Date(Date.now() - 1000).toISOString() // 1秒前过期
      })
      
      expect(order.isExpired()).toBe(true)
      
      // 已支付的订单不应该过期
      order.status = ORDER_STATUS.PAID
      expect(order.isExpired()).toBe(false)
    })

    test('应该能够获取状态文本', () => {
      const order = new Order({ status: ORDER_STATUS.PENDING })
      
      expect(order.getStatusText()).toBe('待付款')
      
      order.status = ORDER_STATUS.DELIVERED
      expect(order.getStatusText()).toBe('已送达')
    })

    test('应该能够转换为JSON对象', () => {
      const orderData = {
        userId: 'user_001',
        status: ORDER_STATUS.PAID,
        items: [{ productId: 'prod_001', price: 100, quantity: 1 }]
      }
      
      const order = new Order(orderData)
      const json = order.toJSON()
      
      expect(json).toHaveProperty('id')
      expect(json).toHaveProperty('orderNo')
      expect(json.userId).toBe('user_001')
      expect(json.status).toBe(ORDER_STATUS.PAID)
      expect(json.items).toHaveLength(1)
    })
  })

  describe('CartItem类', () => {
    test('应该能够创建购物车商品实例', () => {
      const itemData = {
        userId: 'user_001',
        productId: 'prod_001',
        productName: '测试商品',
        price: 99.99,
        quantity: 2
      }
      
      const cartItem = new CartItem(itemData)
      
      expect(cartItem.userId).toBe('user_001')
      expect(cartItem.productId).toBe('prod_001')
      expect(cartItem.quantity).toBe(2)
      expect(cartItem.selected).toBe(true)
      expect(cartItem.id).toBeDefined()
    })

    test('应该能够计算小计', () => {
      const cartItem = new CartItem({
        price: 99.99,
        quantity: 3
      })
      
      expect(cartItem.getSubtotal()).toBe(299.97)
    })

    test('应该能够更新数量', () => {
      const cartItem = new CartItem({ quantity: 1 })
      
      cartItem.updateQuantity(5)
      
      expect(cartItem.quantity).toBe(5)
      expect(cartItem.updateTime).toBeDefined()
    })

    test('更新数量为0或负数应该抛出错误', () => {
      const cartItem = new CartItem({ quantity: 1 })
      
      expect(() => {
        cartItem.updateQuantity(0)
      }).toThrow('商品数量必须大于0')
      
      expect(() => {
        cartItem.updateQuantity(-1)
      }).toThrow('商品数量必须大于0')
    })

    test('应该能够切换选中状态', () => {
      const cartItem = new CartItem({ selected: true })
      
      cartItem.toggleSelected()
      
      expect(cartItem.selected).toBe(false)
      
      cartItem.toggleSelected()
      
      expect(cartItem.selected).toBe(true)
    })
  })

  describe('ShippingAddress类', () => {
    test('应该能够创建收货地址实例', () => {
      const addressData = {
        userId: 'user_001',
        receiverName: '张三',
        receiverPhone: '13800138000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detailAddress: '科技园南区'
      }
      
      const address = new ShippingAddress(addressData)
      
      expect(address.userId).toBe('user_001')
      expect(address.receiverName).toBe('张三')
      expect(address.isDefault).toBe(false)
      expect(address.id).toBeDefined()
    })

    test('应该能够获取完整地址', () => {
      const address = new ShippingAddress({
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detailAddress: '科技园南区A1栋'
      })
      
      const fullAddress = address.getFullAddress()
      
      expect(fullAddress).toBe('广东省深圳市南山区科技园南区A1栋')
    })

    test('应该能够设置为默认地址', () => {
      const address = new ShippingAddress({ isDefault: false })
      
      address.setAsDefault()
      
      expect(address.isDefault).toBe(true)
      expect(address.updateTime).toBeDefined()
    })

    test('应该能够验证地址信息', () => {
      const validAddress = new ShippingAddress({
        receiverName: '张三',
        receiverPhone: '13800138000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detailAddress: '科技园南区'
      })
      
      const validation = validAddress.validate()
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('缺少必填信息应该验证失败', () => {
      const invalidAddress = new ShippingAddress({
        receiverName: '',
        receiverPhone: '123', // 无效电话
        province: '',
        city: '深圳市',
        district: '',
        detailAddress: ''
      })
      
      const validation = invalidAddress.validate()
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('收货人姓名不能为空')
      expect(validation.errors).toContain('收货人电话格式不正确')
      expect(validation.errors).toContain('省份不能为空')
      expect(validation.errors).toContain('区县不能为空')
      expect(validation.errors).toContain('详细地址不能为空')
    })

    test('电话号码格式验证', () => {
      const address1 = new ShippingAddress({ receiverPhone: '13800138000' })
      expect(address1.validate().isValid).toBe(false) // 其他字段为空

      const address2 = new ShippingAddress({
        receiverName: '张三',
        receiverPhone: '1380013800', // 少一位
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detailAddress: '科技园'
      })
      expect(address2.validate().errors).toContain('收货人电话格式不正确')

      const address3 = new ShippingAddress({
        receiverName: '张三',
        receiverPhone: '23800138000', // 不是1开头
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detailAddress: '科技园'
      })
      expect(address3.validate().errors).toContain('收货人电话格式不正确')
    })
  })

  describe('枚举值测试', () => {
    test('ORDER_STATUS应该包含所有必要的状态', () => {
      expect(ORDER_STATUS.PENDING).toBe('pending')
      expect(ORDER_STATUS.PAID).toBe('paid')
      expect(ORDER_STATUS.PROCESSING).toBe('processing')
      expect(ORDER_STATUS.SHIPPED).toBe('shipped')
      expect(ORDER_STATUS.DELIVERED).toBe('delivered')
      expect(ORDER_STATUS.CANCELLED).toBe('cancelled')
      expect(ORDER_STATUS.REFUNDED).toBe('refunded')
    })

    test('PAYMENT_METHOD应该包含所有支付方式', () => {
      expect(PAYMENT_METHOD.WECHAT_PAY).toBe('wechat_pay')
      expect(PAYMENT_METHOD.ALIPAY).toBe('alipay')
      expect(PAYMENT_METHOD.BALANCE).toBe('balance')
      expect(PAYMENT_METHOD.POINTS).toBe('points')
    })

    test('ORDER_TYPE应该包含所有订单类型', () => {
      expect(ORDER_TYPE.NORMAL).toBe('normal')
      expect(ORDER_TYPE.GROUP_BUY).toBe('group_buy')
      expect(ORDER_TYPE.SECKILL).toBe('seckill')
      expect(ORDER_TYPE.PRESALE).toBe('presale')
    })
  })
})